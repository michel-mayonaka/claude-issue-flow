# テストパターン

## モックの使用

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// モジュール全体をモック
vi.mock("@anthropic-ai/claude-code", () => ({
  query: vi.fn(),
}));

// 部分的にモック
vi.mock("./logger.js", () => ({
  ExecutionLogger: vi.fn().mockImplementation(() => ({
    logMessage: vi.fn().mockResolvedValue(undefined),
    info: vi.fn().mockResolvedValue(undefined),
  })),
}));

// モック関数の型付け
import { query } from "@anthropic-ai/claude-code";
const mockQuery = vi.mocked(query);

describe("myModule", () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    vi.clearAllMocks();
  });

  it("should do something", async () => {
    // モックの戻り値を設定
    mockQuery.mockReturnValue(someValue);

    // テスト実行
    const result = await myFunction();

    // アサーション
    expect(result).toBe(expected);
    expect(mockQuery).toHaveBeenCalledWith(expectedArgs);
  });
});
```

## 非同期ジェネレータのモック

```typescript
it("should handle async generator", async () => {
  const mockMessages = [
    { type: "assistant", message: { content: [{ type: "text", text: "Hello" }] } },
    { type: "result", subtype: "success", result: "Done" },
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
});
```

## エラーケースのテスト

```typescript
it("should throw custom error when operation fails", async () => {
  mockQuery.mockImplementation(() => {
    throw new Error("Network error");
  });

  await expect(
    runAgent({ prompt: "test", cwd: "/tmp" })
  ).rejects.toThrow(AgentExecutionError);
});
```

## テストケース構造

```typescript
describe("moduleName", () => {
  // グループ化
  describe("functionName", () => {
    // 正常系
    it("should return expected result when given valid input", () => {
      const result = functionName("valid input");
      expect(result).toBe("expected");
    });

    // 境界値
    it("should handle empty input", () => {
      const result = functionName("");
      expect(result).toBe("");
    });

    // エラー系
    it("should throw error when given invalid input", () => {
      expect(() => functionName(null)).toThrow();
    });

    // エッジケース
    it("should skip whitespace-only content", () => {
      const result = functionName("   ");
      expect(result).toBe("");
    });
  });
});
```
