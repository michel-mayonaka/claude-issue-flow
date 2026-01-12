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

// Helper to create mock assistant message with plan content
function createMockMessages(planContent: string) {
  return [
    {
      type: "assistant",
      message: {
        content: [{ text: planContent }],
      },
    },
  ];
}

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
    ).rejects.toThrow("リクエストが指定されていません");
  });

  it("should read request from file when requestFile provided", async () => {
    const requestFile = join(testDir, "request.txt");
    await writeFile(requestFile, "Implement feature X");

    const planContent = `
\`\`\`markdown
# 計画: Feature X

## 概要
Need feature X

## 変更対象
- \`src/feature.ts\`: 新機能追加
\`\`\`
`;

    (runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      messages: createMockMessages(planContent),
      numTurns: 1,
      costUSD: 0.01,
      durationMs: 1000,
    });

    (extractFinalMessage as ReturnType<typeof vi.fn>).mockReturnValue(planContent);

    (createIssue as ReturnType<typeof vi.fn>).mockResolvedValue({
      number: 1,
      title: "Feature X",
      body: "## 概要\nNeed feature X",
      url: "https://github.com/owner/repo/issues/1",
      labels: [],
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
        allowedTools: expect.arrayContaining(["AskUserQuestion"]),
      })
    );
  });

  it("should use request string when provided", async () => {
    const planContent = `
\`\`\`markdown
# 計画: New Feature

## 概要
Content
\`\`\`
`;

    (runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      messages: createMockMessages(planContent),
      numTurns: 1,
      costUSD: 0.01,
      durationMs: 1000,
    });

    (extractFinalMessage as ReturnType<typeof vi.fn>).mockReturnValue(planContent);

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
    ).rejects.toThrow("計画立案エージェントの実行に失敗しました");
  });

  it("should throw error when no plan found", async () => {
    (runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      messages: createMockMessages("No plan content here"),
      numTurns: 1,
      costUSD: 0.01,
      durationMs: 1000,
    });

    (extractFinalMessage as ReturnType<typeof vi.fn>).mockReturnValue(
      "No plan content here"
    );

    await expect(
      planIssue({
        repo: testDir,
        request: "Some request",
      })
    ).rejects.toThrow("エージェント出力から有効な計画を取得できませんでした");
  });

  it("should skip issue creation in dry run mode", async () => {
    const planContent = `
\`\`\`markdown
# 計画: Dry Run Issue

## 概要
Test content
\`\`\`
`;

    (runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      messages: createMockMessages(planContent),
      numTurns: 1,
      costUSD: 0.01,
      durationMs: 1000,
    });

    (extractFinalMessage as ReturnType<typeof vi.fn>).mockReturnValue(planContent);

    const result = await planIssue({
      repo: testDir,
      request: "Create issue",
      dryRun: true,
    });

    expect(createIssue).not.toHaveBeenCalled();
    expect(result.issues).toHaveLength(0);
  });

  it("should use specified model", async () => {
    const planContent = `
\`\`\`markdown
# 計画: Test

## 概要
Content
\`\`\`
`;

    (runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      messages: createMockMessages(planContent),
      numTurns: 1,
      costUSD: 0.01,
      durationMs: 1000,
    });

    (extractFinalMessage as ReturnType<typeof vi.fn>).mockReturnValue(planContent);

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
    const planContent = `
\`\`\`markdown
# 計画: Test

## 概要
Content
\`\`\`
`;

    (runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      messages: createMockMessages(planContent),
      numTurns: 1,
      costUSD: 0.01,
      durationMs: 1000,
    });

    (extractFinalMessage as ReturnType<typeof vi.fn>).mockReturnValue(planContent);

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
