import { Octokit } from "@octokit/rest";
import { execSync } from "child_process";

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
    throw new Error(`Cannot parse GitHub repo from remote URL: ${remoteUrl}`);
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
    throw new Error(
      "GitHub token not found. Run 'gh auth login' or set GH_TOKEN environment variable."
    );
  }
}

function getOctokit(): Octokit {
  return new Octokit({ auth: getGitHubToken() });
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
      throw new Error(`Cannot parse issue number from URL: ${issueRef}`);
    }
    issueNumber = parseInt(match[1], 10);
  } else {
    issueNumber =
      typeof issueRef === "number" ? issueRef : parseInt(issueRef, 10);
  }

  const { data } = await octokit.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });

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
}

export async function createIssue(
  repoPath: string,
  data: IssueCreateData
): Promise<GitHubIssue> {
  const octokit = getOctokit();
  const { owner, repo } = getRepoInfo(repoPath);

  const { data: created } = await octokit.issues.create({
    owner,
    repo,
    title: data.title,
    body: data.body,
    labels: data.labels,
    assignees: data.assignees,
    milestone: data.milestone,
  });

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
}

export async function createPullRequest(
  repoPath: string,
  data: PRCreateData
): Promise<PullRequest> {
  const octokit = getOctokit();
  const { owner, repo } = getRepoInfo(repoPath);

  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    title: data.title,
    body: data.body,
    head: data.head,
    base: data.base,
    draft: data.draft ?? true,
  });

  return {
    number: pr.number,
    url: pr.html_url,
    title: pr.title,
  };
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
