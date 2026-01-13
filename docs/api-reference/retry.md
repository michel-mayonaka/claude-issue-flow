# core/retry.ts

リトライロジックモジュール。

## withRetry

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
