# プロンプト構築

## 構造

プロンプトはテンプレート関数で構築する：

```typescript
export interface MyPromptOptions {
  // 必須パラメータ
  task: string;
  // オプションパラメータ
  additionalContext?: string;
}

export function buildMyPrompt(options: MyPromptOptions): string {
  return `# タスク

${options.task}

${options.additionalContext ? `## 追加コンテキスト\n${options.additionalContext}\n` : ""}

## 実行ルール

1. ルール1
2. ルール2

## 出力フォーマット

\`\`\`
期待する出力形式
\`\`\`
`;
}
```

## スキルの分離

スキル（ルール・制約）はプロンプト本文から分離し、`appendSystemPrompt`で渡す：

```typescript
// スキルを読み込み
const skills = await loadSkills({
  global: true,            // skills/global/*.md を読み込み
  optional: ["pr-draft"],  // skills/optional/pr-draft.md を読み込み
});

// タスクのみをプロンプトに
const prompt = buildIssueApplyPrompt({ issue });

// スキルはシステムプロンプトに追加
const result = await runAgent({
  prompt,
  appendSystemPrompt: skills,
  // ...
});
```

## skills.ts のパターン

```typescript
export async function loadSkills(options: LoadSkillsOptions): Promise<string> {
  const parts: string[] = [];

  // globalスキルを読み込み
  if (options.global) {
    const globalDir = join(SKILLS_ROOT, "global");
    const files = await readdir(globalDir);
    const mdFiles = files.filter((f) => f.endsWith(".md")).sort();

    for (const file of mdFiles) {
      const content = await readFile(join(globalDir, file), "utf-8");
      parts.push(`## skill: skills/global/${file}\n\n${content}`);
    }
  }

  // optionalスキルを読み込み
  if (options.optional) {
    for (const name of options.optional) {
      const content = await readFile(join(optionalDir, `${name}.md`), "utf-8");
      parts.push(`## skill: skills/optional/${name}.md\n\n${content}`);
    }
  }

  return parts.join("\n\n");
}
```

## Issue実装プロンプトの例

```typescript
export function buildIssueApplyPrompt(options: IssueApplyPromptOptions): string {
  return `# タスク: GitHub Issue実装

以下のIssueの内容を実装してください。

## Issue情報

- **Title**: ${options.issue.title}
- **Number**: #${options.issue.number}
- **URL**: ${options.issue.url}
- **Labels**: ${options.issue.labels.join(", ") || "なし"}

## Issue本文

\`\`\`markdown
${options.issue.body}
\`\`\`

## 実装ルール

1. **受け入れ条件を最優先**: Issueの「受け入れ条件」を全て満たすこと
2. **不明点は明記**: 判断できない点は「要確認」として明記
3. **最小限の変更**: 依頼内容に必要な変更のみ行う
4. **既存パターンを踏襲**: コードベースの既存スタイル・パターンに従う

## 出力フォーマット

実装完了後、以下の形式で最終レポートを出力してください...

## PR情報

最後に、PR作成用の情報を以下のYAML形式で出力してください：

\`\`\`yaml
pr_title: "PRタイトル"
pr_body: |
  ## 概要
  ...
\`\`\`
`;
}
```

## 出力パース関数の例

```typescript
export function parsePRInfo(content: string): { title: string; body: string } | null {
  // YAMLブロックを検索
  const yamlMatch = content.match(/```yaml\s*([\s\S]*?)```/g);
  if (!yamlMatch) {
    return null;
  }

  // 最後のYAMLブロックから情報を抽出
  for (const block of yamlMatch.reverse()) {
    const yamlContent = block.replace(/```yaml\s*/, "").replace(/```$/, "");
    const titleMatch = yamlContent.match(/pr_title:\s*["']?(.+?)["']?\s*$/m);
    const bodyMatch = yamlContent.match(/pr_body:\s*\|\s*\n([\s\S]*?)(?=\n[a-z_]+:|$)/);

    if (titleMatch) {
      const title = titleMatch[1].trim();
      let body = "";

      if (bodyMatch) {
        body = bodyMatch[1]
          .split("\n")
          .map((line) => (line.startsWith("  ") ? line.slice(2) : line))
          .join("\n")
          .trim();
      }

      return { title, body };
    }
  }

  return null;
}
```

## 計画パースの例

```typescript
export function parsePlanMarkdown(content: string): ParsedPlan | null {
  // ```markdown ブロック内で # 計画: を探す
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

  // タイトルと本文を抽出
  if (planContent) {
    const titleMatch = planContent.match(/^# 計画:\s*(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : "実装計画";
    const bodyLines = planContent.split("\n").slice(1);
    const body = bodyLines.join("\n").trim();
    return { title, body };
  }

  return null;
}
```
