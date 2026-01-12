import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { join } from "path";
import { tmpdir } from "os";

// Mock simple-git before importing worktree functions
const mockGitInstance = {
  status: vi.fn(),
  raw: vi.fn(),
  add: vi.fn(),
  commit: vi.fn(),
  push: vi.fn(),
  diff: vi.fn(),
  branch: vi.fn(),
};

vi.mock("simple-git", () => ({
  simpleGit: vi.fn(() => mockGitInstance),
}));

// Must import after mock setup
const { createWorktree, commitChanges, pushBranch, getChangedFiles, getDiff, removeWorktree, deleteBranch, deleteRemoteBranch, listWorktrees, pruneWorktrees, cleanupWorktree } = await import("./worktree.js");

describe("createWorktree", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGitInstance.status.mockResolvedValue({ current: "main" });
    mockGitInstance.raw.mockResolvedValue("");
  });

  it("should create worktree with correct branch name", async () => {
    const result = await createWorktree({
      repo: "/repo",
      runId: "20240115-120000-12345",
      jobName: "issue-apply",
      issueNumber: 42,
      logsRoot: tmpdir(),
    });

    expect(result.branch).toBe("issue-apply-42-20240115-120000-12345");
    expect(result.baseBranch).toBe("main");
    expect(result.repoPath).toBe("/repo");
    expect(mockGitInstance.raw).toHaveBeenCalledWith([
      "worktree",
      "add",
      "-b",
      "issue-apply-42-20240115-120000-12345",
      expect.any(String),
      "main",
    ]);
  });

  it("should sanitize job name for branch", async () => {
    await createWorktree({
      repo: "/repo",
      runId: "run123",
      jobName: "My Job Name!",
      logsRoot: tmpdir(),
    });

    expect(mockGitInstance.raw).toHaveBeenCalledWith([
      "worktree",
      "add",
      "-b",
      "my-job-name--run123",
      expect.any(String),
      "main",
    ]);
  });

  it("should use provided baseBranch", async () => {
    await createWorktree({
      repo: "/repo",
      runId: "run123",
      jobName: "test",
      baseBranch: "develop",
      logsRoot: tmpdir(),
    });

    expect(mockGitInstance.raw).toHaveBeenCalledWith([
      "worktree",
      "add",
      "-b",
      "test-run123",
      expect.any(String),
      "develop",
    ]);
  });

  it("should create branch name without issue number when not provided", async () => {
    const result = await createWorktree({
      repo: "/repo",
      runId: "run123",
      jobName: "plan-issue",
      logsRoot: tmpdir(),
    });

    expect(result.branch).toBe("plan-issue-run123");
  });
});

describe("commitChanges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const worktree = {
    path: "/worktree/path",
    branch: "feature-123",
    baseBranch: "main",
    repoPath: "/repo",
  };

  it("should commit when there are changes", async () => {
    mockGitInstance.status.mockResolvedValue({
      files: [{ path: "file.ts" }],
    });
    mockGitInstance.add.mockResolvedValue(undefined);
    mockGitInstance.commit.mockResolvedValue(undefined);

    const result = await commitChanges(worktree, "commit message");

    expect(result).toBe(true);
    expect(mockGitInstance.add).toHaveBeenCalledWith("-A");
    expect(mockGitInstance.commit).toHaveBeenCalledWith("commit message");
  });

  it("should return false when no changes", async () => {
    mockGitInstance.status.mockResolvedValue({ files: [] });

    const result = await commitChanges(worktree, "commit message");

    expect(result).toBe(false);
    expect(mockGitInstance.add).not.toHaveBeenCalled();
    expect(mockGitInstance.commit).not.toHaveBeenCalled();
  });
});

describe("pushBranch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should push to origin with -u flag", async () => {
    const worktree = {
      path: "/worktree/path",
      branch: "feature-123",
      baseBranch: "main",
      repoPath: "/repo",
    };

    mockGitInstance.push.mockResolvedValue(undefined);

    await pushBranch(worktree);

    expect(mockGitInstance.push).toHaveBeenCalledWith([
      "-u",
      "origin",
      "feature-123",
    ]);
  });
});

describe("getChangedFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return list of changed files", async () => {
    mockGitInstance.status.mockResolvedValue({
      files: [
        { path: "src/index.ts" },
        { path: "package.json" },
        { path: "README.md" },
      ],
    });

    const worktree = {
      path: "/worktree/path",
      branch: "feature",
      baseBranch: "main",
      repoPath: "/repo",
    };

    const result = await getChangedFiles(worktree);

    expect(result).toEqual(["src/index.ts", "package.json", "README.md"]);
  });

  it("should return empty array when no changes", async () => {
    mockGitInstance.status.mockResolvedValue({ files: [] });

    const worktree = {
      path: "/worktree/path",
      branch: "feature",
      baseBranch: "main",
      repoPath: "/repo",
    };

    const result = await getChangedFiles(worktree);

    expect(result).toEqual([]);
  });
});

