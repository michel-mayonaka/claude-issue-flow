#!/usr/bin/env node

import { program } from "commander";
import { planIssue } from "./commands/plan-issue.js";
import { issueApply } from "./commands/issue-apply.js";

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
          console.log(`  - #${issue.number}: ${issue.url}`);
        }
      }

      console.log(`\nLogs: ${result.logDir}`);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command("issue-apply")
  .description("Implement a GitHub Issue using Haiku/Sonnet model")
  .requiredOption("-i, --issue <ref>", "Issue number or URL")
  .option("--repo <path>", "Target repository path", process.cwd())
  .option("-m, --model <model>", "Model to use (haiku or sonnet)", "haiku")
  .option("--draft", "Create PR as draft", true)
  .option("--no-draft", "Create PR as ready for review")
  .option("--skip-pr", "Skip PR creation")
  .action(async (opts) => {
    try {
      const result = await issueApply({
        issue: opts.issue,
        repo: opts.repo,
        model: opts.model as "haiku" | "sonnet",
        draft: opts.draft,
        skipPr: opts.skipPr,
      });

      console.log("\n=== issue-apply completed ===");
      console.log(`Issue: #${result.issue.number} - ${result.issue.title}`);
      console.log(`Branch: ${result.worktree.branch}`);
      console.log(`Changed files: ${result.changedFiles.length}`);

      if (result.pr) {
        console.log(`PR: #${result.pr.number} - ${result.pr.url}`);
      }

      console.log(`\nLogs: ${result.logDir}`);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
