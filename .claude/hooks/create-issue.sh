#!/bin/bash

# デバッグログ
LOG_FILE="/tmp/claude-hook-debug.log"
echo "=== Hook started at $(date) ===" >> "$LOG_FILE"

# stdinを読み取って保存
INPUT=$(cat)
echo "Input: $INPUT" >> "$LOG_FILE"

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
echo "Project dir: $PROJECT_DIR" >> "$LOG_FILE"

# TypeScriptを実行
echo "$INPUT" | npx tsx "$PROJECT_DIR/src/hooks/create-issue.ts" 2>> "$LOG_FILE"
EXIT_CODE=$?

echo "Exit code: $EXIT_CODE" >> "$LOG_FILE"
exit $EXIT_CODE
