import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

/** 目录哈希时忽略的无关文件（不影响内容语义） */
const IGNORED_FILES = new Set(['.DS_Store'])

/** 单文件 SHA-256 */
export async function hashFile(filePath: string): Promise<string> {
    const content = await readFile(filePath)
    return createHash('sha256').update(content).digest('hex')
}

/**
 * 目录级 SHA-256：收集目录下所有文件的「相对路径 + 内容」后哈希。
 * 文件列表先排序，排除遍历顺序干扰；忽略 .DS_Store 等无关文件。
 */
export async function hashDir(dirPath: string): Promise<string> {
    const files: string[] = []
    await collectFiles(dirPath, files)

    const hash = createHash('sha256')
    for (const file of files) {
        const rel = relative(dirPath, file)
        const content = await readFile(file)
        hash.update(rel)
        hash.update('\0')
        hash.update(content)
        hash.update('\0')
    }
    return hash.digest('hex')
}

async function collectFiles(dir: string, out: string[]): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
        if (IGNORED_FILES.has(entry.name)) continue
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
            await collectFiles(fullPath, out)
        } else if (entry.isFile()) {
            out.push(fullPath)
        }
    }
    // 排序在 collectFiles 完成后统一进行，保证归一化
    out.sort()
}
