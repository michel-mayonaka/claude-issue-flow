# init.ts

初期化ヘルパーモジュール。

**ファイル**: `src/core/init.ts`

## 関数

### setupLogger

ロガーを初期化する。

```typescript
async function setupLogger(
  jobName: string,
  repoPath: string
): Promise<{ logger: ExecutionLogger; runId: string }>
```

#### 引数

| 引数 | 型 | 説明 |
|-----|---|------|
| `jobName` | `string` | ジョブ名（`issue-apply`, `plan-issue`等） |
| `repoPath` | `string` | リポジトリパス |

#### 戻り値

| プロパティ | 型 | 説明 |
|-----------|---|------|
| `logger` | `ExecutionLogger` | 初期化済みロガー |
| `runId` | `string` | 生成された実行ID |

#### 処理内容

1. `generateRunId()`で実行IDを生成
2. `repoPath`を絶対パスに変換
3. `ExecutionLogger`を作成（ログルート: `{repoPath}/logs`）
4. `logger.init()`を呼び出し

#### 使用例

```typescript
import { setupLogger } from "./core/init.js";

const repoPath = resolve(options.repo);
const { logger, runId } = await setupLogger("issue-apply", repoPath);

await logger.info("Starting job", { runId });
// ログは {repoPath}/logs/issue-apply/{runId}/ に出力される
```

#### 実際の使用箇所

**issue-apply.ts**:
```typescript
const { logger, runId } = await setupLogger("issue-apply", repoPath);
```

**plan-issue.ts**:
```typescript
const { logger, runId } = await setupLogger("plan-issue", repoPath);
```
