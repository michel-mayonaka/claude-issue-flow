import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { setupLogger } from "./init.js";

describe("setupLogger", () => {
  const testDir = join(tmpdir(), "init-test");
  const repoPath = join(testDir, "test-repo");

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(repoPath, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("should create logger with generated runId", async () => {
    const { logger, runId } = await setupLogger("test-job", repoPath);

    expect(logger).toBeDefined();
    expect(runId).toBeDefined();
    expect(typeof runId).toBe("string");
    expect(runId.length).toBeGreaterThan(0);
  });

  it("should create logs directory", async () => {
    const { logger } = await setupLogger("test-job", repoPath);

    const logDir = logger.getLogDir();
    expect(existsSync(logDir)).toBe(true);
  });

  it("should generate different runIds for multiple calls", async () => {
    const { runId: runId1 } = await setupLogger("test-job", repoPath);
    const { runId: runId2 } = await setupLogger("test-job", repoPath);

    expect(runId1).not.toBe(runId2);
  });

  it("should handle relative path", async () => {
    const { logger, runId } = await setupLogger("test-job", ".");

    expect(logger).toBeDefined();
    expect(runId).toBeDefined();
  });
});
