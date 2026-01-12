import { describe, it, expect } from "vitest";
import { parsePlanMarkdown } from "./parsing.js";

describe("parsing", () => {
  describe("parsePlanMarkdown", () => {
    it("should parse plan from markdown code block", () => {
      const content = `
Some text before

\`\`\`markdown
# 計画: テスト計画

## 概要
これはテストです

## 変更点
- ファイル1を変更
\`\`\`

Some text after
`;

      const result = parsePlanMarkdown(content);
      expect(result).toBeDefined();
      expect(result?.title).toBe("テスト計画");
      expect(result?.body).toContain("## 概要");
      expect(result?.body).toContain("これはテストです");
    });

    it("should parse plan with 'Plan:' prefix", () => {
      const content = `
\`\`\`markdown
# Plan: Test Plan

## Summary
This is a test
\`\`\`
`;

      const result = parsePlanMarkdown(content);
      expect(result).toBeDefined();
      expect(result?.title).toBe("Test Plan");
      expect(result?.body).toContain("## Summary");
    });

    it("should parse plan without markdown code block", () => {
      const content = `
Some text

# 計画: ダイレクト計画

## 概要
コードブロックなし

## 詳細
直接書かれた計画
`;

      const result = parsePlanMarkdown(content);
      expect(result).toBeDefined();
      expect(result?.title).toBe("ダイレクト計画");
      expect(result?.body).toContain("## 概要");
    });

    it("should return null if no plan is found", () => {
      const content = "This is just some text without a plan";
      const result = parsePlanMarkdown(content);
      expect(result).toBeNull();
    });

    it("should extract first plan when multiple plans exist", () => {
      const content = `
\`\`\`markdown
# 計画: 最初の計画

## 内容
これが最初
\`\`\`

\`\`\`markdown
# 計画: 2番目の計画

## 内容
これは2番目
\`\`\`
`;

      const result = parsePlanMarkdown(content);
      expect(result).toBeDefined();
      expect(result?.title).toBe("最初の計画");
      expect(result?.body).toContain("これが最初");
      expect(result?.body).not.toContain("これは2番目");
    });
  });
});
