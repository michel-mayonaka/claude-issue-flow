import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadSkills } from "./skills.js";

// Mock fs/promises
vi.mock("fs/promises", () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
}));

import { readdir, readFile } from "fs/promises";

const mockReaddir = vi.mocked(readdir);
const mockReadFile = vi.mocked(readFile);

describe("skills", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("loadSkills", () => {
    it("should return empty string when no options specified", async () => {
      const result = await loadSkills({});
      expect(result).toBe("");
    });

    it("should load global skills when global option is true", async () => {
      mockReaddir.mockResolvedValue([
        "doc-check.md",
        "no-hallucination.md",
        "test-check.md",
      ] as unknown as Awaited<ReturnType<typeof readdir>>);
      mockReadFile.mockImplementation(async (path) => {
        const pathStr = String(path);
        if (pathStr.includes("doc-check.md")) {
          return "# Doc Check\nCheck documentation.";
        }
        if (pathStr.includes("no-hallucination.md")) {
          return "# No Hallucination\nDo not hallucinate.";
        }
        if (pathStr.includes("test-check.md")) {
          return "# Test Check\nRun tests.";
        }
        throw new Error(`Unexpected path: ${path}`);
      });

      const result = await loadSkills({ global: true });

      expect(mockReaddir).toHaveBeenCalledTimes(1);
      expect(mockReadFile).toHaveBeenCalledTimes(3);
      expect(result).toContain("## skill: skills/global/doc-check.md");
      expect(result).toContain("# Doc Check");
      expect(result).toContain("## skill: skills/global/no-hallucination.md");
      expect(result).toContain("# No Hallucination");
      expect(result).toContain("## skill: skills/global/test-check.md");
      expect(result).toContain("# Test Check");
    });

    it("should filter only .md files from global directory", async () => {
      mockReaddir.mockResolvedValue([
        "skill.md",
        "readme.txt",
        ".gitkeep",
      ] as unknown as Awaited<ReturnType<typeof readdir>>);
      mockReadFile.mockResolvedValue("# Skill Content");

      const result = await loadSkills({ global: true });

      expect(mockReadFile).toHaveBeenCalledTimes(1);
      expect(result).toContain("## skill: skills/global/skill.md");
    });

    it("should sort global skills alphabetically", async () => {
      mockReaddir.mockResolvedValue([
        "z-skill.md",
        "a-skill.md",
        "m-skill.md",
      ] as unknown as Awaited<ReturnType<typeof readdir>>);
      mockReadFile.mockImplementation(async (path) => {
        const pathStr = String(path);
        if (pathStr.includes("a-skill.md")) return "Content A";
        if (pathStr.includes("m-skill.md")) return "Content M";
        if (pathStr.includes("z-skill.md")) return "Content Z";
        return "";
      });

      const result = await loadSkills({ global: true });

      const aIndex = result.indexOf("a-skill.md");
      const mIndex = result.indexOf("m-skill.md");
      const zIndex = result.indexOf("z-skill.md");
      expect(aIndex).toBeLessThan(mIndex);
      expect(mIndex).toBeLessThan(zIndex);
    });

    it("should handle readdir error for global skills gracefully", async () => {
      mockReaddir.mockRejectedValue(new Error("Directory not found"));

      const result = await loadSkills({ global: true });

      expect(result).toBe("");
      expect(console.warn).toHaveBeenCalledWith(
        "Failed to load global skills:",
        expect.any(Error)
      );
    });

    it("should load optional skills by name", async () => {
      mockReadFile.mockImplementation(async (path) => {
        const pathStr = String(path);
        if (pathStr.includes("pr-draft.md")) {
          return "# PR Draft\nCreate draft PR.";
        }
        throw new Error("File not found");
      });

      const result = await loadSkills({ optional: ["pr-draft"] });

      expect(result).toContain("## skill: skills/optional/pr-draft.md");
      expect(result).toContain("# PR Draft");
    });

    it("should try SKILL.md in directory if direct file not found", async () => {
      mockReadFile.mockImplementation(async (path) => {
        const pathStr = String(path);
        if (pathStr.endsWith("custom-skill.md")) {
          throw new Error("File not found");
        }
        if (pathStr.includes("custom-skill/SKILL.md")) {
          return "# Custom Skill\nCustom content.";
        }
        throw new Error("Unexpected path");
      });

      const result = await loadSkills({ optional: ["custom-skill"] });

      expect(result).toContain("## skill: skills/optional/custom-skill/SKILL.md");
      expect(result).toContain("# Custom Skill");
    });

    it("should handle missing optional skill gracefully", async () => {
      mockReadFile.mockRejectedValue(new Error("File not found"));

      const result = await loadSkills({ optional: ["nonexistent"] });

      expect(result).toBe("");
      expect(console.warn).toHaveBeenCalled();
    });

    it("should load multiple optional skills", async () => {
      mockReadFile.mockImplementation(async (path) => {
        const pathStr = String(path);
        if (pathStr.includes("skill-a.md")) return "Content A";
        if (pathStr.includes("skill-b.md")) return "Content B";
        throw new Error("File not found");
      });

      const result = await loadSkills({ optional: ["skill-a", "skill-b"] });

      expect(result).toContain("## skill: skills/optional/skill-a.md");
      expect(result).toContain("Content A");
      expect(result).toContain("## skill: skills/optional/skill-b.md");
      expect(result).toContain("Content B");
    });

    it("should load both global and optional skills", async () => {
      mockReaddir.mockResolvedValue([
        "global-skill.md",
      ] as unknown as Awaited<ReturnType<typeof readdir>>);
      mockReadFile.mockImplementation(async (path) => {
        const pathStr = String(path);
        if (pathStr.includes("global-skill.md")) return "Global Content";
        if (pathStr.includes("optional-skill.md")) return "Optional Content";
        throw new Error("File not found");
      });

      const result = await loadSkills({
        global: true,
        optional: ["optional-skill"],
      });

      expect(result).toContain("## skill: skills/global/global-skill.md");
      expect(result).toContain("Global Content");
      expect(result).toContain("## skill: skills/optional/optional-skill.md");
      expect(result).toContain("Optional Content");
    });

    it("should not load optional skills if array is empty", async () => {
      const result = await loadSkills({ optional: [] });

      expect(result).toBe("");
      expect(mockReadFile).not.toHaveBeenCalled();
    });
  });
});
