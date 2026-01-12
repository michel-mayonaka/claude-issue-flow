import type { ParsedPlan } from "../types/index.js";

export function parsePlanMarkdown(content: string): ParsedPlan | null {
  // Markdownブロックから計画を抽出
  const markdownBlockRegex = /```markdown\s*([\s\S]*?)```/g;
  let match;
  let planContent: string | null = null;

  while ((match = markdownBlockRegex.exec(content)) !== null) {
    const block = match[1].trim();
    // "# 計画:" で始まるブロックを探す
    if (block.startsWith("# 計画:") || block.startsWith("# Plan:")) {
      planContent = block;
      break;
    }
  }

  // Markdownブロックがない場合、直接コンテンツから探す
  if (!planContent) {
    const directMatch = content.match(/^# 計画:\s*(.+)$/m);
    if (directMatch) {
      // # 計画: から次の # 計画: または終端までを抽出
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

  // タイトルを抽出（最初の行から）
  const titleMatch = planContent.match(/^# 計画:\s*(.+)$/m) ||
                     planContent.match(/^# Plan:\s*(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : "実装計画";

  // 本文は全体（タイトル行を除く）
  const bodyLines = planContent.split("\n").slice(1);
  const body = bodyLines.join("\n").trim();

  return { title, body };
}