# 環境設定

## 必須環境変数

| 変数名 | 説明 | 優先度 |
|-------|------|-------|
| `GH_TOKEN` | GitHub Personal Access Token | 1 |
| `GITHUB_TOKEN` | GitHub Personal Access Token（GH_TOKENがない場合） | 2 |
| `ANTHROPIC_API_KEY` | Anthropic API Key | - |

**注意:** 環境変数が設定されていない場合、`gh auth token`でGitHub CLIの認証情報を使用します。

**GitHub Tokenに必要な権限:**
- `repo`: リポジトリへのフルアクセス
- `workflow`: GitHub Actionsワークフローの更新（必要な場合）

## 技術スタック

| パッケージ | バージョン | 用途 |
|-----------|----------|------|
| TypeScript | ESM | 開発言語 |
| Node.js | 20+ | ランタイム |
| @anthropic-ai/claude-code | - | Agent SDK |
| @octokit/rest | - | GitHub API |
| simple-git | - | Git操作 |
| commander | - | CLIパーサー |
| vitest | - | テスト |

## ログディレクトリ

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
        ├── system_prompt_append.txt  # システムプロンプト追加分
        └── result.json      # 実行結果
```

---

## よくある使用パターン

### パターン1: 機能追加の依頼から実装まで

```bash
# 1. Claude Code内で計画立案
/plan-issue ユーザー認証機能を追加してほしい

# 2. 対話しながら詳細を詰める
# 3. 計画承認 → ExitPlanMode → Issue自動作成

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

# リモートブランチもクリーンアップ
npm run dev -- issue-apply --issue 789 --model opus --cleanup --cleanup-remote
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

### GitHub API レート制限

```
[GITHUB_RATE_LIMIT] APIレート制限に達しました
  → しばらく待ってから再試行してください。
```

**対処法:**
- 数分待ってから再試行
- レート制限の残り回数を確認: `gh api rate_limit`

### Issue解析エラー

```
[PARSE_ERROR] Issue番号を解析できません
  → 入力データの形式を確認してください。
```

**対処法:**
- Issue番号が正しいか確認
- URLの場合は完全なURLを使用（例: `https://github.com/owner/repo/issues/123`）
