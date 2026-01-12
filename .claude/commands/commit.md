# コミットとプッシュ

現在のブランチで変更をレビューし、コミット・プッシュします。

**重要: ドキュメント整合性チェック、テスト整合性チェック、またはテスト実行で問題を検出した場合は、コミットせずに停止してください。**

## 手順

### 1. 変更内容の確認

以下のコマンドを実行して変更状況を把握：

```bash
git status
git diff
git diff --cached
git log --oneline -5
```

### 2. ドキュメント整合性チェック

@skills/global/doc-check.md の手順に従ってチェックを実施。

### 3. テスト整合性チェック

@skills/global/test-check.md の手順に従ってチェックを実施。

### 4. 問題検出時の対応

問題を発見した場合は**必ず以下を実行**：

1. 具体的な問題箇所を指摘する
2. 修正案を提案する
3. **コミットせずに停止する**
4. ユーザーに判断を仰ぐ

### 5. テスト実行（コード変更時）

@skills/global/test-run.md の手順に従ってテストを実行。

テストが失敗した場合は**コミットせずに停止**し、ユーザーに報告する。

### 6. コミット実行

テストが通ったら：

1. 適切なファイルをステージング（`git add`）
2. Conventional Commits形式でコミットメッセージを作成
   - 日本語で記述
   - type: feat/fix/docs/style/refactor/test/chore
3. コミット実行（Co-Authored-Byトレーラー付与）
4. リモートにプッシュ（`git push`）
5. 結果を報告

## コミットメッセージ規約

```
<type>: <説明>

[本文（任意）]

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Type一覧
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更
- `refactor`: バグ修正や機能追加ではないコード変更
- `test`: テストの追加・修正
- `chore`: ビルドプロセスやツールの変更

## 注意事項

- 機密情報（.env, credentials等）をコミットしないこと
- force pushは行わないこと
- mainブランチへの直接pushは確認を取ること
