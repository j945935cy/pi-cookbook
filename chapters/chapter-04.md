# 第四章：Agent Loop 核心（553 行）

這是 Pi 的心臟。553 行代碼，決定了 Agent 如何思考、如何行動。

## 4.1 架構概覽

```
┌─────────────────────────────────────────────────────────────┐
│                      Agent Loop                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   agentLoop  │───▶│  runLoop    │───▶│   stream    │     │
│  │   (入口)     │    │  (主迴圈)   │    │  Assistant  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                           │                    │            │
│                           ▼                    ▼            │
│                     ┌─────────────┐    ┌─────────────┐     │
│                     │  execute    │    │   create    │     │
│                     │  ToolCalls  │    │   Messages  │     │
│                     └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 4.2 核心函數

### agentLoop：入口函數

```typescript
// agent-loop.js 第 11-19 行
export function agentLoop(prompts, context, config, signal, streamFn) {
  const stream = createAgentStream();
  void runAgentLoop(prompts, context, config, async (event) => {
    stream.push(event);
  }, signal, streamFn).then((messages) => {
    stream.end(messages);
  });
  return stream;
}
```

**設計要點：**
- 返回 `EventStream`，支援即時事件訂閱
- 非阻塞：`void` 執行，立即返回 stream
- 使用 callback 模式 emit 事件

### runAgentLoop：初始化

```typescript
// agent-loop.js 第 43-57 行
export async function runAgentLoop(prompts, context, config, emit, signal, streamFn) {
  const newMessages = [...prompts];
  const currentContext = {
    ...context,
    messages: [...context.messages, ...prompts],
  };
  
  await emit({ type: "agent_start" });
  await emit({ type: "turn_start" });
  
  for (const prompt of prompts) {
    await emit({ type: "message_start", message: prompt });
    await emit({ type: "message_end", message: prompt });
  }
  
  await runLoop(currentContext, newMessages, config, signal, emit, streamFn);
  return newMessages;
}
```

**職責：**
1. 合併新舊 messages
2. 發出初始化事件
3. 啟動主迴圈

## 4.3 主迴圈：runLoop

這是 Pi 的核心，553 行中最關鍵的部分。

```typescript
// agent-loop.js 第 78-173 行
async function runLoop(initialContext, newMessages, initialConfig, signal, emit, streamFunction) {
  let currentContext = initialContext;
  let config = initialConfig;
  let firstTurn = true;
  
  // 檢查初始 steering messages
  let pendingMessages = (await config.getSteeringMessages?.()) || [];
  
  // 外層迴圈：處理 follow-up messages
  while (true) {
    let hasMoreToolCalls = true;
    
    // 內層迴圈：處理 tool calls 和 steering messages
    while (hasMoreToolCalls || pendingMessages.length > 0) {
      if (!firstTurn) {
        await emit({ type: "turn_start" });
      } else {
        firstTurn = false;
      }
      
      // 1. 處理 pending messages
      if (pendingMessages.length > 0) {
        for (const message of pendingMessages) {
          await emit({ type: "message_start", message });
          await emit({ type: "message_end", message });
          currentContext.messages.push(message);
          newMessages.push(message);
        }
        pendingMessages = [];
      }
      
      // 2. Stream assistant response
      const message = await streamAssistantResponse(
        currentContext, config, signal, emit, streamFunction
      );
      newMessages.push(message);
      
      // 3. 檢查錯誤或中止
      if (message.stopReason === "error" || message.stopReason === "aborted") {
        await emit({ type: "turn_end", message, toolResults: [] });
        await emit({ type: "agent_end", messages: newMessages });
        return;
      }
      
      // 4. 執行 tool calls
      const toolCalls = message.content.filter((c) => c.type === "toolCall");
      const toolResults = [];
      hasMoreToolCalls = false;
      
      if (toolCalls.length > 0) {
        const executedToolBatch = message.stopReason === "length"
          ? await failToolCallsFromTruncatedMessage(toolCalls, emit)
          : await executeToolCalls(currentContext, message, config, signal, emit);
        
        toolResults.push(...executedToolBatch.messages);
        hasMoreToolCalls = !executedToolBatch.terminate;
        
        for (const result of toolResults) {
          currentContext.messages.push(result);
          newMessages.push(result);
        }
      }
      
      await emit({ type: "turn_end", message, toolResults });
      
      // 5. 準備下一輪
      const nextTurnSnapshot = await config.prepareNextTurn?.({
        message, toolResults, context: currentContext, newMessages
      });
      
      if (nextTurnSnapshot) {
        currentContext = nextTurnSnapshot.context ?? currentContext;
        config = {
          ...config,
          model: nextTurnSnapshot.model ?? config.model,
          reasoning: nextTurnSnapshot.thinkingLevel === undefined
            ? config.reasoning
            : nextTurnSnapshot.thinkingLevel === "off" ? undefined : nextTurnSnapshot.thinkingLevel,
        };
      }
      
      // 6. 檢查是否停止
      if (await config.shouldStopAfterTurn?.({
        message, toolResults, context: currentContext, newMessages
      })) {
        await emit({ type: "agent_end", messages: newMessages });
        return;
      }
      
      // 7. 取得下一輪 steering messages
      pendingMessages = (await config.getSteeringMessages?.()) || [];
    }
    
    // Agent 會在這裡停止。檢查 follow-up messages。
    const followUpMessages = (await config.getFollowUpMessages?.()) || [];
    if (followUpMessages.length > 0) {
      pendingMessages = followUpMessages;
      continue;
    }
    
    // 沒有更多訊息，退出
    break;
  }
  
  await emit({ type: "agent_end", messages: newMessages });
}
```

### 迴圈流程圖

```
                    ┌─────────────────┐
                    │  runLoop 開始   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ 取得初始        │
                    │ pendingMessages │
                    └────────┬────────┘
                             │
                             ▼
               ┌─────────────────────────┐
               │  外層迴圈: while(true)  │◀─────────────┐
               └────────────┬────────────┘              │
                            │                           │
                            ▼                           │
               ┌─────────────────────────┐              │
               │  內層迴圈: while        │              │
               │  (hasMoreToolCalls ||   │              │
               │   pendingMessages)      │              │
               └────────────┬────────────┘              │
                            │                           │
          ┌─────────────────┼─────────────────┐         │
          │                 │                 │         │
          ▼                 ▼                 ▼         │
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
   │ 處理        │  │ Stream      │  │ 執行        │  │
   │ pendingMsg  │  │ assistant   │  │ toolCalls   │  │
   └─────────────┘  └─────────────┘  └─────────────┘  │
          │                 │                 │         │
          └─────────────────┼─────────────────┘         │
                            │                           │
                            ▼                           │
               ┌─────────────────────────┐              │
               │  shouldStopAfterTurn?   │              │
               └────────────┬────────────┘              │
                            │                           │
              ┌─────────────┴─────────────┐             │
              │                           │             │
              ▼                           ▼             │
        ┌──────────┐              ┌──────────────┐      │
        │  YES     │              │  NO          │      │
        │  return  │              │  繼續迴圈    │──────┘
        └──────────┘              └──────────────┘
