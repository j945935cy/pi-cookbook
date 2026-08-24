# 第七章：四個預設工具

Pi 的核心工具只有四個：read、write、edit、bash。這是經過深思熟慮的設計。

## 7.1 為什麼只有四個？

### 工具地獄

```
傳統 Agent 的問題：
┌─────────────────────────────────────────────────────┐
│ Claude Code 工具列表                                 │
├─────────────────────────────────────────────────────┤
│ - Read                                              │
│ - Write                                             │
│ - Edit                                              │
│ - Bash                                              │
│ - Grep                                              │
│ - Find                                              │
│ - LS                                                │
│ - Glob                                              │
│ - WebFetch                                          │
│ - WebSearch                                         │
│ - TodoRead                                          │
│ - TodoWrite                                         │
│ - Task (sub-agent)                                  │
│ - ... 更多                                          │
└─────────────────────────────────────────────────────┘

問題：
- 模型要從 20+ 工具中選擇
- System prompt 變得冗長
- 每個工具都要詳細說明
- 工具間功能重疊
```

### Pi 的解答

```
Pi 的工具集：
┌─────────────────────────────────────────────────────┐
│ Pi 工具 (4 個核心 + 可選)                            │
├─────────────────────────────────────────────────────┤
│ 核心：                                              │
│ - read: 讀取檔案                                    │
│ - write: 寫入檔案                                   │
│ - edit: 編輯檔案                                    │
│ - bash: 執行命令                                    │
│                                                     │
│ 可選（預設啟用）：                                   │
│ - grep: 搜尋內容                                    │
│ - find: 搜尋檔案                                    │
│ - ls: 列出目錄                                      │
└─────────────────────────────────────────────────────┘

優勢：
- 模型決策快
- System prompt 簡潔
- 功能清晰不重疊
- 可透過 extension 擴展
```

## 7.2 read：讀取檔案

### 功能

讀取檔案內容，支援行範圍和偏移量。

### 參數

```typescript
interface ReadToolParams {
  path: string;           // 檔案路徑
  offset?: number;        // 起始行號（從 1 開始）
  limit?: number;         // 最大行數
}
```

### 實作

```typescript
// tools/read.js 核心邏輯
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function resolvePath(path: string): string {
  return resolve(path);
}

export async function execute(args: { path: string; offset?: number; limit?: number }, signal: AbortSignal) {
  const { path, offset, limit } = args;
  
  // 解析路徑
  const resolvedPath = resolvePath(path);
  
  // 檢查檔案是否存在
  if (!existsSync(resolvedPath)) {
    return {
      content: [{ type: "text", text: `File not found: ${path}` }],
      isError: true
    };
  }
  
  // 讀取檔案
  const content = readFileSync(resolvedPath, "utf-8");
  const lines = content.split("\n");
  
  // 應用 offset 和 limit
  const start = (offset || 1) - 1;
  const end = limit ? start + limit : lines.length;
  const selectedLines = lines.slice(start, end);
  
  // 格式化輸出
  const output = selectedLines
    .map((line, i) => `${start + i + 1}: ${line}`)
    .join("\n");
  
  return {
    content: [{ type: "text", text: output }]
  };
}
```

### 使用範例

```bash
# 讀取完整檔案
pi -p "Read package.json"

# 讀取前 50 行
pi -p "Read src/index.ts, first 50 lines"

# 從第 100 行開始讀取
pi -p "Read src/index.ts from line 100"
```

### 設計要點

1. **行號顯示**：方便模型定位
2. **偏移量支援**：可以讀取大檔案的一部分
3. **路徑解析**：支援相對路徑和 `~`

## 7.3 write：寫入檔案

### 功能

寫入內容到檔案，如果檔案不存在會自動建立。

### 參數

```typescript
interface WriteToolParams {
  path: string;           // 檔案路徑
  content: string;        // 要寫入的內容
}
```

### 實作

```typescript
// tools/write.js 核心邏輯
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

function resolvePath(path: string): string {
  return resolve(path);
}

export async function execute(args: { path: string; content: string }, signal: AbortSignal) {
  const { path, content } = args;
  
  // 解析路徑
  const resolvedPath = resolvePath(path);
  
  // 確保目錄存在
  const dir = dirname(resolvedPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  // 寫入檔案
  writeFileSync(resolvedPath, content, "utf-8");
  
  return {
    content: [{ type: "text", text: `File written: ${path}` }]
  };
}
```

