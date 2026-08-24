# 第十五章：Package 系統

Pi 的四層套件架構。

## 15.1 四層架構

```
┌─────────────────────────────────────────┐
│  @earendil-works/pi-coding-agent        │  ← 最上層（使用者安裝）
│  (cli.ts, system-prompt, permissions)   │
├─────────────────────────────────────────┤
│  @earendil-works/pi-agent-core          │  ← 核心邏輯
│  (agent.js, agent-loop.js, session)     │
├─────────────────────────────────────────┤
│  @earendil-works/pi-ai                  │  ← AI 串接層
│  (providers, toolSchema, anthropic.ts)  │
├─────────────────────────────────────────┤
│  @earendil-works/pi-tui                 │  ← 介面層
│  (ink, react, readline)                 │
└─────────────────────────────────────────┘
```

## 15.2 各套件職責

| 套件 | 職責 | 行數 |
|------|------|------|
| pi-tui | 終端機 UI、輸入處理 | ~15,000 |
| pi-ai | AI provider 串接、tool schema | ~5,000 |
| pi-agent-core | Agent loop、session 管理 | ~1,500 |
| pi-coding-agent | CLI、系統提示、權限 | ~8,000 |

## 15.3 安裝方式

```bash
# 全域安裝（推薦）
npm install -g --ignore-scripts @earendil-works/pi-coding-agent

# 本地安裝
npm install @earendil-works/pi-coding-agent

# 使用 Corepack
corepack enable
corepack prepare @earendil-works/pi-coding-agent@latest --activate
```

## 15.4 版本管理

```bash
# 查看版本
pi --version

# 更新
npm update -g @earendil-works/pi-coding-agent

# 安裝特定版本
npm install -g @earendil-works/pi-coding-agent@0.84.2
```

## 15.5 套件依賴

```json
// pi-coding-agent/package.json
{
  "dependencies": {
    "@earendil-works/pi-agent-core": "latest",
    "@earendil-works/pi-ai": "latest",
    "@earendil-works/pi-tui": "latest"
  }
}
```

---

> **下一步**：深入了解安全架構。
