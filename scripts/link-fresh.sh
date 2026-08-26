#!/usr/bin/env bash
# 清理本包在全局 bin 目录的全部符号链接（含改名残留），然后重新 npm link
# 使用场景：修改 package.json 的 bin 字段后执行，保证全局命令与当前配置完全一致
set -euo pipefail
shopt -s nullglob

cd "$(dirname "$0")/.."

PKG_NAME=$(node -p "require('./package.json').name")
BIN_DIR="$(npm config get prefix)/bin"

removed=0
for link in "$BIN_DIR"/*; do
    [ -L "$link" ] || continue
    target=$(readlink "$link")
    # 目标指向 node_modules/<本包名>/ 的链接都属于本包管理范围，无论命令名是什么
    case "$target" in
        *"node_modules/$PKG_NAME/"*)
            echo "移除旧链接 $(basename "$link")"
            rm "$link"
            removed=1
            ;;
    esac
done

if [ "$removed" -eq 0 ]; then
    echo "无旧链接需要移除"
fi

# 清掉全局 node_modules 里的包链接后重建（未链接时 unlink 会报错，忽略即可）
npm unlink -g >/dev/null 2>&1 || true
npm link
