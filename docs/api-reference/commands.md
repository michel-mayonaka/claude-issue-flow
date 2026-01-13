# commands/

CLIコマンド実装モジュール。

## issueApply

GitHub Issueを実装してPRを作成する。

**シグネチャ:**
```typescript
function issueApply(options: IssueApplyOptions): Promise<IssueApplyResult>
```

**引数:**
```typescript
interface IssueApplyOptions {
  issue: string | number;           // Issue番号またはURL
  repo: string;                     // リポジトリパス
  model?: "haiku" | "sonnet" | "opus"; // モデル（デフォルト: haiku）
  draft?: boolean;                  // ドラフトPR（デフォルト: true）
  skipPr?: boolean;                 // PR作成をスキップ
  cleanup?: boolean;                // クリーンアップ実行
  cleanupRemote?: boolean;          // リモートブランチも削除
}
```

**戻り値:**
```typescript
interface IssueApplyResult {
  issue: GitHubIssue;
  worktree: WorktreeInfo;
  pr: PullRequest | null;
  runId: string;
  logDir: string;
  changedFiles: string[];
}
```

**モデルマッピング:**
- `haiku`: `claude-3-5-haiku-20241022`
- `sonnet`: `claude-sonnet-4-5-20250929`
- `opus`: `claude-opus-4-5-20251101`

---

## planIssue

計画を立案してIssueを作成する。

**シグネチャ:**
```typescript
function planIssue(options: PlanIssueOptions): Promise<PlanIssueResult>
```

**引数:**
```typescript
interface PlanIssueOptions {
  request?: string;          // リクエストテキスト
  requestFile?: string;      // リクエストファイルパス
  repo: string;              // リポジトリパス
  model?: string;            // モデル（デフォルト: opus）
  dryRun?: boolean;          // ドライラン
  interactive?: boolean;     // インタラクティブモード
}
```

**戻り値:**
```typescript
interface PlanIssueResult {
  issues: GitHubIssue[];
  runId: string;
  logDir: string;
}
```
