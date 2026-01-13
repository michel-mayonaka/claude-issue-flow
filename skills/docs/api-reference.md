---
name: api-reference
description: 公開API・主要関数のリファレンス。引数、戻り値、使用例を記載。
generated_at: 2026-01-13T00:00:00.000Z
source_hash: b871d4b86b4b188e
---

# APIリファレンス

## core/agent.ts

<!-- section: src/core/agent.ts -->

### runAgent

エージェントを実行する。

**シグネチャ:**
```typescript
function runAgent(options: AgentOptions): Promise<AgentResult>
```

**引数:**
- `options.prompt`: string - エージェントに送信するプロンプト
- `options.cwd`: string - 作業ディレクトリ
- `options.model?`: string - 使用するモデル名（例: `claude-opus-4-5-20251101`）
- `options.permissionMode?`: PermissionMode - 権限モード（`"default"` | `"plan"` | `"bypassPermissions"`）
- `options.allowedTools?`: string[] - 許可するツールのリスト
- `options.maxTurns?`: number - 最大ターン数（デフォルト: 500）
- `options.logger?`: ExecutionLogger - ログ出力用ロガー

**戻り値:**
```typescript
interface AgentResult {
  success: boolean;      // 実行が成功したか
  result: string;        // 結果テキスト
  numTurns: number;      // 実行ターン数
  costUSD: number;       // コスト（USD）
  durationMs: number;    // 実行時間（ミリ秒）
  messages: SDKMessage[]; // 全メッセージ
}
```

**使用例:**
```typescript
const result = await runAgent({
  prompt: "ファイルを読んで要約してください",
  cwd: "/path/to/repo",
  model: "claude-opus-4-5-20251101",
  permissionMode: "plan",
  allowedTools: ["Read", "Glob", "Grep"],
  maxTurns: 100,
});
```

---

### extractTextFromMessages

メッセージ配列からテキストコンテンツを抽出して結合する。

**シグネチャ:**
```typescript
function extractTextFromMessages(messages: SDKMessage[]): string
```

**引数:**
- `messages`: SDKMessage[] - エージェント実行結果のメッセージ配列

**戻り値:**
- string - 全アシスタントメッセージのテキストを結合した文字列

---

### extractFinalMessage

最後のアシスタントメッセージのテキストを取得する。

**シグネチャ:**
```typescript
function extractFinalMessage(messages: SDKMessage[]): string
```

**引数:**
- `messages`: SDKMessage[] - エージェント実行結果のメッセージ配列

**戻り値:**
- string - 最後のアシスタントメッセージのテキスト（見つからない場合は空文字）

<!-- /section: src/core/agent.ts -->

## core/github.ts

<!-- section: src/core/github.ts -->

### fetchIssue

GitHub Issueを取得する。

**シグネチャ:**
```typescript
function fetchIssue(repoPath: string, issueRef: string | number): Promise<GitHubIssue>
```

**引数:**
- `repoPath`: string - リポジトリのローカルパス
- `issueRef`: string | number - Issue番号またはURL（例: `123` または `https://github.com/owner/repo/issues/123`）

**戻り値:**
```typescript
interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  url: string;
  labels: string[];
  assignees: string[];
  milestone: string | null;
  state: string;
}
```

**例外:**
- `GitHubAPIError`: API呼び出しに失敗した場合
- `ParseError`: Issue URLの解析に失敗した場合

---

### createIssue

GitHub Issueを作成する。

**シグネチャ:**
```typescript
function createIssue(repoPath: string, data: IssueCreateData): Promise<GitHubIssue>
```

**引数:**
- `repoPath`: string - リポジトリのローカルパス
- `data.title`: string - Issueタイトル
- `data.body`: string - Issue本文
- `data.labels?`: string[] - ラベル
- `data.assignees?`: string[] - アサイン先
- `data.milestone?`: number - マイルストーンID

**戻り値:**
- GitHubIssue - 作成されたIssue情報

**例外:**
- `GitHubAPIError`: API呼び出しに失敗した場合

---

### createPullRequest

Pull Requestを作成する。

**シグネチャ:**
```typescript
function createPullRequest(repoPath: string, data: PRCreateData): Promise<PullRequest>
```

