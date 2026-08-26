/**
 * 零依赖交互式问答组件（基于 stdin raw mode）。
 * 用于无配置文件时的交互式 install、update 的源删除清理确认、remove 的选择。
 */
import { stdin, stdout } from 'node:process'
import type { ReadStream as TTYReadStream } from 'node:tty'

/** 当前环境是否可交互（stdin 与 stdout 均为 TTY） */
export function isInteractive(): boolean {
    return Boolean(stdin.isTTY && stdout.isTTY)
}

export interface CheckOption {
    value: string
    label: string
    /** 展示在 label 后的弱化提示文字 */
    hint?: string
    checked?: boolean
}

export interface MultiselectOptions {
    /** 至少需勾选的数量（默认 0，即允许空选，用于可跳过的问题） */
    min?: number
}

const DIM = '\x1b[2m'
const DIM_RESET = '\x1b[22m'

function dim(text: string): string {
    return `${DIM}${text}${DIM_RESET}`
}

function assertInteractive(): void {
    if (!isInteractive()) {
        throw new Error('当前环境不支持交互式问答（stdin/stdout 非 TTY），请改用配置文件或命令行参数')
    }
}

function setRawMode(enabled: boolean): void {
    ;(stdin as unknown as TTYReadStream).setRawMode(enabled)
}

/** 将一次 data 事件的内容拆分为独立按键（快速输入/粘贴时多个按键会合并到达） */
function* parseKeys(buf: Buffer): Generator<string> {
    const s = buf.toString('utf8')
    let i = 0
    while (i < s.length) {
        if (s[i] === '\x1b') {
            // 方向键序列：\x1b[A / \x1bOA 等，整体作为一个按键
            const seq = s.slice(i, i + 3)
            if (seq.length === 3 && (seq[1] === '[' || seq[1] === 'O') && 'ABCD'.includes(seq[2]!)) {
                yield seq
                i += 3
                continue
            }
        }
        yield s[i]!
        i += 1
    }
}

/**
 * 多选问卷：↑/↓ 移动，空格勾选，a 全选/全不选，回车确认，Ctrl-C 退出。
 * 返回选中的 value 列表。
 */
export async function multiselect(
    title: string,
    options: CheckOption[],
    opts: MultiselectOptions = {},
): Promise<string[]> {
    assertInteractive()
    if (options.length === 0) return []

    const min = opts.min ?? 0
    const states = options.map((o) => ({ ...o, checked: o.checked ?? false }))
    let cursor = 0
    let rendered = 0
    let notice = ''

    return new Promise<string[]>((resolve) => {
        let done = false

        const finish = (): void => {
            stdin.removeListener('data', onData)
            setRawMode(false)
            stdin.pause()
        }

        const rows = (): string[] => {
            const lines = [
                `? ${title}`,
                ...states.map((s, i) => {
                    const pointer = i === cursor ? '❯' : ' '
                    const mark = s.checked ? '[x]' : '[ ]'
                    return `  ${pointer} ${mark} ${s.label}${s.hint ? dim(`  ${s.hint}`) : ''}`
                }),
                `  ${dim('空格勾选 · ↑↓ 移动 · a 全选/清空 · 回车确认')}`,
            ]
            if (notice) lines.push(`  ${notice}`)
            return lines
        }

        const paint = (): void => {
            const lines = rows()
            // 光标回到上一帧首行，清屏至末尾后重画
            let seq = rendered > 0 ? `\x1b[${rendered}F` : ''
            seq += '\x1b[J'
            stdout.write(seq + lines.join('\n') + '\n')
            rendered = lines.length
        }

        const complete = (): void => {
            done = true
            finish()
            const chosen = states.filter((s) => s.checked)
            const summary = `✔ ${title}${
                chosen.length > 0 ? dim(` → ${chosen.map((s) => s.label).join('、')}`) : dim('（未选择）')
            }`
            stdout.write(`\x1b[${rendered}F\x1b[J${summary}\n`)
            resolve(chosen.map((s) => s.value))
        }

        const handleKey = (key: string): void => {
            notice = ''
            if (key === '\x03') {
                finish()
                stdout.write('\n')
                process.exit(130)
            }
            if (key === '\r' || key === '\n') {
                const selectedCount = states.filter((s) => s.checked).length
                if (selectedCount < min) {
                    notice = `⚠ 至少选择 ${min} 项`
                    paint()
                    return
                }
                complete()
                return
            }
            if (key === ' ') {
                states[cursor]!.checked = !states[cursor]!.checked
                paint()
                return
            }
            if (key === 'a' || key === 'A') {
                const allChecked = states.every((s) => s.checked)
                for (const s of states) s.checked = !allChecked
                paint()
                return
            }
            // 方向键（兼容 \x1b[A 与 \x1bOA 两种序列）
            if (key.startsWith('\x1b')) {
                const last = key[key.length - 1]
                if (last === 'A') cursor = (cursor - 1 + states.length) % states.length
                else if (last === 'B') cursor = (cursor + 1) % states.length
                paint()
            }
        }

        const onData = (buf: Buffer): void => {
            for (const key of parseKeys(buf)) {
                if (done) break
                handleKey(key)
            }
        }

        setRawMode(true)
        stdin.resume()
        paint()
        stdin.on('data', onData)
    })
}

/** 是/否确认：y/n 或回车取默认值，Ctrl-C 退出 */
export async function confirm(question: string, defaultValue = true): Promise<boolean> {
    assertInteractive()
    return new Promise<boolean>((resolve) => {
        const hint = defaultValue ? 'Y/n' : 'y/N'
        let answered = false

        const finish = (): void => {
            stdin.removeListener('data', onData)
            setRawMode(false)
            stdin.pause()
        }

        const answer = (value: boolean): void => {
            stdout.write(`\r\x1b[K✔ ${question} ${dim(value ? '是' : '否')}\n`)
            resolve(value)
        }

        const onData = (buf: Buffer): void => {
            if (answered) return
            for (const key of parseKeys(buf)) {
                if (answered) break
                if (key === '\x03') {
                    finish()
                    stdout.write('\n')
                    process.exit(130)
                }
                if (key === 'y' || key === 'Y') {
                    answered = true
                    finish()
                    answer(true)
                } else if (key === 'n' || key === 'N') {
                    answered = true
                    finish()
                    answer(false)
                } else if (key === '\r' || key === '\n') {
                    answered = true
                    finish()
                    answer(defaultValue)
                }
            }
        }

        setRawMode(true)
        stdin.resume()
        stdout.write(`? ${question} ${dim(`(${hint})`)} `)
        stdin.on('data', onData)
    })
}
