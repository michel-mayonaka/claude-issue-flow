---
name: api-reference
description: 公開API・主要関数のリファレンス。引数、戻り値、使用例を記載。
generated_at: 2026-01-13T00:00:00.000Z
source_hash: 1cec94625e4cf57f
files:
  - agent.md
  - github.md
  - worktree.md
  - logger.md
  - retry.md
  - parsing.md
  - init.md
  - errors.md
  - commands.md
---

# APIリファレンス

このディレクトリには公開API・主要関数のリファレンスが含まれています。

## モジュール一覧

| ファイル | 説明 |
|---------|------|
| [agent.md](./agent.md) | Agent SDK連携（runAgent, extractTextFromMessages等） |
| [github.md](./github.md) | GitHub API操作（fetchIssue, createIssue, createPullRequest等） |
| [worktree.md](./worktree.md) | Git worktree管理（createWorktree, commitChanges等） |
| [logger.md](./logger.md) | ログ管理（ExecutionLogger, generateRunId） |
| [retry.md](./retry.md) | リトライ機能（withRetry） |
| [parsing.md](./parsing.md) | 出力パース（parsePlanMarkdown, parsePlanFromInput） |
| [init.md](./init.md) | 初期化（setupLogger） |
| [errors.md](./errors.md) | エラークラス（AppError, 派生クラス） |
| [commands.md](./commands.md) | CLIコマンド（issueApply, planIssue） |

## クイックリファレンス

### Agent実行

```typescript
import { runAgent } from "./core/agent.js";

const result = await runAgent({
  prompt: "タスクの説明",
  cwd: "/path/to/repo",
  model: "claude-sonnet-4-5-20250929",
  permissionMode: "bypassPermissions",
  allowedTools: ["Read", "Write", "Edit", "Bash"],
});
```

### GitHub操作

```typescript
import { fetchIssue, createPullRequest } from "./core/github.js";

const issue = await fetchIssue("/path/to/repo", 123);
const pr = await createPullRequest("/path/to/repo", {
  title: "PR title",
  body: "PR body",
  head: "feature-branch",
  base: "main",
});
```

### Worktree管理

```typescript
import { createWorktree, cleanupWorktree } from "./core/worktree.js";

const worktree = await createWorktree({
  repo: "/path/to/repo",
  runId: "20260113-120000-12345",
  jobName: "issue-apply",
  issueNumber: 123,
});

await cleanupWorktree({ worktree, deleteRemote: true });
```
