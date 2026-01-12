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
      console.warn(`Failed to load global skills directory: ${globalDir}`, error);
    }
  }

  if (options.optional && options.optional.length > 0) {
    const optionalDir = join(SKILLS_ROOT, "optional");

    for (const name of options.optional) {
      const filePath = join(optionalDir, `${name}.md`);
      const dirPath = join(optionalDir, name, "SKILL.md");

      try {
        let content: string;
        let skillPath: string;

        try {
          content = await readFile(filePath, "utf-8");
          skillPath = `skills/optional/${name}.md`;
        } catch (error) {
          console.warn(`Failed to load skill file: ${filePath}`, error);
          content = await readFile(dirPath, "utf-8");
          skillPath = `skills/optional/${name}/SKILL.md`;
        }

        parts.push(`## skill: ${skillPath}\n\n${content}`);
      } catch (error) {
        console.warn(`Warning: Could not load skill "${name}"`, error);
      }
    }
  }

  return parts.join("\n\n");
}
