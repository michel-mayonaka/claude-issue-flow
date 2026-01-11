import { describe, it, expect, vi, beforeEach } from "vitest";
import { writeFileSync, unlinkSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// パース関数をテスト用にエクスポートするため、関数を抽出
// 実際のcreate-issue.tsはstdin依存なので、ロジック部分だけテスト

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
  const { readFileSync } = require("fs");
  const content = readFileSync(transcriptPath, "utf-8");
  const lines = content.trim().split("\n");

  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const entry = JSON.parse(lines[i]);
      if (entry.type === "assistant" && entry.message?.content) {
        for (const block of entry.message.content) {
          if (block.type === "text" && block.text) {
            if (/^#\s*(?:計画|Plan):\s*.+$/m.test(block.text)) {
              return block.text;
            }
          }
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

describe("parsePlanFromInput", () => {
  it("should parse plan with Japanese prefix", () => {
    const plan = `# 計画: コード構造の整理

## 概要
コードを整理する

## 変更対象
- \`src/index.ts\`: リファクタリング
`;

    const result = parsePlanFromInput(plan);

    expect(result).not.toBeNull();
    expect(result!.title).toBe("コード構造の整理");
    expect(result!.body).toContain("## 概要");
    expect(result!.body).toContain("コードを整理する");
  });

  it("should parse plan with English prefix", () => {
    const plan = `# Plan: Refactoring

## Overview
Clean up code
`;

    const result = parsePlanFromInput(plan);

    expect(result).not.toBeNull();
    expect(result!.title).toBe("Refactoring");
    expect(result!.body).toContain("## Overview");
  });

  it("should return null when no plan prefix found", () => {
    const plan = `## Some heading
Just some content without plan prefix
`;

    const result = parsePlanFromInput(plan);

    expect(result).toBeNull();
  });

  it("should handle plan with content before title", () => {
    const plan = `Some intro text

# 計画: 機能追加

## 概要
新機能を追加
`;

    const result = parsePlanFromInput(plan);

    expect(result).not.toBeNull();
    expect(result!.title).toBe("機能追加");
    expect(result!.body).toContain("## 概要");
  });

  it("should preserve body formatting", () => {
    const plan = `# 計画: テスト

## 変更対象
- \`file1.ts\`: 変更1
- \`file2.ts\`: 変更2

## 実装ステップ
1. ステップ1
2. ステップ2

\`\`\`typescript
const x = 1;
\`\`\`
`;

    const result = parsePlanFromInput(plan);

    expect(result).not.toBeNull();
    expect(result!.body).toContain("- `file1.ts`: 変更1");
    expect(result!.body).toContain("1. ステップ1");
    expect(result!.body).toContain("```typescript");
  });
});

describe("extractPlanFromTranscript", () => {
  const testDir = join(tmpdir(), "create-issue-test");
  const testFile = join(testDir, "transcript.jsonl");

  beforeEach(() => {
    try {
      mkdirSync(testDir, { recursive: true });
    } catch {
      // ignore
    }
  });

  it("should extract plan from transcript JSONL", () => {
    const transcript = [
      JSON.stringify({ type: "user", message: { content: "test" } }),
      JSON.stringify({
        type: "assistant",
        message: {
          content: [{ type: "text", text: "# 計画: テスト計画\n\n## 概要\nテスト内容" }],
        },
      }),
    ].join("\n");

    writeFileSync(testFile, transcript);

    const result = extractPlanFromTranscript(testFile);

    expect(result).not.toBeNull();
    expect(result).toContain("# 計画: テスト計画");
    expect(result).toContain("## 概要");
  });

  it("should return null when no plan found", () => {
    const transcript = [
      JSON.stringify({ type: "user", message: { content: "test" } }),
      JSON.stringify({
        type: "assistant",
        message: {
          content: [{ type: "text", text: "No plan here" }],
        },
      }),
    ].join("\n");

    writeFileSync(testFile, transcript);

    const result = extractPlanFromTranscript(testFile);

    expect(result).toBeNull();
  });

  it("should find the last plan in transcript", () => {
    const transcript = [
      JSON.stringify({
        type: "assistant",
        message: {
          content: [{ type: "text", text: "# 計画: 古い計画\n\n古い内容" }],
        },
      }),
      JSON.stringify({
        type: "assistant",
        message: {
          content: [{ type: "text", text: "# 計画: 新しい計画\n\n新しい内容" }],
        },
      }),
    ].join("\n");

    writeFileSync(testFile, transcript);

    const result = extractPlanFromTranscript(testFile);

    expect(result).not.toBeNull();
    expect(result).toContain("# 計画: 新しい計画");
  });
});
