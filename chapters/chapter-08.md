# 第八章：Extension 系統

Extension 是 Pi 最強大的功能。它讓你可以完全自訂 agent 的行為，而不修改核心代碼。

## 8.1 Extension 架構

```
┌─────────────────────────────────────────────────────┐
│                Extension System                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐    ┌─────────────┐                │
│  │   Loader    │───▶│   Runner    │                │
│  │  (載入)     │    │  (執行)     │                │
│  └─────────────┘    └──────┬──────┘                │
│                            │                        │
│                            ▼                        │
│                     ┌─────────────┐                │
│                     │   Wrapper   │                │
│                     │  (包裝)     │                │
│                     └─────────────┘                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 核心元件

| 元件 | 職責 |
|------|------|
| Loader | 掃描並載入 extension 檔案 |
| Runner | 管理 extension 生命週期 |
| Wrapper | 提供安全的執行環境 |

## 8.2 Extension 結構

### 基本結構

```typescript
// extensions/my-extension/index.ts
export default {
  name: "my-extension",
  
  // 工具定義
  tools: [
    {
      name: "my_tool",
      description: "Does something useful",
      parameters: {
        input: { type: "string" }
      },
      execute: async (args) => {
        return { content: [{ type: "text", text: "Result" }] };
      }
    }
  ],
  
  // 生命週期 hooks
  hooks: {
    beforeToolCall: async (ctx) => { ... },
    afterToolCall: async (ctx) => { ... },
    turnEnd: async (ctx) => { ... },
  },
  
  // 命令定義
  commands: [
    {
      name: "/my-command",
      description: "Does something",
      handler: async (args) => { ... }
    }
  ],
  
  // 初始化
  init: async (ctx) => { ... },
  
  // 清理
  destroy: async () => { ... }
};
```

## 8.3 生命週期事件

### 事件流程

```
Session Start
     │
     ▼
┌─────────────────┐
│   init()        │ ← Extension 初始化
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Turn Start    │ ← 每輪開始
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ beforeToolCall  │ ← 工具執行前
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Tool Execute   │ ← 工具執行
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ afterToolCall   │ ← 工具執行後
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Turn End      │ ← 每輪結束
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Session End    │ ← Session 結束
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   destroy()     │ ← Extension 清理
└─────────────────┘
```

### 完整事件列表

```typescript
type ExtensionEvent =
  | "session_start"
  | "session_shutdown"
  | "session_before_switch"
  | "session_before_fork"
  | "turn_start"
  | "turn_end"
  | "message_start"
  | "message_end"
  | "tool_execution_start"
  | "tool_execution_end"
  | "agent_start"
  | "agent_end";
