# ドキュメント生成

ソースコードを解析し、AIフレンドリーなドキュメントを`skills/docs/`に生成・更新します。

**重要: このコマンドはskills/docs/ディレクトリにドキュメントを生成します。**

## 引数

$ARGUMENTS

オプション:
- `--full`: 差分に関わらず全ドキュメントを再生成
- `--dry-run`: 更新が必要なドキュメントを表示のみ（実際の更新なし）
- `--file <name>`: 特定のドキュメントのみ更新（architecture, api-reference, usage-guide, code-patterns）

---

## フェーズ1: 状態確認

### 1.1 ディレクトリ確認

`skills/docs/`ディレクトリの存在を確認。なければ作成。

### 1.2 既存ドキュメントの確認

以下のファイルが存在するか確認し、存在する場合はフロントマターから`source_hash`を取得：

- `skills/docs/architecture.md`
- `skills/docs/api-reference.md`
- `skills/docs/usage-guide.md`
- `skills/docs/code-patterns.md`

### 1.3 現在のソースハッシュ計算

Bashで以下を実行してソースファイルのハッシュを計算：

```bash
# 全体ハッシュ（architecture用）
find src -name "*.ts" ! -name "*.test.ts" -exec cat {} \; | shasum -a 256 | cut -c1-16

# API関連ファイルハッシュ（api-reference用）
cat src/core/*.ts src/types/*.ts 2>/dev/null | shasum -a 256 | cut -c1-16

# CLI関連ファイルハッシュ（usage-guide用）
cat src/index.ts .claude/commands/*.md 2>/dev/null | shasum -a 256 | cut -c1-16

# パターン関連ファイルハッシュ（code-patterns用）
cat src/types/errors.ts src/prompts/*.ts 2>/dev/null | shasum -a 256 | cut -c1-16
```

---

## フェーズ2: 差分分析

### 2.1 更新判定

各ドキュメントについて以下の判定を行う：

| 条件 | 判定 |
|------|------|
| ドキュメント未存在 | 新規作成対象 |
| source_hashが不一致 | 更新対象 |
| source_hashが一致 | 更新不要 |
| `--full`オプション指定 | 全て更新対象 |
| `--file`オプション指定 | 指定ファイルのみ対象 |

### 2.2 更新計画の表示

以下の形式で更新計画を表示：

```
## ドキュメント更新計画

| ファイル | 状態 | 理由 |
|---------|------|------|
| architecture.md | 新規作成 | ファイル未存在 |
| api-reference.md | 更新対象 | ハッシュ不一致 |
| usage-guide.md | 更新不要 | ハッシュ一致 |
| code-patterns.md | 更新対象 | ハッシュ不一致 |
```

### 2.3 dry-runの場合

`--dry-run`オプションが指定されている場合、ここで処理を終了。

---

## フェーズ3: ドキュメント生成

更新対象のドキュメントを以下の手順で生成。

### 3.1 architecture.md の生成

**読み込むファイル:**
- `src/`ディレクトリ構造（Glob: `src/**/*.ts`）
- 各ディレクトリのindex.tsまたは主要ファイル
- `CLAUDE.md`（既存の説明参照）

**出力内容:**
1. モジュール構成（ディレクトリごとの責務）
2. レイヤー構造（types → core → prompts → commands → hooks）
3. 依存関係（import文から抽出）
4. データフロー（主要な処理の流れ）

**フォーマット:**
```markdown
---
name: architecture
description: プロジェクトのアーキテクチャ概要。モジュール構成、レイヤー構造、依存関係を説明。
generated_at: [ISO 8601形式]
source_hash: [計算したハッシュ]
---

# アーキテクチャ概要

## モジュール構成

### src/types/
[説明]

### src/core/
[説明]

...

## レイヤー構造

[図解]

## 依存関係

[主要な依存関係の説明]

## データフロー

### plan-issueフロー
[説明]

### issue-applyフロー
[説明]
```

---

### 3.2 api-reference.md の生成

**読み込むファイル:**
- `src/core/*.ts`（テストファイル除く）
- `src/types/*.ts`

**出力内容:**
1. 公開関数のシグネチャと説明
2. 型定義の説明
3. エラークラスの説明

