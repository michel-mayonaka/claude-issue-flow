# errors.ts

エラークラス定義モジュール。

**ファイル**: `src/types/errors.ts`

## 基底クラス

### AppError

アプリケーションエラーの基底クラス。

```typescript
class AppError extends Error {
  readonly code: string;
  readonly isRetryable: boolean;
  readonly suggestion?: string;

  constructor(
    message: string,
    options: {
      code: string;
      isRetryable?: boolean;
      suggestion?: string;
      cause?: Error;
    }
  )

  toUserMessage(): string
}
```

#### プロパティ

| プロパティ | 型 | 説明 |
|-----------|---|------|
| `code` | `string` | エラーコード |
| `isRetryable` | `boolean` | リトライ可能フラグ |
| `suggestion` | `string?` | 解決方法のヒント |

#### メソッド

##### toUserMessage

ユーザー向けのエラーメッセージを生成。

```typescript
toUserMessage(): string
// 出力例: "[GITHUB_API_ERROR] APIの呼び出しに失敗しました\n  → トークンと権限を確認してください。"
```

---

## 派生クラス

### AgentExecutionError

エージェント実行エラー。

```typescript
class AgentExecutionError extends AppError {
  constructor(message: string, options?: { cause?: Error })
}
```

- **code**: `AGENT_EXECUTION_ERROR`
- **isRetryable**: `false`
- **suggestion**: "エージェント実行中に問題が発生しました。ログを確認してください。"

---

### GitHubAPIError

GitHub API呼び出しエラー。

```typescript
class GitHubAPIError extends AppError {
  readonly statusCode?: number;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      isRetryable?: boolean;
      cause?: Error;
    }
  )
}
```

- **code**: `GITHUB_API_ERROR` または `GITHUB_RATE_LIMIT`（403/429の場合）
- **isRetryable**: レート制限エラーの場合は`true`
- **suggestion**: レート制限時は待機を促すメッセージ

---

### WorktreeError

Git worktree操作エラー。

```typescript
class WorktreeError extends AppError {
  constructor(message: string, options?: { cause?: Error })
}
```

- **code**: `WORKTREE_ERROR`
- **isRetryable**: `false`
- **suggestion**: "Git worktree操作に失敗しました。リポジトリの状態を確認してください。"

---

### ConfigurationError

設定エラー。

```typescript
class ConfigurationError extends AppError {
  constructor(message: string, options?: { suggestion?: string })
}
```

- **code**: `CONFIGURATION_ERROR`
- **isRetryable**: `false`
- **suggestion**: カスタム設定可能（デフォルト: "設定を確認してください。"）

---

### ParseError

パースエラー。

```typescript
class ParseError extends AppError {
  constructor(message: string, options?: { cause?: Error })
}
```

- **code**: `PARSE_ERROR`
- **isRetryable**: `false`
- **suggestion**: "入力データの形式を確認してください。"

---

## 使用例

### エラーのスロー

```typescript
throw new ConfigurationError(
  "GitHubトークンが見つかりません",
  { suggestion: "'gh auth login' を実行してください。" }
);
```

### エラーのキャッチ

```typescript
try {
  await issueApply(options);
} catch (error) {
  if (error instanceof AppError) {
    console.error(error.toUserMessage());
  } else {
    console.error("Unknown error:", error);
  }
  process.exit(1);
}
```

### リトライ判定での使用

```typescript
function shouldRetry(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isRetryable;
  }
  return false;
}
```
