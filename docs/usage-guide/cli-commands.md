# CLIコマンド

## issue-apply

GitHub Issueを実装してPRを作成する。

**基本使用:**
```bash
npm run dev -- issue-apply --issue <番号>
```

**オプション:**

| オプション | 説明 | デフォルト |
|-----------|------|----------|
| `-i, --issue <ref>` | Issue番号またはURL（必須） | - |
| `--repo <path>` | リポジトリパス | カレントディレクトリ |
| `-m, --model <model>` | 使用モデル（haiku, sonnet, opus） | haiku |
| `--draft` | ドラフトPRとして作成 | true |
| `--no-draft` | 通常のPRとして作成 | - |
| `--skip-pr` | PR作成をスキップ | false |
| `--cleanup` | 完了後にWorktreeとローカルブランチを削除 | false |
| `--cleanup-remote` | リモートブランチも削除（--cleanup必須） | false |

**使用例:**
```bash
# Issue #123 をHaikuモデルで実装
npm run dev -- issue-apply --issue 123

# Sonnetモデルを使用
npm run dev -- issue-apply --issue 123 --model sonnet

# PR作成をスキップ（ローカルで確認したい場合）
npm run dev -- issue-apply --issue 123 --skip-pr

# 通常のPR（ドラフトではない）として作成
npm run dev -- issue-apply --issue 123 --no-draft

# 完了後にWorktreeをクリーンアップ
npm run dev -- issue-apply --issue 123 --cleanup

# GitHub URLでIssueを指定
npm run dev -- issue-apply --issue https://github.com/owner/repo/issues/123
```

**モデル選択ガイド:**

| モデル | 用途 | コスト |
|-------|------|-------|
| haiku | シンプルな修正、小規模な変更 | 低 |
| sonnet | 中規模の機能追加、複雑なバグ修正 | 中 |
| opus | 大規模な機能、アーキテクチャ変更 | 高 |

**出力:**
```
=== issue-apply completed ===
Issue: #123 - Issueタイトル
Branch: issue-apply-123-20260113-143052-12345
Changed files: 3
PR: #45
    https://github.com/owner/repo/pull/45

Logs: /path/to/repo/logs/issue-apply/20260113-143052-12345
```

---

## plan-issue

実装計画を立案してGitHub Issueを作成する。

**基本使用:**
```bash
npm run dev -- plan-issue --request "機能追加の依頼..."
```

**オプション:**

| オプション | 説明 | デフォルト |
|-----------|------|----------|
| `-r, --request <text>` | リクエストテキスト | - |
| `-f, --request-file <path>` | リクエストファイル | - |
| `--repo <path>` | リポジトリパス | カレントディレクトリ |
| `--model <model>` | 使用モデル | claude-opus-4-5-20251101 |
| `--dry-run` | Issue作成をスキップ（確認用） | false |
| `--no-interactive` | 非インタラクティブモード | - |

**使用例:**
```bash
# テキストで依頼
npm run dev -- plan-issue --request "ユーザー認証機能を追加してください"

# ファイルから依頼
npm run dev -- plan-issue --request-file request.md

# ドライラン（Issueは作成しない）
npm run dev -- plan-issue --request "..." --dry-run
```
