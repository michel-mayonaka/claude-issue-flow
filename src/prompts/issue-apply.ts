import type { GitHubIssue } from "../core/github.js";

export interface IssueApplyPromptOptions {
  issue: GitHubIssue;
  skills: string;
}

export function buildIssueApplyPrompt(options: IssueApplyPromptOptions): string {
  return `# Agent Skills

${options.skills}

# タスク: GitHub Issue実装

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
5. **テスト**: 既存のテストが壊れないよう注意する

## 禁止事項

- logs/ ディレクトリへの変更
- 依頼範囲外のリファクタリング
- 不要なコメントの追加
- 推測に基づく大きな変更

## 出力フォーマット

実装完了後、以下の形式で最終レポートを出力してください：

\`\`\`
## 実装レポート

### 概要
（1-2文で変更内容を要約）

### 変更ファイル
- path/to/file1.ts: 変更内容
- path/to/file2.ts: 変更内容

### 受け入れ条件の確認
- [x] 条件1: 対応済み
- [x] 条件2: 対応済み
- [ ] 条件3: 要確認（理由）

### 確認コマンド
（動作確認用のコマンド）

### 注意事項
（レビュー時に確認してほしい点など）
\`\`\`

## PR情報

最後に、PR作成用の情報を以下のYAML形式で出力してください：

\`\`\`yaml
pr_title: "PRタイトル（簡潔に）"
pr_body: |
  ## 概要
  - 変更内容の要約

  ## 変更点
  - 変更1
  - 変更2

  ## 確認方法
  動作確認の手順

  Closes #${options.issue.number}
\`\`\`
`;
}

export function parsePRInfo(content: string): {
  title: string;
  body: string;
} | null {
  // Extract YAML block for PR info
  const yamlMatch = content.match(/```yaml\s*([\s\S]*?)```/g);

  if (!yamlMatch) {
    return null;
  }

  // Find the PR info block (last yaml block or one with pr_title)
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

export function generateDefaultPRBody(
  issue: GitHubIssue,
  finalMessage: string
): string {
  return `## 概要

Issue #${issue.number} の実装

## 変更点

${finalMessage.slice(0, 1000)}...

## 関連Issue

Closes #${issue.number}
`;
}
