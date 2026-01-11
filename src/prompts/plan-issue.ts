export interface PlanIssuePromptOptions {
  request: string;
  additionalContext?: string;
}

export function buildPlanIssuePrompt(options: PlanIssuePromptOptions): string {
  return `# タスク: 対話的な実装計画の立案

以下の依頼をもとに、ユーザーと対話しながら実装計画を立案してください。

## 依頼内容
\`\`\`
${options.request}
\`\`\`
${options.additionalContext ? `\n## 追加コンテキスト\n${options.additionalContext}\n` : ""}

## 進め方

### フェーズ1: 初期理解と調査
1. コードベースを調査する（Glob, Grep, Readツールを使用）
2. 依頼内容の理解を深め、不明点があれば **AskUserQuestion** ツールで質問する
   - 要件の明確化が必要な場合
   - 複数のアプローチがあり選択が必要な場合
   - スコープの確認が必要な場合

### フェーズ2: 計画立案
調査と質問が完了したら、実装計画を立案する。

### フェーズ3: 計画の提示と確認
計画を以下のMarkdown形式で出力し、**AskUserQuestion** でユーザーの承認を求める。

## 計画の出力形式

以下のMarkdown形式で計画を出力してください：

\`\`\`markdown
# 計画: [タイトル]

## 概要
[この計画で実現すること]

## 背景
[なぜこの変更が必要か]

## 変更対象
- \`path/to/file1.ts\`: [変更内容]
- \`path/to/file2.ts\`: [変更内容]

## 実装ステップ
1. [ステップ1の詳細]
2. [ステップ2の詳細]
3. [ステップ3の詳細]

## 受け入れ条件
- [ ] [条件1]
- [ ] [条件2]
- [ ] [条件3]

## 確認方法
[テストコマンドや確認手順]

## 注意事項
- [注意点1]
- [注意点2]
\`\`\`

## 重要: 計画の詳細度

この計画は**Haikuモデル（軽量モデル）**で実装されます。
そのため、計画は非常に具体的で明確である必要があります：

- **変更するファイル**: 具体的なファイルパスを記載
- **変更内容**: 何をどう変更するか具体的に記載
- **実装ステップ**: 順序立てて具体的に
- **受け入れ条件**: モデルが自己判断できる具体的な基準

曖昧な指示や抽象的な表現は避け、実装者が迷わないレベルまで詳細化してください。

## 最終確認

計画を出力したら、必ず **AskUserQuestion** で以下を確認してください：
- 「この計画でよろしいですか？」
- 選択肢: 「承認」「修正が必要」「やり直し」

ユーザーが「承認」を選択するまで、フィードバックを反映して計画を修正してください。
`;
}

export interface ParsedPlan {
  title: string;
  body: string;
}

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

// 後方互換性のため残す（テストで使用）
export function parseIssueYaml(content: string): {
  title: string;
  body: string;
  labels: string[];
  assignees: string[];
}[] {
  const plan = parsePlanMarkdown(content);
  if (!plan) {
    return [];
  }
  return [{
    title: plan.title,
    body: plan.body,
    labels: [],
    assignees: [],
  }];
}
