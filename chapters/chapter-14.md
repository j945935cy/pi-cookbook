# 第十四章：RPC 模式

透過 JSON-RPC 2.0 遠端控制 Pi Agent。

> **注意**：本章的 RPC API 範例為**概念性示範**，實際端口、方法和參數可能因版本而異。請參考官方文件確認最新的 RPC 規格。

## 14.1 啟動 RPC Server

```bash
# 啟動 RPC server
pi server start

# 預設端口
# http://localhost:3000
```

## 14.2 JSON-RPC 2.0 協議

### 基本格式

```json
// Request
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "prompt",
  "params": {
    "message": "Hello"
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "message": "Hi there!"
  }
}
```

### 錯誤格式

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Invalid Request"
  }
}
```

## 14.3 可用方法

### prompt

```json
{
  "method": "prompt",
  "params": {
    "message": "Create a React component"
  }
}
```

### promptStream

```json
{
  "method": "promptStream",
  "params": {
    "message": "Write a story"
  }
}
```

### getTools

```json
{
  "method": "getTools",
  "params": {}
}
```

### callTool

```json
{
  "method": "callTool",
  "params": {
    "name": "read",
    "arguments": {
      "path": "package.json"
    }
  }
}
```

### getState

```json
{
  "method": "getState",
  "params": {}
}
```

## 14.4 Client 範例

### JavaScript Client

```typescript
import { RPCClient } from "@earendil-works/pi-coding-agent";

const client = new RPCClient("http://localhost:3000");

// 執行 prompt
const response = await client.prompt("Hello");
console.log(response.message);

// 串流回應
for await (const chunk of client.promptStream("Write a story")) {
  process.stdout.write(chunk);
}

// 呼叫工具
const result = await client.callTool("read", { path: "package.json" });
console.log(result);
```

### Python Client

```python
import requests

def pi_rpc(method, params=None):
    response = requests.post(
        "http://localhost:3000",
        json={
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params or {}
        }
    )
    return response.json()["result"]

# 執行 prompt
result = pi_rpc("prompt", {"message": "Hello"})
print(result["message"])

# 呼叫工具
result = pi_rpc("callTool", {
    "name": "read",
    "arguments": {"path": "package.json"}
})
print(result)
```

### curl Client

```bash
# 執行 prompt
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"prompt","params":{"message":"Hello"}}'

# 呼叫工具
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"callTool","params":{"name":"read","arguments":{"path":"package.json"}}}'
```

## 14.5 WebSocket 支援

### 連線

```typescript
import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:3000");

ws.on("open", () => {
  ws.send(JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "prompt",
    params: { message: "Hello" }
  }));
});

ws.on("message", (data) => {
  const response = JSON.parse(data.toString());
  console.log(response.result);
});
```

## 14.6 安全設定

### API Key 認證

```bash
export PI_RPC_API_KEY="your-secret-key"

# Client 需要帶入 header
curl -X POST http://localhost:3000 \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"prompt","params":{"message":"Hello"}}'
```

### CORS 設定

```bash
export PI_RPC_CORS="http://localhost:8080"
```

---

> **下一步**：深入了解 Package 系統，理解 Pi 的套件管理。
