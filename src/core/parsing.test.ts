import { describe, it, expect } from "vitest";
import { parsePlanMarkdown, parsePlanFromTranscript } from "./parsing.js";

describe("parsePlanMarkdown", () => {
  it("should parse plan from markdown block", () => {
    const content = `
\`\`\`markdown
# 計画: テスト計画

## 概要
テスト用の計画です
\`\`\`
    `;

    const result = parsePlanMarkdown(content);

    expect(result).not.toBeNull();
    expect(result?.title).toBe("テスト計画");
    expect(result?.body).toContain("## 概要");
    expect(result?.body).toContain("テスト用の計画です");
  });

  it("should parse plan with # Plan: prefix", () => {
    const content = `
\`\`\`markdown
# Plan: Test Plan

## Summary
This is a test plan
\`\`\`
    `;

    const result = parsePlanMarkdown(content);

    expect(result).not.toBeNull();
    expect(result?.title).toBe("Test Plan");
  });

  it("should parse plan without markdown block", () => {
    const content = `
# 計画: 直接記述の計画

## 概要
Markdownブロックなしで直接記述
    `;

    const result = parsePlanMarkdown(content);

    expect(result).not.toBeNull();
    expect(result?.title).toBe("直接記述の計画");
  });

  it("should return null if no plan found", () => {
    const content = "No plan here";

    const result = parsePlanMarkdown(content);

    expect(result).toBeNull();
  });
});

describe("parsePlanFromTranscript", () => {
  it("should parse plan from transcript format", () => {
    const content = `
# 計画: トランスクリプト計画

## 概要
トランスクリプトからの計画です

---

以下は無視される内容
    `;

    const result = parsePlanFromTranscript(content);

    expect(result).not.toBeNull();
    expect(result?.title).toBe("トランスクリプト計画");
    expect(result?.body).not.toContain("以下は無視される内容");
  });

  it("should keep content after --- if it starts with #", () => {
    const content = `
# 計画: 計画タイトル

## セクション1

---

## セクション2
これは残す
    `;

    const result = parsePlanFromTranscript(content);

    expect(result).not.toBeNull();
    expect(result?.body).toContain("## セクション2");
  });

  it("should return null if no title match", () => {
    const content = "No plan title here";

    const result = parsePlanFromTranscript(content);

    expect(result).toBeNull();
  });
});
