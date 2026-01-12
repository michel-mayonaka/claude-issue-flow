import { describe, it, expect } from "vitest";
import { buildPlanIssuePrompt } from "./plan-issue.js";
import { parsePlanMarkdown } from "../core/parsing.js";

describe("buildPlanIssuePrompt", () => {
  it("should build prompt with request only", () => {
    const result = buildPlanIssuePrompt({
      request: "Add a new feature",
    });

    expect(result).toContain("Add a new feature");
    expect(result).toContain("# タスク: 対話的な実装計画の立案");
    expect(result).toContain("## 依頼内容");
    expect(result).toContain("AskUserQuestion");
    expect(result).not.toContain("## 追加コンテキスト");
  });

  it("should include additional context when provided", () => {
    const result = buildPlanIssuePrompt({
      request: "Add a new feature",
      additionalContext: "This is for the admin panel",
    });

    expect(result).toContain("## 追加コンテキスト");
    expect(result).toContain("This is for the admin panel");
  });
});

describe("parsePlanMarkdown", () => {
  it("should parse plan from markdown code block", () => {
    const content = `
Here is the plan:

\`\`\`markdown
# 計画: ユーザー認証機能の追加

## 概要
ログイン機能を実装する。

## 背景
ユーザーがログインする必要がある。

## 変更対象
- \`src/auth.ts\`: 認証ロジック

## 実装ステップ
1. ログインフォームの作成
2. APIエンドポイントの追加

## 受け入れ条件
- [ ] ログインフォームが動作する
\`\`\`
`;

    const result = parsePlanMarkdown(content);

    expect(result).not.toBeNull();
    expect(result!.title).toBe("ユーザー認証機能の追加");
    expect(result!.body).toContain("## 概要");
    expect(result!.body).toContain("ログイン機能を実装する");
    expect(result!.body).toContain("## 変更対象");
  });

  it("should parse plan without markdown code block", () => {
    const content = `
調査が完了しました。以下が計画です：

# 計画: リファクタリング

## 概要
コードを整理する。

## 変更対象
- \`src/index.ts\`: エントリーポイント
`;

    const result = parsePlanMarkdown(content);

    expect(result).not.toBeNull();
    expect(result!.title).toBe("リファクタリング");
    expect(result!.body).toContain("## 概要");
    expect(result!.body).toContain("コードを整理する");
  });

  it("should return null when no plan found", () => {
    const content = "Just some text without a plan";

    const result = parsePlanMarkdown(content);

    expect(result).toBeNull();
  });

  it("should handle Plan: prefix (English)", () => {
    const content = `
\`\`\`markdown
# Plan: Add authentication

## Overview
Add user login.
\`\`\`
`;

    const result = parsePlanMarkdown(content);

    expect(result).not.toBeNull();
    expect(result!.title).toBe("Add authentication");
    expect(result!.body).toContain("## Overview");
  });

  it("should handle empty title gracefully", () => {
    const content = `
\`\`\`markdown
# 計画:

## 概要
Something
\`\`\`
`;

    const result = parsePlanMarkdown(content);

    // markdownブロック内に "# 計画:" があっても、タイトルが空の場合はフォールバック
    // 実際には "## 概要" が最初の行として取得される（空行がスキップされる）
    expect(result).not.toBeNull();
  });
});
