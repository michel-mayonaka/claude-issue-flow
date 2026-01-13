# types/errors.ts

エラークラス定義モジュール。

## AppError

アプリケーションエラーの基底クラス。

**プロパティ:**
- `code`: string - エラーコード
- `isRetryable`: boolean - リトライ可能か
- `suggestion?`: string - ユーザー向け提案

**メソッド:**
- `toUserMessage(): string` - ユーザー向けメッセージを生成

---

## AgentExecutionError

エージェント実行エラー。

- コード: `AGENT_EXECUTION_ERROR`
- リトライ: 不可

---

## GitHubAPIError

GitHub API呼び出しエラー。

- コード: `GITHUB_API_ERROR` または `GITHUB_RATE_LIMIT`
- リトライ: レート制限時（403/429）は可
- 追加プロパティ: `statusCode?: number`

---

## WorktreeError

Git worktree操作エラー。

- コード: `WORKTREE_ERROR`
- リトライ: 不可

---

## ConfigurationError

設定エラー。

- コード: `CONFIGURATION_ERROR`
- リトライ: 不可

---

## ParseError

パースエラー。

- コード: `PARSE_ERROR`
- リトライ: 不可
