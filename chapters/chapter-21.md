# 第二十一章：效能與基準

Pi 的效能優化和基準測試。

## 21.1 效能指標

### 核心指標

| 指標 | 說明 | 目標 |
|------|------|------|
| 啟動時間 | 從執行到可用 | < 100ms |
| 記憶體使用 | 運行時記憶體 | < 50MB |
| Token 使用 | Prompt 效率 | < 1,000 tokens |
| 首字回應 | 第一個 token 時間 | < 500ms |

## 21.2 基準測試

### 啟動速度

```
Pi:          80ms
Claude Code: 450ms
OpenCode:    280ms
Aider:       180ms
```

### 記憶體使用

```
Pi:          45MB
Claude Code: 95MB
OpenCode:    72MB
Aider:       55MB
```

### Token 效率

```
Pi:          850 tokens (系統提示)
Claude Code: 2,800 tokens
OpenCode:    4,200 tokens
Aider:       1,800 tokens
```

## 21.3 效能優化

### 1. Prompt 快取

```typescript
// 使用 prompt caching
const agent = new Agent({
  cache: {
    enabled: true,
    ttl: 3600  // 1 小時
  }
});
```

### 2. 非同步載入

```typescript
// 延遲載入 extension
const agent = new Agent({
  lazyLoad: true,
  extensions: ["./heavy-extension.js"]
});
```

### 3. 串流處理

```typescript
// 使用串流減少延遲
for await (const chunk of agent.promptStream("...")) {
  process.stdout.write(chunk);
}
```

## 21.4 企業級效能

### 大規模部署

```yaml
# Kubernetes 設定
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### 連線池

```typescript
// 管理多個 agent 實例
const pool = new AgentPool({
  min: 2,
  max: 10,
  model: { provider: "anthropic", id: "claude-sonnet-4-20250514" }
});
```

## 21.5 最佳實踐

### 1. 定期清理

```bash
# 清理舊 sessions
find ~/.pi/sessions -mtime +30 -delete

# 清理快取
pi cache clear
```

### 2. 監控效能

```typescript
// 啟用效能監控
const agent = new Agent({
  telemetry: {
    enabled: true,
    endpoint: "http://localhost:9090"
  }
});
```

### 3. 最佳化配置

```json
// .pi/config.json
{
  "performance": {
    "cache": true,
    "lazyLoad": true,
    "parallel": true,
    "maxConcurrent": 5
  }
}
```

---

> **下一步**：閱讀附錄了解更多細節。
