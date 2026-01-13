---
name: api-reference
description: 公開API・主要関数のリファレンス。引数、戻り値、使用例を記載。
generated_at: 2026-01-13T00:00:00.000Z
source_hash: b871d4b86b4b188e
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
| [logger.md](./logger.md) | 実行ログ管理（ExecutionLogger, generateRunId） |
| [retry.md](./retry.md) | リトライロジック（withRetry） |
| [parsing.md](./parsing.md) | テキストパース（parsePlanMarkdown等） |
| [init.md](./init.md) | 初期化ユーティリティ（setupLogger） |
| [errors.md](./errors.md) | エラークラス（AppError, AgentExecutionError等） |
| [commands.md](./commands.md) | CLIコマンド（issueApply, planIssue） |
