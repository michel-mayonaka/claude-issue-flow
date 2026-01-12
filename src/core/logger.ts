import { mkdir, appendFile, writeFile } from "fs/promises";
import { join } from "path";

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  data?: unknown;
}

export class ExecutionLogger {
  private logDir: string;
  private initialized = false;

  constructor(
    private jobName: string,
    private runId: string,
    logsRoot: string = "./logs"
  ) {
    this.logDir = join(logsRoot, jobName, runId);
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    await mkdir(this.logDir, { recursive: true });
    this.initialized = true;
  }

  private formatLog(entry: LogEntry): string {
    const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
    if (entry.data) {
      return `${base}\n${JSON.stringify(entry.data, null, 2)}`;
    }
    return base;
  }

  private async log(
    level: LogEntry["level"],
    message: string,
    data?: unknown
  ): Promise<void> {
    await this.init();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    // Console output
    const formatted = this.formatLog(entry);
    if (level === "error") {
      console.error(formatted);
    } else if (level === "warn") {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }

    // File output
    await appendFile(
      join(this.logDir, "execution.log"),
      formatted + "\n"
    );
  }

  async info(message: string, data?: unknown): Promise<void> {
    await this.log("info", message, data);
  }

  async warn(message: string, data?: unknown): Promise<void> {
    await this.log("warn", message, data);
  }

  async error(message: string, data?: unknown): Promise<void> {
    await this.log("error", message, data);
  }

  async debug(message: string, data?: unknown): Promise<void> {
    await this.log("debug", message, data);
  }

  async logMessage(message: unknown): Promise<void> {
    await this.init();
    await appendFile(
      join(this.logDir, "messages.jsonl"),
      JSON.stringify(message) + "\n"
    );
  }

  async saveJson(filename: string, data: unknown): Promise<void> {
    await this.init();
    await writeFile(
      join(this.logDir, filename),
      JSON.stringify(data, null, 2)
    );
  }

  async saveText(filename: string, content: string): Promise<void> {
    await this.init();
    await writeFile(join(this.logDir, filename), content);
  }

  async logIssue(issue: unknown): Promise<void> {
    await this.saveJson("issue.json", issue);
  }

  async logWorktree(worktree: unknown): Promise<void> {
    await this.saveJson("worktree.json", worktree);
  }

  async logPR(pr: unknown): Promise<void> {
    await this.saveJson("pr.json", pr);
  }

  async logResult(result: unknown): Promise<void> {
    await this.saveJson("result.json", result);
  }

  getLogDir(): string {
    return this.logDir;
  }
}

export function generateRunId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toISOString().slice(11, 19).replace(/:/g, "");
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `${date}-${time}-${random}`;
}
