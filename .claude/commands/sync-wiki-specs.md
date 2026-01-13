# Wiki Spec同期

実装の状態をもとに、Spec文書を自動更新・新規作成します。

## Specの管理場所

| 種類 | Spec場所 | 説明 |
|------|----------|------|
| カスタムコマンド | `.claude/commands/*.md` | コマンド定義自体がspec |
| CLIコマンド | `wiki/Spec-*.md` | Wikiで管理 |
| コア機能 | `wiki/Spec-*.md` | Wikiで管理 |

**重要**: カスタムコマンド（`/commit`, `/gen-docs`等）は`.claude/commands/`の.mdファイル自体がspecです。Wikiに別途specを作成する必要はありません。

## 引数

$ARGUMENTS

オプション:
- `--dry-run`: 変更内容を表示のみ（実際の更新なし）
- `--status-only`: ステータス更新のみ（新規spec作成なし）
- `--new-only`: 新規spec作成のみ（既存spec更新なし）

---

## フェーズ1: 情報収集

### 1.1 カスタムコマンドSpec（.claude/commands/）

`.claude/commands/*.md` を一覧化：

```
/commit        - .claude/commands/commit.md
/gen-docs      - .claude/commands/gen-docs.md
/plan-issue    - .claude/commands/plan-issue.md
/sync-wiki-specs - .claude/commands/sync-wiki-specs.md
...
```

これらは**specとして完結**しており、Wikiへの追加は不要。

### 1.2 Wiki Spec（wiki/Spec-*.md）

`wiki/Spec-*.md` ファイルを読み込み、以下を抽出：

```
ファイル: Spec-Plan-Issue.md
タイトル: 計画立案コマンド
ステータス: [x]（実装済み）
```

**抽出ルール:**
- タイトル行: `# [タイトル] [x]` または `# [タイトル] [ ]`
- `[x]` = 実装済み、`[ ]` = 未実装

### 1.3 実装コードの調査

Wiki Specの対象となる実装を調査：

| 調査対象 | 判定基準 |
|----------|----------|
| `src/commands/*.ts` | export された関数 = CLIコマンド |
| `src/hooks/*.ts` | export された関数 = Hook機能 |
| `src/core/*.ts` | 主要なexport関数 = コア機能 |

**注意**: `.claude/commands/*.md`は調査対象外（自身がspec）

### 1.4 マッピングテーブル

Wiki Specと実装の対応付け：

| 実装ファイル | Wiki Specファイル |
|-------------|------------------|
| `src/commands/plan-issue.ts` | `wiki/Spec-Plan-Issue.md` |
| `src/commands/issue-apply.ts` | `wiki/Spec-Issue-Apply.md` |
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

実装（src/）はあるがWiki specがない機能を検出：

```
## 新規Spec候補

| 機能 | 実装ファイル | 提案Specファイル |
|------|-------------|-----------------|
| リトライ機能 | src/core/retry.ts | wiki/Spec-Retry.md |
| ロガー | src/core/logger.ts | wiki/Spec-Logger.md |
```

**注意**: カスタムコマンドは`.claude/commands/`自体がspecなので候補に含めない。

### 2.3 差分サマリーの表示

```markdown
## 差分サマリー

### カスタムコマンド（.claude/commands/）
| コマンド | ファイル |
|---------|---------|
| /commit | .claude/commands/commit.md |
| /gen-docs | .claude/commands/gen-docs.md |
| /plan-issue | .claude/commands/plan-issue.md |
| ... | ... |

### Wiki Spec ステータス更新
- Spec-Plan-Issue.md: [ ] → [x]
- Spec-Example.md: [x] → [ ]

### Wiki Spec 新規作成候補
- Spec-Retry.md（リトライ機能）

### Wiki Spec 変更なし
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

新規Wiki specを追加した場合、`wiki/Home.md`のSpec一覧を更新：

```markdown
### カスタムコマンド
.claude/commands/*.md を参照

### Spec（実装済み）
- [Spec: 計画立案コマンド](Spec-Plan-Issue)
- [Spec: Issue実装コマンド](Spec-Issue-Apply)
- [Spec: リトライ機能](Spec-Retry)  ← 追加
```

---

## フェーズ4: 完了報告

### 4.1 更新サマリー

```markdown
## Spec同期完了

### カスタムコマンドSpec（.claude/commands/）
7個のコマンドspec確認済み
- /commit, /gen-docs, /plan-issue, /sync-wiki-specs, ...

### Wiki Spec更新
- Spec-Plan-Issue.md: ステータス更新 [ ] → [x]

### Wiki Spec新規作成
- Spec-Retry.md

### Wiki Spec変更なし
- Spec-Issue-Apply.md

### 次のステップ
1. 新規作成したspecの内容を確認・修正
2. `cd wiki && git add -A && git commit -m "docs: spec更新" && git push`
```

---

## 注意事項

- **カスタムコマンドはWiki不要**: `.claude/commands/*.md`自体がspec
- specの内容（目的、要件など）は自動更新しない（ステータスのみ）
- 新規Wiki spec作成時は実装から内容を推測するため、必ず確認が必要
- wiki/は別リポジトリなので、個別にcommit/pushが必要
- `--dry-run`で事前確認を推奨

---

## Spec管理ルール

### カスタムコマンド（.claude/commands/）

| ファイル | 役割 |
|---------|------|
| `.claude/commands/commit.md` | /commitのspec |
| `.claude/commands/gen-docs.md` | /gen-docsのspec |
| `.claude/commands/plan-issue.md` | /plan-issueのspec |
| ... | ... |

**Wikiに別途specを作成する必要はない。**

### Wiki Spec（wiki/Spec-*.md）

| 機能タイプ | 命名パターン | 例 |
|-----------|-------------|-----|
| CLIコマンド | `Spec-[Command].md` | `Spec-Issue-Apply.md` |
| コア機能 | `Spec-[Feature].md` | `Spec-Milestone-Sync.md` |
| ビジョン | `Architecture-[Topic].md` | `Architecture-Vision.md` |
