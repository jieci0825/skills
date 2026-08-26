import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ensureCache } from '../core/cache.js'
import { CONFIG_FILENAME, TOOL_IDS, type SkillsConfig, type ToolId } from '../core/config.js'
import { TOOL_TARGETS } from '../core/mapping.js'
import { multiselect } from '../core/prompt.js'
import { scanRules, type SkillCatalog } from '../core/scanner.js'
import { runInstall, type InstallOptions } from './install.js'

/** 框架选型类分类：作为独立问题呈现，并结合 package.json 依赖推荐 */
const FRAMEWORK_CATEGORIES = new Set(['vue', 'react'])

const TOOL_LABELS: Record<ToolId, string> = {
    codex: 'Codex',
    claude: 'Claude Code',
    cursor: 'Cursor',
    trae: 'Trae',
}

/** 判断工具已在项目中使用的标记目录（codex 兼容历史 .codex/） */
const TOOL_MARKERS: Record<ToolId, string[]> = {
    codex: ['.agents', '.codex'],
    claude: ['.claude'],
    cursor: ['.cursor'],
    trae: ['.trae'],
}

/** 无配置文件时的交互式安装：问答 → 生成 skills.config.json → 走 install 流程 */
export async function runInteractiveInstall(cwd: string, opts: InstallOptions): Promise<void> {
    const rulesDir = await ensureCache(opts.source)
    const catalog = await scanRules(rulesDir)

    const categories = [...catalog.keys()].sort()
    if (categories.length === 0) {
        throw new Error('源仓库中未发现任何 skill，请确认源仓库 rules/ 目录结构')
    }

    const selected = await askCategories(cwd, catalog)
    const tools = await askTools(cwd)

    const config: SkillsConfig = {
        categories: categories.filter((c) => selected.includes(c)),
        tools: TOOL_IDS.filter((t) => tools.includes(t)),
    }
    const configPath = opts.config ?? join(cwd, CONFIG_FILENAME)
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8')
    console.log(`已生成 ${CONFIG_FILENAME}（后续可直接编辑后重新执行 install）\n`)

    await runInstall(cwd, opts)
}

async function askCategories(cwd: string, catalog: SkillCatalog): Promise<string[]> {
    const categories = [...catalog.keys()].sort()
    const base = categories.filter((c) => !FRAMEWORK_CATEGORIES.has(c))
    const frameworks = categories.filter((c) => FRAMEWORK_CATEGORIES.has(c))

    const selected: string[] = []
    if (base.length > 0) {
        const picked = await multiselect(
            '选择基础分类（common / frontend 默认勾选）',
            base.map((c) => ({
                value: c,
                label: c,
                hint: `${catalog.get(c)!.length} 个 skill`,
                checked: c === 'common' || c === 'frontend',
            })),
            { min: 1 },
        )
        selected.push(...picked)
    }

    if (frameworks.length > 0) {
        const detected = await detectFrameworks(cwd)
        const picked = await multiselect(
            '选择框架选型分类（可跳过，已按 package.json 依赖预选）',
            frameworks.map((c) => ({
                value: c,
                label: c,
                hint: detected.includes(c) ? '检测到项目依赖' : `${catalog.get(c)!.length} 个 skill`,
                checked: detected.includes(c),
            })),
        )
        selected.push(...picked)
    }

    if (selected.length === 0) {
        throw new Error('至少需要选择一个分类')
    }
    return selected
}

async function askTools(cwd: string): Promise<ToolId[]> {
    const existing = TOOL_IDS.filter((t) => TOOL_MARKERS[t].some((m) => existsSync(join(cwd, m))))
    const picked = await multiselect(
        '选择目标工具（检测到项目已有目录的默认勾选）',
        TOOL_IDS.map((t) => ({
            value: t,
            label: TOOL_LABELS[t],
            hint: `安装到 ${TOOL_TARGETS[t].dir}/`,
            checked: existing.length > 0 ? existing.includes(t) : true,
        })),
        { min: 1 },
    )
    return picked as ToolId[]
}

/** 从 package.json 依赖推断框架选型 */
async function detectFrameworks(cwd: string): Promise<string[]> {
    try {
        const raw = await readFile(join(cwd, 'package.json'), 'utf-8')
        const pkg = JSON.parse(raw) as {
            dependencies?: Record<string, string>
            devDependencies?: Record<string, string>
        }
        const deps = { ...pkg.dependencies, ...pkg.devDependencies }
        const result: string[] = []
        if ('vue' in deps || 'nuxt' in deps) result.push('vue')
        if ('react' in deps || 'next' in deps) result.push('react')
        return result
    } catch {
        return []
    }
}
