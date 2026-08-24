# 第三章：四層套件架構

Pi 的架構就像俄羅斯套娃，每一層都有明確的職責。理解這個架構，是掌握 Pi 的關鍵。

## 3.1 架構總覽

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  pi-coding-agent                      │  │
│  │  CLI + TUI + Extensions + Tools + Skills              │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  pi-agent-core                        │  │
│  │  Agent Loop + State Management + Event System         │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    pi-ai                              │  │
│  │  Multi-provider LLM API + Auth + Streaming            │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    pi-tui                             │  │
│  │  Terminal UI Library + Components + Themes             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 3.2 第一層：pi-tui - Terminal UI Library

**職責**：終端機介面的渲染與互動

```
pi-tui/
├── dist/
│   ├── components/      ← UI 組件
│   ├── index.js         ← 入口
│   └── ...
└── native/              ← 原生相容層
    ├── darwin/          ← macOS
    └── win32/           ← Windows
```

### 核心功能

- **Differential Rendering**：只重繪改變的部分，效率更高
- **Keyboard Handling**：完整的鍵盤事件處理
- **Theme System**：可自訂的颜色主題
- **Cross-platform**：支援 Linux、macOS、Windows

### 為什麼分離 TUI？

```typescript
// pi-tui 是獨立的，可以被其他工具使用
import { Terminal } from "@earendil-works/pi-tui";

const term = new Terminal();
term.on("key", (key) => {
  // 處理鍵盤輸入
});
```

這種分離讓 Pi 的 TUI 可以被替換或擴展，而不影響核心邏輯。

## 3.3 第二層：pi-ai - Multi-provider LLM API

**職責**：統一的 LLM API 抽象層

```
pi-ai/
├── dist/
│   ├── api/                    ← API 實作
│   │   ├── anthropic-messages.js
│   │   ├── openai-responses.js
│   │   ├── google-generative-ai.js
│   │   └── ...
│   ├── providers/              ← Provider 實作
│   │   ├── anthropic.js
│   │   ├── openai.js
│   │   ├── google.js
│   │   ├── groq.js
│   │   └── ...15+ providers
│   ├── auth/                   ← 認證系統
│   │   └── oauth/
│   │       ├── anthropic.js
│   │       ├── openai.js
│   │       └── ...
│   └── utils/                  ← 工具函數
│       ├── event-stream.js
│       ├── retry.js
│       └── ...
```

### 統一 API 設計

```typescript
// 無論使用哪個 provider，介面都相同
import { streamSimple } from "@earendil-works/pi-ai";

const response = await streamSimple(
  { provider: "anthropic", id: "claude-sonnet-4-20250514" },
  {
    systemPrompt: "You are a helpful assistant",
    messages: [{ role: "user", content: "Hello" }],
    tools: []
  },
  { apiKey: "sk-ant-..." }
);

for await (const event of response) {
  // 統一的事件格式
}
```

### 15+ Providers 支援

| Provider | 支援模型 |
|----------|----------|
| Anthropic | Claude 3.5 Sonnet, Claude 3 Opus |
| OpenAI | GPT-4o, GPT-4 Turbo |
| Google | Gemini 1.5 Pro, Gemini 1.5 Flash |
| Azure | OpenAI 模型 |
| AWS Bedrock | Anthropic, Meta 模型 |
| Groq | Llama 3, Mixtral |
| Cerebras | Llama 3 |
| xAI | Grok |
| Ollama | 本地模型 |
| ... | 更多 |

### OAuth 認證

```typescript
// pi-ai 支援 OAuth 認證
import { OAuthManager } from "@earendil-works/pi-ai/auth";

const manager = new OAuthManager();
const token = await manager.authenticate("anthropic");
// 自動處理 token 刷新
```

## 3.4 第三層：pi-agent-core - Agent Runtime

**職責**：Agent 的核心邏輯

```
pi-agent-core/
├── dist/
│   ├── agent.js              ← Agent 類別 (422 行)
│   ├── agent-loop.js         ← Agent Loop (553 行)
│   ├── stream-fn.js          ← Stream 函數
│   └── harness/
│       └── agent-harness.js  ← Harness 抽象 (252 行)
```

### 核心元件

#### Agent Loop（553 行）

```typescript
// agent-loop.js 核心邏輯
async function runLoop(context, newMessages, config, signal, emit, streamFunction) {
  while (true) {
    // 1. 處理 pending messages
    // 2. Stream LLM response
    // 3. 執行 tool calls
    // 4. 檢查是否停止
    // 5. 重複或退出
  }
}
```

#### Agent 類別（422 行）

```typescript
// agent.js 核心介面
class Agent {
  state: {
    messages: Message[];
    tools: Tool[];
    model: Model;
    isStreaming: boolean;
  };
  
  subscribe(listener: Function): Unsubscribe;
  prompt(input: string): Promise<void>;
  continue(): Promise<void>;
  abort(): void;
  steer(message: string): void;
  followUp(message: string): void;
}
```

