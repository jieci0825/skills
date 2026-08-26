import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { pruneEmptyDirs, removeSkillFiles } from '../core/installer.js'
import { TOOL_TARGETS } from '../core/mapping.js'
import { confirm, isInteractive, multiselect } from '../core/prompt.js'
import { loadManifest, manifestPath, saveManifest, MANIFEST_DIRNAME, type ManifestEntry } from '../core/registry.js'

export interface RemoveOptions {
    all?: boolean
}

/**
 * remove：按 manifest 卸载 skill 的落盘产物并更新 manifest。
 * - remove <name> [...]：移除指定 skill
 * - remove --all：移除全部（交互环境先确认）
 * - remove：交互式多选（非交互环境提示用法）
 */
export async function runRemove(cwd: string, names: string[], opts: RemoveOptions = {}): Promise<void> {
    const manifest = await loadManifest(cwd)
    if (!manifest) {
        throw new Error('未找到 .skills/manifest.json，当前项目尚未安装 skill')
    }
    if (opts.all && names.length > 0) {
        throw new Error('--all 与具体 skill 名称不能同时使用')
    }

    let targets: ManifestEntry[]
    if (opts.all) {
        if (isInteractive()) {
            const ok = await confirm(`确定移除全部 ${manifest.skills.length} 个 skill？`, false)
            if (!ok) {
                console.log('已取消')
                return
            }
        }
        targets = [...manifest.skills]
    } else if (names.length > 0) {
        const byName = new Map(manifest.skills.map((e) => [e.name, e]))
        const unknown = names.filter((n) => !byName.has(n))
        if (unknown.length > 0) {
            const installed = manifest.skills.map((e) => e.name).join('、')
            throw new Error(`以下 skill 未安装：${unknown.join('、')}\n  当前已安装：${installed || '（无）'}`)
        }
        targets = names.map((n) => byName.get(n)!)
    } else {
        if (!isInteractive()) {
            throw new Error('请指定要移除的 skill 名称（skills remove <name>...），或使用 --all 移除全部')
        }
        const picked = await multiselect(
            '选择要移除的 skill（可多选）',
            manifest.skills.map((e) => ({ value: e.name, label: e.name, hint: e.category })),
        )
        if (picked.length === 0) {
            console.log('未选择任何 skill，已取消')
            return
        }
        const byName = new Map(manifest.skills.map((e) => [e.name, e]))
        targets = picked.map((n) => byName.get(n)!)
    }

    for (const entry of targets) {
        await removeSkillFiles(cwd, entry.name, entry.tools)
        console.log(`－ 已移除 ${entry.name}（${entry.tools.join(' / ')}）`)
    }

    // 剪枝因卸载而变空的目录链（.cursor/rules → .cursor 等）
    const toolRoots = new Set(targets.flatMap((e) => e.tools).map((t) => join(cwd, TOOL_TARGETS[t].dir)))
    for (const root of toolRoots) {
        await pruneEmptyDirs(cwd, root)
    }

    const removedNames = new Set(targets.map((e) => e.name))
    const remaining = manifest.skills.filter((e) => !removedNames.has(e.name))
    if (remaining.length === 0) {
        await rm(manifestPath(cwd), { force: true })
        await pruneEmptyDirs(cwd, join(cwd, MANIFEST_DIRNAME))
        console.log('所有 skill 已移除，manifest 已删除')
    } else {
        await saveManifest(cwd, { version: 1, skills: remaining })
        console.log(`manifest 已更新（剩余 ${remaining.length} 个 skill）`)
    }
}
