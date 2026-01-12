import { AppError } from "../types/errors.js";

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown) => boolean;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
    shouldRetry = defaultShouldRetry,
  } = options;

  let lastError: unknown;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      console.warn(
        `Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms...`
      );
      await sleep(delay);
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError;
}

function defaultShouldRetry(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isRetryable;
  }
  if (isOctokitError(error)) {
    const status = error.status;
    return status === 429 || status === 503 || status === 502;
  }
  if (error instanceof Error) {
    return (
      error.message.includes("ECONNRESET") ||
      error.message.includes("ETIMEDOUT") ||
      error.message.includes("ENOTFOUND")
    );
  }
  return false;
}

function isOctokitError(error: unknown): error is { status: number } {
  return typeof error === "object" && error !== null && "status" in error;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
