import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  runAgent,
  extractTextFromMessages,
  extractFinalMessage,
  type SDKMessage,
} from "./agent.js";
import { AgentExecutionError } from "../types/errors.js";

// Mock the @anthropic-ai/claude-agent-sdk module
vi.mock("@anthropic-ai/claude-agent-sdk", () => ({
  query: vi.fn(),
}));

// Mock the logger
vi.mock("./logger.js", () => ({
  ExecutionLogger: vi.fn().mockImplementation(() => ({
    logMessage: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { query } from "@anthropic-ai/claude-agent-sdk";

const mockQuery = vi.mocked(query);

describe("agent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("runAgent", () => {
    it("should return successful result when agent completes", async () => {
      const mockMessages: SDKMessage[] = [
        {
          type: "assistant",
          message: {
            content: [{ type: "text", text: "Hello, I will help you." }],
          },
        } as SDKMessage,
        {
          type: "result",
          subtype: "success",
          result: "Task completed",
          num_turns: 2,
          total_cost_usd: 0.01,
          duration_ms: 1000,
        } as SDKMessage,
      ];

      // Create an async generator that yields the mock messages
      async function* mockGenerator() {
        for (const msg of mockMessages) {
          yield msg;
        }
      }

      mockQuery.mockReturnValue(mockGenerator() as ReturnType<typeof query>);

      const result = await runAgent({
        prompt: "Test prompt",
        cwd: "/tmp",
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe("Task completed");
      expect(result.numTurns).toBe(2);
      expect(result.costUSD).toBe(0.01);
      expect(result.durationMs).toBe(1000);
      expect(result.messages).toHaveLength(2);
    });

    it("should return failed result when agent fails", async () => {
      const mockMessages: SDKMessage[] = [
        {
          type: "result",
          subtype: "error_max_turns",
          result: "",
          num_turns: 1,
          total_cost_usd: 0.005,
          duration_ms: 500,
        } as unknown as SDKMessage,
      ];

      async function* mockGenerator() {
        for (const msg of mockMessages) {
          yield msg;
        }
      }

      mockQuery.mockReturnValue(mockGenerator() as ReturnType<typeof query>);

      const result = await runAgent({
        prompt: "Test prompt",
        cwd: "/tmp",
      });

      expect(result.success).toBe(false);
    });

    it("should throw AgentExecutionError when query throws", async () => {
      mockQuery.mockImplementation(() => {
        throw new Error("Network error");
      });

      await expect(
        runAgent({
          prompt: "Test prompt",
          cwd: "/tmp",
        })
      ).rejects.toThrow(AgentExecutionError);
    });

    it("should pass options to query", async () => {
      const mockMessages: SDKMessage[] = [
        {
          type: "result",
          subtype: "success",
          result: "",
          num_turns: 1,
          total_cost_usd: 0.01,
          duration_ms: 100,
        } as SDKMessage,
      ];

      async function* mockGenerator() {
        for (const msg of mockMessages) {
          yield msg;
        }
      }

      mockQuery.mockReturnValue(mockGenerator() as ReturnType<typeof query>);

      await runAgent({
        prompt: "Test prompt",
        cwd: "/test/path",
        model: "claude-sonnet-4-5-20250929",
        permissionMode: "bypassPermissions",
        allowedTools: ["Read", "Write"],
        maxTurns: 100,
      });

      expect(mockQuery).toHaveBeenCalledWith({
        prompt: "Test prompt",
        options: {
          cwd: "/test/path",
          model: "claude-sonnet-4-5-20250929",
          permissionMode: "bypassPermissions",
          allowedTools: ["Read", "Write"],
          maxTurns: 100,
        },
      });
    });

    it("should use default values for optional parameters", async () => {
      const mockMessages: SDKMessage[] = [
        {
          type: "result",
          subtype: "success",
          result: "",
          num_turns: 1,
          total_cost_usd: 0.01,
          duration_ms: 100,
        } as SDKMessage,
      ];

      async function* mockGenerator() {
        for (const msg of mockMessages) {
          yield msg;
        }
      }

      mockQuery.mockReturnValue(mockGenerator() as ReturnType<typeof query>);

      await runAgent({
        prompt: "Test",
        cwd: "/tmp",
      });

      expect(mockQuery).toHaveBeenCalledWith({
        prompt: "Test",
        options: expect.objectContaining({
          permissionMode: "default",
          maxTurns: 500,
        }),
      });
    });
  });

  describe("extractTextFromMessages", () => {
    it("should extract text from assistant messages", () => {
      const messages: SDKMessage[] = [
        {
          type: "assistant",
          message: {
            content: [
              { type: "text", text: "First message" },
              { type: "text", text: "Second part" },
            ],
          },
        } as SDKMessage,
        {
          type: "assistant",
          message: {
            content: [{ type: "text", text: "Third message" }],
          },
        } as SDKMessage,
      ];

      const result = extractTextFromMessages(messages);

      expect(result).toBe("First message\n\nSecond part\n\nThird message");
    });

    it("should ignore non-assistant messages", () => {
      const messages: SDKMessage[] = [
        {
          type: "user",
          message: { content: [{ type: "text", text: "User message" }] },
        } as SDKMessage,
        {
          type: "assistant",
          message: { content: [{ type: "text", text: "Assistant message" }] },
        } as SDKMessage,
        {
          type: "result",
          subtype: "success",
        } as SDKMessage,
      ];

      const result = extractTextFromMessages(messages);

      expect(result).toBe("Assistant message");
    });

    it("should ignore non-text content blocks", () => {
      const messages: SDKMessage[] = [
        {
          type: "assistant",
          message: {
            content: [
              { type: "tool_use", id: "123", name: "Read" },
              { type: "text", text: "Text content" },
            ],
          },
        } as SDKMessage,
      ];

      const result = extractTextFromMessages(messages);

      expect(result).toBe("Text content");
    });

    it("should return empty string for empty messages", () => {
      const result = extractTextFromMessages([]);
      expect(result).toBe("");
    });
  });

  describe("extractFinalMessage", () => {
    it("should extract the last assistant message with text", () => {
      const messages: SDKMessage[] = [
        {
          type: "assistant",
          message: { content: [{ type: "text", text: "First" }] },
        } as SDKMessage,
        {
          type: "assistant",
          message: { content: [{ type: "text", text: "Second" }] },
        } as SDKMessage,
        {
          type: "result",
          subtype: "success",
        } as SDKMessage,
      ];

      const result = extractFinalMessage(messages);

      expect(result).toBe("Second");
    });

    it("should skip messages with empty or whitespace text", () => {
      const messages: SDKMessage[] = [
        {
          type: "assistant",
          message: { content: [{ type: "text", text: "Valid message" }] },
        } as SDKMessage,
        {
          type: "assistant",
          message: { content: [{ type: "text", text: "   " }] },
        } as SDKMessage,
      ];

      const result = extractFinalMessage(messages);

      expect(result).toBe("Valid message");
    });

    it("should return empty string if no text messages found", () => {
      const messages: SDKMessage[] = [
        {
          type: "result",
          subtype: "success",
        } as SDKMessage,
      ];

      const result = extractFinalMessage(messages);

      expect(result).toBe("");
    });

    it("should return empty string for empty array", () => {
      const result = extractFinalMessage([]);
      expect(result).toBe("");
    });
  });
});
