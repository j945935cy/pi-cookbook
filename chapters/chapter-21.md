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

> **注意**：以下數據為大致估計值，實際效能可能因硬體、模型版本、網路狀況等因素而異。如需精確數據，請自行執行基準測試。

### 啟動速度（參考值）

```
Pi:          ~100ms
Claude Code: ~500ms
OpenCode:    ~300ms
Aider:       ~200ms
```

### 記憶體使用（參考值）

```
Pi:          ~50MB
Claude Code: ~100MB
OpenCode:    ~80MB
Aider:       ~60MB
```

### Token 效率（參考值）

```
Pi:          ~1,000 tokens (系統提示)
Claude Code: ~3,000 tokens
OpenCode:    ~5,000 tokens
Aider:       ~2,000 tokens
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
