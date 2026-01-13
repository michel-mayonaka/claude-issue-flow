---
name: architecture
description: プロジェクトのアーキテクチャ概要。モジュール構成、レイヤー構造、依存関係を説明。
generated_at: 2026-01-13T00:00:00.000Z
source_hash: 5d4bf89e64285911
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
│   ├── github.ts      # GitHub API（Octokit）
│   ├── worktree.ts    # Git worktree管理
│   ├── logger.ts      # 実行ログ管理
│   ├── retry.ts       # リトライロジック
│   ├── init.ts        # 初期化ユーティリティ
│   └── parsing.ts     # テキストパース処理
├── prompts/           # プロンプトテンプレート
│   ├── issue-apply.ts # Issue実装用プロンプト
│   ├── plan-issue.ts  # 計画立案用プロンプト
│   └── skills.ts      # スキルファイル読み込み
├── hooks/             # Claude Code hooks
│   └── create-issue.ts # ExitPlanMode後のIssue作成
└── types/             # 型定義
    ├── index.ts       # 型の再エクスポート
    └── errors.ts      # カスタムエラークラス
```

### src/types/

型定義のみを持つ最下位レイヤー。他のモジュールへの依存なし。

- **errors.ts**: `AppError`基底クラスと派生エラークラス群
  - `AgentExecutionError`: エージェント実行エラー
  - `GitHubAPIError`: GitHub API呼び出しエラー
  - `WorktreeError`: Git worktree操作エラー
  - `ConfigurationError`: 設定エラー
  - `ParseError`: パースエラー
- **index.ts**: 全型定義の再エクスポートと共通インターフェース定義
  - `ParsedPlan`, `ParsedPRInfo`, `HookInput`など

### src/core/

ビジネスロジックの中核。`types/`のみに依存。

- **agent.ts**: Claude Code Agent SDKの`query`関数ラッパー
  - `runAgent()`: エージェント実行
  - `extractTextFromMessages()`: メッセージからテキスト抽出
  - `extractFinalMessage()`: 最終メッセージ抽出
- **github.ts**: Octokitを使用したGitHub API連携
  - `fetchIssue()`: Issue取得
  - `createIssue()`: Issue作成
  - `createPullRequest()`: PR作成
  - `issueToYaml()`: Issue情報のYAML形式変換
- **worktree.ts**: simple-gitを使用したWorktree管理
  - `createWorktree()`: Worktree作成
  - `commitChanges()`: 変更をコミット
  - `pushBranch()`: ブランチをプッシュ
  - `cleanupWorktree()`: Worktreeのクリーンアップ
- **logger.ts**: `ExecutionLogger`クラスと`generateRunId()`
- **retry.ts**: `withRetry()`関数（指数バックオフ付きリトライ）
- **init.ts**: `setupLogger()`（ロガー初期化）
- **parsing.ts**: 計画テキストのパース処理
  - `parsePlanMarkdown()`: Markdownからの計画抽出
  - `parsePlanFromInput()`: 入力テキストからの計画抽出

### src/prompts/

プロンプト構築ロジック。`types/`, `core/`に依存可能。

- **issue-apply.ts**: Issue実装用プロンプト
  - `buildIssueApplyPrompt()`: プロンプト構築
  - `parsePRInfo()`: PR情報パース
  - `generateDefaultPRBody()`: デフォルトPR本文生成
- **plan-issue.ts**: 計画立案用プロンプト
  - `buildPlanIssuePrompt()`: プロンプト構築
- **skills.ts**: スキルファイル読み込み
  - `loadSkills()`: `skills/`ディレクトリからスキル読み込み

### src/commands/

CLIコマンドの実装。すべてのレイヤーに依存可能。

- **issue-apply.ts**: `issueApply()`関数
  - Issue取得 → Worktree作成 → エージェント実行 → PR作成
- **plan-issue.ts**: `planIssue()`関数
  - 計画立案エージェント実行 → Issue作成

### src/hooks/

Claude Code hooks実装。すべてのレイヤーに依存可能。

- **create-issue.ts**: ExitPlanMode後に呼び出されるhook
  - トランスクリプトから計画を抽出してIssue作成

## レイヤー構造

依存関係は上から下への一方向のみ許可。

```
┌─────────────────────────────────────┐
│           src/index.ts              │  CLI エントリーポイント
├─────────────────────────────────────┤
│          src/commands/              │  コマンド実装
│  issue-apply.ts    plan-issue.ts    │
├─────────────────────────────────────┤
│           src/hooks/                │  Claude Code hooks
│        create-issue.ts              │
├─────────────────────────────────────┤
│          src/prompts/               │  プロンプト構築
│ issue-apply.ts plan-issue.ts skills │
├─────────────────────────────────────┤
│           src/core/                 │  コアロジック
│  agent github worktree logger ...   │
├─────────────────────────────────────┤
│           src/types/                │  型定義
│      errors.ts    index.ts          │
└─────────────────────────────────────┘
```

## 依存関係

### 外部ライブラリ

| ライブラリ | 用途 |
|-----------|------|
| `@anthropic-ai/claude-code` | Agent SDK |
| `commander` | CLI引数パース |
| `@octokit/rest` | GitHub API |
| `simple-git` | Git操作 |
| `vitest` | テスト |

### 内部依存関係

```
index.ts
  └─→ commands/issue-apply.ts
  └─→ commands/plan-issue.ts
  └─→ types/index.ts

