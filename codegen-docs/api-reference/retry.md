# retry.ts

リトライ機能モジュール。指数バックオフ付き。

**ファイル**: `src/core/retry.ts`

## 型定義

### RetryOptions

```typescript
interface RetryOptions {
  maxAttempts?: number;       // デフォルト: 3
  initialDelayMs?: number;    // デフォルト: 1000
  maxDelayMs?: number;        // デフォルト: 30000
  backoffMultiplier?: number; // デフォルト: 2
  shouldRetry?: (error: unknown) => boolean;
}
```

## 関数

### withRetry

操作をリトライ付きで実行する。

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T>
```

#### 引数

| 引数 | 型 | 説明 |
|-----|---|------|
| `operation` | `() => Promise<T>` | 実行する非同期操作 |
| `options` | `RetryOptions?` | リトライオプション |

#### リトライ判定

デフォルトの`shouldRetry`は以下の条件でリトライ：

1. `AppError`で`isRetryable`が`true`
2. Octokitエラーでステータスが429, 502, 503
3. ネットワークエラー（ECONNRESET, ETIMEDOUT, ENOTFOUND）

#### 使用例

```typescript
import { withRetry } from "./core/retry.js";

// デフォルト設定でリトライ
const result = await withRetry(
  () => fetchDataFromAPI()
);

// カスタム設定
const result = await withRetry(
  () => fetchDataFromAPI(),
  {
    maxAttempts: 5,
    initialDelayMs: 2000,
    maxDelayMs: 60000,
    backoffMultiplier: 2,
    shouldRetry: (error) => {
      // カスタムリトライ判定
      return error instanceof NetworkError;
    },
  }
);
```

#### バックオフ動作

```
試行1: 失敗 → 1000ms待機
試行2: 失敗 → 2000ms待機
試行3: 失敗 → 4000ms待機
試行4: 失敗 → 8000ms待機
...
（maxDelayMsを超えない）
```

#### GitHub APIでの使用

`github.ts`内では以下のように使用されている：

```typescript
const { data } = await withRetry(
  () => octokit.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  }),
  { maxAttempts: 3 }
);
```
