# core/agent.ts

Agent SDK連携モジュール。

## runAgent

エージェントを実行する。

**シグネチャ:**
```typescript
function runAgent(options: AgentOptions): Promise<AgentResult>
```

**引数:**
- `options.prompt`: string - エージェントに送信するプロンプト
- `options.cwd`: string - 作業ディレクトリ
- `options.model?`: string - 使用するモデル名（例: `claude-opus-4-5-20251101`）
- `options.permissionMode?`: PermissionMode - 権限モード（`"default"` | `"plan"` | `"bypassPermissions"`）
- `options.allowedTools?`: string[] - 許可するツールのリスト
- `options.maxTurns?`: number - 最大ターン数（デフォルト: 500）
- `options.logger?`: ExecutionLogger - ログ出力用ロガー
- `options.appendSystemPrompt?`: string - システムプロンプトに追加するテキスト

**戻り値:**
```typescript
interface AgentResult {
  success: boolean;      // 実行が成功したか
  result: string;        // 結果テキスト
  numTurns: number;      // 実行ターン数
  costUSD: number;       // コスト（USD）
  durationMs: number;    // 実行時間（ミリ秒）
  messages: SDKMessage[]; // 全メッセージ
}
```

**使用例:**
```typescript
const result = await runAgent({
  prompt: "ファイルを読んで要約してください",
  cwd: "/path/to/repo",
  model: "claude-opus-4-5-20251101",
  permissionMode: "plan",
  allowedTools: ["Read", "Glob", "Grep"],
  maxTurns: 100,
  appendSystemPrompt: skills,
});
```

---

## extractTextFromMessages

メッセージ配列からテキストコンテンツを抽出して結合する。

**シグネチャ:**
```typescript
function extractTextFromMessages(messages: SDKMessage[]): string
```

**引数:**
- `messages`: SDKMessage[] - エージェント実行結果のメッセージ配列

**戻り値:**
- string - 全アシスタントメッセージのテキストを結合した文字列

---

## extractFinalMessage

最後のアシスタントメッセージのテキストを取得する。

**シグネチャ:**
```typescript
function extractFinalMessage(messages: SDKMessage[]): string
```

**引数:**
- `messages`: SDKMessage[] - エージェント実行結果のメッセージ配列

**戻り値:**
- string - 最後のアシスタントメッセージのテキスト（見つからない場合は空文字）
