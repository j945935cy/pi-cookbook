# 第九章：Skills 系統

Skills 是 Pi 的知識包。它讓你可以將指令、腳本和參考資料打包成可重用的能力。

## 9.1 Skills vs Extensions

| 特性 | Skills | Extensions |
|------|--------|------------|
| 用途 | 知識和指令 | 程式碼和工具 |
| 載入方式 | 按需載入 | 啟動時載入 |
| Token 使用 | Progressive disclosure | 全部載入 |
| 複雜度 | 低（Markdown） | 高（TypeScript） |
| 適用場景 | 工作流程、最佳實踐 | 自訂工具、hooks |

### 概念圖

```
┌─────────────────────────────────────────────────────┐
│                   Pi 能力系統                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────┐      ┌─────────────────┐      │
│  │    Skills       │      │   Extensions    │      │
│  │  (知識包)       │      │  (程式碼包)     │      │
│  ├─────────────────┤      ├─────────────────┤      │
│  │ - 指令          │      │ - 工具          │      │
│  │ - 最佳實踐      │      │ - Hooks         │      │
│  │ - 範例          │      │ - TUI 元件      │      │
│  │ - 模板          │      │ - 命令          │      │
│  └─────────────────┘      └─────────────────┘      │
│           │                        │                │
│           ▼                        ▼                │
│  ┌─────────────────┐      ┌─────────────────┐      │
│  │  按需載入       │      │  啟動時載入     │      │
│  │  (節省 token)   │      │  (完整功能)     │      │
│  └─────────────────┘      └─────────────────┘      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 9.2 SKILL.md 格式

### 基本結構

```markdown
<!-- skills/my-skill/SKILL.md -->
# Skill 名稱

## Trigger
- 用戶提到的關鍵詞

## Instructions
1. 第一步
2. 第二步
3. 第三步

## Tools
- tool1: 用途說明
- tool2: 用途說明

## References
- 相關文件連結
```

### 完整範例：資料庫遷移

```markdown
<!-- skills/db-migrate/SKILL.md -->
# Database Migration Skill

## Trigger
- 用戶提到 migration, schema, database, migrate
- 用戶提到 新增欄位, 修改表格, 刪除表格

## Instructions

### 建立新 Migration
1. 先備份現有資料庫
   ```bash
   pg_dump -U username dbname > backup_$(date +%Y%m%d).sql
   ```

2. 檢查現有 migration 歷史
   ```bash
   ls -la migrations/
   ```

3. 建立新 migration 檔案
   - 檔案名稱格式: `YYYYMMDDHHMMSS_describe.sql`
   - 包含 UP 和 DOWN 邏輯

4. 測試 rollback 功能
   ```bash
   npm run migrate:rollback
   ```

5. 更新 migration 文件

### 執行 Migration
1. 確認沒有未提交的變更
2. 執行 migration
   ```bash
   npm run migrate
   ```

3. 驗證結果
   ```bash
   npm run migrate:status
   ```

## Tools
- bash: 執行 migration 命令
- read: 檢查 schema 檔案
- write: 建立 migration 檔案
- edit: 修改現有 migration

## Best Practices
- 每個 migration 只做一件事
- 總是包含 rollback 邏輯
- 在 migration 前備份
- 測試 rollback 後再部署
```

## 9.3 Progressive Disclosure

### 傳統方式

```
System Prompt:
┌─────────────────────────────────────────────────────┐
│ Available skills:                                   │
│                                                     │
│ ## Database Migration                               │
│ [完整 500 tokens 的說明...]                         │
│                                                     │
│ ## API Documentation                                │
│ [完整 500 tokens 的說明...]                         │
│                                                     │
│ ## Deployment                                       │
│ [完整 500 tokens 的說明...]                         │
│                                                     │
│ 總計: 1,500 tokens                                  │
└─────────────────────────────────────────────────────┘
```

### Pi 方式

```
System Prompt:
┌─────────────────────────────────────────────────────┐
│ Available skills:                                   │
│ - db-migrate: Database migration workflows          │
│ - api-docs: API documentation generation            │
│ - deploy: Deployment automation                     │
│                                                     │
│ 總計: 100 tokens                                    │
└─────────────────────────────────────────────────────┘
         │
         ▼ (模型決定需要時)