**引数:**
- `repoPath`: string - リポジトリのローカルパス
- `data.title`: string - PRタイトル
- `data.body`: string - PR本文
- `data.head`: string - ソースブランチ名
- `data.base`: string - ターゲットブランチ名
- `data.draft?`: boolean - ドラフトPRとして作成（デフォルト: true）

**戻り値:**
```typescript
interface PullRequest {
  number: number;
  url: string;
  title: string;
}
```

**例外:**
- `GitHubAPIError`: API呼び出しに失敗した場合

---

### issueToYaml

GitHubIssueをYAML形式の文字列に変換する。

**シグネチャ:**
```typescript
function issueToYaml(issue: GitHubIssue): string
```

**引数:**
- `issue`: GitHubIssue - 変換するIssue

**戻り値:**
- string - YAML形式の文字列

<!-- /section: src/core/github.ts -->

## core/worktree.ts

<!-- section: src/core/worktree.ts -->

### createWorktree

Git worktreeを作成する。

**シグネチャ:**
```typescript
function createWorktree(options: WorktreeOptions): Promise<WorktreeInfo>
```

**引数:**
- `options.repo`: string - リポジトリパス
- `options.runId`: string - 実行ID（ブランチ名に使用）
- `options.jobName`: string - ジョブ名（ブランチ名に使用）
- `options.issueNumber?`: number - Issue番号（ブランチ名に含める）
- `options.baseBranch?`: string - ベースブランチ（デフォルト: 現在のブランチ）
- `options.logsRoot?`: string - ログディレクトリのルート

**戻り値:**
```typescript
interface WorktreeInfo {
  path: string;        // Worktreeのパス
  branch: string;      // ブランチ名
  baseBranch: string;  // ベースブランチ名
  repoPath: string;    // リポジトリパス
}
```

**例外:**
- `WorktreeError`: Worktree作成に失敗した場合

---

### commitChanges

Worktree内の変更をコミットする。

**シグネチャ:**
```typescript
function commitChanges(worktree: WorktreeInfo, message: string): Promise<boolean>
```

**引数:**
- `worktree`: WorktreeInfo - Worktree情報
- `message`: string - コミットメッセージ

**戻り値:**
- boolean - コミットが行われた場合`true`、変更がない場合`false`

---

### pushBranch

ブランチをリモートにプッシュする。

**シグネチャ:**
```typescript
function pushBranch(worktree: WorktreeInfo): Promise<void>
```

**引数:**
- `worktree`: WorktreeInfo - Worktree情報

---

### getChangedFiles

Worktree内の変更されたファイル一覧を取得する。

**シグネチャ:**
```typescript
function getChangedFiles(worktree: WorktreeInfo): Promise<string[]>
```

**引数:**
- `worktree`: WorktreeInfo - Worktree情報

**戻り値:**
- string[] - 変更されたファイルパスの配列

---

### getDiff

Worktree内のdiffを取得する。

**シグネチャ:**
```typescript
function getDiff(worktree: WorktreeInfo): Promise<string>
```

**引数:**
- `worktree`: WorktreeInfo - Worktree情報

**戻り値:**
- string - ステージ済みと未ステージの差分を結合した文字列

---

### cleanupWorktree

Worktreeとブランチをクリーンアップする。

**シグネチャ:**
```typescript
function cleanupWorktree(options: CleanupOptions): Promise<void>
```

**引数:**
- `options.worktree`: WorktreeInfo - Worktree情報
- `options.deleteRemote?`: boolean - リモートブランチも削除するか（デフォルト: false）

**例外:**
- `WorktreeError`: クリーンアップに失敗した場合

---

### listWorktrees

リポジトリ内のWorktree一覧を取得する。

**シグネチャ:**
```typescript
function listWorktrees(repoPath: string): Promise<WorktreeListEntry[]>
```

**引数:**
- `repoPath`: string - リポジトリパス

**戻り値:**
```typescript
interface WorktreeListEntry {
  path: string;
  head: string;
  branch: string | null;
}
```

<!-- /section: src/core/worktree.ts -->

## core/logger.ts

<!-- section: src/core/logger.ts -->

### ExecutionLogger

実行ログを管理するクラス。

**コンストラクタ:**
```typescript
constructor(jobName: string, runId: string, logsRoot?: string)
```

**引数:**
- `jobName`: string - ジョブ名
- `runId`: string - 実行ID
- `logsRoot?`: string - ログディレクトリのルート（デフォルト: `"./logs"`）

