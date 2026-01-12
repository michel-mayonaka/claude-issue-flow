import { resolve } from "path";
import { readFile } from "fs/promises";
import { runAgent, extractFinalMessage } from "../core/agent.js";
import { createIssue, type GitHubIssue } from "../core/github.js";
import { setupLogger } from "../core/init.js";
import { parsePlanMarkdown } from "../core/parsing.js";
import { buildPlanIssuePrompt } from "../prompts/plan-issue.js";
import { ConfigurationError, AgentExecutionError, ParseError, AppError } from "../types/index.js";

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
  const repoPath = resolve(options.repo);
  const { logger, runId } = await setupLogger("plan-issue", repoPath);
  await logger.info("Starting plan-issue", { options: { ...options, repo: repoPath } });

  // Get request content
  let request: string;
  if (options.requestFile) {
    request = await readFile(resolve(options.requestFile), "utf-8");
  } else if (options.request) {
    request = options.request;
  } else {
    throw new ConfigurationError(
      "リクエストが指定されていません",
      { suggestion: "--request または --request-file オプションを指定してください。" }
    );
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
    allowedTools: ["Read", "Glob", "Grep", "WebSearch", "WebFetch", "AskUserQuestion"],
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
    throw new AgentExecutionError("計画立案エージェントの実行に失敗しました");
  }

  // Extract final message and parse plan
  const finalMessage = extractFinalMessage(result.messages);
  await logger.saveJson("final_message.txt", finalMessage);

  // 全メッセージからMarkdown計画を探す
  const allText = result.messages
    .filter((m) => m.type === "assistant")
    .map((m) => {
      const content = (m as { message: { content: Array<{ text?: string }> } }).message.content;
      return content.map((c) => c.text || "").join("\n");
    })
    .join("\n\n");

  const planData = parsePlanMarkdown(allText);

  if (!planData) {
    await logger.error("No valid plan found in agent output");
    throw new ParseError("エージェント出力から有効な計画を取得できませんでした");
  }

  await logger.info(`Found plan: ${planData.title}`);

  // Create issue
  const createdIssues: GitHubIssue[] = [];

  await logger.info(`Processing plan: ${planData.title}`);

  if (options.dryRun) {
    await logger.info("Dry run - skipping issue creation");
    console.log("\n--- Issue (dry run) ---");
    console.log(`Title: ${planData.title}`);
    console.log(`Body:\n${planData.body}`);
    console.log("------------------------\n");
  } else {
    try {
      const issue = await createIssue(repoPath, {
        title: planData.title,
        body: planData.body,
        labels: [],
      });

      createdIssues.push(issue);
      await logger.logIssue(issue);
      await logger.info(`Created issue #${issue.number}: ${issue.url}`);

      console.log(`Created issue #${issue.number}`);
      console.log(`  ${issue.url}`);
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
