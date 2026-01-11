import { resolve } from "path";
import { readFile } from "fs/promises";
import { runAgent, extractFinalMessage } from "../core/agent.js";
import { createIssue, type GitHubIssue } from "../core/github.js";
import { ExecutionLogger, generateRunId } from "../core/logger.js";
import {
  buildPlanIssuePrompt,
  parseIssueYaml,
} from "../prompts/plan-issue.js";

export interface PlanIssueOptions {
  request?: string;
  requestFile?: string;
  repo: string;
  model?: string;
  dryRun?: boolean;
  interactive?: boolean;
}

export interface PlanIssueResult {
  issues: GitHubIssue[];
  runId: string;
  logDir: string;
}

export async function planIssue(
  options: PlanIssueOptions
): Promise<PlanIssueResult> {
  const runId = generateRunId();
  const repoPath = resolve(options.repo);
  const logger = new ExecutionLogger("plan-issue", runId, resolve(repoPath, "logs"));

  await logger.init();
  await logger.info("Starting plan-issue", { options: { ...options, repo: repoPath } });

  // Get request content
  let request: string;
  if (options.requestFile) {
    request = await readFile(resolve(options.requestFile), "utf-8");
  } else if (options.request) {
    request = options.request;
  } else {
    throw new Error("Either --request or --request-file must be provided");
  }

  await logger.info("Request content", { request });

  // Build prompt
  const prompt = buildPlanIssuePrompt({ request });

  // Run agent in plan mode
  await logger.info("Running agent in plan mode...");

  const result = await runAgent({
    prompt,
    cwd: repoPath,
    model: options.model ?? "claude-opus-4-5-20251101",
    permissionMode: "plan",
    allowedTools: ["Read", "Glob", "Grep", "WebSearch", "WebFetch"],
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

  // Extract final message and parse issues
  const finalMessage = extractFinalMessage(result.messages);
  await logger.saveJson("final_message.txt", finalMessage);

  const issueDataList = parseIssueYaml(finalMessage);

  if (issueDataList.length === 0) {
    await logger.error("No valid issue YAML found in agent output");
    throw new Error("No valid issue YAML found in agent output");
  }

  await logger.info(`Found ${issueDataList.length} issue(s) to create`);

  // Create issues
  const createdIssues: GitHubIssue[] = [];

  for (const issueData of issueDataList) {
    await logger.info(`Processing issue: ${issueData.title}`);

    if (options.dryRun) {
      await logger.info("Dry run - skipping issue creation");
      console.log("\n--- Issue (dry run) ---");
      console.log(`Title: ${issueData.title}`);
      console.log(`Labels: ${issueData.labels.join(", ")}`);
      console.log(`Body:\n${issueData.body}`);
      console.log("------------------------\n");
      continue;
    }

    try {
      const issue = await createIssue(repoPath, {
        title: issueData.title,
        body: issueData.body,
        labels: issueData.labels,
        assignees: issueData.assignees,
      });

      createdIssues.push(issue);
      await logger.logIssue(issue);
      await logger.info(`Created issue #${issue.number}: ${issue.url}`);

      console.log(`Created issue #${issue.number}: ${issue.url}`);
    } catch (error) {
      await logger.error("Failed to create issue", { error: String(error) });
      throw error;
    }
  }

  await logger.info("plan-issue completed", {
    issuesCreated: createdIssues.length,
  });

  return {
    issues: createdIssues,
    runId,
    logDir: logger.getLogDir(),
  };
}
