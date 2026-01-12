import { resolve } from "path";
import { runAgent, extractFinalMessage } from "../core/agent.js";
import {
  fetchIssue,
  createPullRequest,
  type GitHubIssue,
  type PullRequest,
} from "../core/github.js";
import {
  createWorktree,
  commitChanges,
  pushBranch,
  getChangedFiles,
  type WorktreeInfo,
} from "../core/worktree.js";
import { setupLogger } from "../core/init.js";
import { loadSkills } from "../prompts/skills.js";
import {
  buildIssueApplyPrompt,
  parsePRInfo,
  generateDefaultPRBody,
} from "../prompts/issue-apply.js";

export interface IssueApplyOptions {
  issue: string | number;
  repo: string;
  model?: "haiku" | "sonnet";
  draft?: boolean;
  skipPr?: boolean;
}

export interface IssueApplyResult {
  issue: GitHubIssue;
  worktree: WorktreeInfo;
  pr: PullRequest | null;
  runId: string;
  logDir: string;
  changedFiles: string[];
}

const MODEL_MAP = {
  haiku: "claude-3-5-haiku-20241022",
  sonnet: "claude-sonnet-4-20250514",
};

export async function issueApply(
  options: IssueApplyOptions
): Promise<IssueApplyResult> {
  const repoPath = resolve(options.repo);
  const { logger, runId, logsRoot } = await setupLogger("issue-apply", repoPath);

  await logger.info("Starting issue-apply", {
    options: { ...options, repo: repoPath },
  });

  // 1. Fetch issue
  await logger.info("Fetching issue...");
  const issue = await fetchIssue(repoPath, options.issue);
  await logger.logIssue(issue);
  await logger.info(`Issue #${issue.number}: ${issue.title}`);

  // 2. Create worktree
  await logger.info("Creating worktree...");
  const worktree = await createWorktree({
    repo: repoPath,
    runId,
    jobName: "issue-apply",
    issueNumber: issue.number,
    logsRoot,
  });
  await logger.logWorktree(worktree);
  await logger.info(`Worktree created at ${worktree.path}`);
  await logger.info(`Branch: ${worktree.branch}`);

  // 3. Load skills
  await logger.info("Loading skills...");
  const skills = await loadSkills({
    global: true,
    optional: ["pr-draft"],
  });

  // 4. Build prompt
  const prompt = buildIssueApplyPrompt({ issue, skills });
  await logger.saveText("prompt.txt", prompt);

  // 5. Run agent
  await logger.info("Running agent...");
  const modelKey = options.model ?? "haiku";
  const model = MODEL_MAP[modelKey];
  await logger.info(`Using model: ${model}`);

  const result = await runAgent({
    prompt,
    cwd: worktree.path,
    model,
    permissionMode: "bypassPermissions",
    allowedTools: [
      "Read",
      "Write",
      "Edit",
      "Bash",
      "Glob",
      "Grep",
      "WebSearch",
      "WebFetch",
    ],
    maxTurns: 500,
    logger,
  });

  await logger.info("Agent completed", {
    success: result.success,
    numTurns: result.numTurns,
    costUSD: result.costUSD,
    durationMs: result.durationMs,
  });

  if (!result.success) {
    await logger.error("Agent execution failed");
    throw new Error("Agent execution failed");
  }

  // 6. Get changed files
  const changedFiles = await getChangedFiles(worktree);
  await logger.info(`Changed files: ${changedFiles.length}`, { changedFiles });

  if (changedFiles.length === 0) {
    await logger.warn("No changes made by agent");
    return {
      issue,
      worktree,
      pr: null,
      runId,
      logDir: logger.getLogDir(),
      changedFiles: [],
    };
  }

  // 7. Commit changes
  await logger.info("Committing changes...");
  const commitMessage = `issue-apply: implement #${issue.number}\n\n${issue.title}`;
  await commitChanges(worktree, commitMessage);
  await logger.info("Changes committed");

  // 8. Push branch
  await logger.info("Pushing branch...");
  await pushBranch(worktree);
  await logger.info(`Pushed to origin/${worktree.branch}`);

  // 9. Create PR (if not skipped)
  let pr: PullRequest | null = null;

  if (!options.skipPr) {
    await logger.info("Creating pull request...");

    const finalMessage = extractFinalMessage(result.messages);
    const prInfo = parsePRInfo(finalMessage);

    const prTitle =
      prInfo?.title || `Implement #${issue.number}: ${issue.title}`;
    const prBodyBase =
      prInfo?.body || generateDefaultPRBody(issue, finalMessage);

    // 統計情報を追記
    const statsSection = `
---

## Agent Statistics

| Item | Value |
|------|-------|
| Model | ${model} |
| Turns | ${result.numTurns} |
| Cost | $${result.costUSD.toFixed(4)} |
| Duration | ${(result.durationMs / 1000).toFixed(1)}s |
`;
    const prBody = prBodyBase + statsSection;

    pr = await createPullRequest(repoPath, {
      title: prTitle,
      body: prBody,
      head: worktree.branch,
      base: worktree.baseBranch,
      draft: options.draft ?? true,
    });

    await logger.logPR(pr);
    await logger.info(`Created PR #${pr.number}: ${pr.url}`);
  }

  await logger.info("issue-apply completed", {
    issueNumber: issue.number,
    prNumber: pr?.number,
    changedFiles: changedFiles.length,
  });

  return {
    issue,
    worktree,
    pr,
    runId,
    logDir: logger.getLogDir(),
    changedFiles,
  };
}
