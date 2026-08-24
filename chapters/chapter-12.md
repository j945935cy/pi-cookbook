# 第十二章：Extension 開發實戰

從零開始建立一個完整的 Extension。

## 12.1 開發環境

### 專案結構

```
my-extension/
├── index.ts           # 主進入點
├── package.json       # 依賴
├── tsconfig.json      # TypeScript 設定
├── tests/
│   └── index.test.ts
└── README.md
```

### package.json

```json
{
  "name": "@my-org/pi-extension",
  "version": "0.1.0",
  "type": "module",
  "main": "index.ts",
  "dependencies": {
    "@earendil-works/pi-coding-agent": "latest"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## 12.2 Extension 基礎結構

```typescript
// index.ts
export default {
  name: "my-extension",
  
  init: async (ctx) => {
    // 初始化 Extension
    console.log("Extension initialized");
  },
  
  tools: [],
  hooks: {},
  commands: []
};
```

## 12.3 實戰範例：Git Smart Commit

### 需求分析
- 自動分析變更
- 生成有意義的 commit message
- 支援 conventional commits

### 完整實作

```typescript
// index.ts
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

export default {
  name: "git-smart-commit",
  
  init: async (ctx) => {
    console.log("Git Smart Commit initialized");
  },
  
  tools: [
    {
      name: "smart_commit",
      description: "Analyze changes and create a meaningful commit",
      parameters: {
        files: { 
          type: "string", 
          description: "Files to commit (default: all)" 
        }
      },
      execute: async (args) => {
        try {
          // 1. 獲取 git status
          const status = execSync("git status --porcelain").toString();
          
          // 2. 分析變更類型
          const changes = analyzeChanges(status);
          
          // 3. 生成 commit message
          const message = generateCommitMessage(changes);
          
          // 4. 執行 commit
          if (args.files) {
            execSync(`git add ${args.files}`);
          } else {
            execSync("git add -A");
          }
          execSync(`git commit -m "${message}"`);
          
          return {
            content: [{
              type: "text",
              text: `Committed: ${message}\n\nChanges:\n${changes.summary}`
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
          };
        }
      }
    }
  ],
  
  hooks: {
    afterToolCall: async (ctx) => {
      // Auto-commit on write/edit
      if (ctx.toolCall.name === "write" || ctx.toolCall.name === "edit") {
        // 可選：自動提交
      }
    }
  }
};

// 輔助函數
function analyzeChanges(status: string) {
  const changes = {
    added: [] as string[],
    modified: [] as string[],
    deleted: [] as string[],
    types: new Set<string>()
  };
  
  for (const line of status.split("\n")) {
    if (!line) continue;
    
    const [flag, ...fileParts] = line.split(" ");
    const file = fileParts.join(" ");
    
    if (flag.includes("A")) {
      changes.added.push(file);
      changes.types.add("feat");
    } else if (flag.includes("M")) {
      changes.modified.push(file);
      changes.types.add("fix");
    } else if (flag.includes("D")) {
      changes.deleted.push(file);
      changes.types.add("chore");
    }
  }
  
  changes.summary = [
    `Added: ${changes.added.length} files`,
    `Modified: ${changes.modified.length} files`,
    `Deleted: ${changes.deleted.length} files`
  ].join("\n");
  
  return changes;
}

function generateCommitMessage(changes: any) {
  const type = changes.types.has("feat") ? "feat" : 
               changes.types.has("fix") ? "fix" : "chore";
  
  const total = changes.added.length + 
                changes.modified.length + 
                changes.deleted.length;
  
  return `${type}: update ${total} files`;
}
```

## 12.4 實戰範例：Code Metrics

### 完整實作

```typescript
// index.ts
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

export default {
  name: "code-metrics",
  
  tools: [
    {
      name: "calculate_metrics",
      description: "Calculate code metrics for a file or directory",
      parameters: {
        path: { type: "string", description: "File or directory" },
        type: { 
          type: "string", 
          enum: ["complexity", "coverage", "all"],
          description: "Metrics type" 
        }
      },
      execute: async (args) => {
        try {
          const metrics: any = {};
          
          if (args.type === "complexity" || args.type === "all") {
            metrics.complexity = calculateComplexity(args.path);
          }
          
          if (args.type === "coverage" || args.type === "all") {
            metrics.coverage = await calculateCoverage(args.path);
          }
          
          return {
            content: [{
              type: "text",
              text: formatMetrics(metrics)
            }]
          };
        } catch (error) {
          return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
          };
        }
      }
    }
  ]
};

function calculateComplexity(path: string) {
  const code = readFileSync(path, "utf-8");
  
  return {
    lines: code.split("\n").length,
    functions: (code.match(/function\s+\w+/g) || []).length,
    classes: (code.match(/class\s+\w+/g) || []).length,
    complexity: (
      (code.match(/if\s*\(/g) || []).length +
      (code.match(/for\s*\(/g) || []).length +
      (code.match(/while\s*\(/g) || []).length
    )
  };
}

async function calculateCoverage(path: string) {
  try {
    const output = execSync(
      `npx c8 report --reporter=json --report-dir=./coverage ${path}`,
      { encoding: "utf-8" }
    );
    
    const coverage = JSON.parse(output);
    return {
      lines: coverage.total.lines.pct,
      functions: coverage.total.functions.pct,
      branches: coverage.total.branches.pct
    };
  } catch {
    return { lines: 0, functions: 0, branches: 0 };
  }
}

function formatMetrics(metrics: any) {
  let result = "Code Metrics:\n\n";
  
  if (metrics.complexity) {
    result += "Complexity:\n";
    result += `  Lines: ${metrics.complexity.lines}\n`;
    result += `  Functions: ${metrics.complexity.functions}\n`;
    result += `  Classes: ${metrics.complexity.classes}\n`;
    result += `  Complexity: ${metrics.complexity.complexity}\n\n`;
  }
  
  if (metrics.coverage) {
    result += "Coverage:\n";
    result += `  Lines: ${metrics.coverage.lines}%\n`;
    result += `  Functions: ${metrics.coverage.functions}%\n`;
    result += `  Branches: ${metrics.coverage.branches}%\n`;
  }
  
  return result;
}
```

## 12.5 實戰範例：API Mock Server

```typescript
// index.ts
import { createServer, IncomingMessage, ServerResponse } from "node:http";

export default {
  name: "api-mock",
  
  init: async (ctx) => {
    const mocks = new Map<string, any>();
    
    // 建立 mock server
    const server = createServer((req, res) => {
      const key = `${req.method} ${req.url}`;
      const mock = mocks.get(key);
      
      if (mock) {
        res.writeHead(mock.status, mock.headers);
        res.end(JSON.stringify(mock.body));
      } else {
        res.writeHead(404);
        res.end("Mock not found");
      }
    });
    
    server.listen(3001, () => {
      console.log("Mock server running on port 3001");
    });
    
    ctx.server = server;
    ctx.mocks = mocks;
  },
  
  tools: [
    {
      name: "add_mock",
      description: "Add a mock API endpoint",
      parameters: {
        method: { type: "string", description: "HTTP method" },
        path: { type: "string", description: "API path" },
        status: { type: "number", description: "Response status" },
        body: { type: "object", description: "Response body" }
      },
      execute: async (args, signal, ctx) => {
        const key = `${args.method} ${args.path}`;
        ctx.mocks.set(key, {
          status: args.status || 200,
          headers: { "Content-Type": "application/json" },
          body: args.body
        });
        
        return {
          content: [{
            type: "text",
            text: `Mock added: ${key}`
          }]
        };
      }
    },
    {
      name: "list_mocks",
      description: "List all configured mocks",
      parameters: {},
      execute: async (args, signal, ctx) => {
        const mocks = Array.from(ctx.mocks.entries()).map(([key, value]) => ({
          endpoint: key,
          status: value.status
        }));
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify(mocks, null, 2)
          }]
        };
      }
    }
  ],
  
  commands: [
    {
      name: "/mock",
      description: "Manage mock API endpoints",
      handler: async (args) => {
        return `Mock server: http://localhost:3001`;
      }
    }
  ]
};
```

## 12.6 測試 Extension

### 單元測試

```typescript
// tests/index.test.ts
import { describe, it, expect } from "vitest";
import extension from "../index.js";

describe("Git Smart Commit", () => {
  it("should analyze changes correctly", () => {
    const status = "M src/index.ts\nA src/utils.ts\nD src/old.ts";
    const changes = analyzeChanges(status);
    
    expect(changes.modified).toHaveLength(1);
    expect(changes.added).toHaveLength(1);
    expect(changes.deleted).toHaveLength(1);
  });
  
  it("should generate commit message", () => {
    const changes = {
      added: ["new.ts"],
      modified: [],
      deleted: [],
      types: new Set(["feat"])
    };
    
    const message = generateCommitMessage(changes);
    expect(message).toMatch(/^feat: update \d+ files$/);
  });
});
```

### 整合測試

```typescript
// tests/integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Agent } from "@earendil-works/pi-agent-core";

describe("Extension Integration", () => {
  let agent: Agent;
  
  beforeAll(() => {
    agent = new Agent({
      model: { provider: "anthropic", id: "claude-sonnet-4-20250514" },
      extensions: [extension]
    });
  });
  
  it("should use smart_commit tool", async () => {
    await agent.prompt("Use smart_commit to commit all changes");
    const lastMessage = agent.state.messages.pop();
    expect(lastMessage.content).toContain("Committed:");
  });
});
```

## 12.7 發佈 Extension

### npm 發佈

```bash
# 建立 package
npm init -y

# 更新 package.json
{
  "name": "@my-org/pi-extension",
  "version": "1.0.0",
  "main": "index.ts",
  "keywords": ["pi", "pi-coding-agent", "extension"]
}

# 發佈
npm publish
```

### 使用方式

```bash
# 安裝
npm install @my-org/pi-extension

# 在 Pi 中使用
pi --extensions @my-org/pi-extension
```

## 12.8 最佳實踐

### 1. 保持簡單

```typescript
// ❌ 不要這樣
export default {
  name: "mega-extension",
  tools: [
    { name: "tool1", ... },
    { name: "tool2", ... },
    { name: "tool3", ... },
    // ... 10 個工具
  ]
};

// ✅ 要這樣
export default {
  name: "focused-extension",
  tools: [
    { name: "single_tool", ... }  // 一個 Extension 專注一件事
  ]
};
```

### 2. 錯誤處理

```typescript
execute: async (args) => {
  try {
    // 執行操作
    return { content: [...] };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true
    };
  }
}
```

### 3. 文件完整

```markdown
# README.md

## Features
- Feature 1
- Feature 2

## Installation
```bash
npm install my-extension
```

## Usage
[使用範例]

## API
[API 文件]
```

---

> **下一步**：深入了解 SDK 嵌入，將 Pi 整合到你的應用程式。
