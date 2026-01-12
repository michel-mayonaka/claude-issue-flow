---
name: test-run
description: テスト実行。コード変更時にテスト・型チェック・ビルドを実行し、問題があれば修正する。
---

# テスト実行

コード変更（`.ts`, `.js`, `.tsx`, `.jsx` 等）がある場合、以下を実行する。

## 実行コマンド

```bash
# 型チェック
npm run typecheck

# テスト実行
npm test

# ビルド確認
npm run build
```

## 失敗時の対応

テストが失敗した場合：

1. 失敗したテストの一覧を確認
2. エラー内容を分析
3. 修正が必要な箇所を特定
4. 修正を実施
5. 再度テストを実行

例：
```
### テスト失敗

**失敗したテスト**:
- src/core/logger.test.ts > ExecutionLogger > saveText > should save plain text

**エラー内容**:
Expected: "Hello\nWorld"
Received: "Hello\\nWorld"

**修正箇所**:
`src/core/logger.ts` の `saveText()` メソッドでエスケープ処理に問題があります。

**対応**: 修正を実施します。
```

## 注意事項

- テストが通るまで次のステップに進まない
- 型エラーも同様に修正する
- ビルドエラーがあれば修正する
