# 第十八章：多模式運行

Pi 支援多種運行模式。

## 18.1 互動模式

```bash
# 啟動互動模式
pi

# 或
pi -i
```

### 特性
- 即時互動
- Session 保留
- 支援所有命令

## 18.2 非互動模式

```bash
# 執行單一命令
pi -p "Write a React component"

# 執行後退出
pi -p "Run tests" --exit
```

### 特性
- 執行完自動退出
- 適合 CI/CD
- 無需使用者介入

## 18.3 Server 模式

```bash
# 啟動 RPC server
pi server start

# 指定端口
pi server start --port 3001
```

### 特性
- JSON-RPC 2.0 協議
- 支援 WebSocket
- 遠端控制

## 18.4 Daemon 模式

```bash
# 啟動 daemon
pi daemon start

# 停止 daemon
pi daemon stop

# 查看狀態
pi daemon status
```

### 特性
- 後台運行
- 資源佔用低
- 隨時喚醒

## 18.5 模式選擇指南

| 場景 | 模式 | 命令 |
|------|------|------|
| 日常開發 | 互動模式 | `pi` |
| CI/CD | 非互動模式 | `pi -p "..."` |
| Web 整合 | Server 模式 | `pi server start` |
| 長期運行 | Daemon 模式 | `pi daemon start` |

## 18.6 環境變數

```bash
# 非互動模式
export PI_NON_INTERACTIVE=1

# Server 模式
export PI_SERVER_PORT=3000

# Daemon 模式
export PI_DAEMON_SOCKET="/tmp/pi.sock"
```

---

> **下一步**：深入了解競品深度比較。
