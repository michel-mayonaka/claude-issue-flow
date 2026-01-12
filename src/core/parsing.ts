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

export function parsePlanFromInput(plan: string): ParsedPlan | null {
  // "# 計画: タイトル" または "# Plan: タイトル" を探す
  const titleMatch = plan.match(/^#\s*(?:計画|Plan):\s*(.+)$/m);
  if (!titleMatch) {
    return null;
  }

  const title = titleMatch[1].trim();

  // タイトル行以降を本文として取得
  const titleIndex = plan.indexOf(titleMatch[0]);
  let body = plan.slice(titleIndex + titleMatch[0].length).trim();

  // 計画の終端を検出（---の後のテキストを削除）
  // ただし、---の後に見出し（#で始まる行）がある場合は削除しない
  const separatorIndex = body.lastIndexOf("\n---\n");
  if (separatorIndex !== -1) {
    // ---の後のテキストを取得（空行をスキップ）
    const afterSeparator = body.slice(separatorIndex + 5).replace(/^\n+/, "");
    // 見出し（#で始まる）でない場合は削除
    if (afterSeparator && !afterSeparator.startsWith("#")) {
      body = body.slice(0, separatorIndex).trim();
    }
  }

  return { title, body };
}