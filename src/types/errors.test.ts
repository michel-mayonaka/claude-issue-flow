import { describe, it, expect } from "vitest";
import {
  AppError,
  AgentExecutionError,
  GitHubAPIError,
  WorktreeError,
  ConfigurationError,
  ParseError,
} from "./errors.js";

describe("AppError", () => {
  it("should create an error with code and message", () => {
    const error = new AppError("test message", {
      code: "TEST_ERROR",
      isRetryable: false,
    });
    expect(error.message).toBe("test message");
    expect(error.code).toBe("TEST_ERROR");
    expect(error.isRetryable).toBe(false);
  });

  it("should include suggestion in toUserMessage", () => {
    const error = new AppError("test message", {
      code: "TEST_ERROR",
      suggestion: "Try this",
    });
    const message = error.toUserMessage();
    expect(message).toContain("[TEST_ERROR]");
    expect(message).toContain("test message");
    expect(message).toContain("→ Try this");
  });

  it("should not include suggestion if not provided", () => {
    const error = new AppError("test message", {
      code: "TEST_ERROR",
    });
    const message = error.toUserMessage();
    expect(message).toBe("[TEST_ERROR] test message");
  });
});

describe("AgentExecutionError", () => {
  it("should have correct code and message", () => {
    const error = new AgentExecutionError("agent failed");
    expect(error.code).toBe("AGENT_EXECUTION_ERROR");
    expect(error.message).toBe("agent failed");
    expect(error.isRetryable).toBe(false);
  });
});

describe("GitHubAPIError", () => {
  it("should detect rate limit from status code 403", () => {
    const error = new GitHubAPIError("rate limited", { statusCode: 403 });
    expect(error.code).toBe("GITHUB_RATE_LIMIT");
    expect(error.isRetryable).toBe(true);
  });

  it("should detect rate limit from status code 429", () => {
    const error = new GitHubAPIError("rate limited", { statusCode: 429 });
    expect(error.code).toBe("GITHUB_RATE_LIMIT");
    expect(error.isRetryable).toBe(true);
  });

  it("should use GITHUB_API_ERROR for other status codes", () => {
    const error = new GitHubAPIError("api error", { statusCode: 500 });
    expect(error.code).toBe("GITHUB_API_ERROR");
  });
});

describe("WorktreeError", () => {
  it("should have correct code", () => {
    const error = new WorktreeError("worktree failed");
    expect(error.code).toBe("WORKTREE_ERROR");
    expect(error.isRetryable).toBe(false);
  });
});

describe("ConfigurationError", () => {
  it("should have correct code", () => {
    const error = new ConfigurationError("config error");
    expect(error.code).toBe("CONFIGURATION_ERROR");
    expect(error.isRetryable).toBe(false);
  });

  it("should accept custom suggestion", () => {
    const error = new ConfigurationError("config error", {
      suggestion: "Custom fix",
    });
    expect(error.suggestion).toBe("Custom fix");
  });
});

describe("ParseError", () => {
  it("should have correct code", () => {
    const error = new ParseError("parse failed");
    expect(error.code).toBe("PARSE_ERROR");
    expect(error.isRetryable).toBe(false);
  });
});