```

## 4.4 Streaming Assistant Response

```typescript
// agent-loop.js 第 178-255 行
async function streamAssistantResponse(context, config, signal, emit, streamFunction) {
  // 1. 應用 context transform
  let messages = context.messages;
  if (config.transformContext) {
    messages = await config.transformContext(messages, signal);
  }
  
  // 2. 轉換為 LLM 格式
  const llmMessages = await config.convertToLlm(messages);
  
  // 3. 建構 LLM context
  const llmContext = {
    systemPrompt: context.systemPrompt,
    messages: llmMessages,
    tools: context.tools,
  };
  
  // 4. 解析 API key
  const resolvedApiKey = (config.getApiKey ? 
    await config.getApiKey(config.model.provider) : undefined) || config.apiKey;
  
  // 5. 呼叫 LLM
  const response = await streamFunction(config.model, llmContext, {
    ...config,
    apiKey: resolvedApiKey,
    signal,
  });
  
  // 6. 處理 streaming events
  let partialMessage = null;
  let addedPartial = false;
  
  for await (const event of response) {
    switch (event.type) {
      case "start":
        partialMessage = event.partial;
        context.messages.push(partialMessage);
        addedPartial = true;
        await emit({ type: "message_start", message: { ...partialMessage } });
        break;
        
      case "text_delta":
      case "toolcall_delta":
        if (partialMessage) {
          partialMessage = event.partial;
          context.messages[context.messages.length - 1] = partialMessage;
          await emit({
            type: "message_update",
            assistantMessageEvent: event,
            message: { ...partialMessage },
          });
        }
        break;
        
      case "done":
      case "error":
        const finalMessage = await response.result();
        if (addedPartial) {
          context.messages[context.messages.length - 1] = finalMessage;
        } else {
          context.messages.push(finalMessage);
        }
        await emit({ type: "message_end", message: finalMessage });
        return finalMessage;
    }
  }
  
  const finalMessage = await response.result();
  // ... 處理完成
  return finalMessage;
}
```

### Streaming 事件流程

```
LLM Provider
     │
     ▼