**主要メソッド:**

| メソッド | 説明 |
|---------|------|
| `init(): Promise<void>` | ログディレクトリを初期化 |
| `info(message: string, data?: unknown): Promise<void>` | INFOログ出力 |
| `warn(message: string, data?: unknown): Promise<void>` | WARNログ出力 |
| `error(message: string, data?: unknown): Promise<void>` | ERRORログ出力 |
| `debug(message: string, data?: unknown): Promise<void>` | DEBUGログ出力 |
| `logMessage(message: unknown): Promise<void>` | SDKメッセージをJSONLに追記 |
| `saveJson(filename: string, data: unknown): Promise<void>` | JSONファイルを保存 |
| `saveText(filename: string, content: string): Promise<void>` | テキストファイルを保存 |
| `logIssue(issue: unknown): Promise<void>` | Issue情報を保存 |
| `logWorktree(worktree: unknown): Promise<void>` | Worktree情報を保存 |
| `logPR(pr: unknown): Promise<void>` | PR情報を保存 |
| `logResult(result: unknown): Promise<void>` | 結果を保存 |
| `getLogDir(): string` | ログディレクトリパスを取得 |

---

### generateRunId

一意の実行IDを生成する。

**シグネチャ:**
```typescript
function generateRunId(): string
```

**戻り値:**
- string - `YYYYMMDD-HHMMSS-NNNNN` 形式のID

**例:**
```typescript
const runId = generateRunId();
// "20260113-143052-12345"
```

<!-- /section: src/core/logger.ts -->

## core/retry.ts

<!-- section: src/core/retry.ts -->

### withRetry

指数バックオフ付きリトライを行う。

**シグネチャ:**
```typescript
function withRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T>
```

**引数:**
- `operation`: () => Promise<T> - リトライ対象の非同期関数
- `options.maxAttempts?`: number - 最大試行回数（デフォルト: 3）
- `options.initialDelayMs?`: number - 初期遅延時間（デフォルト: 1000ms）
- `options.maxDelayMs?`: number - 最大遅延時間（デフォルト: 30000ms）
- `options.backoffMultiplier?`: number - バックオフ係数（デフォルト: 2）
- `options.shouldRetry?`: (error: unknown) => boolean - リトライ判定関数

**戻り値:**
- T - 操作の結果

**デフォルトのリトライ条件:**
- `AppError`で`isRetryable`が`true`の場合
- Octokit APIエラーでステータスが429, 502, 503の場合
- ネットワークエラー（ECONNRESET, ETIMEDOUT, ENOTFOUND）

**使用例:**
```typescript
const result = await withRetry(
  () => fetchIssue(repoPath, issueNumber),
  { maxAttempts: 5, initialDelayMs: 2000 }
);
```

<!-- /section: src/core/retry.ts -->

## core/parsing.ts

<!-- section: src/core/parsing.ts -->

### parsePlanMarkdown

エージェント出力から計画を抽出する。

**シグネチャ:**
```typescript
function parsePlanMarkdown(content: string): ParsedPlan | null
```

**引数:**
- `content`: string - エージェントの出力テキスト

**戻り値:**
```typescript
interface ParsedPlan {
  title: string;  // 計画タイトル
  body: string;   // 計画本文
}
```
`null` - 計画が見つからない場合

**対応フォーマット:**
- ````markdown\n# 計画: タイトル\n...````
- `# 計画: タイトル`（直接記載）

---

### parsePlanFromInput

入力テキストから計画を抽出する（hookで使用）。

**シグネチャ:**
```typescript
function parsePlanFromInput(plan: string): ParsedPlan | null
```

**引数:**
- `plan`: string - 計画を含むテキスト

**戻り値:**
- ParsedPlan | null - パースされた計画、または見つからない場合null

<!-- /section: src/core/parsing.ts -->

## core/init.ts

<!-- section: src/core/init.ts -->

### setupLogger

ジョブ用のロガーを初期化する。

**シグネチャ:**
```typescript
function setupLogger(
  jobName: string,
  repoPath: string
): Promise<{ logger: ExecutionLogger; runId: string }>
```

**引数:**
- `jobName`: string - ジョブ名（`"issue-apply"` または `"plan-issue"`）
- `repoPath`: string - リポジトリパス