### 使用範例

```bash
# 寫入新檔案
pi -p "Create a new file src/utils.ts with a helper function"

# 覆寫檔案
pi -p "Rewrite package.json with the new dependencies"
```

### 安全機制

```typescript
// 在 agent loop 中的保護
if (config.beforeToolCall) {
  const beforeResult = await config.beforeToolCall({
    assistantMessage,
    toolCall,
    args: validatedArgs,
    context: currentContext,
  }, signal);
  
  if (beforeResult?.block) {
    // 工具調用被阻止
    return {
      kind: "immediate",
      result: createErrorToolResult(beforeResult.reason),
      isError: true,
    };
  }
}
```

## 7.4 edit：編輯檔案

### 功能

使用搜尋/替換模式編輯檔案，比 write 更精確。

### 參數

```typescript
interface EditToolParams {
  path: string;           // 檔案路徑
  oldString: string;      // 要替換的內容
  newString: string;      // 替換後的內容
 replaceAll?: boolean;    // 是否替換所有符合的內容
}
```

### 實作

```typescript
// tools/edit.js 核心邏輯
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function resolvePath(path: string): string {
  return resolve(path);
}

export async function execute(args: { path: string; oldString: string; newString: string; replaceAll?: boolean }, signal: AbortSignal) {
  const { path, oldString, newString, replaceAll } = args;
  
  // 解析路徑
  const resolvedPath = resolvePath(path);
  
  // 讀取檔案
  const content = readFileSync(resolvedPath, "utf-8");
  
  // 檢查 oldString 是否存在
  if (!content.includes(oldString)) {
    return {
      content: [{ type: "text", text: `oldString not found in ${path}` }],
      isError: true
    };
  }
  
  // 檢查是否有多個符合
  if (!replaceAll) {
    const count = content.split(oldString).length - 1;
    if (count > 1) {
      return {
        content: [{ 
          type: "text", 
          text: `Found ${count} matches for oldString. Provide more context or use replaceAll.` 
        }],
        isError: true
      };
    }
  }
  
  // 執行替換
  let newContent;
  if (replaceAll) {
    newContent = content.replaceAll(oldString, newString);
  } else {
    newContent = content.replace(oldString, newString);
  }
  
  // 寫入檔案
  writeFileSync(resolvedPath, newContent, "utf-8");
  
  return {
    content: [{ type: "text", text: `File edited: ${path}` }]
  };
}
```

### 使用範例

```bash
# 替換特定內容
pi -p "In src/auth.ts, replace 'console.log' with 'logger.info'"

# 替換所有符合
pi -p "Replace all 'var' with 'const' in src/index.ts"
```

### 與 write 的比較

| 特性 | edit | write |
|------|------|-------|
| 精確度 | 高（搜尋/替換） | 低（完全覆寫） |
| 安全性 | 高（需要匹配） | 低（可能意外覆寫） |
| 適用場景 | 修改特定部分 | 建立新檔案或完全重寫 |

## 7.5 bash：執行命令

### 功能

執行 shell 命令，支援超時和工作目錄。

### 參數

```typescript
interface BashToolParams {
  command: string;        // 要執行的命令
  timeout?: number;       // 超時時間（毫秒）
  workdir?: string;       // 工作目錄
}
```

### 實作

```typescript
// tools/bash.js 核心邏輯
import { spawn } from "node:child_process";

export async function execute(args: { command: string; timeout?: number; workdir?: string }, signal: AbortSignal) {
  const { command, timeout, workdir } = args;
  
  // 建立子程序
  const child = spawn("bash", ["-c", command], {
    cwd: workdir || process.cwd(),
    signal,
  });
  
  // 收集輸出
  let stdout = "";
  let stderr = "";
  
  child.stdout.on("data", (data) => {
    stdout += data.toString();
  });
  
  child.stderr.on("data", (data) => {
    stderr += data.toString();
  });
  
  // 等待完成（含超時）
  return new Promise((resolve) => {
    const timer = timeout ? setTimeout(() => {
      child.kill();
      resolve({
        content: [{ type: "text", text: `Command timed out after ${timeout}ms` }],
        isError: true
      });
    }, timeout) : null;
    
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      
      const output = stdout + (stderr ? `\nSTDERR:\n${stderr}` : "");
      resolve({
        content: [{ 
          type: "text", 
          text: output || `Command completed with exit code ${code}` 
        }],
        isError: code !== 0
      });
    });
    
    child.on("error", (error) => {
      if (timer) clearTimeout(timer);
      resolve({
        content: [{ type: "text", text: error.message }],
        isError: true
      });
    });
  });
}
```

