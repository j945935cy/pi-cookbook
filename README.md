# Pi Coding Agent 完全指南

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Pi Version](https://img.shields.io/badge/Pi-v0.84.2-blue.svg)](https://pi.dev)

從極簡設計到生產部署的完整指南。

## 📚 目錄

### 第一部分：認識 Pi Agent
- [Ch 1: 為什麼是 Pi？](chapters/chapter-01.md)
- [Ch 2: 快速開始](chapters/chapter-02.md)

### 第二部分：架構深入
- [Ch 3: 四層套件架構](chapters/chapter-03.md)
- [Ch 4: Agent Loop 核心](chapters/chapter-04.md)
- [Ch 5: Agent 類別](chapters/chapter-05.md)
- [Ch 6: System Prompt 設計](chapters/chapter-06.md)

### 第三部分：核心元件
- [Ch 7: 四個預設工具](chapters/chapter-07.md)
- [Ch 8: Extension 系統](chapters/chapter-08.md)
- [Ch 9: Skills 系統](chapters/chapter-09.md)
- [Ch 10: Session 管理](chapters/chapter-10.md)

### 第四部分：進階開發
- [Ch 11: Model 整合](chapters/chapter-11.md)
- [Ch 12: Extension 開發實戰](chapters/chapter-12.md)
- [Ch 13: SDK 嵌入](chapters/chapter-13.md)
- [Ch 14: RPC 模式](chapters/chapter-14.md)
- [Ch 15: Package 系統](chapters/chapter-15.md)

### 第五部分：安全與部署
- [Ch 16: 安全架構](chapters/chapter-16.md)
- [Ch 17: 容器化部署](chapters/chapter-17.md)
- [Ch 18: 多模式運行](chapters/chapter-18.md)

### 第六部分：比較與實踐
- [Ch 19: 競品深度比較](chapters/chapter-19.md)
- [Ch 20: 實戰案例](chapters/chapter-20.md)
- [Ch 21: 效能與基準](chapters/chapter-21.md)

### 附錄
- [附錄 A: 命令參考](appendices/appendix-a.md)
- [附錄 B: Configuration 參考](appendices/appendix-b.md)
- [附錄 C: Extension API 參考](appendices/appendix-c.md)
- [附錄 D: 疑難排解](appendices/appendix-d.md)

## 🔧 範例

### Extensions
- [Auto Commit](examples/extensions/auto-commit/) - Git 自動提交
- [Test Guard](examples/extensions/test-guard/) - 測試守衛
- [Code Analyzer](examples/extensions/code-analyzer/) - 程式碼分析
- [Permission Gate](examples/extensions/permission-gate/) - 權限控制
- [Sub-agent](examples/extensions/subagent/) - 子代理

### Skills
- [Code Review](examples/skills/code-review/) - 程式碼審查
- [DB Migrate](examples/skills/db-migrate/) - 資料庫遷移
- [API Docs](examples/skills/api-docs/) - API 文件生成
- [Deploy](examples/skills/deploy/) - 部署自動化

## 🚀 快速開始

```bash
# 安裝 Pi
npm install -g --ignore-scripts @earendil-works/pi-coding-agent

# 啟動 Pi
cd /path/to/your/project
pi

# 設定 API Key
export ANTHROPIC_API_KEY="sk-ant-..."
```

## 📖 如何使用本書

1. **初學者**：從 Ch 1-2 開始，了解 Pi 是什麼
2. **進階使用者**：閱讀 Ch 3-10，深入理解架構
3. **Extension 開發者**：重點閱讀 Ch 8-9，並參考 examples/
4. **生產部署**：閱讀 Ch 16-17，了解安全與容器化

## 🤝 貢獻

歡迎提交 Issues 和 Pull Requests！

## 📝 授權

MIT License

## 🔗 相關連結

- [Pi 官網](https://pi.dev)
- [Pi GitHub](https://github.com/earendil-works/pi)
- [Pi Discord](https://discord.com/invite/3cU7Bz4UPx)
- [Pi npm](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)
