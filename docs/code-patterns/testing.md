# テストパターン

## 基本設定

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
```

## モックの使用

### モジュール全体をモック

```typescript
// モジュール全体をモック
vi.mock("@anthropic-ai/claude-code", () => ({
  query: vi.fn(),
}));

// モック関数の型付け
import { query } from "@anthropic-ai/claude-code";
const mockQuery = vi.mocked(query);
```

### クラスのモック

```typescript
vi.mock("./logger.js", () => ({
  ExecutionLogger: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    logMessage: vi.fn().mockResolvedValue(undefined),
    info: vi.fn().mockResolvedValue(undefined),
    warn: vi.fn().mockResolvedValue(undefined),
    error: vi.fn().mockResolvedValue(undefined),
    saveJson: vi.fn().mockResolvedValue(undefined),
    saveText: vi.fn().mockResolvedValue(undefined),
    getLogDir: vi.fn().mockReturnValue("/tmp/logs"),
  })),
  generateRunId: vi.fn().mockReturnValue("20260113-120000-12345"),
}));
```

### 部分モック

```typescript
vi.mock("./github.js", async () => {
  const actual = await vi.importActual("./github.js");
  return {
    ...actual,
    // 特定の関数だけモック
    createPullRequest: vi.fn(),
  };
});
```

## テストの基本構造

```typescript
describe("moduleName", () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    vi.clearAllMocks();
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    vi.restoreAllMocks();
  });

  describe("functionName", () => {
    // 正常系
    it("should return expected result when given valid input", async () => {
      // Arrange: セットアップ
      mockQuery.mockReturnValue(/* ... */);

      // Act: 実行
      const result = await myFunction({ input: "valid" });

      // Assert: 検証
      expect(result).toBe("expected");
      expect(mockQuery).toHaveBeenCalledWith(/* ... */);
    });

    // 境界値
    it("should handle empty input", () => {
      const result = functionName("");
      expect(result).toBe("");
    });

    // エラー系
    it("should throw error when given invalid input", async () => {
      await expect(
        myFunction({ input: null })
      ).rejects.toThrow(AppError);
    });
  });
});
```

## 非同期ジェネレータのモック

Agent SDKの`query`関数は非同期ジェネレータを返す：

```typescript
it("should handle async generator", async () => {
  const mockMessages = [
    {
      type: "assistant",
      message: {
        content: [{ type: "text", text: "Hello" }],
      },
    },
    {
      type: "result",
      subtype: "success",
      result: "Done",
      num_turns: 1,
      total_cost_usd: 0.01,
      duration_ms: 1000,
    },
  ];

  // 非同期ジェネレータを作成
  async function* mockGenerator() {
    for (const msg of mockMessages) {
      yield msg;
    }
  }

  mockQuery.mockReturnValue(mockGenerator() as ReturnType<typeof query>);

  const result = await runAgent({ prompt: "test", cwd: "/tmp" });

  expect(result.success).toBe(true);
  expect(result.numTurns).toBe(1);
});
```

## エラーケースのテスト

```typescript
// 特定のエラータイプを検証
it("should throw AgentExecutionError when query fails", async () => {
  mockQuery.mockImplementation(() => {
    throw new Error("Network error");
  });

  await expect(
    runAgent({ prompt: "test", cwd: "/tmp" })
  ).rejects.toThrow(AgentExecutionError);
});

// エラーメッセージを検証
it("should include error message", async () => {
  await expect(
    myFunction({ invalid: true })
  ).rejects.toThrow(/expected pattern/);
});

// エラープロパティを検証
it("should have correct error code", async () => {
  try {
    await myFunction({ invalid: true });
    expect.fail("Should have thrown");
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe("MY_ERROR_CODE");
  }
});
```

## ファイルシステム操作のモック

```typescript
vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  readdir: vi.fn(),
}));

import { readFile } from "fs/promises";
const mockReadFile = vi.mocked(readFile);

it("should read file content", async () => {
  mockReadFile.mockResolvedValue("file content");

  const result = await myFunction("/path/to/file");

  expect(mockReadFile).toHaveBeenCalledWith("/path/to/file", "utf-8");
});
```

## テスト実行コマンド

```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch

# 特定ファイルのテスト
npm test -- src/core/agent.test.ts

# カバレッジ付き
npm test -- --coverage
```
