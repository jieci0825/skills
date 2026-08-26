/**
 * 本地副本状态检测（update 三态比对的「本地副本 vs 安装时记录」一侧）。
 * - dir 模型（Codex/Claude）：安装是整目录复制，hashDir(本地目录) === 安装时源 checksum 即未改动
 * - flat 模型（Cursor/Trae）：比对落盘文件内容哈希与 manifest 记录的 fileChecksums
 */
import { existsSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { hashDir, hashFile } from './checksum.js'
import type { ToolId } from './config.js'
import { TOOL_TARGETS, skillTargetPath } from './mapping.js'
import type { ManifestEntry } from './registry.js'

export interface LocalStatus {
    /** 本地副本与安装时不一致的工具（被修改） */
    modified: ToolId[]
    /** 本地副本缺失的工具（目录被删空 / 文件不存在） */
    missing: ToolId[]
}

export async function computeLocalStatus(cwd: string, entry: ManifestEntry): Promise<LocalStatus> {
    const modified: ToolId[] = []
    const missing: ToolId[] = []

    for (const tool of entry.tools) {
        const path = skillTargetPath(cwd, tool, entry.name)
        if (!existsSync(path)) {
            missing.push(tool)
            continue
        }

        const target = TOOL_TARGETS[tool]
        if (target.format === 'dir') {
            // 目录存在但为空：视为缺失（可安全修复恢复）
            const items = await readdir(path)
            if (items.length === 0) {
                missing.push(tool)
                continue
            }
            if ((await hashDir(path)) !== entry.checksum) modified.push(tool)
        } else {
            const recorded = entry.fileChecksums?.[tool]
            // 旧 manifest 无记录时视为未修改，交由源侧 checksum 比对决策
            if (recorded !== undefined && (await hashFile(path)) !== recorded) modified.push(tool)
        }
    }

    return { modified, missing }
}
