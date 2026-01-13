# core/logger.ts

実行ログ管理モジュール。

## ExecutionLogger

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

## generateRunId

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
