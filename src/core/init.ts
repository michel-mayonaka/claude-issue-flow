import { resolve } from "node:path";
import { ExecutionLogger, generateRunId } from "./logger.js";

export async function setupLogger(
  jobName: string,
  repoPath: string
): Promise<{ logger: ExecutionLogger; runId: string }> {
  const runId = generateRunId();
  const absolutePath = resolve(repoPath);
  const logger = new ExecutionLogger(
    jobName,
    runId,
    resolve(absolutePath, "logs")
  );
  await logger.init();
  return { logger, runId };
}
