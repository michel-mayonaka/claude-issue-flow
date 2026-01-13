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
  cleanupWorktree,
  type WorktreeInfo,
} from "../core/worktree.js";
import { setupLogger } from "../core/init.js";
import { loadSkills } from "../prompts/skills.js";
import {
  buildIssueApplyPrompt,
  parsePRInfo,
  generateDefaultPRBody,
} from "../prompts/issue-apply.js";
import { AgentExecutionError, AppError } from "../types/index.js";

export interface IssueApplyOptions {
  issue: string | number;
  repo: string;
  model?: "haiku" | "sonnet" | "opus";
  draft?: boolean;
  skipPr?: boolean;
  cleanup?: boolean;
  cleanupRemote?: boolean;
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
  sonnet: "claude-sonnet-4-5-20250929",
  opus: "claude-opus-4-5-20251101",
};

export async function issueApply(
  options: IssueApplyOptions
): Promise<IssueApplyResult> {
  const repoPath = resolve(options.repo);
  const { logger, runId } = await setupLogger("issue-apply", repoPath);
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
  const logsRoot = resolve(repoPath, "logs");
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
  const prompt = buildIssueApplyPrompt({ issue });
  await logger.saveText("prompt.txt", prompt);
  await logger.saveText("system_prompt_append.txt", skills);

  // 5. Run agent
  await logger.info("Running agent...");
  const modelKey = options.model ?? "sonnet";
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
    appendSystemPrompt: skills,
  });

  await logger.info("Agent completed", {
    success: result.success,
    numTurns: result.numTurns,
    costUSD: result.costUSD,
    durationMs: result.durationMs,
  });

  if (!result.success) {
    await logger.error("Agent execution failed");
    throw new AgentExecutionError("Issue実装エージェントの実行に失敗しました");
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

    // ログセクションを追記
    const prompt = await logger.getPrompt();
    const executionLog = await logger.getExecutionLog();

    const logSection = `
<details>
<summary>Prompt</summary>

\`\`\`
${prompt}
\`\`\`

</details>

<details>
<summary>Execution Log</summary>

\`\`\`
${executionLog}
\`\`\`

</details>
`;

    const prBody = prBodyBase + statsSection + logSection;

    pr = await createPullRequest(repoPath, {
      title: prTitle,
      body: prBody,
      head: worktree.branch,
      base: worktree.baseBranch,
      draft: options.draft ?? true,
    });

    await logger.logPR(pr);
    await logger.info(`Created PR #${pr.number}`);
    await logger.info(`  ${pr.url}`);
  }

  if (options.cleanup) {
    await logger.info("Cleaning up worktree and branches...");
    try {
      await cleanupWorktree({
        worktree,
        deleteRemote: options.cleanupRemote,
      });
      await logger.info("Cleanup completed");
    } catch (cleanupError) {
      await logger.warn("Cleanup failed", {
        error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
      });
    }
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