### 使用範例

```bash
# 執行簡單命令
pi -p "Run 'npm test' and show the results"

# 執行複雜命令
pi -p "Find all TypeScript files and count lines of code"

# 帶超時
pi -p "Run 'npm install' with a 60 second timeout"
```

### 安全考量

```typescript
// 危險命令檢查
const dangerousPatterns = [
  /rm\s+-rf/i,
  /drop\s+table/i,
  /kubectl\s+delete/i,
  /docker\s+rm/i,
];

function isDangerousCommand(command: string): boolean {
  return dangerousPatterns.some(pattern => pattern.test(command));
}
```

## 7.6 只讀工具

### grep：搜尋內容

```typescript
interface GrepToolParams {
  pattern: string;        // 正則表達式
  path?: string;          // 搜尋目錄
  include?: string;       // 檔案篩選（如 *.ts）
}
```

### find：搜尋檔案

```typescript
interface FindToolParams {
  pattern: string;        // glob 模式
  path?: string;          // 搜尋目錄
}
```

### ls：列出目錄

```typescript
interface LsToolParams {
  path?: string;          // 目錄路徑
  all?: boolean;          // 顯示隱藏檔案
}
```

### 為什麼這些是唯讀的？

1. **安全性**：不會修改系統狀態
2. **可預測**：執行多少次都一樣
3. **可快取**：結果可以快取

## 7.7 工具定義格式

```typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: {
      [key: string]: {
        type: string;
        description?: string;
        enum?: string[];
      };
    };
    required: string[];
  };
  execute: (args: any, signal: AbortSignal) => Promise<ToolResult>;
}

interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  details?: Record<string, any>;
  usage?: UsageInfo;
  terminate?: boolean;
  isError?: boolean;
}
```

## 7.8 工具註冊

### 在 Agent 中註冊

```typescript
const agent = new Agent({
  tools: [
    {
      name: "read",
      description: "Read file contents",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path" }
        },
        required: ["path"]
      },
      execute: async (args) => {
        // 實作
      }
    }
  ]
});
```

### 透過 Extension 註冊

```typescript
// extensions/custom-tools/index.ts
export default {
  name: "custom-tools",
  tools: [
    {
      name: "my_custom_tool",
      description: "Does something custom",
      parameters: { ... },
      execute: async (args) => { ... }
    }
  ]
};
```

## 7.9 工具執行流程

```
User Prompt
     │
     ▼
Agent Loop
     │
     ▼
LLM Response (包含 tool calls)
     │
     ├──▶ Tool Call A (read)
     ├──▶ Tool Call B (grep)
     └──▶ Tool Call C (bash)
           │
           ▼
     executeToolCalls()
           │
     ┌─────┼─────┐
     ▼     ▼     ▼
   read  grep  bash
     │     │     │
     ▼     ▼     ▼
   Result A, B, C
           │
           ▼
     Tool Results → Context
           │
           ▼
     Next LLM Call
```

## 7.10 範例：完整工作流程

```bash
# 1. 探索專案
pi -p "
  Use read, grep, find, ls to explore this project.
  Tell me:
  - What framework is used?
  - What's the project structure?
  - Where are the tests?
"

# 2. 找到問題
pi -p "
  grep for 'TODO' in the codebase.
  Find the top 5 most critical TODOs.
"

# 3. 修復問題
pi -p "
  Fix the TODO in src/auth.ts that says 'handle password reset'.
  Implement password reset functionality.
  Run tests after.
"

# 4. 驗證
pi -p "
  Run 'npm test' and 'npm run lint'.
  Report any failures.
"
```

---

> **下一步**：深入了解 Extension 系統，理解如何擴展 Pi 的功能。