```

## 8.4 註冊自訂工具

### 範例：Git 自動提交

```typescript
// extensions/auto-commit/index.ts
export default {
  name: "auto-commit",
  
  hooks: {
    afterToolCall: async (ctx) => {
      // 只在 write 或 edit 後觸發
      if (ctx.toolCall.name === "write" || ctx.toolCall.name === "edit") {
        const filePath = ctx.args.path;
        
        // Git add
        await ctx.bash(`git add ${filePath}`);
        
        // Git commit
        const message = `ai: update ${filePath}`;
        await ctx.bash(`git commit -m "${message}"`);
        
        return { 
          content: [{ type: "text", text: `Committed: ${message}` }] 
        };
      }
    }
  }
};
```

### 範例：測試守衛

```typescript
// extensions/test-guard/index.ts
export default {
  name: "test-guard",
  
  hooks: {
    beforeToolCall: async (ctx) => {
      // 阻止危險操作
      if (ctx.toolCall.name === "bash") {
        const command = ctx.args.command;
        
        // 阻止 npm publish
        if (command.includes("npm publish")) {
          return { 
            block: true, 
            reason: "Cannot publish from AI session" 
          };
        }
        
        // 阻止 rm -rf
        if (command.includes("rm -rf")) {
          return { 
            block: true, 
            reason: "Dangerous command blocked" 
          };
        }
      }
    }
  }
};
```

## 8.5 Context Injection

### 範例：動態專案資訊

```typescript
// extensions/project-info/index.ts
export default {
  name: "project-info",
  
  hooks: {
    beforeTurn: async (ctx) => {
      // 取得 Git 資訊
      const branch = await ctx.bash("git branch --show-current");
      const status = await ctx.bash("git status --short");
      
      // 注入到 system prompt
      ctx.agent.state.systemPrompt += `
      
## Current Context
- Git branch: ${branch}
- Modified files: ${status.split("\n").length}
      `;
    }
  }
};
```

### 範例：RAG 整合

```typescript
// extensions/rag/index.ts
export default {
  name: "rag",
  
  hooks: {
    transformContext: async (messages, signal) => {
      // 找到用戶的最後一個問題
      const lastUserMessage = messages
        .filter(m => m.role === "user")
        .pop();
      
      if (lastUserMessage) {
        // 搜尋相關文件
        const relevantDocs = await searchDocuments(lastUserMessage.content);
        
        // 注入到 context 開頭
        return [
          {
            role: "system",
            content: `Relevant documentation:\n${relevantDocs}`
          },
          ...messages
        ];
      }
      
      return messages;
    }
  }
};
```

## 8.6 TUI 自訂

### 範例：自訂狀態列

```typescript
// extensions/status-bar/index.ts
export default {
  name: "status-bar",
  
  ui: {
    statusBar: async (ctx) => {
      const model = ctx.agent.state.model.id;
      const messages = ctx.agent.state.messages.length;
      const isStreaming = ctx.agent.state.isStreaming;
      
      return [
        `Model: ${model}`,
        `Messages: ${messages}`,
        isStreaming ? "Streaming..." : "Idle"
      ].join(" | ");
    }
  }
};
```

### 範例：自訂主題

```typescript
// extensions/custom-theme/index.ts
export default {
  name: "custom-theme",
  
  ui: {
    theme: {
      colors: {
        primary: "#00ff00",
        secondary: "#008800",
        background: "#000000",
        text: "#ffffff"
      }
    }
  }
};
```

## 8.7 實戰範例：Sub-agent Extension

```typescript
// extensions/subagent/index.ts
export default {
  name: "subagent",
  
  tools: [
    {
      name: "spawn_agent",
      description: "Spawn a sub-agent for parallel work",
      parameters: {
        task: { type: "string", description: "Task description" },
        model: { type: "string", description: "Model to use" }
      },
      execute: async (args, signal) => {
        // 建立新的 Agent 實例
        const agent = new Agent({
          model: { 
            provider: "anthropic", 
            id: args.model || "claude-sonnet-4-20250514" 
          }
        });
        
        // 執行任務
        await agent.prompt(args.task);
        
        // 回傳結果
        const lastMessage = agent.state.messages.pop();
        return {
          content: lastMessage.content
        };
      }
    }
  ],
  
  commands: [
    {
      name: "/parallel",
      description: "Execute task in parallel with sub-agent",
      handler: async (args) => {
        // 這裡可以實作更複雜的 parallel 邏輯
        return `Task delegated to sub-agent: ${args}`;
      }
    }
  ]
};
```

## 8.8 實戰範例：Code Analyzer

```typescript
// extensions/code-analyzer/index.ts
export default {
  name: "code-analyzer",
  
  tools: [
    {
      name: "analyze_complexity",
      description: "Analyze code complexity metrics",
      parameters: {
        file: { type: "string", description: "File to analyze" }
      },
      execute: async (args) => {
        const code = await readFile(args.file, "utf-8");
        
        const metrics = {
          lines: code.split("\n").length,
          functions: (code.match(/function\s+\w+/g) || []).length,
          classes: (code.match(/class\s+\w+/g) || []).length,
          imports: (code.match(/import\s+/g) || []).length,
          comments: (code.match(/\/\/|\/\*/g) || []).length,
        };
        
        // 計算圈複雜度（簡化版）
        const complexity = (
          (code.match(/if\s*\(/g) || []).length +
          (code.match(/else\s+if/g) || []).length +
          (code.match(/for\s*\(/g) || []).length +
          (code.match(/while\s*\(/g) || []).length +
          (code.match(/case\s+/g) || []).length
        );
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              ...metrics,
              cyclomaticComplexity: complexity
            }, null, 2)
          }]
        };
      }
    }
  ],
  
  hooks: {
    turnEnd: async (ctx) => {
      // 自動分析修改過的檔案
      for (const result of ctx.toolResults) {
        if (result.toolName === "write" || result.toolName === "edit") {
          const filePath = result.args.path;
          // 分析並報告
        }
      }
    }
  }
};
```

## 8.9 實戰範例：即時預覽

```typescript
// extensions/preview/index.ts
import { chromium } from "playwright";

