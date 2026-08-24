# Deployment Automation

## Trigger
- 用戶提到 deploy, 部署, release, 發佈
- 用戶提到 production, 上線

## Instructions

### 部署流程

#### 步驟 1: Pre-deploy Check
```bash
# 執行測試
npm test

# 執行 lint
npm run lint

# 建構專案
npm run build
```

#### 步驟 2: 版本更新
```bash
# 更新 package.json version
npm version patch|minor|major

# 建立 git tag
git tag -a v1.0.0 -m "Release v1.0.0"

# 更新 CHANGELOG.md
echo "## v1.0.0 - $(date +%Y-%m-%d)" >> CHANGELOG.md
```

#### 步驟 3: 部署
```bash
# 根據環境選擇
npm run deploy:staging    # 預生產
npm run deploy:production # 生產環境
```

#### 步驟 4: 驗證
```bash
# 檢查部署狀態
curl -I https://your-app.com

# 執行 smoke tests
npm run test:smoke

# 監控錯誤日誌
npm run logs
```

#### 步驟 5: 回滾（如需要）
```bash
npm run rollback
```

## Tools
- bash: 執行部署命令
- read: 檢查配置
- edit: 更新版本號
- write: 更新文件

## Safety Rules
- 永遠先在 staging 測試
- 部署前確認所有測試通過
- 準備好回滾計畫
- 通知團隊成員
- 不要在非工作時間部署

## Best Practices
- 使用 CI/CD pipeline
- 版本化所有部署
- 保留 rollback 能力
- 監控部署狀態
- 記錄所有變更

## Examples

### 範例 1: 正常部署
用戶: "Deploy to production"
AI:
1. 執行 npm test
2. 執行 npm run lint
3. 執行 npm run build
4. 更新版本號
5. 執行 npm run deploy:production
6. 驗證部署

### 範例 2: 緊急回滾
用戶: "Rollback the last deployment"
AI:
1. 確認需要回滾的版本
2. 執行 npm run rollback
3. 驗證回滾結果
4. 通知團隊成員
