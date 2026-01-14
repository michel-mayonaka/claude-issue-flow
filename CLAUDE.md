# CLAUDE.md

## プロジェクト概要

Claude Code Agent SDKを使用したGitHub Issue駆動ワークフローツール。

- `/plan-issue`: Claude Codeのカスタムコマンド。Opusモデルで計画を立案し、ExitPlanMode後にGitHub Issueを自動作成
- `issue-apply`: CLIツール。Haiku/Sonnet/OpusモデルでIssueを実装しPRを作成

## 技術スタック

- TypeScript (ESM)
- Node.js 20+
- Claude Code Agent SDK (`@anthropic-ai/claude-agent-sdk`)
- Octokit (GitHub API)
- simple-git
- Commander.js (CLI)
- Vitest (テスト)

## Context7 MCPの使用

以下のライブラリのAPI・使い方を調べる際はContext7で最新ドキュメントを取得すること：

- `@anthropic-ai/claude-agent-sdk` (Agent SDK)
- `octokit` (GitHub API)
- `vitest`
- `commander`
- `simple-git`

## ディレクトリ構成

```
.claude/
├── commands/          # Claude Codeカスタムコマンド（/plan-issue, /commit）
├── hooks/             # Claude Code hooks
└── settings.json      # Claude Code設定
src/
├── index.ts           # CLIエントリーポイント
├── commands/          # CLIコマンド実装（issue-apply, plan-issue）
├── core/              # コア機能（agent, github, worktree, logger, retry）
├── hooks/             # Claude Code hooks実装
├── prompts/           # プロンプトテンプレート
└── types/             # 型定義（エラークラス含む）
docs/                  # リポジトリのルール・規約（手動管理）
├── naming-conventions.md
codegen-docs/          # コードベースドキュメント（/gen-docsで自動生成）
├── architecture.md
├── api-reference/
├── usage-guide/
└── code-patterns/
skills/
├── global/            # 全体で使用するスキル
└── optional/          # オプションスキル
wiki/                  # GitHub Wiki（別gitリポジトリ、.gitignoreで除外）
```

## コードベース理解

実装作業を開始する前に、以下のドキュメントを参照してコードベースの概要を把握すること：

### ルール・規約（手動管理）

- `docs/naming-conventions.md`: ディレクトリ・ファイル命名規則、コーディング規約

### コードリファレンス（自動生成）

- `codegen-docs/architecture.md`: モジュール構成、レイヤー構造、依存関係
- `codegen-docs/api-reference/`: 公開API・関数のリファレンス
- `codegen-docs/usage-guide/`: CLI・コマンドの使い方
- `codegen-docs/code-patterns/`: コーディングパターン

自動生成ドキュメントが古い場合は`/gen-docs`で再生成できる。

## ドキュメント管理ポリシー

| 場所 | 役割 |
|------|------|
| **Repository** | 現実（今あるコード） |
| **Issue** | 改善（変えたいこと） |
| **docs/** | ルール・規約（手動管理） |
| **codegen-docs/** | コードリファレンス（自動生成） |

### 最新性の担保

コードに追従してドキュメント・テストを最新に保つため、以下のコマンドを活用する：

- `/gen-docs`: コードベースから`codegen-docs/`にドキュメントを自動生成・更新
- `/commit`: コミット時にテスト・型チェックを実行

**重要**: コミットの際は必ず `/commit` を使うこと。

## よく使うコマンド

```bash
# ビルド
npm run build

# issue-apply（CLIツール）
npm run dev -- issue-apply --issue 123 --skip-pr
npm run dev -- issue-apply --issue 123 --model sonnet

# テスト
npm test
npm run test:watch

# 型チェック
npm run typecheck
```

### Claude Codeカスタムコマンド

```bash
# 計画立案（Claude Code内で実行）
/plan-issue 新機能の実装依頼...

# コミット（Claude Code内で実行）
/commit
```

## 必須環境変数

- `GH_TOKEN` または `GITHUB_TOKEN`: GitHub Personal Access Token
- `ANTHROPIC_API_KEY`: Anthropic API Key

## コーディング規約

- ESM形式（`"type": "module"`）
- インポートには`.js`拡張子を付ける（TypeScriptでも）
- 日本語コメント可

## コミットメッセージ規約

Conventional Commits形式を使用し、日本語で記述する。

```
<type>: <説明>

[本文（任意）]
```

### Type一覧

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更（空白、フォーマット等）
- `refactor`: バグ修正や機能追加ではないコード変更
- `test`: テストの追加・修正
- `chore`: ビルドプロセスやツールの変更

### 例

```
feat: plan-issueコマンドを追加
fix: Issue取得時のエラーハンドリングを修正
docs: READMEに使用例を追加
refactor: loggerモジュールを分離
```