### 為什麼分離核心？

1. **可測試性**：核心邏輯不依賴 UI
2. **可嵌入性**：可以在 Node.js 應用中使用
3. **可替換性**：可以更換 TUI 或 CLI

## 3.5 第四層：pi-coding-agent - CLI + Extensions

**職責**：完整的 coding agent 應用

```
pi-coding-agent/
├── dist/
│   ├── cli.js                ← CLI 入口
│   ├── core/                 ← 核心邏輯
│   │   ├── agent-session.js  ← Session 管理 (2686 行)
│   │   ├── system-prompt.js  ← System prompt (110 行)
│   │   ├── extensions/       ← Extension 系統
│   │   ├── tools/            ← 4 個預設工具
│   │   ├── compaction/       ← Context 壓縮
│   │   └── ...
│   ├── modes/                ← 運行模式
│   │   ├── interactive/      ← TUI 模式
│   │   ├── rpc/              ← RPC 模式
│   │   └── print/            ← Print 模式
│   └── extensions/           ← 內建 Extensions
│       └── llama/            ← llama.cpp 整合
├── docs/                     ← 文件
└── examples/                 ← 範例
```

### 核心檔案大小

| 檔案 | 行數 | 功能 |
|------|------|------|
| agent-session.js | 2,686 | Session 管理主類 |
| agent-loop.js | 553 | 核心 Agent loop |
| agent.js | 422 | Agent 狀態管理 |
| system-prompt.js | 110 | System prompt 建構 |

## 3.6 套件間通訊

```
pi-coding-agent
      │
      │ 調用
      ↓
pi-agent-core
      │
      │ 使用
      ↓
pi-ai
      │
      │ 依賴
      ↓
pi-tui
```

### 通訊範例

```typescript
// pi-coding-agent 使用 pi-agent-core
import { Agent } from "@earendil-works/pi-agent-core";

const agent = new Agent({
  model: { provider: "anthropic", id: "claude-sonnet-4-20250514" },
  streamFn: streamSimple  // 來自 pi-ai
});

// pi-agent-core 使用 pi-ai
// streamSimple 處理 LLM 通訊

// pi-ai 使用 pi-tui（間接）
// TUI 只負責顯示，不參與核心邏輯
```

## 3.7 依賴關係圖

```
@earendil-works/pi-coding-agent
├── @earendil-works/pi-agent-core
├── @earendil-works/pi-ai
├── @earendil-works/pi-tui
├── @earendil-works/pi-protocol
├── @earendil-works/pi-client
└── @earendil-works/pi-telemetry
```

### 為什麼使用 scope？

```json
// package.json
{
  "name": "@earendil-works/pi-coding-agent",
  "dependencies": {
    "@earendil-works/pi-agent-core": "^0.84.2",
    "@earendil-works/pi-ai": "^0.84.2",
    "@earendil-works/pi-tui": "^0.84.2"
  }
}
```

使用 `@earendil-works` scope 可以：
1. 避免命名衝突
2. 明確歸屬
3. 統一版本控制

## 3.8 這種架構的優勢

### 1. 關注點分離

每層只做一件事：
- **pi-tui**：只管 UI 渲染
- **pi-ai**：只管 LLM 通訊
- **pi-agent-core**：只管 agent 邏輯
- **pi-coding-agent**：整合一切

### 2. 可替換性

```typescript
// 可以替換 TUI
const myCustomUI = new MyCustomUI();
// 可以替換 LLM provider
const myCustomLLM = new MyCustomLLM();
// 可以只使用核心
const agent = new Agent({ ... });
```

### 3. 可測試性

```typescript
// 每層都可以獨立測試
describe("pi-agent-core", () => {
  it("should handle tool calls", async () => {
    const agent = new Agent({ ... });
    // 測試核心邏輯，不依賴 UI
  });
});
```

### 4. 可嵌入性

```typescript
// 可以嵌入到任何 Node.js 應用
import { Agent } from "@earendil-works/pi-agent-core";

const app = express();
const agent = new Agent();

app.post("/api/code-review", async (req, res) => {
  await agent.prompt(`Review: ${req.body.code}`);
  res.json({ review: agent.state.messages.pop() });
});
```

## 3.9 與其他框架比較

| 架構 | Pi | Claude Code | OpenCode |
|------|-----|-------------|----------|
| 套件數 | 4 個獨立套件 | 單一套件 | 單一套件 |
| TUI | 可替換 | 固定 | 固定 |
| LLM API | 統一抽象 | 以 Anthropic 為主 | 多 provider |
| 核心代碼 | 可獨立使用 | 與應用耦合 | 與應用耦合 |
| 嵌入性 | ✅ 容易 | ❌ 困難 | ⚠️ 有限 |

---

> **下一步**：深入 Agent Loop 核心，理解 553 行代碼如何運作。
