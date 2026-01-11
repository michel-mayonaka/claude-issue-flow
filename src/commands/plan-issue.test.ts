import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { tmpdir } from "os";
import { join } from "path";
import { mkdir, writeFile, rm } from "fs/promises";

// Mock dependencies
vi.mock("../core/agent.js", () => ({
  runAgent: vi.fn(),
  extractFinalMessage: vi.fn(),
}));

vi.mock("../core/github.js", () => ({
  createIssue: vi.fn(),
}));

// Import after mocks
import { planIssue } from "./plan-issue.js";
import { runAgent, extractFinalMessage } from "../core/agent.js";
import { createIssue } from "../core/github.js";

describe("planIssue", () => {
  let testDir: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    testDir = join(tmpdir(), `plan-issue-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });

    // Suppress console output during tests
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should throw error when neither request nor requestFile provided", async () => {
    await expect(
      planIssue({
        repo: testDir,
      })
    ).rejects.toThrow("Either --request or --request-file must be provided");
  });

  it("should read request from file when requestFile provided", async () => {
    const requestFile = join(testDir, "request.txt");
    await writeFile(requestFile, "Implement feature X");

    (runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      messages: [],
      numTurns: 1,
      costUSD: 0.01,
      durationMs: 1000,
    });

    (extractFinalMessage as ReturnType<typeof vi.fn>).mockReturnValue(`
\`\`\`yaml
title: "Feature X"
body: |
  ## 背景
  Need feature X
labels:
  - enhancement
assignees: []
\`\`\`
`);

    (createIssue as ReturnType<typeof vi.fn>).mockResolvedValue({
      number: 1,
      title: "Feature X",
      body: "## 背景\nNeed feature X",
      url: "https://github.com/owner/repo/issues/1",
      labels: ["enhancement"],
      assignees: [],
      milestone: null,
      state: "open",
    });

    await planIssue({
      repo: testDir,
      requestFile,
    });

    expect(runAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Implement feature X"),
        permissionMode: "plan",
      })
    );
  });

  it("should use request string when provided", async () => {
    (runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      messages: [],
      numTurns: 1,
      costUSD: 0.01,
      durationMs: 1000,
    });

    (extractFinalMessage as ReturnType<typeof vi.fn>).mockReturnValue(`
\`\`\`yaml
title: "New Feature"
body: |
  Content
labels: []
assignees: []
\`\`\`
`);

    (createIssue as ReturnType<typeof vi.fn>).mockResolvedValue({
      number: 2,
      title: "New Feature",
      body: "Content",
      url: "https://github.com/owner/repo/issues/2",
      labels: [],
      assignees: [],
      milestone: null,
      state: "open",
    });

    const result = await planIssue({
      repo: testDir,
      request: "Build new feature",
    });

    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].number).toBe(2);
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
      planIssue({
        repo: testDir,
        request: "Some request",
      })
    ).rejects.toThrow("Agent execution failed");
  });

  it("should throw error when no issue YAML found", async () => {
    (runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      messages: [],
      numTurns: 1,
      costUSD: 0.01,
      durationMs: 1000,
    });

    (extractFinalMessage as ReturnType<typeof vi.fn>).mockReturnValue(
      "No YAML content here"
    );

    await expect(
      planIssue({
        repo: testDir,
        request: "Some request",
      })
    ).rejects.toThrow("No valid issue YAML found in agent output");
  });

  it("should skip issue creation in dry run mode", async () => {
    (runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      messages: [],
      numTurns: 1,
      costUSD: 0.01,
      durationMs: 1000,
    });

    (extractFinalMessage as ReturnType<typeof vi.fn>).mockReturnValue(`
\`\`\`yaml
title: "Dry Run Issue"
body: |
  Test content
labels:
  - test
assignees: []
\`\`\`
`);

    const result = await planIssue({
      repo: testDir,
      request: "Create issue",
      dryRun: true,
    });

    expect(createIssue).not.toHaveBeenCalled();
    expect(result.issues).toHaveLength(0);
  });

  it("should create multiple issues from output", async () => {
    (runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      messages: [],
      numTurns: 1,
      costUSD: 0.02,
      durationMs: 2000,
    });

    (extractFinalMessage as ReturnType<typeof vi.fn>).mockReturnValue(`
\`\`\`yaml
title: "Issue 1"
body: |
  First issue
labels:
  - bug
assignees: []
\`\`\`

\`\`\`yaml
title: "Issue 2"
body: |
  Second issue
labels:
  - enhancement
assignees: []
\`\`\`
`);

    (createIssue as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        number: 10,
        title: "Issue 1",
        body: "First issue",
        url: "https://github.com/owner/repo/issues/10",
        labels: ["bug"],
        assignees: [],
        milestone: null,
        state: "open",
      })
      .mockResolvedValueOnce({
        number: 11,
        title: "Issue 2",
        body: "Second issue",
        url: "https://github.com/owner/repo/issues/11",
        labels: ["enhancement"],
        assignees: [],
        milestone: null,
        state: "open",
      });

    const result = await planIssue({
      repo: testDir,
      request: "Create multiple issues",
    });

    expect(createIssue).toHaveBeenCalledTimes(2);
    expect(result.issues).toHaveLength(2);
    expect(result.issues[0].number).toBe(10);
    expect(result.issues[1].number).toBe(11);
  });

  it("should use specified model", async () => {
    (runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      messages: [],
      numTurns: 1,
      costUSD: 0.01,
      durationMs: 1000,
    });

    (extractFinalMessage as ReturnType<typeof vi.fn>).mockReturnValue(`
\`\`\`yaml
title: "Test"
body: |
  Content
labels: []
assignees: []
\`\`\`
`);

    (createIssue as ReturnType<typeof vi.fn>).mockResolvedValue({
      number: 1,
      title: "Test",
      body: "Content",
      url: "https://github.com/owner/repo/issues/1",
      labels: [],
      assignees: [],
      milestone: null,
      state: "open",
    });

    await planIssue({
      repo: testDir,
      request: "Test",
      model: "custom-model",
    });

    expect(runAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "custom-model",
      })
    );
  });

  it("should return logDir in result", async () => {
    (runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      messages: [],
      numTurns: 1,
      costUSD: 0.01,
      durationMs: 1000,
    });

    (extractFinalMessage as ReturnType<typeof vi.fn>).mockReturnValue(`
\`\`\`yaml
title: "Test"
body: |
  Content
labels: []
assignees: []
\`\`\`
`);

    (createIssue as ReturnType<typeof vi.fn>).mockResolvedValue({
      number: 1,
      title: "Test",
      body: "Content",
      url: "https://github.com/owner/repo/issues/1",
      labels: [],
      assignees: [],
      milestone: null,
      state: "open",
    });

    const result = await planIssue({
      repo: testDir,
      request: "Test",
    });

    expect(result.logDir).toContain("logs");
    expect(result.logDir).toContain("plan-issue");
    expect(result.runId).toMatch(/^\d{8}-\d{6}-\d{5}$/);
  });
});
