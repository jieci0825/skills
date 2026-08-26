#!/usr/bin/env bash
# 检查全局 bin 目录里是否存在本包旧命令名的残留符号链接
# 退出码：0 = 无残留；1 = 存在残留（可用于 CI / 钩子判断）
set -euo pipefail
shopt -s nullglob

cd "$(dirname "$0")/.."

PKG_NAME=$(node -p "require('./package.json').name")
CURRENT_BINS=$(node -p "Object.keys(require('./package.json').bin || {}).join(' ')")

BIN_DIR="$(npm config get prefix)/bin"

is_current_bin() {
    # 空格分隔的当前 bin 名列表中精确匹配
    [[ " $CURRENT_BINS " == *" $1 "* ]]
}

found_any=0
found_stale=0

for link in "$BIN_DIR"/*; do
    [ -L "$link" ] || continue
    target=$(readlink "$link")
    case "$target" in
        *"node_modules/$PKG_NAME/"*)
            found_any=1
            name=$(basename "$link")
            if is_current_bin "$name"; then
                echo "✓ $name -> $target"
            else
                echo "✖ 残留 $name -> $target"
                found_stale=1
            fi
            ;;
    esac
done

if [ "$found_any" -eq 0 ]; then
    echo "本包（$PKG_NAME）尚未创建任何全局命令链接，可执行 npm run link:fresh 创建"
elif [ "$found_stale" -eq 1 ]; then
    echo "发现旧名称残留链接，可执行 npm run link:fresh 清理并重建"
    exit 1
else
    echo "无残留链接"
fi