**戻り値:**
- `logger`: ExecutionLogger - 初期化済みロガー
- `runId`: string - 生成された実行ID

<!-- /section: src/core/init.ts -->

## types/errors.ts

<!-- section: src/types/errors.ts -->

### AppError

アプリケーションエラーの基底クラス。

**プロパティ:**
- `code`: string - エラーコード
- `isRetryable`: boolean - リトライ可能か
- `suggestion?`: string - ユーザー向け提案

**メソッド:**
- `toUserMessage(): string` - ユーザー向けメッセージを生成

---

### AgentExecutionError

エージェント実行エラー。

- コード: `AGENT_EXECUTION_ERROR`
- リトライ: 不可

---

### GitHubAPIError

GitHub API呼び出しエラー。

- コード: `GITHUB_API_ERROR` または `GITHUB_RATE_LIMIT`
- リトライ: レート制限時（403/429）は可
- 追加プロパティ: `statusCode?: number`

---

### WorktreeError

Git worktree操作エラー。

- コード: `WORKTREE_ERROR`
- リトライ: 不可

---

### ConfigurationError

設定エラー。

- コード: `CONFIGURATION_ERROR`
- リトライ: 不可

---

### ParseError

パースエラー。

- コード: `PARSE_ERROR`
- リトライ: 不可

<!-- /section: src/types/errors.ts -->

## prompts/skills.ts

<!-- section: src/prompts/skills.ts -->

### loadSkills

スキルファイルを読み込む。

**シグネチャ:**
```typescript
function loadSkills(options: LoadSkillsOptions): Promise<string>
```

**引数:**
- `options.global?`: boolean - グローバルスキルを読み込むか
- `options.optional?`: string[] - オプションスキル名のリスト

**戻り値:**
- string - 結合されたスキルテキスト

**使用例:**
```typescript
const skills = await loadSkills({
  global: true,
  optional: ["pr-draft"],
});
```

**読み込みパス:**
- グローバル: `skills/global/*.md`
- オプション: `skills/optional/<name>.md` または `skills/optional/<name>/SKILL.md`

<!-- /section: src/prompts/skills.ts -->

## commands/issue-apply.ts

<!-- section: src/commands/issue-apply.ts -->

### issueApply

GitHub Issueを実装してPRを作成する。

**シグネチャ:**
```typescript
function issueApply(options: IssueApplyOptions): Promise<IssueApplyResult>
```

**引数:**
```typescript
interface IssueApplyOptions {
  issue: string | number;           // Issue番号またはURL
  repo: string;                     // リポジトリパス
  model?: "haiku" | "sonnet" | "opus"; // モデル（デフォルト: haiku）
  draft?: boolean;                  // ドラフトPR（デフォルト: true）
  skipPr?: boolean;                 // PR作成をスキップ
  cleanup?: boolean;                // クリーンアップ実行
  cleanupRemote?: boolean;          // リモートブランチも削除
}
```

**戻り値:**
```typescript
interface IssueApplyResult {
  issue: GitHubIssue;
  worktree: WorktreeInfo;
  pr: PullRequest | null;
  runId: string;
  logDir: string;
  changedFiles: string[];
}
```

**モデルマッピング:**
- `haiku`: `claude-3-5-haiku-20241022`
- `sonnet`: `claude-sonnet-4-5-20250929`
- `opus`: `claude-opus-4-5-20251101`

<!-- /section: src/commands/issue-apply.ts -->

## commands/plan-issue.ts

<!-- section: src/commands/plan-issue.ts -->

### planIssue

計画を立案してIssueを作成する。

**シグネチャ:**
```typescript
function planIssue(options: PlanIssueOptions): Promise<PlanIssueResult>
```

**引数:**
```typescript
interface PlanIssueOptions {
  request?: string;          // リクエストテキスト
  requestFile?: string;      // リクエストファイルパス
  repo: string;              // リポジトリパス
  model?: string;            // モデル（デフォルト: opus）
  dryRun?: boolean;          // ドライラン
  interactive?: boolean;     // インタラクティブモード
}
```

**戻り値:**
```typescript
interface PlanIssueResult {
  issues: GitHubIssue[];
  runId: string;
  logDir: string;
}
```

<!-- /section: src/commands/plan-issue.ts -->
