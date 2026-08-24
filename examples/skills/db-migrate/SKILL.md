# Database Migration Skill

## Trigger
- 用戶提到 migration, schema, database, migrate
- 用戶提到 新增欄位, 修改表格, 刪除表格

## Instructions

### 建立新 Migration

#### 步驟 1: 備份
```bash
# PostgreSQL
pg_dump -U username dbname > backup_$(date +%Y%m%d).sql

# MySQL
mysqldump -u username -p dbname > backup_$(date +%Y%m%d).sql
```

#### 步驟 2: 檢查歷史
```bash
ls -la migrations/
cat migrations/*.sql | head -20
```

#### 步驟 3: 建立 Migration 檔案
- 檔案名稱格式: `YYYYMMDDHHMMSS_describe.sql`
- 包含 UP 和 DOWN 邏輯

```sql
-- UP
ALTER TABLE users ADD COLUMN email VARCHAR(255);

-- DOWN
ALTER TABLE users DROP COLUMN email;
```

#### 步驟 4: 測試 Rollback
```bash
npm run migrate:rollback
npm run migrate:status
```

#### 步驟 5: 更新文件
- 更新 README.md
- 更新 CHANGELOG.md

### 執行 Migration

#### 步驟 1: 確認狀態
```bash
npm run migrate:status
```

#### 步驟 2: 執行
```bash
npm run migrate
```

#### 步驟 3: 驗證
```bash
npm run migrate:status
npm test
```

## Tools
- bash: 執行 migration 命令
- read: 檢查 schema 檔案
- write: 建立 migration 檔案
- edit: 修改現有 migration

## Best Practices
- 每個 migration 只做一件事
- 總是包含 rollback 邏輯
- 在 migration 前備份
- 測試 rollback 後再部署
- 不要在 production 直接執行
- 通知團隊成員

## Safety Rules
- 永遠先備份
- 測試 rollback
- 不要在 production 直接執行
- 通知團隊成員

## Examples

### 範例 1: 新增欄位
用戶: "users 表新增 email 欄位"
AI: 
1. 備份資料庫
2. 建立 migration: `20240101_add_email_to_users.sql`
3. 執行 migration
4. 驗證結果

### 範例 2: 修改欄位
用戶: "把 users.name 從 VARCHAR(50) 改成 VARCHAR(100)"
AI:
1. 備份資料庫
2. 建立 migration: `20240102_alter_users_name.sql`
3. 執行 migration
4. 驗證結果
