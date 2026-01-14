# worktree.ts

Git worktree管理モジュール。simple-gitを使用。

**ファイル**: `src/core/worktree.ts`

## 型定義

### WorktreeOptions

```typescript
interface WorktreeOptions {
  repo: string;
  runId: string;
  jobName: string;
  issueNumber?: number;
  baseBranch?: string;
  logsRoot?: string;
}
```

### WorktreeInfo

```typescript
interface WorktreeInfo {
  path: string;        // worktreeのパス
  branch: string;      // ブランチ名
  baseBranch: string;  // ベースブランチ
  repoPath: string;    // 元リポジトリのパス
}
```

### WorktreeListEntry

```typescript
interface WorktreeListEntry {
  path: string;
  head: string;
  branch: string | null;
}
```

### CleanupOptions

```typescript
interface CleanupOptions {
  worktree: WorktreeInfo;
  deleteRemote?: boolean;
}
```

## 関数

### createWorktree

新しいworktreeを作成する。

```typescript
async function createWorktree(options: WorktreeOptions): Promise<WorktreeInfo>
```

#### 引数

| 引数 | 型 | 説明 |
|-----|---|------|
| `options.repo` | `string` | リポジトリパス |
| `options.runId` | `string` | 実行ID |
| `options.jobName` | `string` | ジョブ名 |
| `options.issueNumber` | `number?` | Issue番号（ブランチ名に使用） |
| `options.baseBranch` | `string?` | ベースブランチ |
| `options.logsRoot` | `string?` | ログルートディレクトリ |

#### ブランチ名生成

- Issue番号あり: `{jobName}-{issueNumber}-{runId}`
- Issue番号なし: `{jobName}-{runId}`

#### 使用例

```typescript
const worktree = await createWorktree({
  repo: "/path/to/repo",
  runId: "20260113-120000-12345",
  jobName: "issue-apply",
  issueNumber: 123,
});
// worktree.branch = "issue-apply-123-20260113-120000-12345"
```

#### エラー

- `WorktreeError`: worktree作成失敗

---

### commitChanges

worktree内の変更をコミットする。

```typescript
async function commitChanges(
  worktree: WorktreeInfo,
  message: string
): Promise<boolean>
```

#### 戻り値

- `true`: コミット成功
- `false`: 変更なし（コミットなし）

---

### pushBranch

ブランチをリモートにプッシュする。

```typescript
async function pushBranch(worktree: WorktreeInfo): Promise<void>
```

---

### getChangedFiles

変更されたファイルの一覧を取得する。

```typescript
async function getChangedFiles(worktree: WorktreeInfo): Promise<string[]>
```

---

### getDiff

差分を取得する（staged + unstaged）。

```typescript
async function getDiff(worktree: WorktreeInfo): Promise<string>
```

---

### removeWorktree

worktreeを削除する。

```typescript
async function removeWorktree(worktree: WorktreeInfo): Promise<void>
```

#### エラー

- `WorktreeError`: 削除失敗

---

### deleteBranch

ローカルブランチを削除する。

```typescript
async function deleteBranch(
  worktree: WorktreeInfo,
  force?: boolean
): Promise<void>
```

---

### deleteRemoteBranch

リモートブランチを削除する。

```typescript
async function deleteRemoteBranch(
  repoPath: string,
  branch: string
): Promise<void>
```

---

### listWorktrees

リポジトリのworktree一覧を取得する。

```typescript
async function listWorktrees(repoPath: string): Promise<WorktreeListEntry[]>
```

---

### pruneWorktrees

不要なworktreeを削除する。

```typescript
async function pruneWorktrees(repoPath: string): Promise<void>
```

---

### cleanupWorktree

worktreeとブランチをまとめてクリーンアップする。

```typescript
async function cleanupWorktree(options: CleanupOptions): Promise<void>
```

#### 処理内容

1. worktreeを削除
2. ローカルブランチを削除
3. （オプション）リモートブランチを削除

#### 使用例

```typescript
await cleanupWorktree({
  worktree,
  deleteRemote: true,  // リモートブランチも削除
});
```