export default {
  name: "preview",
  
  tools: [
    {
      name: "preview_html",
      description: "Preview HTML file in browser",
      parameters: {
        file: { type: "string", description: "HTML file path" }
      },
      execute: async (args) => {
        const html = await readFile(args.file, "utf-8");
        
        // 啟動瀏覽器
        const browser = await chromium.launch();
        const page = await browser.newPage();
        
        // 載入 HTML
        await page.setContent(html);
        
        // 截圖
        const screenshotPath = "preview.png";
        await page.screenshot({ path: screenshotPath });
        
        await browser.close();
        
        return {
          content: [{ 
            type: "text", 
            text: `Preview saved to ${screenshotPath}` 
          }]
        };
      }
    },
    {
      name: "preview_markdown",
      description: "Preview Markdown as HTML",
      parameters: {
        file: { type: "string", description: "Markdown file path" }
      },
      execute: async (args) => {
        const markdown = await readFile(args.file, "utf-8");
        
        // 轉換為 HTML（使用 marked）
        const html = marked(markdown);
        
        // 建立完整 HTML
        const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
    code { background: #f0f0f0; padding: 2px 4px; border-radius: 3px; }
  </style>
</head>
<body>${html}</body>
</html>
        `;
        
        // 儲存並預覽
        await writeFile("preview.html", fullHtml);
        
        return {
          content: [{ 
            type: "text", 
            text: "Preview saved to preview.html" 
          }]
        };
      }
    }
  ]
};
```

## 8.10 Extension 最佳實踐

### 1. 單一職責

```typescript
// ❌ 不要這樣
export default {
  name: "everything",
  tools: [ ... 20 tools ... ],
  hooks: { ... 10 hooks ... }
};

// ✅ 要這樣
// auto-commit/index.ts
export default { name: "auto-commit", ... };

// test-guard/index.ts
export default { name: "test-guard", ... };
```

### 2. 錯誤處理

```typescript
execute: async (args) => {
  try {
    // 可能失敗的操作
    const result = await riskyOperation();
    return { content: [{ type: "text", text: result }] };
  } catch (error) {
    return { 
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true
    };
  }
}
```

### 3. 使用 Context

```typescript
hooks: {
  beforeToolCall: async (ctx) => {
    // 使用 ctx 取得上下文
    const cwd = ctx.context.cwd;
    const model = ctx.context.model;
    // ...
  }
}
```

### 4. 避免副作用

```typescript
// ❌ 不要這樣
hooks: {
  afterToolCall: async (ctx) => {
    // 修改外部狀態
    globalState.something = true;
  }
}

// ✅ 要這樣
hooks: {
  afterToolCall: async (ctx) => {
    // 只回傳結果
    return { content: [{ type: "text", text: "Updated" }] };
  }
}
```

## 8.11 Extension 安全性

### 風險評估

```
Extension 類型          風險等級    原因
─────────────────────────────────────────────
唯讀分析 Extension      低         不修改系統
工具註冊 Extension      中         可執行任意代碼
Hook Extension          高         可攔截所有操作
TUI Extension           低         只影響顯示
```

### 安全措施

1. **審查代碼**：安裝前檢查 Extension 代碼
2. **限制權限**：使用 permission-gate Extension
3. **容器化**：在 Docker 中運行
4. **監控**：記錄所有 Extension 操作

---

> **下一步**：深入了解 Skills 系統，理解如何建立可重用的能力包。
