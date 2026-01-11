export interface PlanIssuePromptOptions {
  request: string;
  additionalContext?: string;
}

export function buildPlanIssuePrompt(options: PlanIssuePromptOptions): string {
  return `# タスク: 実装計画とIssue作成

以下の依頼をもとに、作業計画を立案し、GitHub Issue形式で出力してください。

## 依頼内容
\`\`\`
${options.request}
\`\`\`
${options.additionalContext ? `\n## 追加コンテキスト\n${options.additionalContext}\n` : ""}
## 手順

1. **要件整理**: 目的・背景・スコープを整理する
2. **調査**: 必要に応じてコードベースを調査する（Glob, Grep, Readツールを使用）
3. **計画立案**: 具体的なタスク分解と実装順序を決定
4. **Issue作成**: 下記フォーマットでIssue内容を出力

## 重要: 計画の詳細度

このIssueは**Haikuモデル（軽量モデル）**で実装されます。
そのため、計画は非常に具体的で明確である必要があります：

- **変更するファイル**: 具体的なファイルパスを記載
- **変更内容**: 何をどう変更するか具体的に記載
- **実装方針**: どのようなアプローチで実装するか
- **受け入れ条件**: モデルが自己判断できる具体的な基準

曖昧な指示や抽象的な表現は避け、実装者が迷わないレベルまで詳細化してください。

## Issue出力形式

最終的に以下のYAML形式で出力してください。
必ず \`\`\`yaml と \`\`\` で囲んでください。

\`\`\`yaml
title: "Issueタイトル（簡潔で具体的に）"
body: |
  ## 背景
  なぜこの変更が必要か

  ## 目的
  この変更で何を実現するか

  ## 作業範囲
  - 変更対象ファイル1: 変更内容の概要
  - 変更対象ファイル2: 変更内容の概要

  ## 実装方針
  具体的な実装アプローチ（使用するライブラリ、パターンなど）

  ## 受け入れ条件
  - [ ] 条件1（具体的で検証可能な基準）
  - [ ] 条件2（具体的で検証可能な基準）
  - [ ] 条件3（具体的で検証可能な基準）

  ## 技術的詳細
  - 詳細1
  - 詳細2

  ## 確認方法
  実装後の動作確認方法（コマンド、テスト手順など）

  ## 注意事項
  - 実装時に注意すべき点
labels:
  - enhancement
assignees: []
\`\`\`

## 注意

- 複数Issueに分割すべき場合は、複数のYAMLブロックを出力してください
- 不明点や確認が必要な点は「要確認」として明記してください
- 受け入れ条件は、実装モデル（Haiku）が判断できる具体的な基準にしてください
`;
}

export function parseIssueYaml(content: string): {
  title: string;
  body: string;
  labels: string[];
  assignees: string[];
}[] {
  const issues: {
    title: string;
    body: string;
    labels: string[];
    assignees: string[];
  }[] = [];

  // Extract YAML blocks from the content
  const yamlBlockRegex = /```yaml\s*([\s\S]*?)```/g;
  let match;

  while ((match = yamlBlockRegex.exec(content)) !== null) {
    const yamlContent = match[1].trim();

    // Simple YAML parsing for our specific format
    const titleMatch = yamlContent.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    const labelsMatch = yamlContent.match(/labels:\s*\n((?:\s*-\s*.+\n?)*)/);
    const assigneesMatch = yamlContent.match(
      /assignees:\s*\n((?:\s*-\s*.+\n?)*)/
    );

    // Extract body (everything between body: | and labels:)
    const bodyMatch = yamlContent.match(
      /body:\s*\|\s*\n([\s\S]*?)(?=\nlabels:|$)/
    );

    if (titleMatch) {
      const title = titleMatch[1].trim();
      const body = bodyMatch
        ? bodyMatch[1]
            .split("\n")
            .map((line) => {
              // Remove leading indentation (2 spaces)
              return line.startsWith("  ") ? line.slice(2) : line;
            })
            .join("\n")
            .trim()
        : "";

      const labels = labelsMatch
        ? labelsMatch[1]
            .split("\n")
            .filter((l) => l.trim())
            .map((l) => l.replace(/^\s*-\s*["']?/, "").replace(/["']?\s*$/, ""))
        : [];

      const assignees = assigneesMatch
        ? assigneesMatch[1]
            .split("\n")
            .filter((a) => a.trim())
            .map((a) => a.replace(/^\s*-\s*["']?/, "").replace(/["']?\s*$/, ""))
        : [];

      issues.push({ title, body, labels, assignees });
    }
  }

  return issues;
}
