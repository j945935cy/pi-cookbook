# 第十六章：安全架構

Pi 的安全模型設計。

## 16.1 安全理念

### 核心原則

1. **最小權限**：預設不信任任何操作
2. **使用者確認**：危險操作需要確認
3. **沙箱隔離**：容器化隔離執行環境
4. **審計追蹤**：記錄所有操作

## 16.2 權限模型

### 權限等級

```typescript
enum PermissionLevel {
  Read = 0,      // 讀取檔案
  Write = 1,     // 寫入檔案
  Execute = 2,   // 執行命令
  Admin = 3      // 管理權限
}
```

### 權限檢查流程

```
使用者請求
    │
    ▼
┌─────────────────────────┐
│ 檢查權限等級            │
└──────────┬──────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
  允許          需要確認
    │             │
    ▼             ▼
 執行操作    顯示確認對話框
                   │
            ┌──────┴──────┐
            ▼             ▼
          同意          拒絕
            │             │
            ▼             ▼
         執行操作    取消操作
```

## 16.3 預設安全規則

### Bash 工具

```typescript
const bashSecurityRules = [
  {
    pattern: /rm\s+-rf/,
    action: "confirm",
    reason: "Dangerous recursive delete"
  },
  {
    pattern: /sudo/,
    action: "block",
    reason: "No sudo access"
  },
  {
    pattern: /curl.*\|.*sh/,
    action: "confirm",
    reason: "Pipe to shell is risky"
  },
  {
    pattern: /npm\s+publish/,
    action: "confirm",
    reason: "Cannot publish from AI session"
  }
];
```

### Write 工具

```typescript
const writeSecurityRules = [
  {
    pattern: /\.env/,
    action: "confirm",
    reason: "Environment files contain secrets"
  },
  {
    pattern: /\.ssh\//,
    action: "block",
    reason: "SSH keys are sensitive"
  },
  {
    pattern: /\.aws\//,
    action: "block",
    reason: "AWS credentials are sensitive"
  }
];
```

## 16.4 Extension 安全

### Extension 權限

```typescript
interface ExtensionPermissions {
  tools: string[];      // 可使用的工具
  hooks: string[];      // 可註冊的 hooks
  paths: string[];      // 可存取的路徑
}
```

### 預設限制

```typescript
const extensionSecurity = {
  maxTools: 10,           // 最多 10 個工具
  maxHooks: 5,            // 最多 5 個 hooks
  allowedPaths: [         // 允許的路徑
    "./",
    "../",
    "~/.pi/"
  ],
  blockedPaths: [         // 封鎖的路徑
    "/etc",
    "/usr",
    "~/.ssh",
    "~/.aws"
  ]
};
```

## 16.5 環境變數安全

### API Key 保護

```bash
# ❌ 不要這樣
export ANTHROPIC_API_KEY="sk-ant-api03-..."

# ✅ 要這樣（使用 .env）
echo "ANTHROPIC_API_KEY=sk-ant-api03-..." > .env
echo ".env" >> .gitignore
```

### Secrets 管理

```typescript
// 使用 Pi 的 secrets 管理
const agent = new Agent({
  secrets: {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY
  }
});
```

## 16.6 沙箱模式

### Docker 沙箱

```bash
# 啟動沙箱
pi --sandbox docker

# 沙箱限制
- 無網路存取（除非明確允許）
- 唯讀檔案系統（除了工作目錄）
- 資源限制（CPU、記憶體）
```

### 沙箱配置

```json
// .pi/sandbox.json
{
  "docker": {
    "image": "node:20-slim",
    "network": "none",
    "volumes": [
      ".:/workspace:rw"
    ],
    "resources": {
      "memory": "512m",
      "cpus": "1.0"
    }
  }
}
```

## 16.7 審計日誌

### 啟用審計

```bash
export PI_AUDIT_LOG=true
export PI_AUDIT_PATH="./audit.log"
```

### 日誌格式

```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "action": "tool_call",
  "tool": "bash",
  "args": { "command": "ls -la" },
  "result": "success",
  "user": "developer"
}
```

## 16.8 最佳實踐

### 1. 定期更新

```bash
# 更新 Pi
npm update -g @earendil-works/pi-coding-agent

# 檢查安全性
npm audit
```

### 2. 使用 .gitignore

```gitignore
.env
.env.local
.env.production
*.pem
*.key
```

### 3. 限制 Extension 權限

```typescript
// 只給予必要的權限
const agent = new Agent({
  extensions: [{
    name: "my-extension",
    permissions: {
      tools: ["read", "write"],
      paths: ["./src"]
    }
  }]
});
```

---

> **下一步**：深入了解容器化部署。
