import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_ROOT = join(__dirname, "../../skills");

export interface LoadSkillsOptions {
  global?: boolean;
  optional?: string[];
}

export async function loadSkills(options: LoadSkillsOptions): Promise<string> {
  const parts: string[] = [];

  // Load global skills
  if (options.global) {
    const globalDir = join(SKILLS_ROOT, "global");
    try {
      const files = await readdir(globalDir);
      const mdFiles = files.filter((f) => f.endsWith(".md")).sort();

      for (const file of mdFiles) {
        const content = await readFile(join(globalDir, file), "utf-8");
        parts.push(`## skill: skills/global/${file}\n\n${content}`);
      }
    } catch {
      // Global skills directory may not exist
    }
  }

  // Load optional skills
  if (options.optional && options.optional.length > 0) {
    const optionalDir = join(SKILLS_ROOT, "optional");

    for (const name of options.optional) {
      // Try direct file first
      const filePath = join(optionalDir, `${name}.md`);
      // Also try directory with SKILL.md
      const dirPath = join(optionalDir, name, "SKILL.md");

      try {
        let content: string;
        let skillPath: string;

        try {
          content = await readFile(filePath, "utf-8");
          skillPath = `skills/optional/${name}.md`;
        } catch {
          content = await readFile(dirPath, "utf-8");
          skillPath = `skills/optional/${name}/SKILL.md`;
        }

        parts.push(`## skill: ${skillPath}\n\n${content}`);
      } catch {
        console.warn(`Warning: Could not load skill "${name}"`);
      }
    }
  }

  return parts.join("\n\n");
}

export async function listAvailableSkills(): Promise<{
  global: string[];
  optional: string[];
}> {
  const result = { global: [] as string[], optional: [] as string[] };

  // List global skills
  try {
    const globalDir = join(SKILLS_ROOT, "global");
    const files = await readdir(globalDir);
    result.global = files
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(".md", ""));
  } catch {
    // Directory may not exist
  }

  // List optional skills
  try {
    const optionalDir = join(SKILLS_ROOT, "optional");
    const entries = await readdir(optionalDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        result.optional.push(entry.name.replace(".md", ""));
      } else if (entry.isDirectory()) {
        // Check if directory has SKILL.md
        try {
          await readFile(join(optionalDir, entry.name, "SKILL.md"), "utf-8");
          result.optional.push(entry.name);
        } catch {
          // Not a valid skill directory
        }
      }
    }
  } catch {
    // Directory may not exist
  }

  return result;
}
