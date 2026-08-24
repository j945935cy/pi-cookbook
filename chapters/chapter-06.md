# 第六章：System Prompt 設計（110 行）

Pi 的 system prompt 不到 1,000 tokens，卻能讓模型表現得像使用了 10,000 tokens 的 prompt。這是怎麼做到的？

## 6.1 設計哲學

### 傳統方式 vs Pi 方式

```
傳統方式（Claude Code）:
┌─────────────────────────────────────────────────────┐
│ System Prompt (10,000+ tokens)                      │
├─────────────────────────────────────────────────────┤
│ - 完整的角色定義                                     │
│ - 所有工具的詳細說明                                 │
│ - 所有行為規則                                       │
│ - 安全限制                                           │
│ - 錯誤處理指南                                       │
│ - 格式要求                                           │
│ - ... 數十頁                                         │
└─────────────────────────────────────────────────────┘
問題：
- 每次 LLM call 都要傳送完整 prompt
- Token 浪費嚴重
- 模型可能忽略部分規則

Pi 方式:
┌─────────────────────────────────────────────────────┐
│ System Prompt (< 1,000 tokens)                      │
├─────────────────────────────────────────────────────┤
│ - 簡潔的角色定義                                     │
│ - 工具列表（一行描述）                               │
│ - 基本指導原則                                       │
│ - 專案 context（按需載入）                           │
│ - Skills（按需載入）                                 │
└─────────────────────────────────────────────────────┘
優勢：
- Token 節省 90%+
- 模型更容易遵循
- 可擴展性更高
```

### 核心理念

1. **少即是多**：只放必要的東西
2. **按需載入**：專案 context 和 skills 不是每次都傳送
3. **可擴展**：透過 extensions 補充功能
4. **透明**：使用者可以看到完整 prompt

## 6.2 System Prompt 結構

```typescript
// system-prompt.js 核心結構
export function buildSystemPrompt(options) {
  const {
    customPrompt,
    selectedTools,
    toolSnippets,
    promptGuidelines,
    appendSystemPrompt,
    cwd,
    contextFiles,
    skills,
  } = options;
  
  let prompt = `You are an expert coding assistant operating inside pi, 
a coding agent harness. You help users by reading files, executing commands, 
editing code, and writing new files.

Available tools:
${toolsList}

Guidelines:
${guidelines}

Pi documentation (read only when the user asks about pi itself):
- Main documentation: ${readmePath}
- Additional docs: ${docsPath}
- Examples: ${examplesPath}`;

  // 追加專案 context
  if (contextFiles.length > 0) {
    prompt += "\n\n<project_context>\n\n";
    for (const { path: filePath, content } of contextFiles) {
      prompt += `<project_instructions path="${filePath}">\n${content}\n</project_instructions>\n\n`;
    }
    prompt += "</project_context>\n";
  }
  
  // 追加 skills
  if (skills.length > 0) {
    prompt += formatSkillsForPrompt(skills);
  }
  
  prompt += `\nCurrent working directory: ${cwd}`;
  
  return prompt;
}
```

## 6.3 工具描述

### 簡潔描述

```typescript
// 工具描述範例
const toolSnippets = {
  read: "Read file contents",
  write: "Write content to file",
  edit: "Edit file with search/replace",
  bash: "Execute shell command",
  grep: "Search file contents",
  find: "Find files by pattern",
  ls: "List directory contents",
};
```

### 生成工具列表

```typescript
const toolsList = visibleTools
  .map((name) => `- ${name}: ${toolSnippets[name]}`)
  .join("\n");

// 輸出:
// - read: Read file contents
// - write: Write content to file
// - edit: Edit file with search/replace
// - bash: Execute shell command
```

### 為什麼一行描述？

1. **Token 節省**：每個工具只用一句話
2. **模型決策快**：模型不需要閱讀長篇說明
3. **可擴展**：詳細說明放在 docs/ 裡，需要時再讀取

## 6.4 Guidelines 動態生成

```typescript
// 根據可用工具動態生成 guidelines
const guidelinesList = [];

if (hasBash && !hasGrep && !hasFind && !hasLs) {
  addGuideline("Use bash for file operations like ls, rg, find");
}

// 基本 guidelines
addGuideline("Be concise in your responses");
addGuideline("Show file paths clearly when working with files");

// 使用者自訂 guidelines
for (const guideline of promptGuidelines ?? []) {
  addGuideline(guideline);
}

const guidelines = guidelinesList.map((g) => `- ${g}`).join("\n");
```

### Guidelines 範例

```
Guidelines:
- Be concise in your responses
- Show file paths clearly when working with files
- Use bash for file operations like ls, rg, find
- Read the existing implementation before modifying files
- Run tests after code changes
```

## 6.5 Project Context

### AGENTS.md 載入

Pi 從多個位置載入專案設定：

```
~/.pi/agent/AGENTS.md          ← 全域
/project/AGENTS.md             ← 專案根目錄
/project/src/AGENTS.md         ← 子目錄（可選）
```

### Context 格式

```xml
<project_context>

Project-specific instructions and guidelines:

<project_instructions path="AGENTS.md">
# Project Instructions

## 程式碼風格
- 使用 TypeScript strict mode
- 函數長度不超過 50 行

## 測試要求
- 修改程式碼後必須執行 `npm test`
</project_instructions>

</project_context>
```

### 為什麼用 XML 標籤？

1. **結構清晰**：模型容易解析
2. **可選取**：可以只提取特定部分
3. **可擴展**：可以加入更多 metadata

