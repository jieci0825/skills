import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { ToolId } from './config.js'

export const MANIFEST_DIRNAME = '.skills'
export const MANIFEST_FILENAME = 'manifest.json'

export interface ManifestEntry {
    /** skill 名称（= 目录名 / 规则文件名） */
    name: string
    category: string
    /** 安装时源 skill 目录的 checksum（update 三态比对的基准） */
    checksum: string
    /** 安装到的目标工具 */
    tools: ToolId[]
    /** 首次安装时间（ISO），幂等重装时保留 */
    installedAt: string
}

export interface Manifest {
    version: 1
    skills: ManifestEntry[]
}

export function manifestPath(cwd: string): string {
    return join(cwd, MANIFEST_DIRNAME, MANIFEST_FILENAME)
}

export async function loadManifest(cwd: string): Promise<Manifest | null> {
    try {
        const raw = await readFile(manifestPath(cwd), 'utf-8')
        const parsed = JSON.parse(raw) as Manifest
        if (parsed?.version !== 1 || !Array.isArray(parsed.skills)) {
            throw new Error('manifest 结构不合法')
        }
        return parsed
    } catch {
        return null
    }
}

export async function saveManifest(cwd: string, manifest: Manifest): Promise<void> {
    const filePath = manifestPath(cwd)
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8')
}

/** 判断两条记录是否等价（不含时间戳），用于幂等重装时保留 installedAt */
export function sameEntry(a: ManifestEntry, b: ManifestEntry): boolean {
    return (
        a.name === b.name &&
        a.category === b.category &&
        a.checksum === b.checksum &&
        a.tools.length === b.tools.length &&
        [...a.tools].sort().join(',') === [...b.tools].sort().join(',')
    )
}
