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
  global: true,
  optional: ["pr-draft"],
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
...
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

    if (titleMatch) {
      // パース成功
      return { title: titleMatch[1].trim(), body: "..." };
    }
  }

  return null;
}
```