describe("getDiff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return combined staged and unstaged diff", async () => {
    mockGitInstance.diff
      .mockResolvedValueOnce("staged diff")
      .mockResolvedValueOnce("unstaged diff");

    const worktree = {
      path: "/worktree/path",
      branch: "feature",
      baseBranch: "main",
      repoPath: "/repo",
    };

    const result = await getDiff(worktree);

    expect(result).toBe("staged diff\nunstaged diff");
    expect(mockGitInstance.diff).toHaveBeenCalledWith(["--cached"]);
    expect(mockGitInstance.diff).toHaveBeenCalledWith();
  });

  it("should filter out empty diffs", async () => {
    mockGitInstance.diff.mockResolvedValueOnce("").mockResolvedValueOnce("only unstaged");

    const worktree = {
      path: "/worktree/path",
      branch: "feature",
      baseBranch: "main",
      repoPath: "/repo",
    };

    const result = await getDiff(worktree);

    expect(result).toBe("only unstaged");
  });
});

describe("removeWorktree", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should remove worktree with force flag", async () => {
    mockGitInstance.raw.mockResolvedValue("");

    const worktree = {
      path: "/worktree/path",
      branch: "feature",
      baseBranch: "main",
      repoPath: "/repo",
    };

    await removeWorktree(worktree);

    expect(mockGitInstance.raw).toHaveBeenCalledWith([
      "worktree",
      "remove",
      "/worktree/path",
      "--force",
    ]);
  });
});

describe("deleteBranch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const worktree = {
    path: "/worktree/path",
    branch: "feature-123",
    baseBranch: "main",
    repoPath: "/repo",
  };

  it("should delete branch with -d flag by default", async () => {
    mockGitInstance.branch.mockResolvedValue(undefined);

    await deleteBranch(worktree);

    expect(mockGitInstance.branch).toHaveBeenCalledWith(["-d", "feature-123"]);
  });

  it("should delete branch with -D flag when force is true", async () => {
    mockGitInstance.branch.mockResolvedValue(undefined);

    await deleteBranch(worktree, true);

    expect(mockGitInstance.branch).toHaveBeenCalledWith(["-D", "feature-123"]);
  });
});

describe("deleteRemoteBranch", () => {
  it("should delete remote branch using git push --delete", async () => {
    mockGitInstance.push.mockResolvedValue(undefined);

    await deleteRemoteBranch("/repo/path", "feature-123");

    expect(mockGitInstance.push).toHaveBeenCalledWith([
      "origin",
      "--delete",
      "feature-123",
    ]);
  });
});

describe("listWorktrees", () => {
  it("should parse git worktree list --porcelain output", async () => {
    mockGitInstance.raw.mockResolvedValueOnce(
      "worktree /repo\nHEAD abc123\nbranch refs/heads/main\n\nworktree /repo/logs/issue-apply/run1/worktree\nHEAD def456\nbranch refs/heads/feature-1\n\n"
    );

    const result = await listWorktrees("/repo/path");

    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      path: "/repo/logs/issue-apply/run1/worktree",
      head: "def456",
      branch: "feature-1",
    });
  });
});

describe("pruneWorktrees", () => {
  it("should call git worktree prune", async () => {
    mockGitInstance.raw.mockResolvedValue("");

    await pruneWorktrees("/repo/path");

    expect(mockGitInstance.raw).toHaveBeenCalledWith(["worktree", "prune"]);
  });
});

describe("cleanupWorktree", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should remove worktree and delete local branch", async () => {
    mockGitInstance.raw.mockResolvedValue("");
    mockGitInstance.branch.mockResolvedValue(undefined);

    const worktree = {
      path: "/worktree/path",
      branch: "feature-123",
      baseBranch: "main",
      repoPath: "/repo/path",
    };

    await cleanupWorktree({ worktree });

    expect(mockGitInstance.raw).toHaveBeenCalledWith([
      "worktree",
      "remove",
      "/worktree/path",
      "--force",
    ]);
    expect(mockGitInstance.branch).toHaveBeenCalledWith(["-D", "feature-123"]);
    expect(mockGitInstance.push).not.toHaveBeenCalled();
  });

  it("should also delete remote branch when deleteRemote is true", async () => {
    mockGitInstance.raw.mockResolvedValue("");
    mockGitInstance.branch.mockResolvedValue(undefined);
    mockGitInstance.push.mockResolvedValue(undefined);

    const worktree = {
      path: "/worktree/path",
      branch: "feature-123",
      baseBranch: "main",
      repoPath: "/repo/path",
    };

    await cleanupWorktree({ worktree, deleteRemote: true });

    expect(mockGitInstance.push).toHaveBeenCalledWith([
      "origin",
      "--delete",
      "feature-123",
    ]);
  });
});
