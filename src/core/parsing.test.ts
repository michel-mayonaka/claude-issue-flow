import { describe, it, expect } from "vitest";
import { parsePlanMarkdown, parsePlanFromInput } from "./parsing.js";

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
});

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

  it("should remove trailing text after separator (---)", () => {
    const plan = `# 計画: テスト機能

## 概要
テスト機能を追加

## 注意事項
- 注意点1

---

この計画で問題ありませんか？承認いただければ終了します。`;

    const result = parsePlanFromInput(plan);

    expect(result).not.toBeNull();
    expect(result!.title).toBe("テスト機能");
    expect(result!.body).toContain("## 概要");
    expect(result!.body).toContain("## 注意事項");
    expect(result!.body).not.toContain("この計画で問題ありませんか");
  });

  it("should keep separator when followed by heading", () => {
    const plan = `# 計画: テスト

## セクション1
内容1

---

## セクション2
内容2
`;

    const result = parsePlanFromInput(plan);

    expect(result).not.toBeNull();
    expect(result!.body).toContain("## セクション1");
    expect(result!.body).toContain("## セクション2");
  });
});
