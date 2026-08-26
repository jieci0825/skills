import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { ensureCache } from '../core/cache.js'
import { hashDir } from '../core/checksum.js'
import { CONFIG_FILENAME, loadConfig, type ToolId } from '../core/config.js'
import { TOOL_TARGETS, toFlatRule } from '../core/mapping.js'
import {
    loadManifest,
    manifestPath,
    sameEntry,
    saveManifest,
    type Manifest,
    type ManifestEntry,
} from '../core/registry.js'
import { scanRules, type SkillInfo } from '../core/scanner.js'

export interface InstallOptions {
    source?: string
    config?: string
}

/** install 主流程：读配置 → 展开分类 → 按映射复制到各工具目录 → 写 manifest */
export async function runInstall(cwd: string, opts: InstallOptions = {}): Promise<void> {
    const configPath = opts.config ?? join(cwd, CONFIG_FILENAME)
    const config = await loadConfig(configPath)

    const rulesDir = await ensureCache(opts.source ?? config.source)
    const catalog = await scanRules(rulesDir)

    const skills = resolveSkills(catalog, config.categories, config.exclude ?? [])
    if (skills.length === 0) {
        throw new Error('选中的分类下没有任何 skill，请检查 categories 配置')
    }

    const previous = await loadManifest(cwd)
    const previousByName = new Map((previous?.skills ?? []).map((e) => [e.name, e]))

    const entries: ManifestEntry[] = []
    for (const skill of skills) {
        const checksum = await hashDir(skill.path)
        for (const tool of config.tools) {
            await installSkillForTool(cwd, tool, skill)
        }

        const entry: ManifestEntry = {
            name: skill.name,
            category: skill.category,
            checksum,
            tools: [...config.tools],
            installedAt: new Date().toISOString(),
        }
        // 幂等：内容与工具均未变化时保留首次安装时间，保证 manifest 字节级稳定
        const old = previousByName.get(skill.name)
        if (old && sameEntry(old, entry)) {
            entry.installedAt = old.installedAt
        }
        entries.push(entry)
    }

    const manifest: Manifest = { version: 1, skills: entries }
    await saveManifest(cwd, manifest)

    printSummary(skills, config.tools, manifestPath(cwd))
}

/** 展开分类为 skill 清单；分类不存在时报错并列出可选分类 */
function resolveSkills(catalog: Map<string, SkillInfo[]>, categories: string[], exclude: string[]): SkillInfo[] {
    const missing = categories.filter((c) => !catalog.has(c))
    if (missing.length > 0) {
        const available = [...catalog.keys()].sort().join(' / ')
        throw new Error(`配置引用了不存在的分类：${missing.join(' / ')}\n  源仓库可用的分类：${available || '（无）'}`)
    }

    const excluded = new Set(exclude)
    const skills: SkillInfo[] = []
    const seen = new Set<string>()
    for (const category of categories) {
        for (const skill of catalog.get(category)!) {
            if (excluded.has(skill.name)) continue
            if (seen.has(skill.name)) continue // 同名 skill 去重（首见保留）
            seen.add(skill.name)
            skills.push(skill)
        }
    }
    return skills
}

/** 按工具映射安装单个 skill：dir 模型整目录复制；flat 模型压平为单文件 */
async function installSkillForTool(cwd: string, tool: ToolId, skill: SkillInfo): Promise<void> {
    const target = TOOL_TARGETS[tool]

    if (target.format === 'dir') {
        const dest = join(cwd, target.dir, skill.name)
        await rm(dest, { recursive: true, force: true })
        await mkdir(dirname(dest), { recursive: true })
        // 零转换：SKILL.md / references/ / agents/ 原样随目录复制
        await cp(skill.path, dest, { recursive: true })
        return
    }

    // flat（Cursor .mdc / Trae .md）：仅分发 SKILL.md 正文，references/ 与 agents/ 不随发
    const skillMd = await readFile(join(skill.path, 'SKILL.md'), 'utf-8')
    const ruleFile = join(cwd, target.dir, `${skill.name}${target.ext}`)
    await mkdir(dirname(ruleFile), { recursive: true })
    await writeFile(ruleFile, toFlatRule(skill.description, skillMd), 'utf-8')
}

function printSummary(skills: SkillInfo[], tools: ToolId[], manifestFilePath: string): void {
    const byCategory = new Map<string, number>()
    for (const s of skills) {
        byCategory.set(s.category, (byCategory.get(s.category) ?? 0) + 1)
    }
    const lines = [
        `已安装 ${skills.length} 个 skill 到 ${tools.length} 个工具：`,
        ...[...byCategory.entries()].map(([cat, n]) => `  ${cat}/ ×${n}`),
        `  目标工具：${tools.join(' / ')}`,
        `manifest 已写入 ${manifestFilePath}（建议纳入版本控制，安装目录建议加入 .gitignore）`,
    ]
    console.log(lines.join('\n'))
}
