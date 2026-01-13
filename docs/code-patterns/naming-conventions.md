# 命名規約

## 基本規約

| 対象 | 規約 | 例 |
|-----|------|-----|
| ファイル名 | kebab-case | `issue-apply.ts`, `create-issue.ts` |
| 関数名 | camelCase | `createIssue`, `fetchIssue`, `runAgent` |
| クラス名 | PascalCase | `AppError`, `ExecutionLogger` |
| 型/Interface | PascalCase | `AgentOptions`, `GitHubIssue` |
| 定数 | camelCase または UPPER_SNAKE_CASE | `MODEL_MAP`, `maxAttempts` |
| 型パラメータ | 単一大文字 | `T`, `K`, `V` |

---

# import規約

## ESM形式

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

## インポート順序

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

# 再エクスポートパターン

## types/index.ts

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

## 使用側

```typescript
// types/index.tsから一括インポート
import { AppError, GitHubIssue, ParsedPlan } from "../types/index.js";
```

---

# 非同期処理パターン

## async/awaitの使用

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

## リトライロジック

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

# ログ出力パターン

## ExecutionLoggerの使用

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

# Git操作パターン

## simple-gitの使用

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
```

---

# コマンドライン引数パターン

## Commanderの使用

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
