# parsing.ts

出力パースモジュール。Markdownから計画を抽出。

**ファイル**: `src/core/parsing.ts`

## 関数

### parsePlanMarkdown

Markdownコードブロックから計画を抽出する。

```typescript
function parsePlanMarkdown(content: string): ParsedPlan | null
```

#### 引数

- `content`: エージェント出力のテキスト全体

#### 戻り値

```typescript
interface ParsedPlan {
  title: string;  // 計画タイトル
  body: string;   // 計画本文
}
```

見つからない場合は`null`。

#### 検索パターン

1. ` ```markdown ... ``` ` ブロック内で `# 計画:` または `# Plan:` で始まるもの
2. 直接 `# 計画:` で始まる行

#### 使用例

```typescript
const allText = extractTextFromMessages(result.messages);
const plan = parsePlanMarkdown(allText);

if (plan) {
  console.log(`Title: ${plan.title}`);
  console.log(`Body: ${plan.body}`);
}
```

#### 入力例

````
調査結果を報告します。

```markdown
# 計画: ログ機能の改善

## 概要
ログ出力を改善する

## 実装ステップ
1. ログフォーマット変更
2. ログレベル追加
```

以上が計画です。
````

#### 出力例

```typescript
{
  title: "ログ機能の改善",
  body: "## 概要\nログ出力を改善する\n\n## 実装ステップ\n1. ログフォーマット変更\n2. ログレベル追加"
}
```

---

### parsePlanFromInput

直接入力されたテキストから計画をパースする。hooks用。

```typescript
function parsePlanFromInput(plan: string): ParsedPlan | null
```

#### 引数

- `plan`: 計画テキスト（`# 計画:` または `# Plan:` で始まる）

#### 戻り値

`ParsedPlan`オブジェクト、または見つからない場合は`null`。

#### 特殊処理

- 末尾の `\n---\n` 以降でヘッダー以外のテキストがある場合、その部分を除外

#### 使用例（hooks/create-issue.ts）

```typescript
const planContent = extractPlanFromTranscript(transcriptPath);
const parsed = parsePlanFromInput(planContent);

if (parsed) {
  await createIssue(cwd, {
    title: parsed.title,
    body: parsed.body,
  });
}
```
