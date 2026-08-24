# 第一章：為什麼是 Pi？

## 1.1 AI Coding Agent 發展史

2024-2025 年，AI Coding Agent 經歷了爆發式發展。從 GitHub Copilot 的自動補全，到 Claude Code 的完整 agent loop，再到 Cursor 的 IDE 整合，每個工具都在回答同一個問題：**如何讓 AI 更好地協助軟體開發？**

但隨著功能不斷疊加，這些工具變得越來越複雜。Claude Code 的 system prompt 超過 10,000 tokens，Cursor 封裝了數十種工具，LangChain 提供了 1,000+ 整合。開發者開始問：**我們真的需要這些嗎？**

## 1.2 極簡主義的誕生

2025 年底，Mario Zechner（@badlogic）做了一個激進的決定：建立一個**只有 4 個工具**的 coding agent。

```
read    - 讀取檔案
write   - 寫入檔案
edit    - 編輯檔案
bash    - 執行命令
```

System prompt 不到 1,000 tokens。核心 agent loop 只有 552 行 TypeScript。

這不是簡化，而是**提煉**。

## 1.3 設計哲學：少即是多

Pi 的設計哲學可以用一句話概括：

> **「給使用者最少的預設，最多的控制權。」**

### 傳統 Agent 的問題

```
Claude Code:
├── 20+ 內建工具
├── 10,000+ tokens system prompt
├── 複雜的 permission 系統
├── 強制的 sub-agent 機制
└── 開發者無法修改核心行為

問題：
- 工具太多，模型選擇困難
- System prompt 太長，token 浪費
- 內建功能無法自訂
- 一行代碼要改，等官方更新
```

### Pi 的解答

```
Pi:
├── 4 個核心工具（可擴展）
├── < 1,000 tokens system prompt
├── 無內建 permission（用容器隔離）
├── 無內建 sub-agent（用 extension 實作）
└── 開發者完全控制

優勢：
- 工具少，模型決策快
- Prompt 短，token 效率高
- Extension 系統，完全自訂
- 一行代碼要改？自己寫 extension
```

## 1.4 418 行的意義

Pi 的核心 agent loop 只有 418 行。這是什麼概念？

| 框架 | 核心代碼行數 |
|------|-------------|
| Pi Agent Loop | 418 行 |
| Claude Code | 不公開（估計 5,000+ 行） |
| LangChain Agent | 10,000+ 行 |
| AutoGPT | 15,000+ 行 |

418 行意味著：
- **可讀性**：一個下午就能讀完
- **可維護性**：Bug 容易定位
- **可擴展性**：Extension 系統比核心更強大
- **可預測性**：行為完全透明

## 1.5 數字會說話

Pi 的成就：

| 指標 | 數值 |
|------|------|
| GitHub Stars | 96,2k |
| npm Downloads | 快速成長中 |
| Terminal-Bench 2.0 | 與 Claude Code 並列 |
| 核心代碼 | 418 行 |
| System Prompt | < 1,000 tokens |
| 預設工具 | 4 個 |
| 支援 Providers | 15+ |
| Extension 範例 | 50+ |

## 1.6 誰適合 Pi？

### ✅ 適合使用 Pi

- **資深工程師**：想要完全控制 agent 行為
- **平台工程師**：需要自訂工作流程
- **AI 工具開發者**：需要可嵌入的 agent runtime
- **安全敏感環境**：需要容器化隔離
- **模型研究者**：需要輕鬆切換模型比較

### ❌ 不適合 Pi

- **初學者**：需要更多開箱即用的功能
- **想要「裝了就用」**：Pi 需要配置
- **企業環境**：需要內建權限控制（除非願意自己建）
- **IDE 整合**：Pi 是終端工具，非 IDE 插件

## 1.7 Pi 的定位

```
┌─────────────────────────────────────────────────────┐
│                    AI Coding Agent Spectrum          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  開箱即用                              完全控制     │
│     ←────────────────────────────────────→          │
│                                                     │
│  Cursor    Claude Code    OpenCode    Pi           │
│    │           │             │          │           │
│  IDE整合    內建功能     可配置      可擴展         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Pi 不是要取代 Claude Code 或 Cursor。它是給那些說**「我希望我的 coding agent 以不同方式運作」**的人的選擇。

## 1.8 本書目標

讀完本書，你將能夠：

1. **理解** Pi 的架構與設計哲學
2. **使用** Pi 的所有核心功能
3. **開發** 自訂 Extension 和 Skill
4. **部署** Pi 到生產環境
5. **比較** Pi 與其他 coding agent

---

> **下一步**：讓我們開始安裝 Pi，寫下第一行程式碼。
