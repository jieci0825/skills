/**
 * 落盘操作：把 skill 部署到各工具目录，以及反向的移除与空目录剪枝。
 * install / update（覆盖、补装、修复）/ remove 共用。
 */
import { createHash } from 'node:crypto'
import { cp, mkdir, readFile, readdir, rm, rmdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import type { ToolId } from './config.js'
import { TOOL_TARGETS, skillTargetPath, toFlatRule } from './mapping.js'
import type { SkillInfo } from './scanner.js'

export interface DeployOutcome {
    /** flat 工具（Cursor/Trae）落盘规则文件的内容 SHA-256，update 用于检测本地改动 */
    fileChecksums?: Partial<Record<ToolId, string>>
}

/** 将 skill 部署到全部目标工具目录 */
export async function deploySkill(cwd: string, skill: SkillInfo, tools: ToolId[]): Promise<DeployOutcome> {
    const fileChecksums: Partial<Record<ToolId, string>> = {}
    for (const tool of tools) {
        const checksum = await installSkillToTool(cwd, tool, skill)
        if (checksum) fileChecksums[tool] = checksum
    }
    return Object.keys(fileChecksums).length > 0 ? { fileChecksums } : {}
}

/** 部署单个工具：dir 模型整目录复制；flat 模型压平为单规则文件 */
async function installSkillToTool(cwd: string, tool: ToolId, skill: SkillInfo): Promise<string | undefined> {
    const target = TOOL_TARGETS[tool]

    if (target.format === 'dir') {
        const dest = skillTargetPath(cwd, tool, skill.name)
        await rm(dest, { recursive: true, force: true })
        await mkdir(dirname(dest), { recursive: true })
        // 零转换：SKILL.md / references/ / agents/ 原样随目录复制
        await cp(skill.path, dest, { recursive: true })
        return undefined
    }

    // flat（Cursor .mdc / Trae .md）：仅分发 SKILL.md 正文，references/ 与 agents/ 不随发
    const skillMd = await readFile(join(skill.path, 'SKILL.md'), 'utf-8')
    const ruleFile = skillTargetPath(cwd, tool, skill.name)
    await mkdir(dirname(ruleFile), { recursive: true })
    const content = toFlatRule(skill.description, skillMd)
    await writeFile(ruleFile, content, 'utf-8')
    return createHash('sha256').update(content, 'utf-8').digest('hex')
}

/** 移除 skill 在指定工具目录下的落盘产物 */
export async function removeSkillFiles(cwd: string, name: string, tools: ToolId[]): Promise<void> {
    for (const tool of tools) {
        await rm(skillTargetPath(cwd, tool, name), { recursive: true, force: true })
    }
}

/**
 * 自下而上剪枝空目录：只删除因卸载而变空的目录链（如 .cursor/rules → .cursor），
 * 任何一级有其他内容即停止，cwd 本身不会被删除。
 */
export async function pruneEmptyDirs(cwd: string, deepest: string): Promise<void> {
    const root = resolve(cwd)
    let current = resolve(deepest)
    while (current.startsWith(root + sep)) {
        let entries: string[]
        try {
            entries = await readdir(current)
        } catch {
            return
        }
        if (entries.length > 0) return
        try {
            await rmdir(current)
        } catch {
            return
        }
        current = dirname(current)
    }
}
