import { Octokit } from "@octokit/rest";
import { execSync } from "child_process";
import { GitHubAPIError, ConfigurationError, ParseError } from "../types/errors.js";
import { withRetry } from "./retry.js";

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  url: string;
  labels: string[];
  assignees: string[];
  milestone: string | null;
  state: string;
}

export interface IssueCreateData {
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
  milestone?: number;
}

export interface PRCreateData {
  title: string;
  body: string;
  head: string;
  base: string;
  draft?: boolean;
}

export interface PullRequest {
  number: number;
  url: string;
  title: string;
}

function getRepoInfo(repoPath: string): { owner: string; repo: string } {
  const remoteUrl = execSync("git remote get-url origin", {
    cwd: repoPath,
    encoding: "utf-8",
  }).trim();

  // Parse GitHub URL (supports both HTTPS and SSH)
  // https://github.com/owner/repo.git
  // git@github.com:owner/repo.git
  const httpsMatch = remoteUrl.match(
    /github\.com\/([^/]+)\/([^/.]+)(?:\.git)?$/
  );
  const sshMatch = remoteUrl.match(/github\.com:([^/]+)\/([^/.]+)(?:\.git)?$/);

  const match = httpsMatch || sshMatch;
  if (!match) {
    throw new ParseError(`GitHubリポジトリURLを解析できません: ${remoteUrl}`);
  }

  return { owner: match[1], repo: match[2] };
}

function getGitHubToken(): string {
  // 1. 環境変数を優先（CI/CD、明示設定用）
  const envToken = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (envToken) return envToken;

  // 2. gh CLI からトークンを取得
  try {
    return execSync("gh auth token", { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    throw new ConfigurationError(
      "GitHubトークンが見つかりません",
      { suggestion: "'gh auth login' を実行するか、GH_TOKEN環境変数を設定してください。" }
    );
  }
}

function getOctokit(): Octokit {
  return new Octokit({ auth: getGitHubToken() });
}

function wrapOctokitError(error: unknown, message: string): GitHubAPIError {
  // Already a GitHubAPIError, just re-throw
  if (error instanceof GitHubAPIError) {
    return error;
  }

  // Octokit error with status code
  if (isOctokitError(error)) {
    return new GitHubAPIError(`${message}: ${error.message}`, {
      statusCode: error.status,
      cause: error instanceof Error ? error : undefined,
    });
  }

  // Generic error
  if (error instanceof Error) {
    return new GitHubAPIError(`${message}: ${error.message}`, {
      cause: error,
    });
  }

  return new GitHubAPIError(message, {});
}

function isOctokitError(error: unknown): error is Error & { status: number; message: string } {
  return (
    error instanceof Error &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  );
}

export async function fetchIssue(
  repoPath: string,
  issueRef: string | number
): Promise<GitHubIssue> {
  const octokit = getOctokit();
  const { owner, repo } = getRepoInfo(repoPath);

  // Handle URL or number
  let issueNumber: number;
  if (typeof issueRef === "string" && issueRef.includes("github.com")) {
    const match = issueRef.match(/issues\/(\d+)/);
    if (!match) {
      throw new ParseError(`Issue番号を解析できません: ${issueRef}`);
    }
    issueNumber = parseInt(match[1], 10);
  } else {
    issueNumber =
      typeof issueRef === "number" ? issueRef : parseInt(issueRef, 10);
  }

  try {
    const { data } = await withRetry(
      () => octokit.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      }),
      { maxAttempts: 3 }
    );

    return {
      number: data.number,
      title: data.title,
      body: data.body || "",
      url: data.html_url,
      labels: data.labels.map((l) => (typeof l === "string" ? l : l.name || "")),
      assignees: data.assignees?.map((a) => a.login) || [],
      milestone: data.milestone?.title || null,
      state: data.state,
    };
  } catch (error) {
    throw wrapOctokitError(error, `Issue #${issueNumber} の取得に失敗しました`);
  }
}

export async function createIssue(
  repoPath: string,
  data: IssueCreateData
): Promise<GitHubIssue> {
  const octokit = getOctokit();
  const { owner, repo } = getRepoInfo(repoPath);

  try {
    const { data: created } = await withRetry(
      () => octokit.issues.create({
        owner,
        repo,
        title: data.title,
        body: data.body,
        labels: data.labels,
        assignees: data.assignees,
        milestone: data.milestone,
      }),
      { maxAttempts: 3 }
    );

    return {
      number: created.number,
      title: created.title,
      body: created.body || "",
      url: created.html_url,
      labels: created.labels.map((l) =>
        typeof l === "string" ? l : l.name || ""
      ),
      assignees: created.assignees?.map((a) => a.login) || [],
      milestone: created.milestone?.title || null,
      state: created.state,
    };
  } catch (error) {
    throw wrapOctokitError(error, "Issueの作成に失敗しました");
  }
}

export async function createPullRequest(
  repoPath: string,
  data: PRCreateData
): Promise<PullRequest> {
  const octokit = getOctokit();
  const { owner, repo } = getRepoInfo(repoPath);

  try {
    const { data: pr } = await withRetry(
      () => octokit.pulls.create({
        owner,
        repo,
        title: data.title,
        body: data.body,
        head: data.head,
        base: data.base,
        draft: data.draft ?? true,
      }),
      { maxAttempts: 3 }
    );

    return {
      number: pr.number,
      url: pr.html_url,
      title: pr.title,
    };
  } catch (error) {
    throw wrapOctokitError(error, "Pull Requestの作成に失敗しました");
  }
}

export function issueToYaml(issue: GitHubIssue): string {
  const lines = [
    `title: "${issue.title.replace(/"/g, '\\"')}"`,
    `number: ${issue.number}`,
    `url: "${issue.url}"`,
    `state: "${issue.state}"`,
    `body: |`,
    ...issue.body.split("\n").map((line) => `  ${line}`),
    `labels:`,
    ...issue.labels.map((l) => `  - "${l}"`),
    `assignees:`,
    ...issue.assignees.map((a) => `  - "${a}"`),
  ];

  if (issue.milestone) {
    lines.push(`milestone: "${issue.milestone}"`);
  }

  return lines.join("\n");
}