┌─────────────┐
│   start     │ ← 開始接收
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ text_delta  │ ← 文字增量
└──────┬──────┘
       │
       ▼
┌─────────────┐
│toolcall_delta│ ← 工具調用增量
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    done     │ ← 完成
└─────────────┘
```

## 4.5 Tool Call 執行

### Parallel vs Sequential

```typescript
// agent-loop.js 第 287-294 行
async function executeToolCalls(currentContext, assistantMessage, config, signal, emit) {
  const toolCalls = assistantMessage.content.filter((c) => c.type === "toolCall");
  const hasSequentialToolCall = toolCalls.some((tc) => 
    currentContext.tools?.find((t) => t.name === tc.name)?.executionMode === "sequential"
  );
  
  if (config.toolExecution === "sequential" || hasSequentialToolCall) {
    return executeToolCallsSequential(currentContext, assistantMessage, toolCalls, config, signal, emit);
  }
  
  return executeToolCallsParallel(currentContext, assistantMessage, toolCalls, config, signal, emit);
}
```

### Parallel Execution

```typescript
// agent-loop.js 第 332-376 行
async function executeToolCallsParallel(currentContext, assistantMessage, toolCalls, config, signal, emit) {
  const finalizedCalls = [];
  
  for (const toolCall of toolCalls) {
    await emit({
      type: "tool_execution_start",
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      args: toolCall.arguments,
    });
    
    const preparation = await prepareToolCall(currentContext, assistantMessage, toolCall, config, signal);
    
    if (preparation.kind === "immediate") {
      // 立即返回結果（例如工具不存在）
      const finalized = {
        toolCall,
        result: preparation.result,
        isError: preparation.isError,
      };
      await emitToolExecutionEnd(finalized, emit);
      finalizedCalls.push(finalized);
    } else {
      // 建立 async function，稍後執行
      finalizedCalls.push(async () => {
        const executed = await executePreparedToolCall(preparation, signal, emit);
        const finalized = await finalizeExecutedToolCall(
          currentContext, assistantMessage, preparation, executed, config, signal
        );
        await emitToolExecutionEnd(finalized, emit);
        return finalized;
      });
    }
  }
  
  // 並行執行所有 tool calls
  const orderedFinalizedCalls = await Promise.all(
    finalizedCalls.map((entry) => (typeof entry === "function" ? entry() : Promise.resolve(entry)))
  );
  
  // 建構結果訊息
  const messages = [];
  for (const finalized of orderedFinalizedCalls) {
    const toolResultMessage = createToolResultMessage(finalized);
    await emitToolResultMessage(toolResultMessage, emit);
    messages.push(toolResultMessage);
  }
  
  return {
    messages,
    terminate: shouldTerminateToolBatch(orderedFinalizedCalls),
  };
}
```

### 並行執行圖

```
Assistant Message
     │
     ├── Tool Call A (read)
     ├── Tool Call B (grep)
     └── Tool Call C (ls)
           │
           ▼
     ┌─────────────────────────────┐
     │   Promise.all([             │
     │     execute(A),             │
     │     execute(B),             │
     │     execute(C)              │
     │   ])                        │
     └─────────────────────────────┘
           │
           ▼
     ┌─────────────────────────────┐
     │   Result A, Result B,       │
     │   Result C (保持順序)       │
     └─────────────────────────────┘
```

## 4.6 Steering Messages 機制

Steering messages 允許使用者在 agent 運行時注入訊息。

```typescript
// 在 runLoop 中
pendingMessages = (await config.getSteeringMessages?.()) || [];

