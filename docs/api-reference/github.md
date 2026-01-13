# core/github.ts

GitHub API操作モジュール。Octokitを使用。

## fetchIssue

GitHub Issueを取得する。

**シグネチャ:**
```typescript
function fetchIssue(repoPath: string, issueRef: string | number): Promise<GitHubIssue>
```

**引数:**
- `repoPath`: string - リポジトリのローカルパス
- `issueRef`: string | number - Issue番号またはURL（例: `123` または `https://github.com/owner/repo/issues/123`）

**戻り値:**
```typescript
interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  url: string;
  labels: string[];
  assignees: string[];
  milestone: string | null;
  state: string;
}
```

**例外:**
- `GitHubAPIError`: API呼び出しに失敗した場合
- `ParseError`: Issue URLの解析に失敗した場合

---

## createIssue

GitHub Issueを作成する。

**シグネチャ:**
```typescript
function createIssue(repoPath: string, data: IssueCreateData): Promise<GitHubIssue>
```

**引数:**
- `repoPath`: string - リポジトリのローカルパス
- `data.title`: string - Issueタイトル
- `data.body`: string - Issue本文
- `data.labels?`: string[] - ラベル
- `data.assignees?`: string[] - アサイン先
- `data.milestone?`: number - マイルストーンID

**戻り値:**
- GitHubIssue - 作成されたIssue情報

**例外:**
- `GitHubAPIError`: API呼び出しに失敗した場合

---

## createPullRequest

Pull Requestを作成する。

**シグネチャ:**
```typescript
function createPullRequest(repoPath: string, data: PRCreateData): Promise<PullRequest>
```

**引数:**
- `repoPath`: string - リポジトリのローカルパス
- `data.title`: string - PRタイトル
- `data.body`: string - PR本文
- `data.head`: string - ソースブランチ名
- `data.base`: string - ターゲットブランチ名
- `data.draft?`: boolean - ドラフトPRとして作成（デフォルト: true）

**戻り値:**
```typescript
interface PullRequest {
  number: number;
  url: string;
  title: string;
}
```

**例外:**
- `GitHubAPIError`: API呼び出しに失敗した場合

---

## issueToYaml

GitHubIssueをYAML形式の文字列に変換する。

**シグネチャ:**
```typescript
function issueToYaml(issue: GitHubIssue): string
```

**引数:**
- `issue`: GitHubIssue - 変換するIssue

**戻り値:**
- string - YAML形式の文字列
