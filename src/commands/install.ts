import { join } from 'node:path'
import { ensureCache } from '../core/cache.js'
import { hashDir } from '../core/checksum.js'
import { CONFIG_FILENAME, loadConfig, type ToolId } from '../core/config.js'
import { deploySkill } from '../core/installer.js'
import { TOOL_TARGETS } from '../core/mapping.js'
import {
    loadManifest,
    manifestPath,
    sameEntry,
    saveManifest,
    type Manifest,
    type ManifestEntry,
} from '../core/registry.js'
import { expandCategories, scanRules, type SkillInfo } from '../core/scanner.js'

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

    const skills = expandCategories(catalog, config.categories, config.exclude ?? [])
    if (skills.length === 0) {
        throw new Error('选中的分类下没有任何 skill，请检查 categories 配置')
    }

    const previous = await loadManifest(cwd)
    const previousByName = new Map((previous?.skills ?? []).map((e) => [e.name, e]))

    const entries: ManifestEntry[] = []
    for (const skill of skills) {
        const checksum = await hashDir(skill.path)
        const { fileChecksums } = await deploySkill(cwd, skill, config.tools)

        const entry: ManifestEntry = {
            name: skill.name,
            category: skill.category,
            checksum,
            tools: [...config.tools],
            installedAt: new Date().toISOString(),
            ...(fileChecksums ? { fileChecksums } : {}),
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

function printSummary(skills: SkillInfo[], tools: ToolId[], manifestFilePath: string): void {
    const byCategory = new Map<string, number>()
    for (const s of skills) {
        byCategory.set(s.category, (byCategory.get(s.category) ?? 0) + 1)
    }
    const ignoreDirs = [...new Set(tools.map((t) => `${TOOL_TARGETS[t].dir}/`))].sort()
    const lines = [
        `已安装 ${skills.length} 个 skill 到 ${tools.length} 个工具：`,
        ...[...byCategory.entries()].map(([cat, n]) => `  ${cat}/ ×${n}`),
        `  目标工具：${tools.join(' / ')}`,
        `manifest 已写入 ${manifestFilePath}（建议纳入版本控制）`,
        `建议将以下安装目录加入 .gitignore（团队成员各自执行 install）：`,
        ...ignoreDirs.map((d) => `  ${d}`),
    ]
    console.log(lines.join('\n'))
}
