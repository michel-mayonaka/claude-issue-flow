# logger.ts

ログ管理モジュール。

**ファイル**: `src/core/logger.ts`

## 型定義

### LogEntry

```typescript
interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  data?: unknown;
}
```

## クラス

### ExecutionLogger

実行ログとメッセージログを管理するクラス。

```typescript
class ExecutionLogger {
  constructor(
    jobName: string,
    runId: string,
    logsRoot?: string  // デフォルト: "./logs"
  )
}
```

#### ログ出力先

```
{logsRoot}/{jobName}/{runId}/
├── execution.log    # 実行ログ（テキスト形式）
├── messages.jsonl   # メッセージログ（JSONL形式）
├── issue.json       # Issue情報
├── worktree.json    # Worktree情報
├── pr.json          # PR情報
├── result.json      # 実行結果
└── prompt.txt       # プロンプト
```

#### メソッド

##### init

ログディレクトリを初期化する。

```typescript
async init(): Promise<void>
```

##### info / warn / error / debug

ログを出力する。

```typescript
async info(message: string, data?: unknown): Promise<void>
async warn(message: string, data?: unknown): Promise<void>
async error(message: string, data?: unknown): Promise<void>
async debug(message: string, data?: unknown): Promise<void>
```

出力形式:
```
[2026-01-13T12:00:00.000Z] [INFO] メッセージ
{
  "data": "..."
}
```

##### logMessage

SDKメッセージをJSONLファイルに追記する。

```typescript
async logMessage(message: unknown): Promise<void>
```

##### saveJson

JSONファイルを保存する。

```typescript
async saveJson(filename: string, data: unknown): Promise<void>
```

##### saveText

テキストファイルを保存する。

```typescript
async saveText(filename: string, content: string): Promise<void>
```

##### 専用ログメソッド

```typescript
async logIssue(issue: unknown): Promise<void>      // → issue.json
async logWorktree(worktree: unknown): Promise<void> // → worktree.json
async logPR(pr: unknown): Promise<void>            // → pr.json
async logResult(result: unknown): Promise<void>    // → result.json
```

##### getLogDir

ログディレクトリのパスを取得する。

```typescript
getLogDir(): string
```

#### 使用例

```typescript
const logger = new ExecutionLogger("issue-apply", "20260113-120000-12345");
await logger.init();

await logger.info("Starting issue-apply", { issueNumber: 123 });
await logger.logIssue(issue);

// SDKメッセージをストリーミング保存
for await (const message of response) {
  await logger.logMessage(message);
}

await logger.info("Completed", { success: true });
console.log(`Logs: ${logger.getLogDir()}`);
```

---

## 関数

### generateRunId

実行IDを生成する。

```typescript
function generateRunId(): string
```

#### フォーマット

`{YYYYMMDD}-{HHmmss}-{random5}`

例: `20260113-120000-12345`

#### 使用例

```typescript
const runId = generateRunId();
const logger = new ExecutionLogger("job-name", runId);
```
