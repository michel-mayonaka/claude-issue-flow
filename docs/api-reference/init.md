# core/init.ts

初期化ユーティリティモジュール。

## setupLogger

ジョブ用のロガーを初期化する。

**シグネチャ:**
```typescript
function setupLogger(
  jobName: string,
  repoPath: string
): Promise<{ logger: ExecutionLogger; runId: string }>
```

**引数:**
- `jobName`: string - ジョブ名（`"issue-apply"` または `"plan-issue"`）
- `repoPath`: string - リポジトリパス

**戻り値:**
- `logger`: ExecutionLogger - 初期化済みロガー
- `runId`: string - 生成された実行ID
