# Code Review Skill

## Trigger
- 用戶提到 review, 審查, code review
- 用戶提到 檢查程式碼, 品質分析

## Instructions

### 審查流程

#### 1. 理解需求
- 讀取相關文件
- 理解業務邏輯
- 確認修改範圍

#### 2. 安全性檢查
- SQL injection 漏洞
- XSS 漏洞
- 認證授權問題
- 敏感資料洩漏
- 不安全的依賴

#### 3. 程式碼品質
- 命名規範
- 函數長度（建議 < 50 行）
- 重複代碼
- 錯誤處理
- 類型安全

#### 4. 效能問題
- N+1 查詢
- 不必要的迴圈
- 記憶體洩漏
- 快取使用

#### 5. 測試覆蓋
- 是否有測試
- 測試是否完整
- 邊界情況

## Report Format

```markdown
## Code Review Report

### 🔴 Critical Issues
- `file.ts:line`: Issue description
  - **Impact**: Description of impact
  - **Fix**: Suggested fix

### 🟡 Warnings
- `file.ts:line`: Issue description
  - **Suggestion**: Improvement suggestion

### 🟢 Suggestions
- `file.ts:line`: Issue description
  - **Consider**: Alternative approach

### 📊 Summary
- Total issues: X
- Critical: X
- Warnings: X
- Suggestions: X
```

## Tools
- read: 讀取檔案
- grep: 搜尋模式
- find: 尋找檔案

## Examples

### 範例 1: 基本審查
用戶: "Review src/auth.ts"
AI: [執行完整審查流程]

### 範例 2: 安全性審查
用戶: "Security audit for the authentication module"
AI: [專注安全性問題]

## Best Practices
- 先閱讀相關文件
- 理解業務邏輯
- 不只找問題，也要稱讚好的做法
- 提供具體的修復建議
- 按優先順序排列問題
