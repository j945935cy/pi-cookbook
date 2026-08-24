# 附錄 D：疑難排解

常見問題和解決方案。

## D.1 安裝問題

### 問題：npm install 失敗

```bash
# 解決方案：使用 --ignore-scripts
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

### 問題：權限不足

```bash
# 解決方案：使用 sudo 或 nvm
sudo npm install -g @earendil-works/pi-coding-agent

# 或使用 nvm
nvm install 20
nvm use 20
npm install -g @earendil-works/pi-coding-agent
```

### 問題：找不到 pi 命令

```bash
# 解決方案：檢查 PATH
echo $PATH

# 確認安裝位置
npm list -g @earendil-works/pi-coding-agent

# 或使用完整路徑
~/.nvm/versions/node/v20.11.0/bin/pi
```

## D.2 認證問題

### 問題：API Key 無效

```bash
# 檢查環境變數
echo $ANTHROPIC_API_KEY

# 重新設定
export ANTHROPIC_API_KEY="sk-ant-..."
```

### 問題：Rate Limit

```bash
# 解決方案：等待或使用其他 provider
export GEMINI_API_KEY="AIza..."
pi --model gemini-2.0-flash
```

## D.3 執行問題

### 問題：Extension 載入失敗

```bash
# 檢查 extension 路徑
ls -la .pi/extensions/

# 重新載入
/reload
```

### 問題：Session 損毀

```bash
# 刪除損毀的 session
rm -f ~/.pi/sessions/*.jsonl

# 或建立新 session
/new
```

### 問題：記憶體不足

```bash
# 解決方案：壓縮 session
/compact

# 或清理舊 sessions
find ~/.pi/sessions -mtime +30 -delete
```

## D.4 網路問題

### 問題：連線超時

```bash
# 檢查網路
curl -I https://api.anthropic.com

# 使用代理
export HTTP_PROXY="http://proxy:8080"
export HTTPS_PROXY="http://proxy:8080"
```

### 問題：SSL 錯誤

```bash
# 解決方案：更新憑證
brew install ca-certificates

# 或使用 Node.js 內建憑證
export NODE_EXTRA_CA_CERTS="/path/to/ca-certificates.crt"
```

## D.5 效能問題

### 問題：回應速度慢

```bash
# 解決方案：使用更快的模型
pi --model gemini-2.0-flash

# 或使用本地模型
pi --model ollama/llama3.3
```

### 問題：Token 使用過多

```bash
# 解決方案：壓縮 session
/compact

# 或使用更簡潔的 prompt
```

## D.6 取得協助

```bash
# 查看說明
pi --help

# 查看版本
pi --version

# 重啟 daemon
pi daemon restart

# 清除快取
pi cache clear
```
