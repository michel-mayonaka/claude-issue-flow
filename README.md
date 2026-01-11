# claude-agent

Claude Code Agent SDKを使用したGitHub Issue駆動ワークフローツール。

## 概要

- **plan-issue**: Opusモデルで計画を立案し、GitHub Issueを作成
- **issue-apply**: Haiku/SonnetモデルでIssueを実装し、PRを作成

## セットアップ

### 必要条件

- Node.js 20以上
- GitHub Token（`GH_TOKEN`または`GITHUB_TOKEN`環境変数）
- Anthropic API Key（`ANTHROPIC_API_KEY`環境変数）

### インストール

```bash
cd claude-agent
npm install
npm run build
```

## 使い方

### plan-issue（計画→Issue作成）

Opusモデルを使用してコードベースを調査し、実装計画をGitHub Issueとして作成します。

```bash
# テキストで依頼
npx claude-agent plan-issue --request "ログイン機能を追加してください"

# ファイルから依頼を読み込み
npx claude-agent plan-issue --request-file ./request.md

# dry-runモード（Issueを作成せず内容を確認）
npx claude-agent plan-issue --request "新機能" --dry-run

# リポジトリを指定
npx claude-agent plan-issue --request "機能追加" --repo /path/to/repo
```

**オプション**:
| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `-r, --request <text>` | 依頼内容（テキスト） | - |
| `-f, --request-file <path>` | 依頼内容（ファイル） | - |
| `--repo <path>` | 対象リポジトリ | カレントディレクトリ |
| `--model <model>` | 使用モデル | claude-opus-4-5-20251101 |
| `--dry-run` | Issue作成をスキップ | false |
| `--no-interactive` | 非インタラクティブモード | - |

### issue-apply（Issue→PR作成）

指定したIssueの内容を実装し、PRを作成します。

```bash
# Issue番号で指定
npx claude-agent issue-apply --issue 123

# Issue URLで指定
npx claude-agent issue-apply --issue https://github.com/owner/repo/issues/123

# Sonnetモデルを使用（複雑なIssue向け）
npx claude-agent issue-apply --issue 123 --model sonnet

# PRをドラフトではなく公開
npx claude-agent issue-apply --issue 123 --no-draft

# PR作成をスキップ（変更のみコミット）
npx claude-agent issue-apply --issue 123 --skip-pr
```

**オプション**:
| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `-i, --issue <ref>` | Issue番号またはURL（必須） | - |
| `--repo <path>` | 対象リポジトリ | カレントディレクトリ |
| `-m, --model <model>` | 使用モデル（haiku/sonnet） | haiku |
| `--draft` | ドラフトPRとして作成 | true |
| `--no-draft` | 公開PRとして作成 | - |
| `--skip-pr` | PR作成をスキップ | false |

## 開発

### テストの実行

```bash
# 全テスト実行
npm test

# ウォッチモード（ファイル変更時に自動実行）
npm run test:watch

# 特定ファイルのテスト
npm test -- src/core/logger.test.ts
```

### ビルド

```bash
# TypeScriptコンパイル
npm run build

# 型チェックのみ
npm run typecheck
```

### 開発モードで実行

```bash
# tsxで直接実行（ビルド不要）
npm run dev -- plan-issue --request "テスト" --dry-run
npm run dev -- issue-apply --issue 123 --skip-pr
```

## ディレクトリ構成

```
claude-agent/
├── src/
│   ├── index.ts           # CLIエントリーポイント
│   ├── commands/
│   │   ├── plan-issue.ts  # plan-issueコマンド
│   │   └── issue-apply.ts # issue-applyコマンド
│   ├── core/
│   │   ├── agent.ts       # Claude Code SDK ラッパー
│   │   ├── github.ts      # GitHub API操作
│   │   ├── worktree.ts    # git worktree管理
│   │   └── logger.ts      # ログ出力
│   ├── prompts/
│   │   ├── plan-issue.ts  # plan-issue用プロンプト
│   │   ├── issue-apply.ts # issue-apply用プロンプト
│   │   └── skills.ts      # スキルローダー
│   └── types/
│       └── index.ts       # 型定義エクスポート
├── skills/                # agentスキル定義
│   ├── global/
│   │   └── no-hallucination.md
│   └── optional/
│       ├── issue-template.md
│       └── pr-draft.md
└── logs/                  # 実行ログ（自動生成）
```

## ログ

各実行のログは `logs/<command>/<run-id>/` に保存されます。

```
logs/issue-apply/20240115-120000-12345/
├── execution.log      # 実行ログ
├── messages.jsonl     # agentメッセージ履歴
├── issue.json         # 取得したIssue情報
├── worktree.json      # worktree情報
├── pr.json            # 作成したPR情報
└── prompt.txt         # 使用したプロンプト
```

## 環境変数

| 変数名 | 説明 | 必須 |
|-------|------|-----|
| `GH_TOKEN` または `GITHUB_TOKEN` | GitHub Personal Access Token | `gh auth login` 済みなら不要 |
| `ANTHROPIC_API_KEY` | Anthropic API Key | Yes |

**Note**: GitHub認証は `gh auth login` でログイン済みであれば環境変数の設定は不要です。環境変数が設定されている場合はそちらが優先されます。

## ライセンス

MIT
