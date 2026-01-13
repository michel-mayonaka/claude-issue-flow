---
name: usage-guide
description: ツールの使い方ガイド。CLIコマンド、カスタムコマンド、環境設定を説明。
generated_at: 2026-01-13T00:00:00.000Z
source_hash: 8f9a74c7ca45b5e8
---

# 使い方ガイド

## CLIコマンド

### issue-apply

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

### plan-issue

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

---

## カスタムコマンド

Claude Code内で使用できるカスタムコマンド。

### /plan-issue

実装計画を対話的に立案してGitHub Issueを作成する。

**使用方法:**
```
/plan-issue <依頼内容>
```

**例:**
```
/plan-issue ユーザープロファイルページに編集機能を追加してほしい
```

**フロー:**
1. コードベースを調査
2. ユーザーと対話しながら詳細を詰める
3. 計画をMarkdown形式で出力
4. ユーザー承認後、ExitPlanModeを実行
5. hookによりGitHub Issueが自動作成される

**計画フォーマット:**
```markdown
# 計画: [タイトル]

## 概要
[実現すること]

## 背景
[変更の理由]

## 変更対象
- `path/to/file.ts`: [変更内容]

## 実装ステップ
1. [ステップ1]
2. [ステップ2]

## 受け入れ条件
- [ ] [条件1]
- [ ] [条件2]

## 確認方法
[テストコマンドや確認手順]

## 注意事項
- [注意点]
```

---

### /commit

変更をレビューしてコミット・プッシュする。

**使用方法:**
```
/commit
```

**実行内容:**
1. `git status`で変更確認
2. ドキュメント整合性チェック（skills/global/doc-check.md参照）
3. テスト整合性チェック（skills/global/test-check.md参照）
4. テスト実行（コード変更時）
5. 問題なければコミット＆プッシュ

**コミットメッセージ規約:**
```
<type>: <説明>

[本文（任意）]

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Type一覧:**
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: コードスタイル変更
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド・ツール変更

---

### /review-architecture

アーキテクチャを包括的にレビューしてレポートを出力する。

**使用方法:**
```
/review-architecture
```

**レビュー項目:**
1. プロジェクト概要の把握
2. ディレクトリ構造の分析
3. 依存関係とモジュール構造
4. コード品質と一貫性
5. テストカバレッジ
6. セキュリティと設定

**出力:**
Markdown形式のレビューレポート（改善提案付き）

---

### /gen-docs

ソースコードを解析してドキュメントを生成・更新する。

**使用方法:**
```
/gen-docs [オプション]
```

**オプション:**
- `--full`: 全ドキュメントを再生成
- `--dry-run`: 更新計画のみ表示
- `--file <name>`: 特定のドキュメントのみ更新
  - architecture, api-reference, usage-guide, code-patterns

**生成ファイル:**
- `skills/docs/architecture.md`: アーキテクチャ概要
- `skills/docs/api-reference.md`: APIリファレンス
- `skills/docs/usage-guide.md`: 使い方ガイド
- `skills/docs/code-patterns.md`: コーディングパターン

---

### /save-article

指定URLの記事を取得してMarkdownで保存する。

**使用方法:**
```
/save-article <URL>
```

**例:**
```
/save-article https://example.com/article
```

**保存先:**
```
repositories/articles/<ディレクトリ名>/
├── article.md      # 記事本文
└── source.txt      # 元URL
```

---

## 環境設定

### 必須環境変数

| 変数名 | 説明 | 優先度 |
|-------|------|-------|
| `GH_TOKEN` | GitHub Personal Access Token | 1 |
| `GITHUB_TOKEN` | GitHub Personal Access Token（GH_TOKENがない場合） | 2 |
| `ANTHROPIC_API_KEY` | Anthropic API Key | - |

**注意:** 環境変数が設定されていない場合、`gh auth token`でGitHub CLIの認証情報を使用します。

**GitHub Tokenに必要な権限:**
- `repo`: リポジトリへのフルアクセス
- `workflow`: GitHub Actionsワークフローの更新（必要な場合）

### ログディレクトリ

実行ログは以下の構造で保存されます：

```
logs/
└── <job-name>/
    └── <run-id>/
        ├── execution.log    # 実行ログ
        ├── messages.jsonl   # SDKメッセージ
        ├── issue.json       # Issue情報
        ├── worktree.json    # Worktree情報
        ├── pr.json          # PR情報（作成時）
        ├── prompt.txt       # 使用したプロンプト
        └── result.json      # 実行結果
```

---

## よくある使用パターン

### パターン1: 機能追加の依頼から実装まで

```bash
# 1. Claude Code内で計画立案
/plan-issue ユーザー認証機能を追加してほしい

# 2. 対話しながら詳細を詰める
# 3. 計画承認 → Issue自動作成

# 4. Issueを実装
npm run dev -- issue-apply --issue 123 --model sonnet

# 5. PRをレビュー＆マージ
```

### パターン2: バグ修正

```bash
# Issue番号がわかっている場合
npm run dev -- issue-apply --issue 456 --model haiku

# PR作成をスキップしてローカルで確認
npm run dev -- issue-apply --issue 456 --skip-pr

# 確認後、手動でコミット
/commit
```

### パターン3: 大規模な変更

```bash
# Opusモデルで複雑な実装
npm run dev -- issue-apply --issue 789 --model opus

# クリーンアップ付き（Worktree削除）
npm run dev -- issue-apply --issue 789 --model opus --cleanup
```

### パターン4: ドライラン（確認のみ）

```bash
# 計画のみ表示（Issue作成しない）
npm run dev -- plan-issue --request "..." --dry-run
```

---

## トラブルシューティング

### GitHubトークンエラー

```
[CONFIGURATION_ERROR] GitHubトークンが見つかりません
  → 'gh auth login' を実行するか、GH_TOKEN環境変数を設定してください。
```

**対処法:**
```bash
# GitHub CLIでログイン
gh auth login

# または環境変数を設定
export GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

### Worktree作成エラー

```
[WORKTREE_ERROR] Worktreeの作成に失敗しました
  → Git worktree操作に失敗しました。リポジトリの状態を確認してください。
```

**対処法:**
```bash
# 既存のWorktreeを確認
git worktree list

# 不要なWorktreeを削除
git worktree prune

# 手動で削除
git worktree remove <path> --force
```

### エージェント実行エラー

```
[AGENT_EXECUTION_ERROR] エージェントの実行に失敗しました
  → エージェント実行中に問題が発生しました。ログを確認してください。
```

**対処法:**
1. `logs/<job-name>/<run-id>/execution.log`を確認
2. `logs/<job-name>/<run-id>/messages.jsonl`でSDKメッセージを確認
3. プロンプトが適切か`prompt.txt`を確認
