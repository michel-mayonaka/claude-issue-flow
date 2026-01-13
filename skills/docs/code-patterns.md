---
name: code-patterns
description: コーディングパターンと規約。新規実装時の参考用。
generated_at: 2026-01-13T00:00:00.000Z
source_hash: d89c6c829469319f
---

# コーディングパターン

## エラーハンドリング

### AppError基底クラス

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

### カスタムエラーの作成例

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

### エラーのキャッチと再スロー

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

### ユーザー向けエラー表示

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

---

## プロンプト構築

### 構造

プロンプトはテンプレート関数で構築する：

```typescript
export interface MyPromptOptions {
  // 必須パラメータ
  task: string;
  // オプションパラメータ
  additionalContext?: string;
}

export function buildMyPrompt(options: MyPromptOptions): string {
  return `# タスク

${options.task}

${options.additionalContext ? `## 追加コンテキスト\n${options.additionalContext}\n` : ""}

## 実行ルール

1. ルール1
2. ルール2

## 出力フォーマット

\`\`\`
期待する出力形式
\`\`\`
`;
}
```

### Issue実装プロンプトの例

```typescript
export function buildIssueApplyPrompt(options: IssueApplyPromptOptions): string {
  return `# Agent Skills

${options.skills}

# タスク: GitHub Issue実装

以下のIssueの内容を実装してください。

## Issue情報

- **Title**: ${options.issue.title}
- **Number**: #${options.issue.number}
- **URL**: ${options.issue.url}
- **Labels**: ${options.issue.labels.join(", ") || "なし"}

## Issue本文

\`\`\`markdown
${options.issue.body}
\`\`\`

## 実装ルール

1. **受け入れ条件を最優先**: Issueの「受け入れ条件」を全て満たすこと
2. **不明点は明記**: 判断できない点は「要確認」として明記
...
`;
}
```

### 出力パース関数の例

```typescript
export function parsePRInfo(content: string): { title: string; body: string } | null {
  // YAMLブロックを検索
  const yamlMatch = content.match(/```yaml\s*([\s\S]*?)```/g);
  if (!yamlMatch) {
    return null;
  }

  // 最後のYAMLブロックから情報を抽出
  for (const block of yamlMatch.reverse()) {
    const yamlContent = block.replace(/```yaml\s*/, "").replace(/```$/, "");
    const titleMatch = yamlContent.match(/pr_title:\s*["']?(.+?)["']?\s*$/m);

    if (titleMatch) {
      // パース成功
      return { title: titleMatch[1].trim(), body: "..." };
    }
  }

  return null;
}
```

---

## テストパターン

### モックの使用

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

### 非同期ジェネレータのモック

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

### エラーケースのテスト

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

### テストケース構造

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

---

## 命名規約

| 対象 | 規約 | 例 |
|-----|------|-----|
| ファイル名 | kebab-case | `issue-apply.ts`, `create-issue.ts` |
| 関数名 | camelCase | `createIssue`, `fetchIssue`, `runAgent` |
| クラス名 | PascalCase | `AppError`, `ExecutionLogger` |
| 型/Interface | PascalCase | `AgentOptions`, `GitHubIssue` |
| 定数 | camelCase または UPPER_SNAKE_CASE | `MODEL_MAP`, `maxAttempts` |
| 型パラメータ | 単一大文字 | `T`, `K`, `V` |

---

## import規約

### ESM形式

```typescript
// 外部モジュール（拡張子なし）
import { program } from "commander";
import { Octokit } from "@octokit/rest";

// 内部モジュール（.js拡張子必須）
import { runAgent } from "./core/agent.js";
import { AppError } from "../types/errors.js";

// 型のみのインポート
import type { GitHubIssue } from "../core/github.js";
import type { SDKMessage } from "@anthropic-ai/claude-code";
```

### インポート順序

1. Node.js組み込みモジュール
2. 外部ライブラリ
3. 内部モジュール（相対パス）
4. 型のみのインポート

```typescript
// 1. Node.js
import { readFile } from "fs/promises";
import { resolve, join } from "path";

// 2. 外部ライブラリ
import { program } from "commander";
import { simpleGit } from "simple-git";

// 3. 内部モジュール
import { runAgent } from "./core/agent.js";
import { createIssue } from "./core/github.js";

// 4. 型
import type { AgentOptions } from "./core/agent.js";
```

---

## 再エクスポートパターン

### types/index.ts

```typescript
// コアモジュールから型を再エクスポート
export type { GitHubIssue, IssueCreateData } from "../core/github.js";
export type { AgentOptions, AgentResult } from "../core/agent.js";

// このファイル独自の型定義
export interface ParsedPlan {
  title: string;
  body: string;
}

// エラークラスを全てエクスポート
export * from "./errors.js";
```

### 使用側

```typescript
// types/index.tsから一括インポート
import { AppError, GitHubIssue, ParsedPlan } from "../types/index.js";
```

---

## 非同期処理パターン

### async/awaitの使用

```typescript
export async function fetchIssue(repoPath: string, issueRef: string | number): Promise<GitHubIssue> {
  const octokit = getOctokit();
  const { owner, repo } = getRepoInfo(repoPath);

  try {
    const { data } = await withRetry(
      () => octokit.issues.get({ owner, repo, issue_number: issueNumber }),
      { maxAttempts: 3 }
    );

    return {
      number: data.number,
      title: data.title,
      // ...
    };
  } catch (error) {
    throw wrapOctokitError(error, `Issue #${issueNumber} の取得に失敗しました`);
  }
}
```

### リトライロジック

```typescript
const result = await withRetry(
  () => someAsyncOperation(),
  {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    shouldRetry: (error) => {
      // カスタムリトライ条件
      return error instanceof SomeRetryableError;
    },
  }
);
```

---

## ログ出力パターン

### ExecutionLoggerの使用

```typescript
const { logger, runId } = await setupLogger("job-name", repoPath);

// 情報ログ
await logger.info("Starting operation", { options });

// 警告ログ
await logger.warn("Something unexpected", { details });

// エラーログ
await logger.error("Operation failed", { error: error.message });

// 構造化データの保存
await logger.saveJson("result.json", resultData);
await logger.saveText("prompt.txt", promptText);

// 特定の情報を保存
await logger.logIssue(issue);
await logger.logWorktree(worktree);
await logger.logPR(pr);
```

---

## Git操作パターン

### simple-gitの使用

```typescript
import { simpleGit, SimpleGit } from "simple-git";

export async function createWorktree(options: WorktreeOptions): Promise<WorktreeInfo> {
  const git: SimpleGit = simpleGit(options.repo);

  // ステータス確認
  const status = await git.status();
  const baseBranch = status.current ?? "main";

  // Worktree作成
  await git.raw(["worktree", "add", "-b", branchName, worktreePath, baseBranch]);

  return { path: worktreePath, branch: branchName, baseBranch, repoPath };
}

export async function commitChanges(worktree: WorktreeInfo, message: string): Promise<boolean> {
  const git: SimpleGit = simpleGit(worktree.path);

  const status = await git.status();
  if (status.files.length === 0) {
    return false;
  }

  await git.add("-A");
  await git.commit(message);
  return true;
}
```

---

## コマンドライン引数パターン

### Commanderの使用

```typescript
import { program } from "commander";

program
  .command("my-command")
  .description("コマンドの説明")
  .requiredOption("-i, --input <value>", "必須オプション")
  .option("-o, --output <path>", "オプション", "default")
  .option("--flag", "フラグオプション", false)
  .action(async (opts) => {
    try {
      await myCommand({
        input: opts.input,
        output: opts.output,
        flag: opts.flag,
      });
    } catch (error) {
      if (error instanceof AppError) {
        console.error(error.toUserMessage());
      } else {
        console.error("Error:", error);
      }
      process.exit(1);
    }
  });

program.parse();
```
