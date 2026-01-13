# core/worktree.ts

Git worktree管理モジュール。simple-gitを使用。

## createWorktree

Git worktreeを作成する。

**シグネチャ:**
```typescript
function createWorktree(options: WorktreeOptions): Promise<WorktreeInfo>
```

**引数:**
- `options.repo`: string - リポジトリパス
- `options.runId`: string - 実行ID（ブランチ名に使用）
- `options.jobName`: string - ジョブ名（ブランチ名に使用）
- `options.issueNumber?`: number - Issue番号（ブランチ名に含める）
- `options.baseBranch?`: string - ベースブランチ（デフォルト: 現在のブランチ）
- `options.logsRoot?`: string - ログディレクトリのルート

**戻り値:**
```typescript
interface WorktreeInfo {
  path: string;        // Worktreeのパス
  branch: string;      // ブランチ名
  baseBranch: string;  // ベースブランチ名
  repoPath: string;    // リポジトリパス
}
```

**例外:**
- `WorktreeError`: Worktree作成に失敗した場合

---

## commitChanges

Worktree内の変更をコミットする。

**シグネチャ:**
```typescript
function commitChanges(worktree: WorktreeInfo, message: string): Promise<boolean>
```

**引数:**
- `worktree`: WorktreeInfo - Worktree情報
- `message`: string - コミットメッセージ

**戻り値:**
- boolean - コミットが行われた場合`true`、変更がない場合`false`

---

## pushBranch

ブランチをリモートにプッシュする。

**シグネチャ:**
```typescript
function pushBranch(worktree: WorktreeInfo): Promise<void>
```

**引数:**
- `worktree`: WorktreeInfo - Worktree情報

---

## getChangedFiles

Worktree内の変更されたファイル一覧を取得する。

**シグネチャ:**
```typescript
function getChangedFiles(worktree: WorktreeInfo): Promise<string[]>
```

**引数:**
- `worktree`: WorktreeInfo - Worktree情報

**戻り値:**
- string[] - 変更されたファイルパスの配列

---

## getDiff

Worktree内のdiffを取得する。

**シグネチャ:**
```typescript
function getDiff(worktree: WorktreeInfo): Promise<string>
```

**引数:**
- `worktree`: WorktreeInfo - Worktree情報

**戻り値:**
- string - ステージ済みと未ステージの差分を結合した文字列

---

## cleanupWorktree

Worktreeとブランチをクリーンアップする。

**シグネチャ:**
```typescript
function cleanupWorktree(options: CleanupOptions): Promise<void>
```

**引数:**
- `options.worktree`: WorktreeInfo - Worktree情報
- `options.deleteRemote?`: boolean - リモートブランチも削除するか（デフォルト: false）

**例外:**
- `WorktreeError`: クリーンアップに失敗した場合

---

## listWorktrees

リポジトリ内のWorktree一覧を取得する。

**シグネチャ:**
```typescript
function listWorktrees(repoPath: string): Promise<WorktreeListEntry[]>
```

**引数:**
- `repoPath`: string - リポジトリパス

**戻り値:**
```typescript
interface WorktreeListEntry {
  path: string;
  head: string;
  branch: string | null;
}
```
