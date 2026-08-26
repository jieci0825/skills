import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseFrontmatter } from './frontmatter.js'

export interface SkillInfo {
    /** frontmatter name（缺失时回退为目录名） */
    name: string
    description: string
    /** 所属分类（rules/ 下的一级目录名） */
    category: string
    /** skill 目录绝对路径 */
    path: string
}

export type SkillCatalog = Map<string, SkillInfo[]>

/**
 * 扫描 rules/ 目录，产出「分类 → skills 清单」。
 * 仅识别含 SKILL.md 的一级子目录；分类目录只有一层（见附录 B）。
 */
export async function scanRules(rulesDir: string): Promise<SkillCatalog> {
    const catalog: SkillCatalog = new Map()
    const categories = await listDirs(rulesDir)

    for (const category of categories) {
        const skillDirs = await listDirs(join(rulesDir, category))
        const skills: SkillInfo[] = []

        for (const dirName of skillDirs) {
            const skillPath = join(rulesDir, category, dirName)
            const skillMdPath = join(skillPath, 'SKILL.md')
            let raw: string
            try {
                raw = await readFile(skillMdPath, 'utf-8')
            } catch {
                continue // 无 SKILL.md，不是 skill（如 README、杂项文件）
            }
            const fm = parseFrontmatter(raw)
            skills.push({
                name: fm.name || dirName,
                description: fm.description ?? '',
                category,
                path: skillPath,
            })
        }

        if (skills.length > 0) {
            catalog.set(category, skills)
        }
    }

    return catalog
}

/** 展开分类为 skill 清单；分类不存在时报错并列出可选分类，同名 skill 去重（首见保留） */
export function expandCategories(catalog: SkillCatalog, categories: string[], exclude: string[]): SkillInfo[] {
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
            if (seen.has(skill.name)) {
                console.warn(`⚠ 不同分类下存在同名 skill「${skill.name}」（${category}），仅保留首个，已跳过`)
                continue
            }
            seen.add(skill.name)
            skills.push(skill)
        }
    }
    return skills
}

async function listDirs(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true })
    return entries.filter((e) => e.isDirectory()).map((e) => e.name)
}