┌─────────────────────────────────────────────────────┐
│ 只載入 db-migrate 的完整內容                         │
│ (500 tokens)                                        │
└─────────────────────────────────────────────────────┘
```

### 載入流程

```
1. System prompt 包含 skill 列表
       │
       ▼
2. 用戶提問
       │
       ▼
3. 模型分析問題
       │
       ├── 不需要 skill → 直接回答
       │
       └── 需要 skill → 讀取完整 SKILL.md
              │
              ▼
4. 根據 skill 指令執行
```

## 9.4 建立自訂 Skill

### 步驟 1：建立目錄

```bash
mkdir -p skills/my-skill
```

### 步驟 2：建立 SKILL.md

```markdown
<!-- skills/my-skill/SKILL.md -->
# My Custom Skill

## Trigger
- 用戶提到 my-skill, custom, 專案特定關鍵詞

## Instructions
1. 分析用戶需求
2. 檢查相關檔案
3. 執行適當操作
4. 報告結果

## Tools
- read: 讀取檔案
- write: 寫入檔案
- bash: 執行命令

## Examples
### 範例 1: 基本使用
用戶: "使用 my-skill 處理這個檔案"
AI: [根據 instructions 執行]

### 範例 2: 進階使用
用戶: "使用 my-skill 批次處理所有檔案"
AI: [根據 instructions 執行]
```

### 步驟 3：在專案中使用

```bash
# Skill 會自動從 skills/ 目錄載入
pi -p "使用 my-skill 處理這個問題"
```

## 9.5 實戰 Skills

### Skill 1：Code Review

```markdown
<!-- skills/code-review/SKILL.md -->
# Code Review Skill

## Trigger
- 用戶提到 review, 審查, code review
- 用戶提到 檢查程式碼, 品質分析

## Instructions

### 審查流程
1. **理解需求**
   - 讀取相關文件
   - 理解業務邏輯

2. **安全性檢查**
   - SQL injection
   - XSS 漏洞
   - 認證授權問題
   - 敏感資料洩漏

3. **程式碼品質**
   - 命名規範
   - 函數長度
   - 重複代碼
   - 錯誤處理

4. **效能問題**
   - N+1 查詢
   - 不必要的迴圈
   - 記憶體洩漏

5. **輸出報告**
   - 嚴重等級：🔴 Critical, 🟡 Warning, 🟢 Suggestion
   - 具體位置：檔案名稱:行號
   - 修復建議

## Report Format
```markdown
## Code Review Report

### 🔴 Critical
- `file.ts:line`: Issue description
  - Fix: Suggested fix

### 🟡 Warning
- `file.ts:line`: Issue description
  - Suggestion: Improvement suggestion

### 🟢 Suggestion
- `file.ts:line`: Issue description
  - Consider: Alternative approach
```
```

### Skill 2：API 文件生成

```markdown
<!-- skills/api-docs/SKILL.md -->
# API Documentation Generator

## Trigger
- 用戶提到 api docs, swagger, openapi, 文件
- 用戶提到 API 規格, 接口文檔

## Instructions

### 文件生成流程
1. **掃描 API routes**
   ```bash
   grep -r "router\." src/api/
   ```

2. **提取 JSDoc 註解**
   - 讀取每個 route 的註解
   - 提取參數、回傳值、描述

3. **生成 OpenAPI 3.0 spec**
   ```yaml
   openapi: 3.0.0
   info:
     title: API Documentation
     version: 1.0.0
   paths:
     /api/users:
       get:
         summary: Get all users
         parameters:
           - name: limit
             in: query
             schema:
               type: integer
   ```

4. **產生 Swagger UI HTML**
   - 使用 swagger-ui-dist
   - 產生獨立 HTML 檔案

