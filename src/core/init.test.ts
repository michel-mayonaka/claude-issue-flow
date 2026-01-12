import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setupLogger } from "./init.js";
import { ExecutionLogger } from "./logger.js";
import { rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

describe("setupLogger", () => {
  const testDir = join(tmpdir(), "init-test-" + Date.now());

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
    }
  });

  it("should create logger and return runId", async () => {
    const { logger, runId } = await setupLogger("test-job", testDir);

    expect(logger).toBeInstanceOf(ExecutionLogger);
    expect(runId).toMatch(/^\d{8}-\d{6}-\d+$/);
  });

  it("should initialize logger with correct job name", async () => {
    const { logger } = await setupLogger("my-job", testDir);

    expect(logger.getLogDir()).toContain("my-job");
  });
});
