# Wiki Spec同期

実装コードの状態をもとに、WikiのSpec文書を自動更新・新規作成します。

**重要: このコマンドはwiki/ディレクトリのSpec-*.mdを更新します。**

## 引数

$ARGUMENTS

オプション:
- `--dry-run`: 変更内容を表示のみ（実際の更新なし）
- `--status-only`: ステータス更新のみ（新規spec作成なし）
- `--new-only`: 新規spec作成のみ（既存spec更新なし）

---

## フェーズ1: 情報収集

### 1.1 既存Specの収集

`wiki/Spec-*.md` ファイルを読み込み、以下を抽出：

```
ファイル: Spec-Plan-Issue.md
タイトル: 計画立案コマンド
ステータス: [x]（実装済み）
```

**抽出ルール:**
- タイトル行: `# [タイトル] [x]` または `# [タイトル] [ ]`
- `[x]` = 実装済み、`[ ]` = 未実装

### 1.2 実装コードの調査

以下を調査して実装済み機能を特定：

| 調査対象 | 判定基準 |
|----------|----------|
| `src/commands/*.ts` | export された関数 = CLIコマンド |
| `.claude/commands/*.md` | ファイル存在 = カスタムコマンド |
| `src/hooks/*.ts` | export された関数 = Hook機能 |
| `src/core/*.ts` | 主要なexport関数 = コア機能 |

### 1.3 マッピングテーブル

以下のマッピングで実装とspecを対応付け：

| 実装ファイル | Specファイル |
|-------------|-------------|
| `src/commands/plan-issue.ts` | `Spec-Plan-Issue.md` |
| `src/commands/issue-apply.ts` | `Spec-Issue-Apply.md` |
| `.claude/commands/commit.md` | `Spec-Commit.md` |
| `.claude/commands/gen-docs.md` | `Spec-Gen-Docs.md` |
| `src/hooks/create-issue.ts` | （plan-issueに含む） |

---

## フェーズ2: 差分分析

### 2.1 ステータス不整合の検出

各specについて、実装状態とステータスの整合性をチェック：

| ケース | アクション |
|--------|----------|
| spec `[ ]` だが実装あり | `[x]` に更新 |
| spec `[x]` だが実装なし | `[ ]` に更新（または確認） |
| spec存在、実装存在、一致 | 変更なし |

### 2.2 新規Spec候補の検出

実装はあるがspecがない機能を検出：

```
## 新規Spec候補

| 機能 | 実装ファイル | 提案Specファイル |
|------|-------------|-----------------|
| commitコマンド | .claude/commands/commit.md | Spec-Commit.md |
| gen-docsコマンド | .claude/commands/gen-docs.md | Spec-Gen-Docs.md |
```

### 2.3 差分サマリーの表示

```markdown
## 差分サマリー

### ステータス更新
- Spec-Plan-Issue.md: [ ] → [x]
- Spec-Example.md: [x] → [ ]

### 新規Spec作成
- Spec-Commit.md（commitコマンド）
- Spec-Gen-Docs.md（gen-docsコマンド）

### 変更なし
- Spec-Issue-Apply.md（一致）
```

`--dry-run`の場合はここで終了。

---

## フェーズ3: 更新実行

### 3.1 既存Specのステータス更新

タイトル行の`[x]`/`[ ]`を更新：

```markdown
# 計画立案コマンド [ ]
↓
# 計画立案コマンド [x]
```

### 3.2 新規Specの作成

以下のテンプレートで新規specを作成：

```markdown
# [機能名] [x]

[機能の1行説明]

## 目的

[この機能が必要な理由]

## 要件

- [要件1]
- [要件2]

## 入力

[入力フォーマット・オプション]

## 出力

[出力フォーマット]

## 期待される振る舞い

[ユーザー視点での動作フロー]

## 補足

[追加情報]
```

**Spec作成時の手順:**
1. 実装ファイルを読み込む
2. 機能の目的・要件・入出力を抽出
3. テンプレートに沿ってspec作成
4. `wiki/Spec-[機能名].md` に保存

### 3.3 Home.mdの更新

新規specを追加した場合、`wiki/Home.md`のSpec一覧を更新：

```markdown
### Spec（実装済み）
- [Spec: 計画立案コマンド](Spec-Plan-Issue)
- [Spec: Issue実装コマンド](Spec-Issue-Apply)
- [Spec: コミットコマンド](Spec-Commit)  ← 追加
```

---

## フェーズ4: 完了報告

### 4.1 更新サマリー

```markdown
## Wiki Spec同期完了

### 更新したSpec
- Spec-Plan-Issue.md: ステータス更新 [ ] → [x]

### 新規作成したSpec
- Spec-Commit.md
- Spec-Gen-Docs.md

### 変更なしのSpec
- Spec-Issue-Apply.md

### 次のステップ
1. 新規作成したspecの内容を確認・修正
2. `cd wiki && git add -A && git commit -m "docs: spec更新" && git push`
```

---

## 注意事項

- specの内容（目的、要件など）は自動更新しない（ステータスのみ）
- 新規spec作成時は実装から内容を推測するため、必ず確認が必要
- wiki/は別リポジトリなので、個別にcommit/pushが必要
- `--dry-run`で事前確認を推奨

---

## Specファイル命名規則

| 機能タイプ | 命名パターン | 例 |
|-----------|-------------|-----|
| CLIコマンド | `Spec-[Command].md` | `Spec-Issue-Apply.md` |
| カスタムコマンド | `Spec-[Command].md` | `Spec-Commit.md` |
| コア機能 | `Spec-[Feature].md` | `Spec-Milestone-Sync.md` |
| ビジョン | `Architecture-[Topic].md` | `Architecture-Vision.md` |
