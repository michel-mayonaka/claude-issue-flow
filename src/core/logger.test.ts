import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ExecutionLogger, generateRunId } from "./logger.js";
import { readFile, rm, stat } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

describe("generateRunId", () => {
  it("should generate ID in correct format", () => {
    const id = generateRunId();

    // Format: YYYYMMDD-HHMMSS-XXXXX
    expect(id).toMatch(/^\d{8}-\d{6}-\d{5}$/);
  });

  it("should generate unique IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateRunId());
    }
    // Most should be unique (timing collision possible but rare)
    expect(ids.size).toBeGreaterThan(90);
  });
});

describe("ExecutionLogger", () => {
  let testDir: string;
  let logger: ExecutionLogger;

  beforeEach(() => {
    testDir = join(tmpdir(), `logger-test-${Date.now()}`);
    logger = new ExecutionLogger("test-job", "test-run-123", testDir);
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("init", () => {
    it("should create log directory", async () => {
      await logger.init();

      const logDir = logger.getLogDir();
      const stats = await stat(logDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it("should be idempotent", async () => {
      await logger.init();
      await logger.init();
      await logger.init();

      const logDir = logger.getLogDir();
      const stats = await stat(logDir);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe("getLogDir", () => {
    it("should return correct path", () => {
      const logDir = logger.getLogDir();
      expect(logDir).toBe(join(testDir, "test-job", "test-run-123"));
    });
  });

  describe("logging methods", () => {
    beforeEach(() => {
      vi.spyOn(console, "log").mockImplementation(() => {});
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should write info log to file", async () => {
      await logger.info("Test info message");

      const logFile = join(logger.getLogDir(), "execution.log");
      const content = await readFile(logFile, "utf-8");

      expect(content).toContain("[INFO] Test info message");
      expect(console.log).toHaveBeenCalled();
    });

    it("should write warn log to file", async () => {
      await logger.warn("Test warning");

      const logFile = join(logger.getLogDir(), "execution.log");
      const content = await readFile(logFile, "utf-8");

      expect(content).toContain("[WARN] Test warning");
      expect(console.warn).toHaveBeenCalled();
    });

    it("should write error log to file", async () => {
      await logger.error("Test error");

      const logFile = join(logger.getLogDir(), "execution.log");
      const content = await readFile(logFile, "utf-8");

      expect(content).toContain("[ERROR] Test error");
      expect(console.error).toHaveBeenCalled();
    });

    it("should include data when provided", async () => {
      await logger.info("With data", { key: "value", count: 42 });

      const logFile = join(logger.getLogDir(), "execution.log");
      const content = await readFile(logFile, "utf-8");

      expect(content).toContain("With data");
      expect(content).toContain('"key": "value"');
      expect(content).toContain('"count": 42');
    });
  });

  describe("logMessage", () => {
    it("should append messages to JSONL file", async () => {
      await logger.logMessage({ role: "user", content: "Hello" });
      await logger.logMessage({ role: "assistant", content: "Hi" });

      const msgFile = join(logger.getLogDir(), "messages.jsonl");
      const content = await readFile(msgFile, "utf-8");
      const lines = content.trim().split("\n");

      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0])).toEqual({ role: "user", content: "Hello" });
      expect(JSON.parse(lines[1])).toEqual({ role: "assistant", content: "Hi" });
    });
  });

  describe("saveJson", () => {
    it("should save JSON to file", async () => {
      const data = { name: "test", values: [1, 2, 3] };
      await logger.saveJson("custom.json", data);

      const file = join(logger.getLogDir(), "custom.json");
      const content = await readFile(file, "utf-8");

      expect(JSON.parse(content)).toEqual(data);
    });
  });

  describe("saveText", () => {
    it("should save plain text to file", async () => {
      const text = "Hello\nWorld\nTest";
      await logger.saveText("output.txt", text);

      const file = join(logger.getLogDir(), "output.txt");
      const content = await readFile(file, "utf-8");

      expect(content).toBe(text);
    });
  });

  describe("convenience methods", () => {
    it("should save issue JSON", async () => {
      const issue = { number: 123, title: "Test" };
      await logger.logIssue(issue);

      const file = join(logger.getLogDir(), "issue.json");
      const content = await readFile(file, "utf-8");
      expect(JSON.parse(content)).toEqual(issue);
    });

    it("should save worktree JSON", async () => {
      const worktree = { path: "/tmp/wt", branch: "feature" };
      await logger.logWorktree(worktree);

      const file = join(logger.getLogDir(), "worktree.json");
      const content = await readFile(file, "utf-8");
      expect(JSON.parse(content)).toEqual(worktree);
    });

    it("should save PR JSON", async () => {
      const pr = { number: 456, url: "https://github.com/..." };
      await logger.logPR(pr);

      const file = join(logger.getLogDir(), "pr.json");
      const content = await readFile(file, "utf-8");
      expect(JSON.parse(content)).toEqual(pr);
    });

    it("should save result JSON", async () => {
      const result = { success: true, files: ["a.ts", "b.ts"] };
      await logger.logResult(result);

      const file = join(logger.getLogDir(), "result.json");
      const content = await readFile(file, "utf-8");
      expect(JSON.parse(content)).toEqual(result);
    });
  });

  describe("getExecutionLog", () => {
    beforeEach(() => {
      vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should return execution log content", async () => {
      await logger.info("Test message 1");
      await logger.info("Test message 2");

      const log = await logger.getExecutionLog();

      expect(log).toContain("Test message 1");
      expect(log).toContain("Test message 2");
    });

    it("should return empty string when log file not found", async () => {
      const freshLogger = new ExecutionLogger("test", "nonexistent", testDir);
      const log = await freshLogger.getExecutionLog();

      expect(log).toBe("");
    });
  });

  describe("getPrompt", () => {
    it("should return prompt content", async () => {
      const promptText = "This is a test prompt\nwith multiple lines";
      await logger.saveText("prompt.txt", promptText);

      const prompt = await logger.getPrompt();

      expect(prompt).toBe(promptText);
    });

    it("should return empty string when prompt file not found", async () => {
      const freshLogger = new ExecutionLogger("test", "nonexistent", testDir);
      const prompt = await freshLogger.getPrompt();

      expect(prompt).toBe("");
    });
  });
});
