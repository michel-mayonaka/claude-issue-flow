---
name: architecture
description: プロジェクトのアーキテクチャ概要。モジュール構成、レイヤー構造、依存関係を説明。
generated_at: 2026-01-13T00:00:00.000Z
source_hash: 3656ca3d56614a6d
---

# アーキテクチャ概要

Claude Code Agent SDKを使用したGitHub Issue駆動ワークフローツールのアーキテクチャ。

## モジュール構成

```
src/
├── index.ts           # CLIエントリーポイント
├── commands/          # CLIコマンド実装
│   ├── issue-apply.ts # Issue実装コマンド
│   └── plan-issue.ts  # 計画立案コマンド
├── core/              # コア機能
│   ├── agent.ts       # Agent SDK連携
│   ├── github.ts      # GitHub API操作
│   ├── worktree.ts    # Git worktree管理
│   ├── logger.ts      # ログ管理
│   ├── retry.ts       # リトライ機能
│   ├── parsing.ts     # 出力パース
│   └── init.ts        # 初期化
├── hooks/             # Claude Code hooks実装
│   └── create-issue.ts # ExitPlanMode時のIssue作成
├── prompts/           # プロンプトテンプレート
│   ├── plan-issue.ts  # 計画立案プロンプト
│   ├── issue-apply.ts # Issue実装プロンプト
│   └── skills.ts      # スキル読み込み
└── types/             # 型定義
    ├── index.ts       # 型のエクスポート
    └── errors.ts      # エラークラス定義
```

## レイヤー構造

プロジェクトは以下のレイヤー構造に従っている：

```
┌─────────────────────────────────────────────────┐
│                  index.ts                        │  CLI エントリーポイント
├─────────────────────────────────────────────────┤
│                  commands/                       │  コマンド実装
│  (issue-apply.ts, plan-issue.ts)                │
├─────────────────────────────────────────────────┤
│                  hooks/                          │  Claude Code hooks
│  (create-issue.ts)                              │
├─────────────────────────────────────────────────┤
│                  prompts/                        │  プロンプトテンプレート
│  (plan-issue.ts, issue-apply.ts, skills.ts)    │
├─────────────────────────────────────────────────┤
│                  core/                           │  コア機能
│  (agent, github, worktree, logger, retry等)    │
├─────────────────────────────────────────────────┤
│                  types/                          │  型定義・エラー
│  (index.ts, errors.ts)                          │
└─────────────────────────────────────────────────┘
```

### 依存関係ルール

- **types/**: 他のモジュールへの依存なし。純粋な型定義とエラークラス
- **core/**: types/のみに依存可
- **prompts/**: types/, core/に依存可
- **commands/**: types/, core/, prompts/に依存可
- **hooks/**: すべてに依存可
- **index.ts**: commands/のエントリーポイント

## モジュール詳細

### types/ - 型定義

| ファイル | 説明 |
|---------|------|
| `index.ts` | 型の再エクスポート、ParsedPlan, HookInput等の共通型 |
| `errors.ts` | AppError基底クラス、各種派生エラークラス |

### core/ - コア機能

| ファイル | 説明 |
|---------|------|
| `agent.ts` | Claude Code Agent SDKの`query`関数ラッパー。メッセージのストリーミング処理 |
| `github.ts` | Octokit使用。Issue取得・作成、PR作成 |
| `worktree.ts` | simple-git使用。Git worktreeの作成・削除・クリーンアップ |
| `logger.ts` | ExecutionLoggerクラス。実行ログとJSONL形式メッセージログ |
| `retry.ts` | 指数バックオフ付きリトライ機能 |
| `parsing.ts` | Markdownからの計画パース |
| `init.ts` | ロガー初期化のヘルパー |

### prompts/ - プロンプトテンプレート

| ファイル | 説明 |
|---------|------|
| `plan-issue.ts` | 計画立案用プロンプト生成 |
| `issue-apply.ts` | Issue実装用プロンプト生成、PR情報パース |
| `skills.ts` | skills/ディレクトリからスキルファイル読み込み |

### commands/ - CLIコマンド

| ファイル | 説明 |
|---------|------|
| `issue-apply.ts` | GitHub IssueをHaiku/Sonnet/Opusで実装 |
| `plan-issue.ts` | 対話的に計画立案してIssue作成 |

### hooks/ - Claude Code hooks

| ファイル | 説明 |
|---------|------|
| `create-issue.ts` | ExitPlanMode時にtranscriptから計画を抽出してIssue作成 |

## データフロー

### issue-apply コマンド

```
1. CLI引数パース (index.ts)
          ↓
2. Issue取得 (github.ts)
          ↓
3. Worktree作成 (worktree.ts)
          ↓
4. スキル読み込み (skills.ts)
          ↓
5. プロンプト生成 (issue-apply.ts)
          ↓
6. Agent実行 (agent.ts)
          ↓
7. 変更コミット・プッシュ (worktree.ts)
          ↓
8. PR作成 (github.ts)
          ↓
9. [オプション] クリーンアップ (worktree.ts)
```

### plan-issue コマンド

```
1. CLI引数パース (index.ts)
          ↓
2. プロンプト生成 (plan-issue.ts)
          ↓
3. Agent実行 - planモード (agent.ts)
          ↓
4. 計画パース (parsing.ts)
          ↓
5. Issue作成 (github.ts)
```

### /plan-issue カスタムコマンド + hooks

```
1. Claude Code内で /plan-issue 実行
          ↓
2. Opusモデルで対話的に計画立案
          ↓
3. ExitPlanMode実行
          ↓
4. hooks/create-issue.ts が呼び出される
          ↓
5. transcriptから計画抽出 (parsing.ts)
          ↓
6. GitHub Issue作成 (github.ts)
```

## 外部依存関係

| パッケージ | 用途 |
|-----------|------|
| `@anthropic-ai/claude-agent-sdk` | Claude Code Agent SDK |
| `@octokit/rest` | GitHub REST API |
| `simple-git` | Git操作 |
| `commander` | CLIパーサー |

## 設定ファイル

```
.claude/
├── commands/          # カスタムコマンド定義（.md）
│   ├── plan-issue.md
│   ├── commit.md
│   ├── review-architecture.md
│   ├── gen-docs.md
│   └── save-article.md
├── hooks/             # hooks設定
└── settings.json      # Claude Code設定

skills/
├── global/            # 常時読み込まれるスキル
└── optional/          # オプションスキル（pr-draft等）
```
