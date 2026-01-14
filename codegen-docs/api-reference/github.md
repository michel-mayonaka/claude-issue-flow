# github.ts

GitHub API操作モジュール。Octokitを使用。

**ファイル**: `src/core/github.ts`

## 型定義

### GitHubIssue

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

### IssueCreateData

```typescript
interface IssueCreateData {
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
  milestone?: number;
}
```

### PRCreateData

```typescript
interface PRCreateData {
  title: string;
  body: string;
  head: string;
  base: string;
  draft?: boolean;
}
```

### PullRequest

```typescript
interface PullRequest {
  number: number;
  url: string;
  title: string;
}
```

## 関数

### fetchIssue

GitHub Issueを取得する。

```typescript
async function fetchIssue(
  repoPath: string,
  issueRef: string | number
): Promise<GitHubIssue>
```

#### 引数

| 引数 | 型 | 説明 |
|-----|---|------|
| `repoPath` | `string` | リポジトリのローカルパス |
| `issueRef` | `string \| number` | Issue番号またはURL |

#### 戻り値

`GitHubIssue`オブジェクト

#### エラー

- `ParseError`: Issue番号の解析失敗
- `GitHubAPIError`: API呼び出し失敗

#### 使用例

```typescript
// 番号で取得
const issue = await fetchIssue("/path/to/repo", 123);

// URLで取得
const issue = await fetchIssue(
  "/path/to/repo",
  "https://github.com/owner/repo/issues/123"
);
```

---

### createIssue

GitHub Issueを作成する。

```typescript
async function createIssue(
  repoPath: string,
  data: IssueCreateData
): Promise<GitHubIssue>
```

#### 引数

| 引数 | 型 | 説明 |
|-----|---|------|
| `repoPath` | `string` | リポジトリのローカルパス |
| `data` | `IssueCreateData` | Issue作成データ |

#### 戻り値

作成された`GitHubIssue`オブジェクト

#### エラー

- `GitHubAPIError`: API呼び出し失敗

#### 使用例

```typescript
const issue = await createIssue("/path/to/repo", {
  title: "新機能の実装",
  body: "## 概要\n機能の説明...",
  labels: ["enhancement", "priority:high"],
});
```

---

### createPullRequest

Pull Requestを作成する。

```typescript
async function createPullRequest(
  repoPath: string,
  data: PRCreateData
): Promise<PullRequest>
```

#### 引数

| 引数 | 型 | 説明 |
|-----|---|------|
| `repoPath` | `string` | リポジトリのローカルパス |
| `data` | `PRCreateData` | PR作成データ |

#### 戻り値

作成された`PullRequest`オブジェクト

#### エラー

- `GitHubAPIError`: API呼び出し失敗

#### 使用例

```typescript
const pr = await createPullRequest("/path/to/repo", {
  title: "feat: 新機能を追加",
  body: "## 概要\n変更内容...\n\nCloses #123",
  head: "feature-branch",
  base: "main",
  draft: true,
});
```

---

### issueToYaml

GitHubIssueをYAML形式の文字列に変換する。

```typescript
function issueToYaml(issue: GitHubIssue): string
```

#### 使用例

```typescript
const yaml = issueToYaml(issue);
console.log(yaml);
// title: "Issue title"
// number: 123
// url: "https://..."
// ...
```

## 認証

GitHubトークンは以下の順序で取得される：

1. 環境変数 `GH_TOKEN`
2. 環境変数 `GITHUB_TOKEN`
3. `gh auth token` コマンド（gh CLI）

トークンが見つからない場合は`ConfigurationError`がスローされる。
