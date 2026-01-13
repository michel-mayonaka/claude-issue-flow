# エラーハンドリング

## AppError基底クラス

```typescript
export class AppError extends Error {
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
  ) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.code = options.code;
    this.isRetryable = options.isRetryable ?? false;
    this.suggestion = options.suggestion;
  }

  toUserMessage(): string {
    let msg = `[${this.code}] ${this.message}`;
    if (this.suggestion) {
      msg += `\n  → ${this.suggestion}`;
    }
    return msg;
  }
}
```

## カスタムエラーの作成例

新しいエラータイプを追加する場合：

```typescript
// 1. AppErrorを継承
export class MyCustomError extends AppError {
  // 2. 追加プロパティがあれば定義
  readonly additionalInfo?: string;

  constructor(message: string, options?: { cause?: Error; additionalInfo?: string }) {
    super(message, {
      // 3. ユニークなコードを設定
      code: "MY_CUSTOM_ERROR",
      // 4. リトライ可能かどうかを指定
      isRetryable: false,
      // 5. ユーザー向けの提案を設定
      suggestion: "問題の対処方法を記載してください。",
      cause: options?.cause,
    });
    this.additionalInfo = options?.additionalInfo;
  }
}
```

## エラーのキャッチと再スロー

```typescript
try {
  await someOperation();
} catch (error) {
  // 既にAppErrorの場合はそのまま再スロー
  if (error instanceof AppError) {
    throw error;
  }
  // それ以外はラップして再スロー
  throw new MyCustomError(
    "操作に失敗しました",
    { cause: error instanceof Error ? error : undefined }
  );
}
```

## ユーザー向けエラー表示

```typescript
try {
  await issueApply(options);
} catch (error) {
  if (error instanceof AppError) {
    // toUserMessage()で整形されたメッセージを表示
    console.error(error.toUserMessage());
  } else if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error("Error:", error);
  }
  process.exit(1);
}
```
