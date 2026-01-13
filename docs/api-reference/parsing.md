# core/parsing.ts

テキストパース処理モジュール。

## parsePlanMarkdown

エージェント出力から計画を抽出する。

**シグネチャ:**
```typescript
function parsePlanMarkdown(content: string): ParsedPlan | null
```

**引数:**
- `content`: string - エージェントの出力テキスト

**戻り値:**
```typescript
interface ParsedPlan {
  title: string;  // 計画タイトル
  body: string;   // 計画本文
}
```
`null` - 計画が見つからない場合

**対応フォーマット:**
- ````markdown\n# 計画: タイトル\n...````
- `# 計画: タイトル`（直接記載）

---

## parsePlanFromInput

入力テキストから計画を抽出する（hookで使用）。

**シグネチャ:**
```typescript
function parsePlanFromInput(plan: string): ParsedPlan | null
```

**引数:**
- `plan`: string - 計画を含むテキスト

**戻り値:**
- ParsedPlan | null - パースされた計画、または見つからない場合null
