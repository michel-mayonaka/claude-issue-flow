# ドキュメント生成

ソースコードを解析し、AIフレンドリーなドキュメントを`docs/`に生成・更新します。

**重要: このコマンドはdocs/ディレクトリにドキュメントを生成します。**

## 引数

$ARGUMENTS

オプション:
- `--full`: 差分に関わらず全ドキュメントを再生成
- `--dry-run`: 更新が必要なドキュメントを表示のみ（実際の更新なし）
- `--file <name>`: 特定のドキュメントのみ更新（architecture, api-reference, usage-guide, code-patterns）

---

## ディレクトリ構造

```
docs/
├── architecture.md              # 単一ファイル
├── api-reference/
│   ├── index.md                # 目次 + source_hash
│   ├── agent.md
│   ├── github.md
│   ├── worktree.md
│   ├── logger.md
│   ├── retry.md
│   ├── parsing.md
│   ├── init.md
│   ├── errors.md
│   └── commands.md
├── usage-guide/
│   ├── index.md                # 目次 + source_hash
│   ├── cli-commands.md
│   ├── custom-commands.md
│   └── environment.md
└── code-patterns/
    ├── index.md                # 目次 + source_hash
    ├── error-handling.md
    ├── prompt-building.md
    ├── testing.md
    └── naming-conventions.md
```

---

## フェーズ1: 状態確認

### 1.1 ディレクトリ確認

`docs/`ディレクトリの存在を確認。なければ作成。

### 1.2 既存ドキュメントの確認

以下のファイルが存在するか確認し、存在する場合はフロントマターから`source_hash`を取得：

- `docs/architecture.md`
- `docs/api-reference/index.md`
- `docs/usage-guide/index.md`
- `docs/code-patterns/index.md`

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

| ドキュメント | 状態 | 理由 |
|------------|------|------|
| architecture.md | 新規作成 | ファイル未存在 |
| api-reference/ | 更新対象 | ハッシュ不一致 |
| usage-guide/ | 更新不要 | ハッシュ一致 |
| code-patterns/ | 更新対象 | ハッシュ不一致 |
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

**出力先:** `docs/architecture.md`

---

### 3.2 api-reference/ の生成

**読み込むファイル:**
- `src/core/*.ts`（テストファイル除く）
- `src/types/*.ts`
- `src/commands/*.ts`

**生成ファイル:**

| ファイル | ソース | 内容 |
|---------|-------|------|
| index.md | - | 目次、source_hash |
| agent.md | src/core/agent.ts | runAgent, extractTextFromMessages等 |
| github.md | src/core/github.ts | fetchIssue, createIssue, createPullRequest等 |
| worktree.md | src/core/worktree.ts | createWorktree, commitChanges等 |
| logger.md | src/core/logger.ts | ExecutionLogger, generateRunId |
| retry.md | src/core/retry.ts | withRetry |
| parsing.md | src/core/parsing.ts | parsePlanMarkdown等 |
| init.md | src/core/init.ts | setupLogger |
| errors.md | src/types/errors.ts | AppError, 派生クラス |
| commands.md | src/commands/*.ts | issueApply, planIssue |

**index.mdフォーマット:**
```markdown
---
name: api-reference
description: 公開API・主要関数のリファレンス。引数、戻り値、使用例を記載。
generated_at: [ISO 8601形式]
source_hash: [計算したハッシュ]
files:
  - agent.md
  - github.md
  - ...
---

# APIリファレンス

## モジュール一覧

| ファイル | 説明 |
|---------|------|
| [agent.md](./agent.md) | Agent SDK連携 |
| ...
```

---

### 3.3 usage-guide/ の生成

**読み込むファイル:**
- `src/index.ts`（CLI定義）
- `.claude/commands/*.md`（カスタムコマンド）
- `CLAUDE.md`（環境設定）

**生成ファイル:**

| ファイル | 内容 |
|---------|------|
| index.md | 目次、source_hash |
| cli-commands.md | issue-apply, plan-issue の使い方 |
| custom-commands.md | /plan-issue, /commit, /gen-docs等 |
| environment.md | 環境設定、トラブルシューティング |

---

### 3.4 code-patterns/ の生成

**読み込むファイル:**
- `src/types/errors.ts`（エラーパターン）
- `src/prompts/*.ts`（プロンプトパターン）
- `src/**/*.test.ts`の一部（テストパターン）

**生成ファイル:**

| ファイル | 内容 |
|---------|------|
| index.md | 目次、source_hash |
| error-handling.md | AppError、カスタムエラー作成、キャッチ＆再スロー |
| prompt-building.md | プロンプト構造、スキル分離、出力パース |
| testing.md | モック、非同期ジェネレータ、エラーケース |
| naming-conventions.md | 命名規約、import規約、非同期パターン |

---

## フェーズ4: 完了報告

### 4.1 更新サマリーの表示

以下の形式で完了報告を表示：

```markdown
## ドキュメント生成完了

### 更新ファイル
- docs/architecture.md（新規作成）
- docs/api-reference/（更新: 10ファイル）
- docs/code-patterns/（更新: 5ファイル）

### 更新なし
- docs/usage-guide/（ハッシュ一致）

### 次のステップ
- 内容を確認して必要に応じて手動修正
- `/commit`でコミット
```

---

## 注意事項

- source_hashは各ディレクトリの`index.md`に集約される
- `--full`オプションはディレクトリ内の全ファイルを再生成
- 生成後は必ず内容を確認すること
- ドキュメントはAI向けの参照用であり、完璧である必要はない