commands/issue-apply.ts
  └─→ core/agent.ts
  └─→ core/github.ts
  └─→ core/worktree.ts
  └─→ core/init.ts
  └─→ prompts/issue-apply.ts
  └─→ prompts/skills.ts
  └─→ types/index.ts

commands/plan-issue.ts
  └─→ core/agent.ts
  └─→ core/github.ts
  └─→ core/init.ts
  └─→ core/parsing.ts
  └─→ prompts/plan-issue.ts
  └─→ types/index.ts

hooks/create-issue.ts
  └─→ core/github.ts
  └─→ core/parsing.ts
  └─→ types/index.ts

core/agent.ts
  └─→ @anthropic-ai/claude-code
  └─→ core/logger.ts
  └─→ types/errors.ts

core/github.ts
  └─→ @octokit/rest
  └─→ core/retry.ts
  └─→ types/errors.ts

core/worktree.ts
  └─→ simple-git
  └─→ types/errors.ts

core/retry.ts
  └─→ types/errors.ts
```

## データフロー

### plan-issueフロー

```
[ユーザー]
    │ /plan-issue "機能追加の依頼..."
    ▼
[plan-issue.ts]
    │ 1. リクエストテキスト取得
    │ 2. ロガー初期化
    ▼
[agent.ts]
    │ 3. エージェント実行（planモード）
    │    - permissionMode: "plan"
    │    - allowedTools: Read, Glob, Grep, WebSearch, WebFetch, AskUserQuestion
    ▼
[parsing.ts]
    │ 4. 出力から計画を抽出
    │    - "# 計画: [タイトル]" 形式を検出
    ▼
[github.ts]
    │ 5. Issue作成
    ▼
[出力] Issue URL
```

### issue-applyフロー

```
[ユーザー/CI]
    │ issue-apply --issue 123
    ▼
[issue-apply.ts]
    │ 1. Issue取得 (github.ts)
    │ 2. Worktree作成 (worktree.ts)
    │ 3. スキル読み込み (skills.ts)
    │ 4. プロンプト構築 (prompts/issue-apply.ts)
    ▼
[agent.ts]
    │ 5. エージェント実行（bypassPermissionsモード）
    │    - allowedTools: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch
    ▼
[worktree.ts]
    │ 6. 変更をコミット＆プッシュ
    ▼
[github.ts]
    │ 7. PR作成
    ▼
[出力] PR URL
```

### ExitPlanMode hookフロー

```
[Claude Code]
    │ ExitPlanMode実行
    ▼
[create-issue.ts] (hook)
    │ 1. stdinからトランスクリプトパス取得
    │ 2. JSONLから計画テキスト抽出
    │ 3. 計画をパース (parsing.ts)
    │ 4. Issue作成 (github.ts)
    ▼
[出力] Issue URL (stdout)
```
