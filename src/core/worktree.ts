import { simpleGit, SimpleGit } from "simple-git";
import { mkdir } from "fs/promises";
import { join } from "path";
import { WorktreeError } from "../types/errors.js";

export interface WorktreeOptions {
  repo: string;
  runId: string;
  jobName: string;
  issueNumber?: number;
  baseBranch?: string;
  logsRoot?: string;
}

export interface WorktreeInfo {
  path: string;
  branch: string;
  baseBranch: string;
  repoPath: string;
}

export async function createWorktree(
  options: WorktreeOptions
): Promise<WorktreeInfo> {
  try {
    const git: SimpleGit = simpleGit(options.repo);

    // Determine base branch
    let baseBranch = options.baseBranch;
    if (!baseBranch) {
      const status = await git.status();
      baseBranch = status.current ?? "main";
    }

    // Generate branch name
    const safeJobName = options.jobName
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-");
    const branchName = options.issueNumber
      ? `${safeJobName}-${options.issueNumber}-${options.runId}`
      : `${safeJobName}-${options.runId}`;

    // Worktree directory
    const logsRoot = options.logsRoot ?? join(options.repo, "logs");
    const runDir = join(logsRoot, options.jobName, options.runId);
    const worktreePath = join(runDir, "worktree");

    await mkdir(runDir, { recursive: true });

    // Create worktree
    await git.raw(["worktree", "add", "-b", branchName, worktreePath, baseBranch]);

    return {
      path: worktreePath,
      branch: branchName,
      baseBranch,
      repoPath: options.repo,
    };
  } catch (error) {
    throw new WorktreeError(
      `Worktreeの作成に失敗しました`,
      { cause: error instanceof Error ? error : undefined }
    );
  }
}

export async function commitChanges(
  worktree: WorktreeInfo,
  message: string
): Promise<boolean> {
  const git: SimpleGit = simpleGit(worktree.path);

  // Check for changes
  const status = await git.status();
  if (status.files.length === 0) {
    return false;
  }

  // Stage all changes
  await git.add("-A");

  // Commit
  await git.commit(message);

  return true;
}

export async function pushBranch(worktree: WorktreeInfo): Promise<void> {
  const git: SimpleGit = simpleGit(worktree.path);
  await git.push(["-u", "origin", worktree.branch]);
}

export async function getChangedFiles(
  worktree: WorktreeInfo
): Promise<string[]> {
  const git: SimpleGit = simpleGit(worktree.path);
  const status = await git.status();
  return status.files.map((f) => f.path);
}

export async function getDiff(worktree: WorktreeInfo): Promise<string> {
  const git: SimpleGit = simpleGit(worktree.path);

  // Get diff of staged and unstaged changes
  const diffStaged = await git.diff(["--cached"]);
  const diffUnstaged = await git.diff();

  return [diffStaged, diffUnstaged].filter(Boolean).join("\n");
}

export async function removeWorktree(worktree: WorktreeInfo): Promise<void> {
  try {
    const git: SimpleGit = simpleGit(worktree.repoPath);
    await git.raw(["worktree", "remove", worktree.path, "--force"]);
  } catch (error) {
    throw new WorktreeError(
      `Worktreeのクリーンアップに失敗しました: ${worktree.path}`,
      { cause: error instanceof Error ? error : undefined }
    );
  }
}

export async function deleteBranch(
  worktree: WorktreeInfo,
  force = false
): Promise<void> {
  const git: SimpleGit = simpleGit(worktree.repoPath);
  const flag = force ? "-D" : "-d";
  await git.branch([flag, worktree.branch]);
}
