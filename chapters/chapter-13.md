# 第十三章：SDK 嵌入

將 Pi Agent 嵌入到你的應用程式中。

> **注意**：本章的 SDK API 範例為**概念性示範**，實際 API 可能因版本而異。請參考官方文件確認最新的 API 簽章。

## 13.1 安裝 SDK

```bash
npm install @earendil-works/pi-coding-agent
```

## 13.2 基本用法

```typescript
import { Agent, SessionManager } from "@earendil-works/pi-coding-agent";

// 建立 Agent
const agent = new Agent({
  model: { provider: "anthropic", id: "claude-sonnet-4-20250514" }
});

// 開啟 session
const session = SessionManager.open("./session.jsonl");

// 執行 prompt
const result = await agent.prompt("Hello, world!");

// 獲取回應
console.log(result);
```

## 13.3 串流回應

```typescript
const agent = new Agent({
  model: { provider: "anthropic", id: "claude-sonnet-4-20250514" }
});

// 串流回應
for await (const chunk of agent.promptStream("Write a story")) {
  process.stdout.write(chunk);
}
```

## 13.4 自訂工具

```typescript
const agent = new Agent({
  model: { provider: "anthropic", id: "claude-sonnet-4-20250514" },
  tools: [
    {
      name: "get_weather",
      description: "Get weather for a location",
      parameters: {
        location: { type: "string", description: "City name" }
      },
      execute: async (args) => {
        // 實作天氣查詢
        return {
          content: [{ type: "text", text: `Weather in ${args.location}: Sunny` }]
        };
      }
    }
  ]
});

await agent.prompt("What's the weather in Taipei?");
```

## 13.5 Extension 整合

```typescript
import { Agent } from "@earendil-works/pi-coding-agent";
import autoCommit from "./extensions/auto-commit.js";

const agent = new Agent({
  model: { provider: "anthropic", id: "claude-sonnet-4-20250514" },
  extensions: [autoCommit]
});

await agent.prompt("Create a new file called hello.ts");
```

## 13.6 狀態管理

```typescript
const agent = new Agent({
  model: { provider: "anthropic", id: "claude-sonnet-4-20250514" }
});

// 執行多個 prompts
await agent.prompt("Create a React component");
await agent.prompt("Add TypeScript types");
await agent.prompt("Write tests");

// 獲取完整歷史
const messages = agent.state.messages;
console.log(`Total messages: ${messages.length}`);
```

## 13.7 Hook 系統

```typescript
const agent = new Agent({
  model: { provider: "anthropic", id: "claude-sonnet-4-20250514" },
  hooks: {
    beforeToolCall: async (ctx) => {
      console.log(`Tool called: ${ctx.toolCall.name}`);
      // 可以阻擋工具呼叫
      if (ctx.toolCall.name === "bash" && ctx.args.command.includes("rm -rf")) {
        return { block: true, reason: "Dangerous command" };
      }
    },
    afterToolCall: async (ctx) => {
      console.log(`Tool completed: ${ctx.toolCall.name}`);
    }
  }
});
```

## 13.8 完整範例：CLI 工具

```typescript
#!/usr/bin/env node
import { Agent, SessionManager } from "@earendil-works/pi-coding-agent";
import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const agent = new Agent({
  model: { provider: "anthropic", id: "claude-sonnet-4-20250514" }
});

const session = SessionManager.open("./session.jsonl");

console.log("Pi CLI - Type 'exit' to quit");

const ask = () => {
  rl.question("You: ", async (input) => {
    if (input === "exit") {
      process.exit(0);
    }
    
    const response = await agent.prompt(input);
    console.log(`AI: ${response}`);
    
    ask();
  });
};

ask();
```

## 13.9 完整範例：Web Server

```typescript
import express from "express";
import { Agent } from "@earendil-works/pi-coding-agent";

const app = express();
app.use(express.json());

const agent = new Agent({
  model: { provider: "anthropic", id: "claude-sonnet-4-20250514" }
});

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  
  const response = await agent.prompt(message);
  
  res.json({ response });
});

app.post("/chat/stream", async (req, res) => {
  const { message } = req.body;
  
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  for await (const chunk of agent.promptStream(message)) {
    res.write(`data: ${chunk}\n\n`);
  }
  
  res.write("data: [DONE]\n\n");
  res.end();
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

## 13.10 最佳實踐

### 1. 錯誤處理

```typescript
try {
  const response = await agent.prompt(input);
} catch (error) {
  if (error.message.includes("rate limit")) {
    // 等待後重試
    await sleep(60000);
    return retry();
  }
  throw error;
}
```

### 2. 記憶體管理

```typescript
// 定期清理舊訊息
if (agent.state.messages.length > 100) {
  agent.state.messages = agent.state.messages.slice(-50);
}
```

### 3. 並行控制

```typescript
import PQueue from "p-queue";

const queue = new PQueue({ concurrency: 3 });

// 限制並行數
await queue.add(() => agent.prompt("Task 1"));
await queue.add(() => agent.prompt("Task 2"));
```

---

> **下一步**：深入了解 RPC 模式，遠端控制 Pi Agent。
