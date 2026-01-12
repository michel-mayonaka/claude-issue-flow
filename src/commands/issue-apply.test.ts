import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { tmpdir } from "os";
import { join } from "path";
import { mkdir, rm } from "fs/promises";

// Mock dependencies
vi.mock("../core/agent.js", () => ({
  runAgent: vi.fn(),
  extractFinalMessage: vi.fn(),
}));

vi.mock("../core/github.js", () => ({
  fetchIssue: vi.fn(),
  createPullRequest: vi.fn(),
}));

vi.mock("../core/worktree.js", () => ({
  createWorktree: vi.fn(),
  commitChanges: vi.fn(),
  pushBranch: vi.fn(),
  getChangedFiles: vi.fn(),
}));

vi.mock("../prompts/skills.js", () => ({
  loadSkills: vi.fn(),
}));

// Import after mocks
import { issueApply } from "./issue-apply.js";
import { runAgent, extractFinalMessage } from "../core/agent.js";
import { fetchIssue, createPullRequest } from "../core/github.js";
import {
  createWorktree,
  commitChanges,
  pushBranch,
  getChangedFiles,
} from "../core/worktree.js";
import { loadSkills } from "../prompts/skills.js";

describe("issueApply", () => {
  let testDir: string;

  const mockIssue = {
    number: 42,
    title: "Test Issue",
    body: "Implement this feature",
    url: "https://github.com/owner/repo/issues/42",
    labels: ["enhancement"],
    assignees: [],
    milestone: null,
    state: "open",
  };

  const mockWorktree = {
    path: "/tmp/worktree",
    branch: "issue-apply-42-123",
    baseBranch: "main",
    repoPath: "/repo",
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    testDir = join(tmpdir(), `issue-apply-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });

    // Suppress console output
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Default mock implementations
    (fetchIssue as ReturnType<typeof vi.fn>).mockResolvedValue(mockIssue);
    (createWorktree as ReturnType<typeof vi.fn>).mockResolvedValue(mockWorktree);
    (loadSkills as ReturnType<typeof vi.fn>).mockResolvedValue("# Skills");
    (getChangedFiles as ReturnType<typeof vi.fn>).mockResolvedValue([
      "src/file.ts",
    ]);
    (commitChanges as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (pushBranch as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (createPullRequest as ReturnType<typeof vi.fn>).mockResolvedValue({
      number: 100,
      url: "https://github.com/owner/repo/pull/100",
      title: "Implement #42",
    });
    (runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      messages: [],
      numTurns: 5,
      costUSD: 0.05,
      durationMs: 5000,
    });
    (extractFinalMessage as ReturnType<typeof vi.fn>).mockReturnValue(`
## 実装レポート
Done!

\`\`\`yaml
pr_title: "Implement feature X"
pr_body: |
  ## 概要
  Implemented feature

  Closes #42
\`\`\`
`);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should fetch issue and create worktree", async () => {
    await issueApply({
      issue: 42,
      repo: testDir,
    });

    expect(fetchIssue).toHaveBeenCalledWith(expect.any(String), 42);
    expect(createWorktree).toHaveBeenCalledWith(
      expect.objectContaining({
        jobName: "issue-apply",
        issueNumber: 42,
      })
    );
  });

  it("should run agent with correct configuration", async () => {
    await issueApply({
      issue: 42,
      repo: testDir,
      model: "haiku",
    });

    expect(runAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-3-5-haiku-20241022",
        permissionMode: "bypassPermissions",
        maxTurns: 500,
      })
    );
  });

  it("should use sonnet model when specified", async () => {
    await issueApply({
      issue: 42,
      repo: testDir,
      model: "sonnet",
    });

    expect(runAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-sonnet-4-5-20250929",
      })
    );
  });

  it("should commit and push changes", async () => {
    await issueApply({
      issue: 42,
      repo: testDir,
    });

    expect(commitChanges).toHaveBeenCalledWith(
      mockWorktree,
      expect.stringContaining("#42")
    );
    expect(pushBranch).toHaveBeenCalledWith(mockWorktree);
  });

  it("should create PR with parsed info", async () => {
    const result = await issueApply({
      issue: 42,
      repo: testDir,
    });

    expect(createPullRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        title: "Implement feature X",
        head: mockWorktree.branch,
        base: mockWorktree.baseBranch,
        draft: true,
      })
    );
    expect(result.pr?.number).toBe(100);
  });

  it("should skip PR creation when skipPr is true", async () => {
    const result = await issueApply({
      issue: 42,
      repo: testDir,
      skipPr: true,
    });

    expect(createPullRequest).not.toHaveBeenCalled();
    expect(result.pr).toBeNull();
  });

  it("should create non-draft PR when draft is false", async () => {
    await issueApply({
      issue: 42,
      repo: testDir,
      draft: false,
    });

    expect(createPullRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        draft: false,
      })
    );
  });

  it("should throw error when agent execution fails", async () => {
    (runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      messages: [],
      numTurns: 1,
      costUSD: 0,
      durationMs: 500,
    });

    await expect(
      issueApply({
        issue: 42,
        repo: testDir,
      })
    ).rejects.toThrow("Issue実装エージェントの実行に失敗しました");
  });

  it("should return without PR when no changes made", async () => {
    (getChangedFiles as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await issueApply({
      issue: 42,
      repo: testDir,
    });

    expect(commitChanges).not.toHaveBeenCalled();
    expect(pushBranch).not.toHaveBeenCalled();
    expect(createPullRequest).not.toHaveBeenCalled();
    expect(result.changedFiles).toHaveLength(0);
    expect(result.pr).toBeNull();
  });

  it("should handle issue URL", async () => {
    await issueApply({
      issue: "https://github.com/owner/repo/issues/42",
      repo: testDir,
    });

    expect(fetchIssue).toHaveBeenCalledWith(
      expect.any(String),
      "https://github.com/owner/repo/issues/42"
    );
  });

  it("should return result with all fields", async () => {
    const result = await issueApply({
      issue: 42,
      repo: testDir,
    });

    expect(result.issue).toEqual(mockIssue);
    expect(result.worktree).toEqual(mockWorktree);
    expect(result.runId).toMatch(/^\d{8}-\d{6}-\d{5}$/);
    expect(result.logDir).toContain("logs");
    expect(result.changedFiles).toEqual(["src/file.ts"]);
    expect(result.pr?.number).toBe(100);
  });

  it("should use default PR info when YAML not found", async () => {
    (extractFinalMessage as ReturnType<typeof vi.fn>).mockReturnValue(
      "Implementation complete without YAML"
    );

    await issueApply({
      issue: 42,
      repo: testDir,
    });

    expect(createPullRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        title: expect.stringContaining("#42"),
        body: expect.stringContaining("Closes #42"),
      })
    );
  });

  it("should load skills for agent prompt", async () => {
    await issueApply({
      issue: 42,
      repo: testDir,
    });

    expect(loadSkills).toHaveBeenCalledWith({
      global: true,
      optional: ["pr-draft"],
    });
  });
});
