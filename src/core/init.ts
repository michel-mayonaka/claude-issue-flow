import { resolve } from "node:path";
import { ExecutionLogger, generateRunId } from "./logger.js";

export async function setupLogger(
  jobName: string,
  repoPath: string
): Promise<{ logger: ExecutionLogger; runId: string; logsRoot: string }> {
  const runId = generateRunId();
  const absolutePath = resolve(repoPath);
  const logsRoot = resolve(absolutePath, "logs");
  const logger = new ExecutionLogger(
    jobName,
    runId,
    logsRoot
  );
  await logger.init();
  return { logger, runId, logsRoot };
}