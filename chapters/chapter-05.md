# 第五章：Agent 類別（422 行）

Agent 類別是 pi-agent-core 的門面，封裝了所有複雜度，提供簡潔的 API。

## 5.1 類別結構

```typescript
// agent.js 核心結構
export class Agent {
  // 私有狀態
  _state: MutableAgentState;
  listeners: Set<Function>;
  steeringQueue: PendingMessageQueue;
  followUpQueue: PendingMessageQueue;
  
  // 配置
  convertToLlm: Function;
  transformContext: Function;
  streamFunction: Function;
  getApiKey: Function;
  
  // Hooks
  beforeToolCall: Function;
  afterToolCall: Function;
  shouldStopAfterTurn: Function;
  prepareNextTurn: Function;
  
  // 運行時
  activeRun: ActiveRun | undefined;
  sessionId: string;
  
  constructor(options: AgentOptions) { ... }
}
```

## 5.2 狀態管理

### MutableAgentState

```typescript
// agent.js 第 26-50 行
function createMutableAgentState(initialState) {
  let tools = initialState?.tools?.slice() ?? [];
  let messages = initialState?.messages?.slice() ?? [];
  
  return {
    systemPrompt: initialState?.systemPrompt ?? "",
    model: initialState?.model ?? DEFAULT_MODEL,
    thinkingLevel: initialState?.thinkingLevel ?? "off",
    
    get tools() {
      return tools;
    },
    set tools(nextTools) {
      tools = nextTools.slice();  // 複製，避免外部修改
    },
    
    get messages() {
      return messages;
    },
    set messages(nextMessages) {
      messages = nextMessages.slice();  // 複製，避免外部修改
    },
    
    isStreaming: false,
    streamingMessage: undefined,
    pendingToolCalls: new Set(),
    errorMessage: undefined,
  };
}
```

### 狀態圖

```
┌─────────────────────────────────────────────────────┐
│                  Agent State                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  systemPrompt: string                               │
│  model: Model                                       │
│  thinkingLevel: "off" | "minimal" | "low" | ...    │
│                                                     │
│  messages: Message[]        ← 完整對話歷史          │
│  tools: Tool[]             ← 可用工具               │
│                                                     │
│  isStreaming: boolean       ← 是否正在 streaming    │
│  streamingMessage: Message ← 當前 streaming 訊息    │
│  pendingToolCalls: Set     ← 執行中的 tool calls    │
│  errorMessage: string      ← 錯誤訊息               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 5.3 事件系統

### subscribe

```typescript
// agent.js 第 146-149 行
subscribe(listener) {
  this.listeners.add(listener);
  return () => this.listeners.delete(listener);  // 返回 unsubscribe 函數
}
```

### processEvents

```typescript
// agent.js 第 380-420 行
async processEvents(event) {
  // 1. 更新內部狀態
  switch (event.type) {
    case "message_start":
      this._state.streamingMessage = event.message;
      break;
    case "message_update":
      this._state.streamingMessage = event.message;
      break;
    case "message_end":
      this._state.streamingMessage = undefined;
      this._state.messages.push(event.message);
      break;
    case "tool_execution_start": {
      const pendingToolCalls = new Set(this._state.pendingToolCalls);
      pendingToolCalls.add(event.toolCallId);
      this._state.pendingToolCalls = pendingToolCalls;
      break;
    }
    case "tool_execution_end": {
      const pendingToolCalls = new Set(this._state.pendingToolCalls);
      pendingToolCalls.delete(event.toolCallId);
      this._state.pendingToolCalls = pendingToolCalls;
      break;
    }
    case "agent_end":
      this._state.streamingMessage = undefined;
      break;
  }
  
  // 2. 通知所有 listeners
  const signal = this.activeRun?.abortController.signal;
  for (const listener of this.listeners) {
    await listener(event, signal);
  }
}
```

### 事件流程圖

```
Agent Loop
     │
     ▼
processEvents(event)
     │
     ├──▶ 更新 _state
     │
     └──▶ for listener in listeners
              │
              └──▶ await listener(event, signal)
