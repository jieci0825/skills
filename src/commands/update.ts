import { join } from 'node:path'
import { ensureCache } from '../core/cache.js'
import { hashDir } from '../core/checksum.js'
import { CONFIG_FILENAME, loadConfigIfExists } from '../core/config.js'
import { deploySkill, pruneEmptyDirs, removeSkillFiles } from '../core/installer.js'
import { TOOL_TARGETS, skillTargetPath } from '../core/mapping.js'
import { confirm, isInteractive } from '../core/prompt.js'
import { loadManifest, saveManifest, type ManifestEntry } from '../core/registry.js'
import { expandCategories, scanRules, type SkillInfo } from '../core/scanner.js'
import { computeLocalStatus } from '../core/status.js'

export interface UpdateOptions {
    source?: string
    config?: string
    force?: boolean
}

interface UpdateStats {
    added: number
    updated: number
    repaired: number
    skipped: number
    conflicts: number
    cleaned: number
}

/**
 * update 主流程：pull 缓存 → 读 manifest → 逐 skill 三态比对（源当前 / 本地副本 / 安装时记录）。
 * 决策表：
 *   本地未改 + 源有更新 → 覆盖并更新 manifest
 *   本地已改 + 源有更新 → 跳过并警告（--force 强制覆盖，覆盖前打印将丢弃的文件）
 *   本地未改 + 源无变化 → 跳过
 *   本地缺失           → 修复恢复
 *   源已删除           → 交互确认是否清理本地产物
 * 另：配置中新勾选但未安装的 skill 在此补装。
 */
export async function runUpdate(cwd: string, opts: UpdateOptions = {}): Promise<void> {
    const manifest = await loadManifest(cwd)
    if (!manifest) {
        throw new Error('未找到 .skills/manifest.json，请先执行 skills install')
    }

    const configPath = opts.config ?? join(cwd, CONFIG_FILENAME)
    const config = await loadConfigIfExists(configPath)
    if (!config) {
        console.warn('⚠ 未找到 skills.config.json：跳过「新勾选未安装」的补装检查，源以 --source 或默认仓库为准')
    }

    const rulesDir = await ensureCache(opts.source ?? config?.source)
    const catalog = await scanRules(rulesDir)
    const byName = new Map<string, SkillInfo>()
    for (const skills of catalog.values()) {
        for (const s of skills) byName.set(s.name, s)
    }

    const entries = manifest.skills.map((e) => ({ ...e }))
    let dirty = false
    const stats: UpdateStats = { added: 0, updated: 0, repaired: 0, skipped: 0, conflicts: 0, cleaned: 0 }

    // 1) 补装：配置新勾选但尚未安装的 skill
    const addedNames = new Set<string>()
    if (config) {
        const installed = new Set(entries.map((e) => e.name))
        for (const skill of expandCategories(catalog, config.categories, config.exclude ?? [])) {
            if (installed.has(skill.name)) continue
            const checksum = await hashDir(skill.path)
            const { fileChecksums } = await deploySkill(cwd, skill, config.tools)
            entries.push({
                name: skill.name,
                category: skill.category,
                checksum,
                tools: [...config.tools],
                installedAt: new Date().toISOString(),
                ...(fileChecksums ? { fileChecksums } : {}),
            })
            addedNames.add(skill.name)
            dirty = true
            stats.added++
            console.log(`＋ 补装 ${skill.name}（${skill.category}）`)
        }
    }

    // 2) 已装 skill 三态比对
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]!
        if (addedNames.has(entry.name)) continue

        const skill = byName.get(entry.name)

        // 源已删除：交互确认是否清理本地产物
        if (!skill) {
            let cleanup = false
            if (isInteractive()) {
                cleanup = await confirm(`「${entry.name}」已从源仓库删除，是否清理本地安装？`, true)
            } else {
                console.log(
                    `⚠ ${entry.name}：已从源仓库删除（非交互环境保留本地，如需清理执行 skills remove ${entry.name}）`,
                )
            }
            if (cleanup) {
                await removeSkillFiles(cwd, entry.name, entry.tools)
                for (const tool of entry.tools) {
                    await pruneEmptyDirs(cwd, join(cwd, TOOL_TARGETS[tool].dir))
                }
                entries.splice(i, 1)
                i--
                dirty = true
                stats.cleaned++
                console.log(`－ 已清理 ${entry.name}`)
            } else {
                stats.skipped++
            }
            continue
        }

        const sourceChecksum = await hashDir(skill.path)
        const sourceUpdated = sourceChecksum !== entry.checksum
        const status = await computeLocalStatus(cwd, entry)

        // 源无变化：最新则跳过；副本缺失则修复；本地改动则保持现状
        if (!sourceUpdated) {
            if (status.missing.length > 0) {
                const { fileChecksums } = await deploySkill(cwd, skill, status.missing)
                if (fileChecksums) {
                    entry.fileChecksums = { ...(entry.fileChecksums ?? {}), ...fileChecksums }
                }
                dirty = true
                stats.repaired++
                console.log(`↻ 修复 ${entry.name}：${status.missing.join(' / ')} 副本缺失，已恢复`)
                continue
            }
            if (status.modified.length > 0) {
                stats.skipped++
                console.log(`⚠ ${entry.name}：本地已修改（${status.modified.join(' / ')}），源无更新，保持现状`)
                continue
            }
            stats.skipped++
            continue
        }

        // 源有更新
        if (status.modified.length > 0 && !opts.force) {
            stats.conflicts++
            console.log(
                `✖ 冲突 ${entry.name}：源有更新，但本地已修改（${status.modified.join(' / ')}），已跳过（--force 强制覆盖）`,
            )
            continue
        }
        if (status.modified.length > 0) {
            const discarded = status.modified.map((t) => skillTargetPath(cwd, t, entry.name))
            console.log(`⚠ 强制覆盖 ${entry.name}，将丢弃本地修改：\n    ${discarded.join('\n    ')}`)
        }

        const { fileChecksums } = await deploySkill(cwd, skill, entry.tools)
        entry.category = skill.category
        entry.checksum = sourceChecksum
        if (fileChecksums) entry.fileChecksums = fileChecksums
        else delete entry.fileChecksums
        dirty = true
        stats.updated++
        console.log(`↑ 更新 ${entry.name}（${skill.category}）`)
    }

    if (dirty) {
        await saveManifest(cwd, { version: 1, skills: entries })
    }

    const parts = [
        `更新 ${stats.updated}`,
        ...(stats.added ? [`补装 ${stats.added}`] : []),
        ...(stats.repaired ? [`修复 ${stats.repaired}`] : []),
        `跳过 ${stats.skipped}`,
        ...(stats.conflicts ? [`冲突 ${stats.conflicts}`] : []),
        ...(stats.cleaned ? [`清理 ${stats.cleaned}`] : []),
    ]
    console.log(`\n${parts.join(' · ')}`)
    // 冲突意味着有更新未应用，以非零码退出便于 CI 感知
    if (stats.conflicts > 0) process.exitCode = 1
}
