# agent.ts

Claude Code Agent SDKとの連携モジュール。

**ファイル**: `src/core/agent.ts`

## 関数

### runAgent

Agent SDKの`query`関数をラップし、エージェントを実行する。

```typescript
async function runAgent(options: AgentOptions): Promise<AgentResult>
```

#### AgentOptions

| プロパティ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| `prompt` | `string` | ✓ | エージェントへの指示 |
| `cwd` | `string` | ✓ | 作業ディレクトリ |
| `model` | `string` | - | 使用モデル（例: `claude-opus-4-5-20251101`） |
| `permissionMode` | `PermissionMode` | - | 権限モード（`default`, `bypassPermissions`, `plan`） |
| `allowedTools` | `string[]` | - | 許可するツール一覧 |
| `maxTurns` | `number` | - | 最大ターン数（デフォルト: 500） |
| `logger` | `ExecutionLogger` | - | ログ出力用ロガー |
| `appendSystemPrompt` | `string` | - | システムプロンプトに追加するテキスト |

#### AgentResult

| プロパティ | 型 | 説明 |
|-----------|---|------|
| `success` | `boolean` | 実行成功フラグ |
| `result` | `string` | 結果テキスト |
| `numTurns` | `number` | 実行ターン数 |
| `costUSD` | `number` | コスト（USD） |
| `durationMs` | `number` | 実行時間（ミリ秒） |
| `messages` | `SDKMessage[]` | 全メッセージ |

#### 使用例

```typescript
import { runAgent } from "./core/agent.js";

const result = await runAgent({
  prompt: "READMEファイルを読んで要約してください",
  cwd: "/path/to/repo",
  model: "claude-sonnet-4-5-20250929",
  permissionMode: "bypassPermissions",
  allowedTools: ["Read", "Glob", "Grep"],
  maxTurns: 100,
});

if (result.success) {
  console.log(`Result: ${result.result}`);
  console.log(`Cost: $${result.costUSD}`);
}
```

#### エラー

- `AgentExecutionError`: エージェント実行中のエラー

---

### extractTextFromMessages

メッセージ配列からアシスタントのテキスト応答を抽出する。

```typescript
function extractTextFromMessages(messages: SDKMessage[]): string
```

#### 引数

- `messages`: Agent SDKから返されたメッセージ配列

#### 戻り値

アシスタントメッセージのテキスト部分を結合した文字列。

#### 使用例

```typescript
const allText = extractTextFromMessages(result.messages);
console.log(allText);
```

---

### extractFinalMessage

メッセージ配列から最後のアシスタントテキストを取得する。

```typescript
function extractFinalMessage(messages: SDKMessage[]): string
```

#### 引数

- `messages`: Agent SDKから返されたメッセージ配列

#### 戻り値

最後のアシスタントメッセージのテキスト。見つからない場合は空文字列。

#### 使用例

```typescript
const finalMessage = extractFinalMessage(result.messages);
const prInfo = parsePRInfo(finalMessage);
```

---

## 再エクスポート

以下の型とオブジェクトがAgent SDKから再エクスポートされている：

```typescript
export { query, type Options, type SDKMessage, type PermissionMode };
```
