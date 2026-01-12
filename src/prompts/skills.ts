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
    } catch (error) {
      console.warn(`Failed to load global skills: ${error instanceof Error ? error.message : String(error)}`);
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
      } catch (error) {
        console.warn(`Failed to load skill "${name}": ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  return parts.join("\n\n");
}
