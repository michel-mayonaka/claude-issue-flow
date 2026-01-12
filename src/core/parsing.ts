import type { ParsedPlan } from "../types/index.js";

export function parsePlanMarkdown(content: string): ParsedPlan | null {
  const markdownBlockRegex = /```markdown\s*([\s\S]*?)```/g;
  let match;
  let planContent: string | null = null;

  while ((match = markdownBlockRegex.exec(content)) !== null) {
    const block = match[1].trim();
    if (block.startsWith("# 計画:") || block.startsWith("# Plan:")) {
      planContent = block;
      break;
    }
  }

  if (!planContent) {
    const directMatch = content.match(/^# 計画:\s*(.+)$/m);
    if (directMatch) {
      const startIndex = content.indexOf(directMatch[0]);
      const remainingContent = content.slice(startIndex);
      const nextPlanIndex = remainingContent.indexOf("\n# 計画:", 1);
      planContent = nextPlanIndex > 0
        ? remainingContent.slice(0, nextPlanIndex).trim()
        : remainingContent.trim();
    }
  }

  if (!planContent) {
    return null;
  }

  const titleMatch = planContent.match(/^# 計画:\s*(.+)$/m) ||
                     planContent.match(/^# Plan:\s*(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : "実装計画";

  const bodyLines = planContent.split("\n").slice(1);
  const body = bodyLines.join("\n").trim();

  return { title, body };
}

export function parsePlanFromInput(plan: string): ParsedPlan | null {
  const titleMatch = plan.match(/^#\s*(?:計画|Plan):\s*(.+)$/m);
  if (!titleMatch) {
    return null;
  }

  const title = titleMatch[1].trim();

  const titleIndex = plan.indexOf(titleMatch[0]);
  let body = plan.slice(titleIndex + titleMatch[0].length).trim();

  const separatorIndex = body.lastIndexOf("\n---\n");
  if (separatorIndex !== -1) {
    const afterSeparator = body.slice(separatorIndex + 5).replace(/^\n+/, "");
    if (afterSeparator && !afterSeparator.startsWith("#")) {
      body = body.slice(0, separatorIndex).trim();
    }
  }

  return { title, body };
}
