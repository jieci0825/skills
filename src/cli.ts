#!/usr/bin/env node
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { Command } from 'commander'
import { runInstall, type InstallOptions } from './commands/install.js'
import { runInteractiveInstall } from './commands/interactive.js'
import { runList, type ListOptions } from './commands/list.js'
import { runRemove, type RemoveOptions } from './commands/remove.js'
import { runUpdate, type UpdateOptions } from './commands/update.js'
import { CONFIG_FILENAME } from './core/config.js'
import { isInteractive } from './core/prompt.js'

const VERSION = '0.2.0'

const program = new Command()

program
    .name('skills')
    .description('从 skills 源仓库安装 AI 编码规则到 Codex / Claude Code / Cursor / Trae（项目级）')
    .version(VERSION)

program.addHelpText(
    'after',
    `
示例:
  skills install                          首次使用：交互式问答生成 skills.config.json 并安装
  skills install --source ../skills      指定本地源仓库安装
  skills list                             查看源仓库全部可用 skill
  skills list --installed                 查看已安装 skill 的更新 / 本地改动状态
  skills update                           拉取源仓库并安全更新（不覆盖本地修改）
  skills update --force                   强制覆盖有本地修改的 skill
  skills remove git-commit                移除指定 skill
  skills remove --all                     移除全部 skill 并清理 manifest`,
)

program
    .command('install')
    .description('安装选中分类的 skills 到目标工具目录；无配置文件时进入交互式问答')
    .option('--source <path-or-url>', '源仓库（git URL 或本地路径），覆盖配置文件中的 source')
    .option('--config <path>', '配置文件路径（默认当前目录 skills.config.json）')
    .action(async (opts: InstallOptions) => {
        await guard(async () => {
            const cwd = process.cwd()
            const configPath = opts.config ?? join(cwd, CONFIG_FILENAME)
            if (!existsSync(configPath)) {
                if (!isInteractive()) {
                    throw new Error(
                        `未找到配置文件 ${CONFIG_FILENAME}，且当前环境不支持交互式问答。\n` +
                            '  请在交互式终端中执行 skills install，或手动创建配置：\n' +
                            '  {"categories": ["common", "frontend"], "tools": ["codex", "claude", "cursor", "trae"]}',
                    )
                }
                await runInteractiveInstall(cwd, opts)
                return
            }
            await runInstall(cwd, opts)
        })
    })

program
    .command('list')
    .description('列出源仓库中的全部 skills；--installed 对照 manifest 显示已装状态')
    .option('--installed', '显示当前项目已安装的 skills 及其状态（有更新 / 本地改动 / 缺失）')
    .option('--source <path-or-url>', '源仓库（git URL 或本地路径）')
    .option('--config <path>', '配置文件路径（默认当前目录 skills.config.json，仅用于读取 source）')
    .action(async (opts: ListOptions) => {
        await guard(() => runList(process.cwd(), opts))
    })

program
    .command('update')
    .description('拉取源仓库并安全更新：本地未改动的 skill 覆盖更新，有本地修改的跳过并警告')
    .option('--force', '强制覆盖有本地修改的 skill（覆盖前打印将丢弃的文件）')
    .option('--source <path-or-url>', '源仓库（git URL 或本地路径），覆盖配置文件中的 source')
    .option('--config <path>', '配置文件路径（默认当前目录 skills.config.json）')
    .action(async (opts: UpdateOptions) => {
        await guard(() => runUpdate(process.cwd(), opts))
    })

program
    .command('remove')
    .description('按 manifest 移除已安装的 skills 及其产物；无参数时交互式选择')
    .argument('[names...]', '要移除的 skill 名称')
    .option('--all', '移除全部已安装 skill')
    .action(async (names: string[], opts: RemoveOptions) => {
        await guard(() => runRemove(process.cwd(), names, opts))
    })

async function guard(fn: () => Promise<void>): Promise<void> {
    try {
        await fn()
    } catch (e) {
        console.error(`✖ ${(e as Error).message}`)
        process.exitCode = 1
    }
}

program.parseAsync(process.argv)
