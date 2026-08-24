# 附錄 A：命令參考

Pi 的所有命令。

## A.1 主要命令

| 命令 | 說明 |
|------|------|
| `pi` | 啟動互動模式 |
| `pi -p "..."` | 執行 prompt |
| `pi -p "..." --exit` | 執行後退出 |
| `pi --version` | 顯示版本 |
| `pi --help` | 顯示說明 |

## A.2 伺服器命令

| 命令 | 說明 |
|------|------|
| `pi server start` | 啟動 RPC server |
| `pi server stop` | 停止 RPC server |
| `pi server status` | 查看 server 狀態 |

## A.3 Daemon 命令

| 命令 | 說明 |
|------|------|
| `pi daemon start` | 啟動 daemon |
| `pi daemon stop` | 停止 daemon |
| `pi daemon status` | 查看 daemon 狀態 |
| `pi daemon restart` | 重啟 daemon |

## A.4 Session 命令

| 命令 | 說明 |
|------|------|
| `/tree` | 查看 session 樹 |
| `/fork` | 分支 session |
| `/clone` | 複製 session |
| `/compact` | 壓縮 session |
| `/export` | 匯出 session |

## A.5 模型命令

| 命令 | 說明 |
|------|------|
| `/model` | 切換模型 |
| `/stats` | 查看使用量 |
| `/cache` | 管理快取 |

## A.6 Extension 命令

| 命令 | 說明 |
|------|------|
| `/extensions` | 列出 extensions |
| `/reload` | 重載 extensions |

## A.7 環境變數

| 變數 | 說明 |
|------|------|
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `GEMINI_API_KEY` | Gemini API key |
| `PI_NON_INTERACTIVE` | 非互動模式 |
| `PI_SERVER_PORT` | Server 端口 |
| `PI_AUDIT_LOG` | 啟用審計日誌 |
| `PI_BUDGET_WARNING` | 預算警告 |
| `PI_BUDGET_LIMIT` | 預算限制 |
