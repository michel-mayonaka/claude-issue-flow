#!/usr/bin/env npx tsx

/**
 * Claude Code hooks用スクリプト
 * ExitPlanMode実行時に呼び出され、計画からGitHub Issueを作成する
 *
 * stdinで受け取るJSON:
 * {
 *   "transcript_path": "/path/to/transcript.jsonl",
 *   "cwd": "/path/to/project",
 *   ...
 * }
 *
 * transcript_pathのJSONLから計画（# 計画: を含むメッセージ）を抽出してIssue作成
 */

import { createIssue } from "../core/github.js";
import { readFileSync } from "fs";

interface HookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_response?: Record<string, unknown>;
}

interface ParsedPlan {
  title: string;
  body: string;
}

function parsePlanFromInput(plan: string): ParsedPlan | null {
  // "# 計画: タイトル" または "# Plan: タイトル" を探す
  const titleMatch = plan.match(/^#\s*(?:計画|Plan):\s*(.+)$/m);
  if (!titleMatch) {
    return null;
  }

  const title = titleMatch[1].trim();

  // タイトル行以降を本文として取得
  const titleIndex = plan.indexOf(titleMatch[0]);
  const body = plan.slice(titleIndex + titleMatch[0].length).trim();

  return { title, body };
}

function extractPlanFromTranscript(transcriptPath: string): string | null {
  // JSONLファイルを読み込み
  const content = readFileSync(transcriptPath, "utf-8");
  const lines = content.trim().split("\n");

  // 後ろから探して、# 計画: を含むassistantメッセージを見つける
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const entry = JSON.parse(lines[i]);

      // assistantメッセージを探す
      if (entry.type === "assistant" && entry.message?.content) {
        for (const block of entry.message.content) {
          if (block.type === "text" && block.text) {
            // # 計画: または # Plan: を含むか確認
            if (/^#\s*(?:計画|Plan):\s*.+$/m.test(block.text)) {
              return block.text;
            }
          }
        }
      }
    } catch {
      // JSON解析エラーは無視
      continue;
    }
  }

  return null;
}

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";

    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
    process.stdin.on("error", reject);
  });
}

async function main() {
  try {
    // stdinからJSON入力を読み取り
    const inputJson = await readStdin();

    if (!inputJson.trim()) {
      console.error("No input received from stdin");
      process.exit(1);
    }

    const input: HookInput = JSON.parse(inputJson);

    // transcriptから計画を抽出
    const planContent = extractPlanFromTranscript(input.transcript_path);

    if (!planContent) {
      console.error("No plan found in transcript (looking for '# 計画:' or '# Plan:')");
      process.exit(1);
    }

    // 計画をパース
    const parsed = parsePlanFromInput(planContent);

    if (!parsed) {
      console.error("Could not parse plan. Expected format: '# 計画: [タイトル]'");
      process.exit(1);
    }

    // Issue作成
    const issue = await createIssue(input.cwd, {
      title: parsed.title,
      body: parsed.body,
      labels: ["plan"],
    });

    // 成功メッセージを出力（Claudeのトランスクリプトに追加される）
    console.log(`GitHub Issue created: #${issue.number} - ${issue.url}`);

    process.exit(0);
  } catch (error) {
    console.error("Failed to create issue:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
