---
name: code-patterns
description: コーディングパターンと規約。新規実装時の参考用。
generated_at: 2026-01-13T00:00:00.000Z
source_hash: d7551da52ad56315
files:
  - error-handling.md
  - prompt-building.md
  - testing.md
  - naming-conventions.md
---

# コーディングパターン

このディレクトリにはコーディングパターンと規約が含まれています。

## ドキュメント一覧

| ファイル | 説明 |
|---------|------|
| [error-handling.md](./error-handling.md) | エラーハンドリングパターン |
| [prompt-building.md](./prompt-building.md) | プロンプト構築パターン |
| [testing.md](./testing.md) | テストパターン（vitest） |
| [naming-conventions.md](./naming-conventions.md) | 命名規約、import規約、各種パターン |

## クイックリファレンス

### エラーのスロー

```typescript
throw new ConfigurationError(
  "GitHubトークンが見つかりません",
  { suggestion: "'gh auth login' を実行してください。" }
);
```

### リトライ付き操作

```typescript
const result = await withRetry(
  () => octokit.issues.get({ owner, repo, issue_number }),
  { maxAttempts: 3 }
);
```

### プロンプト構築

```typescript
const prompt = buildIssueApplyPrompt({ issue });
const result = await runAgent({
  prompt,
  appendSystemPrompt: skills,  // スキルは分離
});
```

### ESM import

```typescript
// 内部モジュールは.js拡張子必須
import { runAgent } from "./core/agent.js";
import type { AgentOptions } from "./core/agent.js";
```
