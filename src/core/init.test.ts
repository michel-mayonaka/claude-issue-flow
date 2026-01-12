import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setupLogger } from "./init.js";
import { ExecutionLogger } from "./logger.js";

// Mock logger module
vi.mock("./logger.js", () => ({
  ExecutionLogger: vi.fn(),
  generateRunId: vi.fn(() => "test-run-id-123"),
}));

describe("setupLogger", () => {
  const mockInit = vi.fn();
  const MockExecutionLogger = ExecutionLogger as any;

  beforeEach(() => {
    vi.clearAllMocks();
    MockExecutionLogger.mockImplementation(function(this: any, jobName: string, runId: string, logPath: string) {
      this.jobName = jobName;
      this.runId = runId;
      this.logPath = logPath;
      this.init = mockInit;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create logger with correct parameters", async () => {
    const result = await setupLogger("test-job", "/test/repo");

    expect(MockExecutionLogger).toHaveBeenCalledWith(
      "test-job",
      "test-run-id-123",
      "/test/repo/logs"
    );
    expect(mockInit).toHaveBeenCalled();
    expect(result.runId).toBe("test-run-id-123");
    expect(result.logger).toBeInstanceOf(MockExecutionLogger);
  });

  it("should resolve relative repo paths", async () => {
    await setupLogger("test-job", "relative/path");

    expect(MockExecutionLogger).toHaveBeenCalledWith(
      "test-job",
      "test-run-id-123",
      expect.stringMatching(/.*relative\/path\/logs$/)
    );
  });
});