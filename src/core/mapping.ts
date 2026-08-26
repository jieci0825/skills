import type { ToolId } from './config.js'
import { stripFrontmatter, yamlQuote } from './frontmatter.js'

/** 工具目标模型：dir = skill 目录原样复制；flat = 压平为单规则文件 */
export type TargetFormat = 'dir' | 'flat'

export interface ToolTarget {
    /** 项目级目标目录（相对项目根） */
    dir: string
    format: TargetFormat
    /** flat 模式的扩展名 */
    ext?: string
}

/** 阶段 1 实测定稿的映射表（附录 A） */
export const TOOL_TARGETS: Record<ToolId, ToolTarget> = {
    codex: { dir: '.agents/skills', format: 'dir' },
    claude: { dir: '.claude/skills', format: 'dir' },
    cursor: { dir: '.cursor/rules', format: 'flat', ext: '.mdc' },
    trae: { dir: '.trae/rules', format: 'flat', ext: '.md' },
}

/**
 * 将 SKILL.md 转换为 Cursor / Trae 的单文件规则格式：
 * - name 丢弃（由文件名承载）
 * - description 直传，alwaysApply: false，不设 globs（智能生效）
 * - 正文为 SKILL.md 去 frontmatter 后的内容；references/ 不随发（附录 A 要点 3）
 */
export function toFlatRule(description: string, skillMd: string): string {
    const body = stripFrontmatter(skillMd).replace(/^\n+/, '')
    const desc = description.trim() || ''
    return `---\n` + `description: ${yamlQuote(desc)}\n` + `alwaysApply: false\n` + `---\n\n` + body
}
