#!/usr/bin/env node
import { Command } from 'commander'
import { runInstall } from './commands/install.js'

const program = new Command()

program
    .name('skills')
    .description('从 skills 源仓库安装 AI 编码规则到 Codex / Claude Code / Cursor / Trae（项目级）')
    .version('0.1.0')

program
    .command('install')
    .description('读取 skills.config.json，安装选中分类的 skills 到目标工具目录')
    .option('--source <path-or-url>', '源仓库（git URL 或本地路径），覆盖配置文件中的 source')
    .option('--config <path>', '配置文件路径（默认当前目录 skills.config.json）')
    .action(async (opts: { source?: string; config?: string }) => {
        try {
            await runInstall(process.cwd(), opts)
        } catch (e) {
            console.error(`✖ ${(e as Error).message}`)
            process.exitCode = 1
        }
    })

program.parseAsync(process.argv)
