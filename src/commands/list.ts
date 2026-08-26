import { join } from 'node:path'
import { ensureCache } from '../core/cache.js'
import { hashDir } from '../core/checksum.js'
import { CONFIG_FILENAME, loadConfigIfExists } from '../core/config.js'
import { loadManifest } from '../core/registry.js'
import { scanRules, type SkillInfo } from '../core/scanner.js'
import { computeLocalStatus } from '../core/status.js'

export interface ListOptions {
    source?: string
    config?: string
    installed?: boolean
}

/** list：列出源仓库全部 skills；--installed 对照 manifest 显示已装状态 */
export async function runList(cwd: string, opts: ListOptions = {}): Promise<void> {
    if (opts.installed) {
        await listInstalled(cwd, opts)
        return
    }

    const configPath = opts.config ?? join(cwd, CONFIG_FILENAME)
    const config = await loadConfigIfExists(configPath)
    const rulesDir = await ensureCache(opts.source ?? config?.source)
    const catalog = await scanRules(rulesDir)

    const categories = [...catalog.keys()].sort()
    let total = 0
    for (const category of categories) {
        const skills = [...catalog.get(category)!].sort((a, b) => a.name.localeCompare(b.name))
        console.log(`${category}/`)
        for (const skill of skills) {
            console.log(`  ${skill.name.padEnd(34)}${truncate(skill.description, 64)}`)
        }
        total += skills.length
    }
    console.log(`\n共 ${total} 个 skill · ${categories.length} 个分类`)
}

async function listInstalled(cwd: string, opts: ListOptions): Promise<void> {
    const manifest = await loadManifest(cwd)
    if (!manifest) {
        throw new Error('未找到 .skills/manifest.json，当前项目尚未安装 skill（先执行 skills install）')
    }

    const configPath = opts.config ?? join(cwd, CONFIG_FILENAME)
    const config = await loadConfigIfExists(configPath)
    const rulesDir = await ensureCache(opts.source ?? config?.source)
    const catalog = await scanRules(rulesDir)
    const byName = new Map<string, SkillInfo>()
    for (const skills of catalog.values()) {
        for (const s of skills) byName.set(s.name, s)
    }

    const entries = [...manifest.skills].sort((a, b) => a.name.localeCompare(b.name))
    console.log(`已安装 ${entries.length} 个 skill：\n`)
    for (const entry of entries) {
        const skill = byName.get(entry.name)
        let status: string
        if (!skill) {
            status = '源已删除（可 skills remove 清理）'
        } else {
            const parts: string[] = []
            if ((await hashDir(skill.path)) !== entry.checksum) parts.push('有更新')
            const st = await computeLocalStatus(cwd, entry)
            if (st.modified.length > 0) parts.push(`本地已修改（${st.modified.join('/')}）`)
            if (st.missing.length > 0) parts.push(`副本缺失（${st.missing.join('/')}）`)
            status = parts.length > 0 ? parts.join(' · ') : '最新'
        }
        console.log(
            `  ${entry.name.padEnd(34)}${entry.category.padEnd(12)}${entry.tools.join(',').padEnd(26)}${status}`,
        )
    }
    console.log('\n执行 skills update 应用更新（本地有修改的不会被覆盖）')
}

function truncate(text: string, max: number): string {
    const t = text.trim().replace(/\s+/g, ' ')
    return t.length > max ? `${t.slice(0, max - 1)}…` : t
}
