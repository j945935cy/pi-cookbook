# 第十一章：Model 整合

Pi 支援 15+ 家 LLM providers，從付費到免費，從大型到小型，應有盡有。

## 11.1 支援的 Providers

| Provider | 模型 | 免費 | 備註 |
|----------|------|------|------|
| Anthropic | Claude 4, 3.5 | ❌ | 官方支援，最佳體驗 |
| OpenAI | GPT-4o, o1, o3 | ❌ | 需 API key |
| Google | Gemini 2.5, 2.0 | ✅ | 免費額度慷慨 |
| Mistral | Large 2, Small | ❌ | 歐洲選擇 |
| Groq | Llama 3.3, Gemma | ✅ | 超快推論 |
| GitHub | Copilot Models | ✅ | 透過 Models API |
| Azure | OpenAI Models | ❌ | 企業級 |
| Amazon Bedrock | Claude, Llama | ❌ | AWS 整合 |
| OpenRouter | 100+ 模型 | ✅ | 聚合平台 |
| GitHub Models | 各種模型 | ✅ | 免費額度 |
| xAI | Grok 2, 3 | ✅ | 免費配額 |
| Moonshot | Kimi K2 | ✅ | 中文優化 |
| Z.AI | GLM 4.5 | ✅ | 中文優化 |
| Alibaba | Qwen 3 Coder | ✅ | 中文優化 |

## 11.2 環境變數設定

### Anthropic（推薦）

```bash
export ANTHROPIC_API_KEY="sk-ant-api03-..."
```

### OpenAI

```bash
export OPENAI_API_KEY="sk-..."
```

### Google Gemini

```bash
export GEMINI_API_KEY="AIza..."
```

### Mistral

```bash
export MISTRAL_API_KEY="..."
```

### Groq

```bash
export GROQ_API_KEY="gsk_..."
```

### GitHub Models

```bash
export GITHUB_TOKEN="ghp_..."
```

### 多 Provider 同時設定

```bash
# .env 或 ~/.bashrc
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
export GEMINI_API_KEY="AIza..."
export GROQ_API_KEY="gsk_..."
```

## 11.3 Provider 選擇策略

### 依需求選擇

```
需要最高品質 → Anthropic (Claude 4)
需要速度     → Groq (Llama 3.3)
需要免費     → Google (Gemini 2.5)
需要中文     → Qwen 3 Coder
需要隱私     → 本地模型 (Ollama)
```

### 依預算選擇

```
高預算（> $100/月）→ Claude 4, GPT-4o
中預算（$10-100）  → Claude 3.5, Gemini Pro
低預算（< $10）    → Gemini 2.0, Groq
零預算            → Gemini 2.5 Free, GitHub Models
```

## 11.4 模型切換

### 命令列切換

```bash
# 使用特定模型
pi --model claude-sonnet-4-20250514
pi --model gpt-4o
pi --model gemini-2.5-pro

# 使用免費模型
pi --model gemini-2.0-flash

# 使用本地模型
pi --model ollama/llama3.3
```

### Session 中切換

```
> /model gemini-2.5-pro

Model changed to: gemini-2.5-pro
```

### AGENTS.md 中設定

```markdown
# AGENTS.md

## Model Configuration
- Default model: claude-sonnet-4-20250514
- Fallback model: gemini-2.0-flash
- Free model: github-copilot/gpt-4o-mini
```

## 11.5 自動 Fallback

### Fallback 機制

```typescript
// 當主要模型失敗時自動嘗試其他模型
const fallbackChain = [
  "claude-sonnet-4-20250514",      // 主要
  "gpt-4o",                        // 備用
  "gemini-2.0-flash",              // 免費
  "ollama/llama3.3"                // 本地
];
```

### Fallback 策略

```
1. 主要模型失敗 → 嘗試備用模型
2. 備用模型失敗 → 嘗試免費模型
3. 免費模型失敗 → 嘗試本地模型
4. 所有模型失敗 → 顯示錯誤
```

## 11.6 本地模型整合

### Ollama 整合

