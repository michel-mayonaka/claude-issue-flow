import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock child_process
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

// Mock @octokit/rest
const mockOctokit = {
  issues: {
    get: vi.fn(),
    create: vi.fn(),
  },
  pulls: {
    create: vi.fn(),
  },
};

vi.mock("@octokit/rest", () => ({
  Octokit: vi.fn(() => mockOctokit),
}));

// Import after mocks
import { execSync } from "child_process";
import { fetchIssue, createIssue, createPullRequest, issueToYaml } from "./github.js";
import type { GitHubIssue } from "./github.js";

describe("github", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GH_TOKEN: "test-token" };
    (execSync as ReturnType<typeof vi.fn>).mockReturnValue(
      "https://github.com/owner/repo.git\n"
    );
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("fetchIssue", () => {
    it("should fetch issue by number", async () => {
      mockOctokit.issues.get.mockResolvedValue({
        data: {
          number: 42,
          title: "Test Issue",
          body: "Issue body",
          html_url: "https://github.com/owner/repo/issues/42",
          labels: [{ name: "bug" }, { name: "priority" }],
          assignees: [{ login: "user1" }],
          milestone: { title: "v1.0" },
          state: "open",
        },
      });

      const result = await fetchIssue("/repo", 42);

      expect(result).toEqual({
        number: 42,
        title: "Test Issue",
        body: "Issue body",
        url: "https://github.com/owner/repo/issues/42",
        labels: ["bug", "priority"],
        assignees: ["user1"],
        milestone: "v1.0",
        state: "open",
      });

      expect(mockOctokit.issues.get).toHaveBeenCalledWith({
        owner: "owner",
        repo: "repo",
        issue_number: 42,
      });
    });

    it("should fetch issue by string number", async () => {
      mockOctokit.issues.get.mockResolvedValue({
        data: {
          number: 123,
          title: "Another Issue",
          body: null,
          html_url: "https://github.com/owner/repo/issues/123",
          labels: [],
          assignees: [],
          milestone: null,
          state: "closed",
        },
      });

      const result = await fetchIssue("/repo", "123");

      expect(result.number).toBe(123);
      expect(result.body).toBe("");
      expect(result.milestone).toBeNull();
    });

    it("should fetch issue by URL", async () => {
      mockOctokit.issues.get.mockResolvedValue({
        data: {
          number: 99,
          title: "URL Issue",
          body: "Content",
          html_url: "https://github.com/owner/repo/issues/99",
          labels: [],
          assignees: [],
          milestone: null,
          state: "open",
        },
      });

      const result = await fetchIssue(
        "/repo",
        "https://github.com/owner/repo/issues/99"
      );

      expect(result.number).toBe(99);
      expect(mockOctokit.issues.get).toHaveBeenCalledWith({
        owner: "owner",
        repo: "repo",
        issue_number: 99,
      });
    });

    it("should throw error when token is missing", async () => {
      delete process.env.GH_TOKEN;
      delete process.env.GITHUB_TOKEN;

      await expect(fetchIssue("/repo", 1)).rejects.toThrow("GitHub token not found");
    });

    it("should parse SSH remote URL", async () => {
      (execSync as ReturnType<typeof vi.fn>).mockReturnValue(
        "git@github.com:owner/repo.git\n"
      );

      mockOctokit.issues.get.mockResolvedValue({
        data: {
          number: 1,
          title: "Test",
          body: "",
          html_url: "https://github.com/owner/repo/issues/1",
          labels: [],
          assignees: [],
          milestone: null,
          state: "open",
        },
      });

      await fetchIssue("/repo", 1);

      expect(mockOctokit.issues.get).toHaveBeenCalledWith({
        owner: "owner",
        repo: "repo",
        issue_number: 1,
      });
    });
  });

  describe("createIssue", () => {
    it("should create issue with all fields", async () => {
      mockOctokit.issues.create.mockResolvedValue({
        data: {
          number: 100,
          title: "New Issue",
          body: "Issue body",
          html_url: "https://github.com/owner/repo/issues/100",
          labels: [{ name: "enhancement" }],
          assignees: [{ login: "user1" }],
          milestone: { title: "v2.0" },
          state: "open",
        },
      });

      const result = await createIssue("/repo", {
        title: "New Issue",
        body: "Issue body",
        labels: ["enhancement"],
        assignees: ["user1"],
        milestone: 1,
      });

      expect(result.number).toBe(100);
      expect(result.title).toBe("New Issue");
      expect(mockOctokit.issues.create).toHaveBeenCalledWith({
        owner: "owner",
        repo: "repo",
        title: "New Issue",
        body: "Issue body",
        labels: ["enhancement"],
        assignees: ["user1"],
        milestone: 1,
      });
    });
  });

  describe("createPullRequest", () => {
    it("should create PR with draft flag", async () => {
      mockOctokit.pulls.create.mockResolvedValue({
        data: {
          number: 200,
          html_url: "https://github.com/owner/repo/pull/200",
          title: "New PR",
        },
      });

      const result = await createPullRequest("/repo", {
        title: "New PR",
        body: "PR description",
        head: "feature-branch",
        base: "main",
        draft: true,
      });

      expect(result).toEqual({
        number: 200,
        url: "https://github.com/owner/repo/pull/200",
        title: "New PR",
      });

      expect(mockOctokit.pulls.create).toHaveBeenCalledWith({
        owner: "owner",
        repo: "repo",
        title: "New PR",
        body: "PR description",
        head: "feature-branch",
        base: "main",
        draft: true,
      });
    });

    it("should default draft to true", async () => {
      mockOctokit.pulls.create.mockResolvedValue({
        data: {
          number: 201,
          html_url: "https://github.com/owner/repo/pull/201",
          title: "Another PR",
        },
      });

      await createPullRequest("/repo", {
        title: "Another PR",
        body: "Body",
        head: "feature",
        base: "main",
      });

      expect(mockOctokit.pulls.create).toHaveBeenCalledWith(
        expect.objectContaining({
          draft: true,
        })
      );
    });
  });

  describe("issueToYaml", () => {
    it("should convert issue to YAML format", () => {
      const issue: GitHubIssue = {
        number: 42,
        title: "Test Issue",
        body: "Line 1\nLine 2",
        url: "https://github.com/owner/repo/issues/42",
        labels: ["bug", "high-priority"],
        assignees: ["user1", "user2"],
        milestone: "v1.0",
        state: "open",
      };

      const result = issueToYaml(issue);

      expect(result).toContain('title: "Test Issue"');
      expect(result).toContain("number: 42");
      expect(result).toContain("body: |");
      expect(result).toContain("  Line 1");
      expect(result).toContain("  Line 2");
      expect(result).toContain('  - "bug"');
      expect(result).toContain('  - "user1"');
      expect(result).toContain('milestone: "v1.0"');
    });

    it("should escape quotes in title", () => {
      const issue: GitHubIssue = {
        number: 1,
        title: 'Title with "quotes"',
        body: "",
        url: "https://github.com/owner/repo/issues/1",
        labels: [],
        assignees: [],
        milestone: null,
        state: "open",
      };

      const result = issueToYaml(issue);

      expect(result).toContain('title: "Title with \\"quotes\\""');
    });

    it("should not include milestone when null", () => {
      const issue: GitHubIssue = {
        number: 1,
        title: "Test",
        body: "",
        url: "https://github.com/owner/repo/issues/1",
        labels: [],
        assignees: [],
        milestone: null,
        state: "open",
      };

      const result = issueToYaml(issue);

      expect(result).not.toContain("milestone:");
    });
  });
});
