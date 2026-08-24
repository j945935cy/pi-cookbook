# 第十章：Session 管理

Pi 的 session 不是線性的對話記錄，而是一棵樹。這讓你可以分支、比較、回溯。

## 10.1 Tree-structured Sessions

### 傳統方式 vs Pi 方式

```
傳統方式（線性）:
┌─────────────────────────────────────────────────────┐
│ Session A                                           │
├─────────────────────────────────────────────────────┤
│ Message 1 → Message 2 → Message 3 → Message 4      │
│                                                     │
│ 問題：如果 Message 3 是錯的，只能重新開始            │
└─────────────────────────────────────────────────────┘

Pi 方式（樹狀）:
┌─────────────────────────────────────────────────────┐
│ Session A                                           │
├─────────────────────────────────────────────────────┤
│ Message 1                                           │
│   └── Message 2                                     │
│       ├── Message 3a (方法 A)                       │
│       │   └── Message 4a                            │
│       └── Message 3b (方法 B)                       │
│           └── Message 4b                            │
│                                                     │
│ 優勢：可以同時探索多種方法，比較結果                  │
└─────────────────────────────────────────────────────┘
```

### 樹狀結構圖

```
                    Root
                      │
                      ▼
                 Message 1
                      │
                      ▼
                 Message 2
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
       Message 3a          Message 3b
            │                   │
            ▼                   ▼
       Message 4a          Message 4b
            │                   │
            ▼                   ▼
       Message 5a          Message 5b
```

## 10.2 JSONL 儲存格式

### 檔案結構

```jsonl
{"id":"msg_1","type":"message","parentId":null,"message":{"role":"user","content":"Hello"}}
{"id":"msg_2","type":"message","parentId":"msg_1","message":{"role":"assistant","content":"Hi there!"}}
{"id":"msg_3","type":"message","parentId":"msg_2","message":{"role":"user","content":"Help me refactor"}}
{"id":"msg_4","type":"message","parentId":"msg_3","message":{"role":"assistant","content":"Let me read the file..."}}
{"id":"msg_5","type":"message","parentId":"msg_4","message":{"role":"user","content":"Try approach B instead"}}
{"id":"msg_6","type":"message","parentId":"msg_4","message":{"role":"assistant","content":"Here's approach B..."}}
```

### 資料結構

```typescript
interface SessionEntry {
  id: string;              // 唯一識別碼
  type: "message" | "compaction" | "summary";
  parentId: string | null; // 父節點 ID
  message?: {
    role: "user" | "assistant" | "toolResult";
    content: any;
    timestamp: number;
  };
}
```

## 10.3 Session 命令

### /tree：查看 session 樹

```
> /tree

Session Tree:
├── msg_1: "Hello"
│   └── msg_2: "Hi there!"
│       ├── msg_3: "Help me refactor" ← current
│       │   └── msg_4: "Let me read..."
│       └── msg_5: "Try approach B"
│           └── msg_6: "Here's approach B..."
```

### /fork：分支

```
> /fork msg_3

Forked from message 3.
Current branch: msg_3 → msg_7 (new)
```

### /clone：複製

```
> /clone msg_4

Cloned branch from message 4.
New session created with same history.
```

### /compact：壓縮

```
> /compact

Compacted 15 messages into summary.
Context size: 50,000 tokens → 5,000 tokens
```

## 10.4 實際使用場景

### 場景 1：Debug 分支策略

```bash
# 主線程：正常開發
pi -p "Implement user authentication"

# 遇到問題，建立分支
> /fork <message-id-before-error>

# 方法 A：嘗試修復
pi -p "The login fails, try using JWT"

# 回到分支點
> /tree
> /fork <message-id-before-error>

# 方法 B：嘗試另一種方式
pi -p "The login fails, try using session-based auth"

# 比較兩種方法的結果
> /tree
```

### 場景 2：長對話 Compaction

```bash
# 長對話後，context 接近限制
> /compact

# 自動壓縮舊訊息，保留最近 20k tokens
# 舊訊息會被摘要，但仍然可以存取
```

### 場景 3：多角度探索

```bash
# 問題：如何優化這個函數？

# 分支 1：演算法優化
> /fork <message-id>
pi -p "Optimize the algorithm to O(n log n)"

# 分支 2：快取優化
> /fork <message-id>
pi -p "Add caching to reduce database calls"

# 分支 3：並行處理
> /fork <message-id>
pi -p "Use parallel processing for this task"

# 比較三種方法
> /tree
```