```bash
# 安裝 Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 下載模型
ollama pull llama3.3
ollama pull qwen2.5-coder

# 使用本地模型
pi --model ollama/llama3.3
pi --model ollama/qwen2.5-coder
```

### LM Studio 整合

```bash
# 啟動 LM Studio server
# 載入模型後啟動 local server

# 使用 LM Studio
pi --model lmstudio/llama-3.3-70b
```

### 本地模型配置

```json
// .pi/models.json
{
  "models": {
    "ollama/llama3.3": {
      "provider": "ollama",
      "endpoint": "http://localhost:11434",
      "model": "llama3.3"
    },
    "lmstudio/llama-3.3-70b": {
      "provider": "openai-compatible",
      "endpoint": "http://localhost:1234/v1",
      "model": "llama-3.3-70b"
    }
  }
}
```

## 11.7 模型比較

### 品質比較

```
程式碼生成：Claude 4 > GPT-4o > Gemini 2.5 Pro
中文理解：Qwen 3 > Gemini 2.5 > Claude 4
推理能力：Claude 4 > o3 > Gemini 2.5
速度：Groq > Gemini Flash > Claude 3.5
```

### 價格比較（每百萬 tokens）

```
Claude 4 Sonnet:     $15 / $75
GPT-4o:              $10 / $30
Gemini 2.5 Pro:      $1.25 / $10
Gemini 2.0 Flash:    $0.10 / $0.40
Groq Llama 3.3:      $0.59 / $0.79
本地模型:             $0 / $0
```

### 速度比較

```
Groq Llama 3.3:      ~300 tokens/s
Gemini 2.0 Flash:    ~200 tokens/s
Claude 3.5 Sonnet:   ~80 tokens/s
GPT-4o:              ~60 tokens/s
Claude 4 Sonnet:     ~50 tokens/s
```

## 11.8 特殊模型功能

### Extended Thinking

```bash
# Claude 的 extended thinking
pi --model claude-sonnet-4-20250514 --thinking

# Gemini 的 thinking
pi --model gemini-2.5-pro --thinking
```

### Tool Use 優化

```typescript
// 某些模型對 tool use 更好
const toolOptimizedModels = [
  "claude-sonnet-4-20250514",  // 最佳 tool use
  "gpt-4o",                    // 優良 tool use
  "gemini-2.5-pro",            // 良好 tool use
];
```

### Large Context

```bash
# 大 context 模型
pi --model gemini-2.5-pro      # 1M tokens
pi --model claude-sonnet-4-20250514  # 200K tokens
pi --model gpt-4o              # 128K tokens
```

## 11.9 企業級整合

### Azure OpenAI

```bash
export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
export AZURE_OPENAI_API_KEY="..."
export AZURE_OPENAI_API_VERSION="2024-02-01"

pi --model azure/gpt-4o
```

### Amazon Bedrock

```bash
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"

pi --model bedrock/anthropic.claude-3-5-sonnet-20241022-v2:0
```

### Google Vertex AI

```bash
export GOOGLE_APPLICATION_CREDENTIALS="service-account.json"
export VERTEX_AI_PROJECT="your-project-id"

pi --model vertex/gemini-2.5-pro
```

## 11.10 最佳實踐

### 1. 根據任務選擇模型

```bash
# 複雜推理
pi --model claude-sonnet-4-20250514

# 快速迭代
pi --model gemini-2.0-flash

# 大型專案
pi --model gemini-2.5-pro
```

### 2. 使用 Fallback

```bash
# 設定自動 fallback
export PI_FALLBACK_MODELS="claude-sonnet-4-20250514,gpt-4o,gemini-2.0-flash"
```

### 3. 監控使用量

```bash
# 查看 token 使用量
pi --stats

# 設定預算警告
export PI_BUDGET_WARNING=100  # $100
export PI_BUDGET_LIMIT=500    # $500
```

### 4. 快取策略

```typescript
// 啟用 prompt caching
{
  "cache": {
    "enabled": true,
    "ttl": 3600  // 1 小時
  }
}
```

---

> **下一步**：深入了解 Extension 開發實戰，建立你的第一個 Extension。
