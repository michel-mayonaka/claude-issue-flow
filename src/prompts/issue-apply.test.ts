import { describe, it, expect } from "vitest";
import {
  buildIssueApplyPrompt,
  parsePRInfo,
  generateDefaultPRBody,
} from "./issue-apply.js";
import type { GitHubIssue } from "../core/github.js";

const mockIssue: GitHubIssue = {
  number: 123,
  title: "Test Issue",
  body: "This is the issue body\n\n## 受け入れ条件\n- [ ] Condition 1",
  labels: ["enhancement", "priority-high"],
  assignees: [],
  milestone: null,
  url: "https://github.com/owner/repo/issues/123",
  state: "open",
};

describe("buildIssueApplyPrompt", () => {
  it("should build prompt with issue info", () => {
    const result = buildIssueApplyPrompt({
      issue: mockIssue,
    });

    expect(result).toContain("# タスク: GitHub Issue実装");
    expect(result).toContain("Test Issue");
    expect(result).toContain("#123");
    expect(result).toContain("enhancement, priority-high");
    expect(result).toContain("This is the issue body");
  });

  it("should include implementation rules", () => {
    const result = buildIssueApplyPrompt({
      issue: mockIssue,
    });

    expect(result).toContain("受け入れ条件を最優先");
    expect(result).toContain("最小限の変更");
    expect(result).toContain("既存パターンを踏襲");
  });

  it("should include PR info format", () => {
    const result = buildIssueApplyPrompt({
      issue: mockIssue,
    });

    expect(result).toContain("pr_title:");
    expect(result).toContain("pr_body:");
    expect(result).toContain(`Closes #${mockIssue.number}`);
  });

  it("should handle issue with no labels", () => {
    const issueNoLabels: GitHubIssue = {
      ...mockIssue,
      labels: [],
    };

    const result = buildIssueApplyPrompt({
      issue: issueNoLabels,
    });

    expect(result).toContain("**Labels**: なし");
  });
});

describe("parsePRInfo", () => {
  it("should parse PR info from YAML block", () => {
    const content = `
## 実装レポート

Some implementation notes...

\`\`\`yaml
pr_title: "Add authentication feature"
pr_body: |
  ## 概要
  - Added login functionality

  ## 変更点
  - New login component

  Closes #123
\`\`\`
`;

    const result = parsePRInfo(content);

    expect(result).not.toBeNull();
    expect(result!.title).toBe("Add authentication feature");
    expect(result!.body).toContain("## 概要");
    expect(result!.body).toContain("Added login functionality");
    expect(result!.body).toContain("Closes #123");
  });

  it("should return null when no YAML block found", () => {
    const content = "Just some text without YAML";

    const result = parsePRInfo(content);

    expect(result).toBeNull();
  });

  it("should return null when YAML block has no pr_title", () => {
    const content = `
\`\`\`yaml
other_field: value
\`\`\`
`;

    const result = parsePRInfo(content);

    expect(result).toBeNull();
  });

  it("should handle multiple YAML blocks and find PR info", () => {
    const content = `
\`\`\`yaml
some_other: config
\`\`\`

\`\`\`yaml
pr_title: "The correct title"
pr_body: |
  Correct body
\`\`\`
`;

    const result = parsePRInfo(content);

    expect(result).not.toBeNull();
    expect(result!.title).toBe("The correct title");
  });

  it("should handle title with quotes", () => {
    const content = `
\`\`\`yaml
pr_title: 'Single quoted title'
pr_body: |
  Body content
\`\`\`
`;

    const result = parsePRInfo(content);

    expect(result).not.toBeNull();
    expect(result!.title).toBe("Single quoted title");
  });

  it("should strip indentation from body", () => {
    const content = `
\`\`\`yaml
pr_title: "Test"
pr_body: |
  Line 1
  Line 2
    Indented line
\`\`\`
`;

    const result = parsePRInfo(content);

    expect(result).not.toBeNull();
    expect(result!.body).toBe("Line 1\nLine 2\n  Indented line");
  });
});

describe("generateDefaultPRBody", () => {
  it("should generate default PR body", () => {
    const result = generateDefaultPRBody(
      mockIssue,
      "Implementation complete. Changed 3 files."
    );

    expect(result).toContain("## 概要");
    expect(result).toContain(`Issue #${mockIssue.number}`);
    expect(result).toContain("Implementation complete");
    expect(result).toContain(`Closes #${mockIssue.number}`);
  });

  it("should truncate long final messages", () => {
    const longMessage = "x".repeat(2000);
    const result = generateDefaultPRBody(mockIssue, longMessage);

    expect(result.length).toBeLessThan(2000);
    expect(result).toContain("...");
  });
});
