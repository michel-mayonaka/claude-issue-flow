# commands/

CLIコマンド実装モジュール。

**ファイル**: `src/commands/issue-apply.ts`, `src/commands/plan-issue.ts`

---

## issueApply

GitHub Issueを実装するコマンド。

**ファイル**: `src/commands/issue-apply.ts`

### 型定義

#### IssueApplyOptions

```typescript
interface IssueApplyOptions {
  issue: string | number;      // Issue番号またはURL
  repo: string;                // リポジトリパス
  model?: "haiku" | "sonnet" | "opus";  // デフォルト: "haiku"
  draft?: boolean;             // PRをドラフトで作成（デフォルト: true）
  skipPr?: boolean;            // PR作成をスキップ
  cleanup?: boolean;           // worktreeとブランチをクリーンアップ
  cleanupRemote?: boolean;     // リモートブランチも削除
}
```

#### IssueApplyResult

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

### 関数

```typescript
async function issueApply(options: IssueApplyOptions): Promise<IssueApplyResult>
```

### 処理フロー

1. ロガー初期化
2. Issue取得
3. Worktree作成
4. スキル読み込み（global + pr-draft）
5. プロンプト生成
6. Agent実行（bypassPermissionsモード）
7. 変更ファイル取得
8. コミット・プッシュ
9. PR作成（オプション）
10. クリーンアップ（オプション）

### モデルマッピング

| オプション値 | 実際のモデルID |
|-------------|---------------|
| `haiku` | `claude-3-5-haiku-20241022` |
| `sonnet` | `claude-sonnet-4-5-20250929` |
| `opus` | `claude-opus-4-5-20251101` |

### 許可ツール

`Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`, `WebSearch`, `WebFetch`

### 使用例

```typescript
import { issueApply } from "./commands/issue-apply.js";

const result = await issueApply({
  issue: 123,
  repo: "/path/to/repo",
  model: "sonnet",
  draft: true,
  skipPr: false,
});

console.log(`PR created: ${result.pr?.url}`);
```

---

## planIssue

対話的に計画を立案してIssueを作成するコマンド。

**ファイル**: `src/commands/plan-issue.ts`

### 型定義

#### PlanIssueOptions

```typescript
interface PlanIssueOptions {
  request?: string;       // リクエストテキスト
  requestFile?: string;   // リクエストファイルパス
  repo: string;           // リポジトリパス
  model?: string;         // デフォルト: "claude-opus-4-5-20251101"
  dryRun?: boolean;       // Issue作成をスキップ
  interactive?: boolean;  // 対話モード
}
```

#### PlanIssueResult

```typescript
interface PlanIssueResult {
  issues: GitHubIssue[];
  runId: string;
  logDir: string;
}
```

### 関数

```typescript
async function planIssue(options: PlanIssueOptions): Promise<PlanIssueResult>
```

### 処理フロー

1. ロガー初期化
2. リクエスト内容取得（テキストまたはファイル）
3. プロンプト生成
4. Agent実行（planモード）
5. 計画パース
6. Issue作成（dryRunでない場合）

### 許可ツール

`Read`, `Glob`, `Grep`, `WebSearch`, `WebFetch`, `AskUserQuestion`

### 使用例

```typescript
import { planIssue } from "./commands/plan-issue.js";

// テキストで指定
const result = await planIssue({
  request: "ログ機能を改善してください",
  repo: "/path/to/repo",
  dryRun: true,
});

// ファイルで指定
const result = await planIssue({
  requestFile: "./request.md",
  repo: "/path/to/repo",
});

for (const issue of result.issues) {
  console.log(`Created: #${issue.number} - ${issue.title}`);
}
```