```

## 5.4 Queue 管理

### PendingMessageQueue

```typescript
// agent.js 第 51-79 行
class PendingMessageQueue {
  messages = [];
  mode: "all" | "one-at-a-time";
  
  constructor(mode) {
    this.mode = mode;
  }
  
  enqueue(message) {
    this.messages.push(message);
  }
  
  hasItems() {
    return this.messages.length > 0;
  }
  
  drain() {
    if (this.mode === "all") {
      // 一次取出所有訊息
      const drained = this.messages.slice();
      this.messages = [];
      return drained;
    }
    // 一次只取出一個
    const first = this.messages[0];
    if (!first) return [];
    this.messages = this.messages.slice(1);
    return [first];
  }
  
  clear() {
    this.messages = [];
  }
}
```

### Steering vs Follow-up

```typescript
// Steering：在 agent 運行時注入
steer(message) {
  this.steeringQueue.enqueue(message);
}

// Follow-up：等 agent 停止後執行
followUp(message) {
  this.followUpQueue.enqueue(message);
}
```

### 使用場景

```typescript
// 場景 1：使用者在 agent 運行時輸入
// → 使用 steer()
agent.steer("改用 TypeScript 而不是 JavaScript");

// 場景 2：使用者想要 agent 完成後繼續
// → 使用 followUp()
agent.followUp("現在寫測試");

// 場景 3：清空佇列
agent.clearAllQueues();
```

## 5.5 生命週期

### prompt

```typescript
// agent.js 第 226-232 行
async prompt(input, images) {
  if (this.activeRun) {
    throw new Error("Agent is already processing a prompt.");
  }
  
  const messages = this.normalizePromptInput(input, images);
  await this.runPromptMessages(messages);
}
```

### continue

```typescript
// agent.js 第 234-256 行
async continue() {
  if (this.activeRun) {
    throw new Error("Agent is already processing.");
  }
  
  const lastMessage = this._state.messages[this._state.messages.length - 1];
  if (!lastMessage) {
    throw new Error("No messages to continue from");
  }
  
  if (lastMessage.role === "assistant") {
    // 檢查 queued messages
    const queuedSteering = this.steeringQueue.drain();
    if (queuedSteering.length > 0) {
      await this.runPromptMessages(queuedSteering, { skipInitialSteeringPoll: true });
      return;
    }
    
    const queuedFollowUps = this.followUpQueue.drain();
    if (queuedFollowUps.length > 0) {
      await this.runPromptMessages(queuedFollowUps);
      return;
    }
    
    throw new Error("Cannot continue from message role: assistant");
  }
  
  await this.runContinuation();
}
```

### abort

```typescript
// agent.js 第 202-204 行
abort() {
  this.activeRun?.abortController.abort();
}
```

### 生命週期狀態圖

```
┌─────────────────────────────────────────────────────┐
│                Agent Lifecycle                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Idle ─────▶ Processing ─────▶ Idle                 │
│    │            │                 │                  │
│    │            ▼                 │                  │
│    │        Streaming             │                  │
│    │            │                 │                  │
│    │            ▼                 │                  │
│    │        Tool Execution        │                  │
│    │            │                 │                  │
│    │            ▼                 │                  │
│    │        Turn End              │                  │
│    │            │                 │                  │
│    │            ▼                 │                  │
│    │        ┌─────────┐          │                  │
│    │        │ More    │──Yes──▶  │                  │
│    │        │ Tool    │          │                  │
│    │        │ Calls?  │          │                  │
│    │        └────┬────┘          │                  │
│    │             │No             │                  │
│    │             ▼               │                  │
│    │        Agent End ──────────▶│                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 5.6 runWithLifecycle

```typescript
// agent.js 第 326-348 行
async runWithLifecycle(executor) {
  if (this.activeRun) {
    throw new Error("Agent is already processing.");
  }
  
  const abortController = new AbortController();
  let resolvePromise = () => { };
  
  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });
  
  this.activeRun = { promise, resolve: resolvePromise, abortController };
  this._state.isStreaming = true;
  this._state.streamingMessage = undefined;
  this._state.errorMessage = undefined;
  
  try {
    await executor(abortController.signal);
  } catch (error) {
    await this.handleRunFailure(error, abortController.signal.aborted);
  } finally {
    this.finishRun();
  }
}
```

