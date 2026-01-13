---
name: usage-guide
description: ツールの使い方ガイド。CLIコマンド、カスタムコマンド、環境設定を説明。
generated_at: 2026-01-13T00:00:00.000Z
source_hash: e369de0932cf1b54
files:
  - cli-commands.md
  - custom-commands.md
  - environment.md
---

# 使い方ガイド

このディレクトリにはツールの使い方ガイドが含まれています。

## ドキュメント一覧

| ファイル | 説明 |
|---------|------|
| [cli-commands.md](./cli-commands.md) | CLIコマンド（issue-apply, plan-issue）の使い方 |
| [custom-commands.md](./custom-commands.md) | Claude Codeカスタムコマンドの使い方 |
| [environment.md](./environment.md) | 環境設定、トラブルシューティング |

## クイックスタート

```bash
# Issue #123 を実装してPRを作成
npm run dev -- issue-apply --issue 123

# Sonnetモデルを使用
npm run dev -- issue-apply --issue 123 --model sonnet

# Claude Code内で計画立案
/plan-issue ユーザー認証機能を追加してほしい

# 変更をコミット・プッシュ
/commit
```

## ワークフロー概要

```
1. /plan-issue で計画立案
        ↓
2. 対話的に詳細を詰める
        ↓
3. ExitPlanMode → Issue自動作成
        ↓
4. issue-apply でIssue実装
        ↓
5. PR作成・レビュー
```
