import { describe, it, expect, vi } from "vitest";
import { withRetry } from "./retry.js";
import { AppError } from "../types/errors.js";

describe("withRetry", () => {
  it("should return result on first success", async () => {
    const operation = vi.fn().mockResolvedValue("success");
    const result = await withRetry(operation);
    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure and succeed", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("success");

    const result = await withRetry(operation, {
      initialDelayMs: 10,
      shouldRetry: () => true,
    });
    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("should throw after max attempts", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("fail"));

    await expect(
      withRetry(operation, {
        maxAttempts: 2,
        initialDelayMs: 10,
        shouldRetry: () => true,
      })
    ).rejects.toThrow("fail");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("should not retry if shouldRetry returns false", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("fail"));

    await expect(
      withRetry(operation, {
        shouldRetry: () => false,
        maxAttempts: 3,
      })
    ).rejects.toThrow("fail");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("should retry AppError with isRetryable=true", async () => {
    const retryableError = new AppError("retryable", {
      code: "TEST",
      isRetryable: true,
    });
    const operation = vi
      .fn()
      .mockRejectedValueOnce(retryableError)
      .mockResolvedValue("success");

    const result = await withRetry(operation, { initialDelayMs: 10 });
    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("should not retry AppError with isRetryable=false", async () => {
    const nonRetryableError = new AppError("not retryable", {
      code: "TEST",
      isRetryable: false,
    });
    const operation = vi.fn().mockRejectedValue(nonRetryableError);

    await expect(
      withRetry(operation, { maxAttempts: 3, initialDelayMs: 10 })
    ).rejects.toThrow("not retryable");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("should retry on Octokit 429 status", async () => {
    const octokitError = { status: 429 };
    const operation = vi
      .fn()
      .mockRejectedValueOnce(octokitError)
      .mockResolvedValue("success");

    const result = await withRetry(operation, { initialDelayMs: 10 });
    expect(result).toBe("success");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("should apply exponential backoff", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("success");

    const startTime = Date.now();
    await withRetry(operation, {
      initialDelayMs: 100,
      backoffMultiplier: 2,
      shouldRetry: () => true,
    });
    const duration = Date.now() - startTime;

    expect(duration).toBeGreaterThanOrEqual(300);
    expect(operation).toHaveBeenCalledTimes(3);
  });
});