**フォーマット:**
```markdown
---
name: api-reference
description: 公開API・主要関数のリファレンス。引数、戻り値、使用例を記載。
generated_at: [ISO 8601形式]
source_hash: [計算したハッシュ]
---

# APIリファレンス

## core/agent.ts

<!-- section: src/core/agent.ts -->

### runAgent

エージェントを実行する。

**シグネチャ:**
\`\`\`typescript
function runAgent(options: AgentOptions): Promise<AgentResult>
\`\`\`

**引数:**
- `options.prompt`: プロンプト文字列
- `options.allowedTools`: 許可するツールの配列
- ...

**戻り値:**
- `AgentResult`: 実行結果

<!-- /section: src/core/agent.ts -->

## core/github.ts

<!-- section: src/core/github.ts -->
...
<!-- /section: src/core/github.ts -->

...

## types/

### エラークラス

[AppError, AgentExecutionError等の説明]

### 型定義

[主要な型の説明]
```

---

### 3.3 usage-guide.md の生成

**読み込むファイル:**
- `src/index.ts`（CLI定義）
- `.claude/commands/*.md`（カスタムコマンド）
- `CLAUDE.md`（環境設定）

**出力内容:**
1. CLIコマンドの使い方
2. カスタムコマンドの使い方
3. 環境設定
4. よくある使用パターン

**フォーマット:**
```markdown
---
name: usage-guide
description: ツールの使い方ガイド。CLIコマンド、カスタムコマンド、環境設定を説明。
generated_at: [ISO 8601形式]
source_hash: [計算したハッシュ]
---

# 使い方ガイド

## CLIコマンド

### issue-apply

GitHub Issueを実装してPRを作成する。

**基本使用:**
\`\`\`bash
npm run dev -- issue-apply --issue <番号>
\`\`\`

**オプション:**
| オプション | 説明 | デフォルト |
|-----------|------|----------|
| `--issue` | Issue番号（必須） | - |
| `--model` | 使用モデル | haiku |
| `--skip-pr` | PR作成をスキップ | false |
| ...

### plan-issue

[説明]

## カスタムコマンド

### /plan-issue

[説明と使用例]

### /commit

[説明と使用例]

### /gen-docs

[説明と使用例]

## 環境設定

### 必須環境変数

| 変数名 | 説明 |
|-------|------|
| `GH_TOKEN` or `GITHUB_TOKEN` | GitHub Personal Access Token |
| `ANTHROPIC_API_KEY` | Anthropic API Key |

## よくある使用パターン

[典型的なワークフローの説明]
```

---

### 3.4 code-patterns.md の生成

**読み込むファイル:**
- `src/types/errors.ts`（エラーパターン）
- `src/prompts/*.ts`（プロンプトパターン）
- `src/**/*.test.ts`の一部（テストパターン）

**出力内容:**
1. エラーハンドリングパターン
2. プロンプト構築パターン
3. テストパターン
4. ファイル命名・import規約

**フォーマット:**
```markdown
---
name: code-patterns
description: コーディングパターンと規約。新規実装時の参考用。
generated_at: [ISO 8601形式]
source_hash: [計算したハッシュ]
---

# コーディングパターン

## エラーハンドリング

### AppError基底クラス

\`\`\`typescript
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly isRetryable: boolean = false,
    public readonly suggestion?: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
\`\`\`

### カスタムエラーの作成例

[例]

## プロンプト構築

### 構造

[説明]

### 例

[実際のコードから抽出]

## テストパターン

### モックの使用

[vitest, vi.mockの使用例]

### テストケース構造

[describe, it, expectの使用例]

## 命名規約

| 対象 | 規約 | 例 |
|-----|------|-----|
| ファイル名 | kebab-case | `issue-apply.ts` |
| 関数名 | camelCase | `createIssue` |
| クラス名 | PascalCase | `AppError` |
| 型/Interface | PascalCase | `AgentOptions` |
| 定数 | UPPER_SNAKE_CASE or camelCase | `DEFAULT_TIMEOUT` |

## import規約

- ESM形式を使用
- 相対パスには`.js`拡張子を付ける
- 型のみのimportは`import type`を使用
```

---

## フェーズ4: 完了報告

### 4.1 更新サマリーの表示

以下の形式で完了報告を表示：

```markdown
## ドキュメント生成完了

### 更新ファイル
- skills/docs/architecture.md（新規作成）
- skills/docs/api-reference.md（更新: 3セクション）
- skills/docs/code-patterns.md（更新: 全体）

### 更新なし
- skills/docs/usage-guide.md（ハッシュ一致）

### 次のステップ
- 内容を確認して必要に応じて手動修正
- `/commit`でコミット
```

---

## 注意事項

- セクションマーカー（`<!-- section: ... -->`）内の内容は自動更新される
- セクション外に手動で追加した内容は保持される（`--full`以外）
- `--full`オプションは手動追加内容も削除されるため注意
- 生成後は必ず内容を確認すること
- ドキュメントはAI向けの参照用であり、完璧である必要はない
