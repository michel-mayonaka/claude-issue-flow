export type { GitHubIssue, IssueCreateData, PRCreateData, PullRequest } from "../core/github.js";
export type { AgentOptions, AgentResult } from "../core/agent.js";
export type { LogEntry } from "../core/logger.js";
export type { WorktreeInfo, WorktreeOptions } from "../core/worktree.js";
export type { PlanIssueOptions, PlanIssueResult } from "../commands/plan-issue.js";
export type { IssueApplyOptions, IssueApplyResult } from "../commands/issue-apply.js";

export interface ParsedPlan {
  title: string;
  body: string;
}

export interface ParsedPRInfo {
  title: string;
  body: string;
}

export interface HookInput {
  transcript_path: string;
  cwd: string;
  [key: string]: unknown;
}
