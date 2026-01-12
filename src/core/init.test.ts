import { describe, it, expect } from "vitest";
import { setupLogger } from "./init.js";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";

describe("init", () => {
  describe("setupLogger", () => {
    it("should create logger with generated runId", async () => {
      const repoPath = "/tmp/test-repo";
      const { logger, runId } = await setupLogger("test-job", repoPath);

      expect(logger).toBeDefined();
      expect(runId).toBeDefined();
      expect(typeof runId).toBe("string");
      expect(runId).toMatch(/^\d{8}-\d{6}-\d{5}$/);

      const logDir = logger.getLogDir();
      expect(logDir).toContain("logs/test-job");
      expect(logDir).toContain(runId);

      if (existsSync(resolve(repoPath, "logs"))) {
        await rm(resolve(repoPath, "logs"), { recursive: true, force: true });
      }
    });

    it("should resolve relative paths to absolute paths", async () => {
      const repoPath = "./test-repo";
      const { logger } = await setupLogger("test-job", repoPath);

      const logDir = logger.getLogDir();
      expect(logDir).toMatch(/^\/.*\/logs\/test-job/);

      const absolutePath = resolve(repoPath);
      if (existsSync(resolve(absolutePath, "logs"))) {
        await rm(resolve(absolutePath, "logs"), { recursive: true, force: true });
      }
    });
  });
});
