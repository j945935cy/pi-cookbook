# 第二章：快速開始

## 2.1 安裝

### 使用 npm

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

> **為什麼要 `--ignore-scripts`？**
> 跳過依賴的生命週期腳本，減少供應鏈攻擊風險。Pi 不需要這些腳本就能正常運作。

### 使用 curl（Linux/macOS）

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

### 使用 PowerShell（Windows）

```powershell
powershell -c "irm https://pi.dev/install.ps1 | iex"
```

### 驗證安裝

```bash
pi --version
# 輸出: 0.84.2 或更新版本
```

## 2.2 認證設定

Pi 支援兩種認證方式：

### 方式一：API Key（推薦）

```bash
# Anthropic
export ANTHROPIC_API_KEY="sk-ant-..."

# OpenAI
export OPENAI_API_KEY="sk-..."

# Google
export GOOGLE_API_KEY="AIza..."
```

### 方式二：OAuth 互動式登入

```bash
pi
> /login anthropic
# 瀏覽器會自動開啟，完成認證
```

### 查看可用模型

```bash
pi
> /model
# 選擇 provider 和 model
```

## 2.3 第一個 Session

### 安全開始：只讀模式

在對陌生專案賦予寫入權限前，先用只讀模式評估：

```bash
cd /path/to/your/project

pi --tools read,grep,find,ls -p "
  Inspect this repository.
  Explain its architecture.
  Identify the main entry points.
  List the commands you would run before making a change.
  Do NOT modify any files.
"
```

這個 prompt 的設計很巧妙：
- **明確的工具限制**：只允許讀取
- **具體的任務**：解釋架構、找入口點
- **安全約束**：明確禁止修改

### 建立 Git 分支（強烈建議）

在允許 Pi 修改檔案前，先建立一個隔離分支：

```bash
git switch -c ai/pi-evaluation
pi
```

這樣即使 Pi 做了不預期的修改，也能輕鬆用 `git checkout` 回復。

## 2.4 AGENTS.md 專案配置

在專案根目錄建立 `AGENTS.md`，告訴 Pi 你的專案規則：

```markdown
# Project Instructions

## 程式碼風格
- 使用 TypeScript strict mode
- 函數長度不超過 50 行
- 每個檔案頂部加入 JSDoc 註解

## 測試要求
- 修改程式碼後必須執行 `npm test`
- 新增功能必須包含測試
- 測試覆蓋率不低於 80%

## 禁止操作
- 不要修改 `.env` 檔案
- 不要執行 `rm -rf`
- 不要存取 production 環境
- 不要修改 migration 檔案（除非明確要求）

## Git 規範
- Commit message 使用 Conventional Commits 格式
- 每個 commit 只做一件事
- 先建立分支再修改

## 工作流程
1. 讀取相關檔案
2. 解釋提出的修改
3. 等待確認
4. 執行修改
5. 執行測試
6. 報告結果
```

### AGENTS.md 的層級

Pi 會從多個位置載入配置：

```
~/.pi/agent/AGENTS.md          ← 全域設定
/project/AGENTS.md             ← 專案設定
/project/src/AGENTS.md         ← 子目錄設定（可選）
```

子目錄的設定會**覆蓋**父目錄的同名設定。

## 2.5 常用命令速查

### 斜線命令

| 命令 | 功能 |
|------|------|
| `/model` | 切換模型 |
| `/login` | 認證登入 |
| `/tree` | 查看 session 樹 |
| `/fork` | 分支 session |
| `/clone` | 複製 session |
| `/compact` | 壓縮 context |
| `/export` | 匯出為 HTML |
| `/share` | 上傳到 GitHub Gist |
| `/reload` | 重新載入 extension |

### 快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `Enter` | 送出訊息（steering） |
| `Alt+Enter` | 送出 follow-up |
| `Ctrl+C` | 中斷當前操作 |
| `Ctrl+L` | 切換模型 |
| `Ctrl+P` | 切換最愛模型 |

### CLI 參數

```bash
# 列印模式（適合腳本）
pi -p "your prompt here"

# JSON 模式（適合程式整合）
pi --mode json -p "your prompt"

# RPC 模式（適合非 Node 整合）
pi --mode rpc

# 指定目錄
pi --cwd /path/to/project

# 不儲存 session
pi --no-session

# 指定工具
pi --tools read,write,bash
```

## 2.6 實際範例：程式碼審查

讓我們用一個完整的例子來展示 Pi 的能力：

```bash
# 1. 建立測試分支
git switch -c ai/code-review

# 2. 啟動 Pi 進行審查
pi -p "
  Review the authentication module in src/auth/.
  
  Check for:
  1. Security vulnerabilities
  2. Code quality issues
  3. Missing error handling
  4. Performance concerns
  
  Do NOT modify any files.
  Provide a summary with severity levels.
"
```

Pi 會：
1. 讀取 `src/auth/` 下的所有檔案
2. 分析安全性、程式碼品質、錯誤處理
3. 輸出帶有嚴重等級的報告
4. **不會修改任何檔案**

### 報告範例

```markdown
## Code Review Report

### 🔴 Critical
- `auth/login.ts:45`: Password compared with `===` (timing attack)
  - Fix: Use `crypto.timingSafeEqual()`

### 🟡 Warning
- `auth/session.ts:23`: Session token not invalidated on logout
  - Fix: Add token revocation logic

### 🟢 Suggestion
- `auth/middleware.ts:67`: Consider adding rate limiting
  - Suggestion: Use `express-rate-limit`
```

## 2.7 故障排除

### 問題：`Missing API key`

```bash
# 確認環境變數已設定
echo $ANTHROPIC_API_KEY

# 或使用 /login 命令
pi
> /login anthropic
```

### 問題：`Model not found`

```bash
# 查看可用模型
pi
> /model
# 選擇有提供的 model
```

### 問題：`Permission denied`

```bash
# 確認有執行權限
chmod +x ~/.local/bin/pi

# 或使用完整路徑
~/.local/bin/pi --version
```

### 問題：`Session not found`

```bash
# 查看現有 sessions
pi
> /tree

# 或建立新 session
pi --no-session
```

---

> **下一步**：深入了解 Pi 的四層架構，理解它是如何組織的。