## 6.6 Skills on-demand Loading

```typescript
// Skills 格式
function formatSkillsForPrompt(skills) {
  let prompt = "\n\nAvailable skills:\n";
  
  for (const skill of skills) {
    prompt += `<skill name="${skill.name}" location="${skill.location}">\n`;
    prompt += `${skill.description}\n`;
    prompt += `</skill>\n`;
  }
  
  return prompt;
}
```

### Skill 載入流程

```
1. System prompt 包含 skill 列表（簡短描述）
       │
       ▼
2. 模型決定是否需要使用 skill
       │
       ▼
3. 如果需要，讀取完整 skill 內容
       │
       ▼
4. 根據 skill 指令執行
```

### Progressive Disclosure

```
傳統方式:
┌─────────────────────────────────────────┐
│ System Prompt                           │
├─────────────────────────────────────────┤
│ Skill 1: 完整說明 (500 tokens)          │
│ Skill 2: 完整說明 (500 tokens)          │
│ Skill 3: 完整說明 (500 tokens)          │
│ ...                                     │
│ 總計: 5,000 tokens                      │
└─────────────────────────────────────────┘

Pi 方式:
┌─────────────────────────────────────────┐
│ System Prompt                           │
├─────────────────────────────────────────┤
│ Skills:                                 │
│ - db-migrate: Database migration        │
│ - api-docs: API documentation           │
│ - deploy: Deployment automation         │
│ 總計: 100 tokens                        │
└─────────────────────────────────────────┘
       │
       ▼ (按需載入)
┌─────────────────────────────────────────┐
│ 只載入需要的 skill                       │
└─────────────────────────────────────────┘
```

## 6.7 與 Claude Code 比較

| 特性 | Pi | Claude Code |
|------|-----|-------------|
| System Prompt 大小 | < 1,000 tokens | > 10,000 tokens |
| 工具描述 | 一行 | 完整說明 |
| Guidelines | 動態生成 | 固定 |
| 專案 Context | 按需載入 | 全部載入 |
| Skills | Progressive disclosure | 全部載入 |
| 可擴展性 | Extension 系統 | Hooks/Plugins |

### Token 節省計算

```typescript
// 假設
const piPrompt = 800;      // tokens
const claudePrompt = 12000; // tokens

// 每次 LLM call 節省
const savings = claudePrompt - piPrompt;  // 11,200 tokens

// 假設平均每次 session 有 20 次 LLM call
const totalSavings = savings * 20;  // 224,000 tokens

// 假設 Claude 3.5 Sonnet 價格
// Input: $3 / 1M tokens
const costSavings = (totalSavings / 1_000_000) * 3;  // $0.67 per session
```

## 6.8 自訂 System Prompt

### 使用 SYSTEM.md

```markdown
<!-- SYSTEM.md -->
# Custom System Prompt

You are a senior backend engineer specializing in:
- Node.js and TypeScript
- PostgreSQL and Redis
- RESTful API design
- Microservices architecture

## Additional Guidelines
- Always use dependency injection
- Follow SOLID principles
- Write self-documenting code
```

### 使用 Extension

```typescript
// extensions/custom-prompt/index.ts
export default {
  name: "custom-prompt",
  hooks: {
    beforeTurn: async (ctx) => {
      // 動態修改 system prompt
      ctx.agent.state.systemPrompt += `
      
## Dynamic Context
Current time: ${new Date().toISOString()}
Git branch: ${await exec("git branch --show-current")}
      `;
    }
  }
};
```

## 6.9 最佳實踐

### 1. 保持簡潔

```markdown
# ❌ 不要這樣
You are an expert coding assistant. You have access to various tools that allow you to 
read files, write files, edit files, and execute commands. When reading files, you should 
carefully analyze the content and provide meaningful insights. When writing files, you 
should follow best practices and ensure code quality...

# ✅ 要這樣
You are an expert coding assistant. Available tools: read, write, edit, bash.
```

### 2. 明確的 Guidelines

```markdown
# ❌ 不要這樣
- Be helpful
- Do good work

# ✅ 要這樣
- Read existing code before modifying
- Run tests after changes
- Show file paths when working with files
```

### 3. 結構化的 Context

```xml
# ❌ 不要這樣
AGENTS.md 內容直接塞進 prompt

# ✅ 要這樣
<project_context>
<project_instructions path="AGENTS.md">
... 內容 ...
</project_instructions>
</project_context>
```

### 4. Progressive Disclosure

```markdown
# ❌ 不要這樣
把所有 skills 的完整說明都放在 prompt 裡

# ✅ 要這樣
只放 skill 列表，需要時再載入完整內容
```

## 6.10 110 行的魔力

Pi 的 system-prompt.js 只有 110 行，卻做到了：

1. **動態生成**：根據可用工具和設定生成 prompt
2. **按需載入**：專案 context 和 skills 不是每次都傳送
3. **可擴展**：支援自訂 prompt 和 extensions
4. **透明**：使用者可以看到完整 prompt

```typescript
// 110 行的核心邏輯
export function buildSystemPrompt(options) {
  // 1. 基本角色定義 (~50 tokens)
  // 2. 工具列表 (~100 tokens)
  // 3. Guidelines (~100 tokens)
  // 4. 專案 context (~200 tokens，按需)
  // 5. Skills (~50 tokens，按需)
  // 6. 工作目錄 (~10 tokens)
  // 總計: < 1,000 tokens
}
```

---

> **下一步**：深入了解四個預設工具，理解它們如何與 agent loop 整合。
