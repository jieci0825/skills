import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['src/cli.ts'],
    format: 'esm',
    platform: 'node',
    target: 'node18',
    // CLI 应用不发布类型声明
    dts: false,
    // 构建前清空 dist，避免残留旧产物
    clean: true,
    // 包为 type:module，.js 即 ESM，保持 bin 路径 dist/cli.js 不变
    fixedExtension: false,
})