## Tools
- grep: 掃描 routes
- read: 讀取程式碼
- write: 產生文件

## Output
- `docs/api/openapi.yaml`
- `docs/api/swagger.html`
```

### Skill 3：部署自動化

```markdown
<!-- skills/deploy/SKILL.md -->
# Deployment Automation

## Trigger
- 用戶提到 deploy, 部署, release, 發佈
- 用戶提到 production, 上線

## Instructions

### 部署流程
1. **pre-deploy check**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

2. **版本更新**
   - 更新 package.json version
   - 建立 git tag
   - 更新 CHANGELOG.md

3. **部署**
   ```bash
   # 根據環境選擇
   npm run deploy:staging    # 預生產
   npm run deploy:production # 生產環境
   ```

4. **驗證**
   - 檢查部署狀態
   - 執行 smoke tests
   - 監控錯誤日誌

5. **回滾（如需要）**
   ```bash
   npm run rollback
   ```

## Safety Rules
- 永遠先在 staging 測試
- 部署前確認所有測試通過
- 準備好回滾計畫
- 通知團隊成員

## Tools
- bash: 執行部署命令
- read: 檢查配置
- edit: 更新版本號
```

## 9.6 Skill 載入機制

### 自動載入

```typescript
// Pi 會自動從以下位置載入 skills
const skillPaths = [
  "~/.pi/agent/skills/",      // 全域
  "/project/skills/",          // 專案
  "/project/src/skills/",      // 子目錄
];
```

### 手動載入

```typescript
// 在 extension 中
export default {
  name: "custom-skill-loader",
  
  init: async (ctx) => {
    // 載入自訂 skill
    const skill = await loadSkill("path/to/custom-skill");
    ctx.agent.addSkill(skill);
  }
};
```

## 9.7 Skills 最佳實踐

### 1. 明確的 Trigger

```markdown
# ❌ 不要這樣
## Trigger
- 相關問題

# ✅ 要這樣
## Trigger
- 用戶提到 migration, schema, database
- 用戶提到 新增欄位, 修改表格
- 用戶提到 migrate, migrate:rollback
```

### 2. 結構化的 Instructions

```markdown
# ❌ 不要這樣
## Instructions
做這個做那個，然後檢查結果。

# ✅ 要這樣
## Instructions
### 步驟 1: 備份
```bash
pg_dump ...
```

### 步驟 2: 執行
```bash
npm run migrate
```

### 步驟 3: 驗證
```bash
npm run migrate:status
```
```

### 3. 包含範例

```markdown
# ❌ 不要這樣
## Instructions
執行 migration。

# ✅ 要這樣
## Instructions
執行 migration。

## Examples
### 範例 1: 新增欄位
用戶: "users 表新增 email 欄位"
AI: 建立 migration 檔案，包含:
- ALTER TABLE users ADD COLUMN email VARCHAR(255);
- UPDATE users SET email = '' WHERE email IS NULL;
```

### 4. 安全提醒

```markdown
## Safety Rules
- 永遠先備份
- 測試 rollback
- 不要在 production 直接執行
- 通知團隊成員
```

## 9.8 Skills 與 Extensions 結合

```typescript
// extensions/db-migrate/index.ts
import { readFileSync } from "fs";

export default {
  name: "db-migrate",
  
  // 載入 skill
  init: async (ctx) => {
    const skillContent = readFileSync(
      "./skills/db-migrate/SKILL.md", 
      "utf-8"
    );
    ctx.agent.addSkill({
      name: "db-migrate",
      content: skillContent
    });
  },
  
  // 提供工具
  tools: [
    {
      name: "run_migrate",
      description: "Execute database migration",
      parameters: {
        action: { type: "string", enum: ["up", "down", "status"] }
      },
      execute: async (args) => {
        // 執行 migration
      }
    }
  ]
};
```

---

> **下一步**：深入了解 Session 管理，理解 tree-structured sessions 如何運作。