// 在內層迴圈中
if (pendingMessages.length > 0) {
  for (const message of pendingMessages) {
    await emit({ type: "message_start", message });
    await emit({ type: "message_end", message });
    currentContext.messages.push(message);
    newMessages.push(message);
  }
  pendingMessages = [];
}
```

### Steering vs Follow-up

```
┌─────────────────────────────────────────────────────┐
│                   Timing                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  User Input ────────────────────────────────────▶   │
│       │                                             │
│       ▼                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐         │
│  │ Turn 1  │───▶│ Turn 2  │───▶│ Turn 3  │         │
│  └─────────┘    └─────────┘    └─────────┘         │
│       │              │              │               │
│       ▼              ▼              ▼               │
│  Steering       Steering       Follow-up            │
│  (立即注入)     (立即注入)     (等 agent 停止)       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Steering**：在當前 tool 執行後、下一個 assistant response 前注入
**Follow-up**：在 agent 停止後才執行

## 4.7 Context Transformation

```typescript
// 在 streamAssistantResponse 中
let messages = context.messages;
if (config.transformContext) {
  messages = await config.transformContext(messages, signal);
}
```

Context transformation 允許在每次 LLM call 前修改 context：

```typescript
// 範例：注入專案資訊
const config = {
  transformContext: async (messages, signal) => {
    // 在 context 開頭注入專案資訊
    const projectInfo = await readFile("package.json", "utf-8");
    return [
      { role: "system", content: `Project: ${projectInfo}` },
      ...messages
    ];
  }
};
```

## 4.8 錯誤處理

### Truncated Message 處理

```typescript
// agent-loop.js 第 263-283 行
async function failToolCallsFromTruncatedMessage(toolCalls, emit) {
  const messages = [];
  
  for (const toolCall of toolCalls) {
    await emit({
      type: "tool_execution_start",
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      args: toolCall.arguments,
    });
    
    const finalized = {
      toolCall,
      result: createErrorToolResult(
        `Tool call "${toolCall.name}" was not executed: ` +
        `the response hit the output token limit, ` +
        `so its arguments may be truncated. ` +
        `Re-issue the tool call with complete arguments.`
      ),
      isError: true,
    };
    
    await emitToolExecutionEnd(finalized, emit);
    const toolResultMessage = createToolResultMessage(finalized);
    await emitToolResultMessage(toolResultMessage, emit);
    messages.push(toolResultMessage);
  }
  
  return { messages, terminate: false };
}
```

### Error Tool Result

```typescript
function createErrorToolResult(message) {
  return {
    content: [{ type: "text", text: message }],
    details: {},
  };
}
```

## 4.9 事件系統

Agent Loop 透過 events 與外界通訊：

```typescript
// 事件類型
type AgentEvent =
  | { type: "agent_start" }
  | { type: "turn_start" }
  | { type: "message_start"; message: Message }
  | { type: "message_update"; assistantMessageEvent: any; message: Message }
  | { type: "message_end"; message: Message }
  | { type: "tool_execution_start"; toolCallId: string; toolName: string; args: any }
  | { type: "tool_execution_update"; toolCallId: string; toolName: string; args: any; partialResult: any }
  | { type: "tool_execution_end"; toolCallId: string; toolName: string; result: any; isError: boolean }
  | { type: "turn_end"; message: Message; toolResults: Message[] }
  | { type: "agent_end"; messages: Message[] };
```

### 事件訂閱

```typescript
const agent = new Agent();
agent.subscribe((event) => {
  switch (event.type) {
    case "message_update":
      // 即時顯示 streaming 文字
      process.stdout.write(event.message.content);
      break;
    case "tool_execution_start":
      console.log(`Executing ${event.toolName}...`);
      break;
    case "agent_end":
      console.log("Agent finished");
      break;
  }
});
```

## 4.10 設計哲學總結

### 1. 單一職責

每個函數只做一件事：
- `agentLoop`：建立 stream
- `runAgentLoop`：初始化
- `runLoop`：主迴圈
- `streamAssistantResponse`：LLM 通訊
- `executeToolCalls`：工具執行

### 2. 事件驅動

所有通訊都透過 events，不直接回呼。

### 3. 非阻塞

使用 async/await，不阻塞主執行緒。

### 4. 可組合

每個函數都可以獨立使用或替換。

---

> **下一步**：深入了解 Agent 類別，理解狀態管理與生命週期。
