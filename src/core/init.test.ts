import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setupLogger } from "./init.js";
import { ExecutionLogger } from "./logger.js";
import { mkdtemp, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

describe("setupLogger", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "init-test-"));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it("should create logger and return runId", async () => {
    const result = await setupLogger("test-job", tempDir);

    expect(result).toHaveProperty("logger");
    expect(result).toHaveProperty("runId");
    expect(result.logger).toBeInstanceOf(ExecutionLogger);
    expect(typeof result.runId).toBe("string");
    expect(result.runId).toMatch(/^\d{8}-\d{6}-\d{5}$/);
  });

  it("should initialize logger", async () => {
    const result = await setupLogger("test-job", tempDir);

    const logDir = result.logger.getLogDir();
    expect(logDir).toContain("test-job");
    expect(logDir).toContain(result.runId);
  });

  it("should use absolute path for logs", async () => {
    const result = await setupLogger("test-job", tempDir);

    const logDir = result.logger.getLogDir();
    expect(logDir).toMatch(/^\/|^[A-Z]:\\/);
  });
});
