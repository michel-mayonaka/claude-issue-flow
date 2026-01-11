import { describe, it, expect } from "vitest";
import { buildPlanIssuePrompt, parseIssueYaml } from "./plan-issue.js";

describe("buildPlanIssuePrompt", () => {
  it("should build prompt with request only", () => {
    const result = buildPlanIssuePrompt({
      request: "Add a new feature",
    });

    expect(result).toContain("Add a new feature");
    expect(result).toContain("# タスク: 実装計画とIssue作成");
    expect(result).toContain("## 依頼内容");
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

describe("parseIssueYaml", () => {
  it("should parse a single issue YAML block", () => {
    const content = `
Here is the plan:

\`\`\`yaml
title: "Add user authentication"
body: |
  ## 背景
  Users need to log in.

  ## 目的
  Implement login functionality.

  ## 受け入れ条件
  - [ ] Login form works
labels:
  - enhancement
assignees: []
\`\`\`
`;

    const result = parseIssueYaml(content);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Add user authentication");
    expect(result[0].body).toContain("## 背景");
    expect(result[0].body).toContain("Users need to log in.");
    expect(result[0].labels).toEqual(["enhancement"]);
    expect(result[0].assignees).toEqual([]);
  });

  it("should parse multiple issue YAML blocks", () => {
    const content = `
\`\`\`yaml
title: "Issue 1"
body: |
  First issue body
labels:
  - bug
assignees: []
\`\`\`

\`\`\`yaml
title: "Issue 2"
body: |
  Second issue body
labels:
  - enhancement
  - documentation
assignees:
  - user1
\`\`\`
`;

    const result = parseIssueYaml(content);

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Issue 1");
    expect(result[0].labels).toEqual(["bug"]);
    expect(result[1].title).toBe("Issue 2");
    expect(result[1].labels).toEqual(["enhancement", "documentation"]);
    expect(result[1].assignees).toEqual(["user1"]);
  });

  it("should handle title with quotes", () => {
    const content = `
\`\`\`yaml
title: 'Quoted title'
body: |
  Body content
labels: []
assignees: []
\`\`\`
`;

    const result = parseIssueYaml(content);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Quoted title");
  });

  it("should return empty array when no YAML blocks found", () => {
    const content = "Just some text without YAML";

    const result = parseIssueYaml(content);

    expect(result).toEqual([]);
  });

  it("should handle body with code blocks", () => {
    const content = `
\`\`\`yaml
title: "Issue with code"
body: |
  ## 実装方針

  Use the following pattern:

  - Step 1
  - Step 2
labels:
  - enhancement
assignees: []
\`\`\`
`;

    const result = parseIssueYaml(content);

    expect(result).toHaveLength(1);
    expect(result[0].body).toContain("## 実装方針");
    expect(result[0].body).toContain("- Step 1");
  });

  it("should strip indentation from body", () => {
    const content = `
\`\`\`yaml
title: "Test indentation"
body: |
  First line
  Second line
    Indented line
labels: []
assignees: []
\`\`\`
`;

    const result = parseIssueYaml(content);

    expect(result).toHaveLength(1);
    expect(result[0].body).toBe(
      "First line\nSecond line\n  Indented line"
    );
  });
});
