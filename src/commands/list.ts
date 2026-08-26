import { join } from 'node:path'
import Table from 'cli-table3'
import stringWidth from 'string-width'
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

/** 表格边框 + 内边距等固定开销：3 列为 10 列宽，4 列为 13 列宽 */
const TABLE_OVERHEAD = { columns3: 10, columns4: 13 }

/** list：以表格列出源仓库全部 skills；--installed 对照 manifest 显示已装状态 */
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
    const allSkills = categories.flatMap((category) =>
        [...catalog.get(category)!].sort((a, b) => a.name.localeCompare(b.name)),
    )

    const catWidth = Math.max(stringWidth('分类'), ...categories.map((c) => stringWidth(c)))
    const nameWidth = Math.max(stringWidth('Skill'), ...allSkills.map((s) => stringWidth(s.name)))
    const descWidth = clamp(termWidth() - catWidth - nameWidth - TABLE_OVERHEAD.columns3, 20, 64)

    const table = new Table({ head: ['分类', 'Skill', '描述'], style: tableStyle() })
    for (const skill of allSkills) {
        table.push([skill.category, skill.name, truncate(skill.description, descWidth)])
    }
    console.log(table.toString())
    console.log(`\n共 ${allSkills.length} 个 skill · ${categories.length} 个分类`)
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

    const nameWidth = Math.max(stringWidth('Skill'), ...entries.map((e) => stringWidth(e.name)))
    const catWidth = Math.max(stringWidth('分类'), ...entries.map((e) => stringWidth(e.category)))
    const toolsWidth = Math.max(stringWidth('工具'), ...entries.map((e) => stringWidth(e.tools.join(', '))))
    const statusWidth = clamp(termWidth() - nameWidth - catWidth - toolsWidth - TABLE_OVERHEAD.columns4, 16, 64)

    const table = new Table({ head: ['Skill', '分类', '工具', '状态'], style: tableStyle() })
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
        table.push([entry.name, entry.category, entry.tools.join(', '), truncate(status, statusWidth)])
    }
    console.log(table.toString())
    console.log('\n执行 skills update 应用更新（本地有修改的不会被覆盖）')
}

/** 纯文本表格样式：关闭默认着色，compact 去掉行间横线使表格更紧凑 */
function tableStyle() {
    return {
        head: [] as string[],
        border: [] as string[],
        compact: true,
        'padding-left': 1,
        'padding-right': 1,
    }
}

/** 终端列宽，非 TTY 环境回退 80 */
function termWidth(): number {
    const w = process.stdout.columns
    return w && w > 0 ? w : 80
}

function clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n))
}

/** 按终端显示宽度截断（CJK 全角按 2 列计），超出以省略号结尾 */
function truncate(text: string, maxWidth: number): string {
    const t = text.trim().replace(/\s+/g, ' ')
    if (stringWidth(t) <= maxWidth) return t
    let out = ''
    for (const ch of t) {
        if (stringWidth(out + ch) + 1 > maxWidth) break
        out += ch
    }
    return `${out}…`
}
