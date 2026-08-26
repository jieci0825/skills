import { execFile } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const exec = promisify(execFile)

export const DEFAULT_REPO_URL = 'https://github.com/jieci0825/skills.git'
export const CACHE_DIR = join(homedir(), '.skills', 'repo')

/**
 * 确保源仓库可用，返回其 rules/ 目录绝对路径。
 * - source 为存在的本地目录：直接使用（本地开发 / 私有场景）
 * - 否则视为 git URL：~/.skills/repo 不存在则 clone，存在则 pull
 */
export async function ensureCache(source?: string): Promise<string> {
    const repoUrl = source?.trim() || DEFAULT_REPO_URL

    if (isLocalDir(repoUrl)) {
        const rulesDir = join(repoUrl, 'rules')
        if (!existsSync(rulesDir)) {
            throw new Error(`本地源目录 ${repoUrl} 下未找到 rules/，请确认路径指向本仓库根目录`)
        }
        return rulesDir
    }

    const hasCache = existsSync(join(CACHE_DIR, '.git'))
    try {
        if (!hasCache) {
            await exec('git', ['clone', repoUrl, CACHE_DIR])
        } else {
            // 缓存可能来自不同 remote，统一指向当前 source 后快进更新
            await exec('git', ['-C', CACHE_DIR, 'remote', 'set-url', 'origin', repoUrl])
            await exec('git', ['-C', CACHE_DIR, 'pull', '--ff-only'])
        }
    } catch (e) {
        const hint = hasCache ? '更新缓存失败' : '克隆源仓库失败'
        throw new Error(
            `${hint}（${repoUrl}）：${(e as Error).message}\n` +
                `  请检查网络与仓库地址，或使用 --source 指向本地仓库路径。`,
        )
    }

    const rulesDir = join(CACHE_DIR, 'rules')
    if (!existsSync(rulesDir)) {
        throw new Error(`源仓库中未找到 rules/ 目录（${repoUrl}），请确认仓库结构`)
    }
    return rulesDir
}

function isLocalDir(path: string): boolean {
    try {
        return existsSync(path) && statSync(path).isDirectory()
    } catch {
        return false
    }
}