## 10.5 Compaction 機制

### 自動 Compaction

```typescript
// 當 context 接近限制時自動觸發
if (shouldCompact(context)) {
  const compaction = await prepareCompaction(context);
  context.messages = compaction.messages;
}
```

### 手動 Compaction

```bash
> /compact

# 或指定保留的 token 數
> /compact --keep 10000
```

### Compaction 策略

```typescript
interface CompactionOptions {
  reserveTokens: number;    // 保留給回應的 token
  keepRecentTokens: number; // 保留最近的 token
  summarizeModel?: string;  // 用於摘要的模型
}
```

### 壓縮流程

```
原始 Context (50,000 tokens)
     │
     ▼
┌─────────────────────────────┐
│ 識別可壓縮的訊息             │
│ (舊的 user/assistant 對話)  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ 生成摘要                     │
│ (使用 summarization model)  │
└──────────────┬──────────────┘
               │
               ▼
壓縮後 Context (5,000 tokens)
     │
     ├── 摘要 (舊訊息)
     └── 最近訊息 (完整保留)
```

## 10.6 Branch Summary

### 自動分支摘要

```typescript
// 當切換分支時自動生成摘要
async function generateBranchSummary(messages) {
  const summary = await summarize(messages);
  return {
    type: "summary",
    content: summary
  };
}
```

### 摘要格式

```markdown
## Branch Summary

### 主要討論
- 實作了用戶認證功能
- 使用 JWT token
- 整合了 PostgreSQL

### 做出的決定
- 使用 bcrypt 加密密碼
- Token 過期時間設為 24 小時
- 加入 refresh token 機制

### 待辦事項
- [ ] 加入 rate limiting
- [ ] 寫單元測試
- [ ] 更新 API 文件
```

## 10.7 Session 管理 API

### 開啟 Session

```typescript
import { SessionManager } from "@earendil-works/pi-coding-agent";

const sessionManager = SessionManager.open("session.jsonl");
```

### 建立新 Session

```typescript
const sessionManager = SessionManager.create(cwd, sessionDir);
sessionManager.newSession();
```

### 分支 Session

```typescript
const forkedPath = sessionManager.createBranchedSession(targetLeafId);
```

### 匯出 Session

```typescript
// 匯出為 HTML
await exportSessionToHtml(sessionManager, "export.html");

// 匯出為 JSON
const data = sessionManager.exportToJson();
```

## 10.8 Session 與 Context 工程

### Context Injection

```typescript
// Extension 可以注入 context
hooks: {
  beforeTurn: async (ctx) => {
    // 注入專案資訊
    const projectInfo = await getProjectInfo();
    ctx.agent.state.messages.unshift({
      role: "system",
      content: `Project context: ${projectInfo}`
    });
  }
}
```

### Context Transformation

```typescript
// 轉換 context 格式
config: {
  transformContext: async (messages, signal) => {
    // 過濾敏感資訊
    return messages.map(msg => ({
      ...msg,
      content: sanitizeContent(msg.content)
    }));
  }
}
```

## 10.9 Session 最佳實踐

### 1. 定期 Compaction

```bash
# 長對話時定期壓縮
> /compact

# 或設定自動壓縮
# 在 AGENTS.md 中
auto_compaction: true
compaction_threshold: 40000  # tokens
```

### 2. 使用分支探索

```bash
# 不確定時，使用分支
> /fork
pi -p "嘗試方法 A"

# 如果不好，回到分支點
> /tree
> /fork
pi -p "嘗試方法 B"
```

### 3. 建立摘要

```bash
# 完成重要工作後建立摘要
> /compact

# 或手動建立
pi -p "總結我們剛才做的所有修改"
```

### 4. 匯出重要 Session

```bash
# 匯出為可分享的格式
> /export session.html

# 上傳到 GitHub Gist
> /share
```

## 10.10 Session 資料管理

### 儲存位置

```
~/.pi/sessions/
├── session-1.jsonl
├── session-2.jsonl
└── ...
```

### 清理舊 Session

```bash
# 刪除 30 天前的 sessions
find ~/.pi/sessions -name "*.jsonl" -mtime +30 -delete
```

### 備份 Session

```bash
# 備份所有 sessions
tar -czf pi-sessions-backup.tar.gz ~/.pi/sessions/
```

---

> **下一步**：深入了解 Model 整合，理解如何使用 15+ providers。
