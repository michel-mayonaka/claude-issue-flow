import {
  query,
  type Options,
  type SDKMessage,
  type SDKResultMessage,
  type SDKAssistantMessage,
  type PermissionMode,
} from "@anthropic-ai/claude-agent-sdk";
import { ExecutionLogger } from "./logger.js";
import { AgentExecutionError } from "../types/errors.js";

export interface AgentOptions {
  prompt: string;
  cwd: string;
  model?: string;
  permissionMode?: PermissionMode;
  allowedTools?: string[];
  maxTurns?: number;
  logger?: ExecutionLogger;
  appendSystemPrompt?: string;
}

export interface AgentResult {
  success: boolean;
  result: string;
  numTurns: number;
  costUSD: number;
  durationMs: number;
  messages: SDKMessage[];
}

export async function runAgent(options: AgentOptions): Promise<AgentResult> {
  try {
    const queryOptions: Options = {
      cwd: options.cwd,
      model: options.model,
      permissionMode: options.permissionMode ?? "default",
      allowedTools: options.allowedTools,
      maxTurns: options.maxTurns ?? 500,
      systemPrompt: options.appendSystemPrompt
        ? { type: "preset", preset: "claude_code", append: options.appendSystemPrompt }
        : undefined,
    };

    const messages: SDKMessage[] = [];
    let result: AgentResult = {
      success: false,
      result: "",
      numTurns: 0,
      costUSD: 0,
      durationMs: 0,
      messages: [],
    };

    const response = query({ prompt: options.prompt, options: queryOptions });

    for await (const message of response) {
      messages.push(message);

      // Log message if logger is provided
      if (options.logger) {
        await options.logger.logMessage(message);
      }

      // Handle different message types
      if (message.type === "result") {
        const resultMsg = message as SDKResultMessage;
        result = {
          success: resultMsg.subtype === "success",
          result: "result" in resultMsg ? resultMsg.result : "",
          numTurns: resultMsg.num_turns,
          costUSD: resultMsg.total_cost_usd,
          durationMs: resultMsg.duration_ms,
          messages,
        };
      }
    }

    return result;
  } catch (error) {
    throw new AgentExecutionError(
      "エージェントの実行に失敗しました",
      { cause: error instanceof Error ? error : undefined }
    );
  }
}

export function extractTextFromMessages(messages: SDKMessage[]): string {
  const textParts: string[] = [];

  for (const message of messages) {
    if (message.type === "assistant") {
      const assistantMsg = message as SDKAssistantMessage;
      for (const block of assistantMsg.message.content) {
        if ("text" in block) {
          textParts.push(block.text);
        }
      }
    }
  }

  return textParts.join("\n\n");
}

export function extractFinalMessage(messages: SDKMessage[]): string {
  // Find the last assistant message with text content
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.type === "assistant") {
      const assistantMsg = message as SDKAssistantMessage;
      for (const block of assistantMsg.message.content) {
        if ("text" in block && block.text.trim()) {
          return block.text;
        }
      }
    }
  }
  return "";
}

export { query, type Options, type SDKMessage, type PermissionMode };