### 錯誤處理

```typescript
// agent.js 第 349-365 行
async handleRunFailure(error, aborted) {
  const failureMessage = {
    role: "assistant",
    content: [{ type: "text", text: "" }],
    api: this._state.model.api,
    provider: this._state.model.provider,
    model: this._state.model.id,
    usage: EMPTY_USAGE,
    stopReason: aborted ? "aborted" : "error",
    errorMessage: error instanceof Error ? error.message : String(error),
    timestamp: Date.now(),
  };
  
  await this.processEvents({ type: "message_start", message: failureMessage });
  await this.processEvents({ type: "message_end", message: failureMessage });
  await this.processEvents({ type: "turn_end", message: failureMessage, toolResults: [] });
  await this.processEvents({ type: "agent_end", messages: [failureMessage] });
}
```

## 5.7 實際使用範例

### 範例 1：基本使用

```typescript
import { Agent } from "@earendil-works/pi-agent-core";

const agent = new Agent({
  model: { provider: "anthropic", id: "claude-sonnet-4-20250514" },
  tools: [
    {
      name: "read",
      description: "Read a file",
      parameters: {
        path: { type: "string" }
      },
      execute: async (args) => {
        const content = await readFile(args.path, "utf-8");
        return { content: [{ type: "text", text: content }] };
      }
    }
  ]
});

// 訂閱事件
agent.subscribe((event) => {
  if (event.type === "message_update") {
    process.stdout.write(event.message.content);
  }
});

// 開始對話
await agent.prompt("Read package.json and explain it");
```

### 範例 2：使用 Steering

```typescript
// 開始一個長任務
const taskPromise = agent.prompt("Refactor the entire authentication module");

// 5 秒後，使用者改變主意
setTimeout(() => {
  agent.steer("只重構 login 函數，不要動其他部分");
}, 5000);

await taskPromise;
```

### 範例 3：使用 Follow-up

```typescript
// 第一個任務
await agent.prompt("Find all TODO comments in the codebase");

// 等 agent 完成後，自動執行下一個任務
agent.followUp("Create a plan to address the top 5 TODOs");
await agent.continue();
```

### 範例 4：中止操作

```typescript
// 開始長任務
const taskPromise = agent.prompt("分析整個 codebase");

// 3 秒後中止
setTimeout(() => {
  agent.abort();
}, 3000);

try {
  await taskPromise;
} catch (error) {
  console.log("Agent was aborted");
}
```

### 範例 5：嵌入 Web 應用

```typescript
import express from "express";
import { Agent } from "@earendil-works/pi-agent-core";

const app = express();
const agent = new Agent();

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  
  res.setHeader("Content-Type", "text/event-stream");
  
  agent.subscribe((event) => {
    if (event.type === "message_update") {
      res.write(`data: ${JSON.stringify(event.message)}\n\n`);
    }
    if (event.type === "agent_end") {
      res.write("data: [DONE]\n\n");
      res.end();
    }
  });
  
  await agent.prompt(message);
});

app.listen(3000);
```

## 5.8 設計模式總結

### 1. Facade Pattern

Agent 類別是所有複雜度的 facade：

```
Agent
├── state      ← 狀態管理
├── queue      ← 訊息佇列
├── events     ← 事件系統
└── lifecycle  ← 生命週期
```

### 2. Observer Pattern

透過 subscribe/emit 實作事件驅動：

```typescript
agent.subscribe((event) => { ... });
// 內部
await listener(event, signal);
```

### 3. Command Pattern

Queue 佇列將操作延遲執行：

```typescript
agent.steer(message);      // 延遲到 tool 執行後
agent.followUp(message);   // 延遲到 agent 停止後
```

### 4. State Machine

Agent 有明確的狀態轉換：

```
Idle → Processing → Streaming → Tool Execution → Turn End → Idle
```

---

> **下一步**：深入了解 System Prompt 設計，理解如何用 1,000 tokens 做到 10,000 tokens 的效果。
