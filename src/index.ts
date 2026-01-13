#!/usr/bin/env node

import { program } from "commander";
import { planIssue } from "./commands/plan-issue.js";
import { issueApply } from "./commands/issue-apply.js";
import { AppError } from "./types/index.js";

program
  .name("claude-agent")
  .description("GitHub Issue-driven workflow using Claude Code Agent SDK")
  .version("0.1.0");

program
  .command("plan-issue")
  .description("Create a detailed implementation plan and GitHub Issue using Opus model")
  .option("-r, --request <text>", "Implementation request (text)")
  .option("-f, --request-file <path>", "Implementation request (file)")
  .option("--repo <path>", "Target repository path", process.cwd())
  .option("--model <model>", "Model to use", "claude-opus-4-5-20251101")
  .option("--dry-run", "Show what would be created without creating")
  .option("--no-interactive", "Non-interactive mode")
  .action(async (opts) => {
    try {
      if (!opts.request && !opts.requestFile) {
        console.error("Error: Either --request or --request-file must be provided");
        process.exit(1);
      }

      const result = await planIssue({
        request: opts.request,
        requestFile: opts.requestFile,
        repo: opts.repo,
        model: opts.model,
        dryRun: opts.dryRun,
        interactive: opts.interactive,
      });

      if (result.issues.length > 0) {
        console.log("\nCreated issues:");
        for (const issue of result.issues) {
          console.log(`  - #${issue.number}`);
          console.log(`    ${issue.url}`);
        }
      }

      console.log(`\nLogs: ${result.logDir}`);
    } catch (error) {
      if (error instanceof AppError) {
        console.error(error.toUserMessage());
      } else if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error("Error:", error);
      }
      process.exit(1);
    }
  });

program
  .command("issue-apply")
  .description("Implement a GitHub Issue using Sonnet model (default)")
  .requiredOption("-i, --issue <ref>", "Issue number or URL")
  .option("--repo <path>", "Target repository path", process.cwd())
  .option("-m, --model <model>", "Model to use (haiku, sonnet, or opus)", "sonnet")
  .option("--draft", "Create PR as draft")
  .option("--no-draft", "Create PR as ready for review (default)")
  .option("--skip-pr", "Skip PR creation")
  .option("--cleanup", "Cleanup worktree and local branch after PR creation", false)
  .option("--cleanup-remote", "Also delete remote branch during cleanup (requires --cleanup)", false)
  .action(async (opts) => {
    try {
      const result = await issueApply({
        issue: opts.issue,
        repo: opts.repo,
        model: opts.model as "haiku" | "sonnet" | "opus",
        draft: opts.draft,
        skipPr: opts.skipPr,
        cleanup: opts.cleanup,
        cleanupRemote: opts.cleanupRemote,
      });

      console.log("\n=== issue-apply completed ===");
      console.log(`Issue: #${result.issue.number} - ${result.issue.title}`);
      console.log(`Branch: ${result.worktree.branch}`);
      console.log(`Changed files: ${result.changedFiles.length}`);

      if (result.pr) {
        console.log(`PR: #${result.pr.number}`);
        console.log(`    ${result.pr.url}`);
      }

      console.log(`\nLogs: ${result.logDir}`);
    } catch (error) {
      if (error instanceof AppError) {
        console.error(error.toUserMessage());
      } else if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error("Error:", error);
      }
      process.exit(1);
    }
  });

program.parse();
