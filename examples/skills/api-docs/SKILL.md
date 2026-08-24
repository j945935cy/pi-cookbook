# API Documentation Generator

## Trigger
- 用戶提到 api docs, swagger, openapi, 文件
- 用戶提到 API 規格, 接口文檔

## Instructions

### 文件生成流程

#### 步驟 1: 掃描 API Routes
```bash
# Express
grep -r "router\." src/api/
grep -r "app\." src/api/

# FastAPI
grep -r "@app\." src/api/
```

#### 步驟 2: 提取 JSDoc 註解
- 讀取每個 route 的註解
- 提取參數、回傳值、描述

#### 步驟 3: 生成 OpenAPI 3.0 Spec

```yaml
openapi: 3.0.0
info:
  title: API Documentation
  version: 1.0.0
  description: Auto-generated API documentation

paths:
  /api/users:
    get:
      summary: Get all users
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
```

#### 步驟 4: 產生 Swagger UI HTML
- 使用 swagger-ui-dist
- 產生獨立 HTML 檔案

### 輸出檔案
- `docs/api/openapi.yaml` - OpenAPI spec
- `docs/api/swagger.html` - Swagger UI

## Tools
- grep: 掃描 routes
- read: 讀取程式碼
- write: 產生文件
- bash: 執行命令

## Best Practices
- 自動掃描程式碼
- 產生完整 OpenAPI 3.0 spec
- 包含請求/回應範例
- 支援 authentication 說明
- 產生可互動的 Swagger UI

## Examples

### 範例 1: 產生 API 文件
用戶: "Generate API documentation for this project"
AI:
1. 掃描 src/api/ 目錄
2. 提取所有 routes 和 JSDoc
3. 生成 openapi.yaml
4. 產生 swagger.html

### 範例 2: 更新文件
用戶: "Update the API docs after adding new endpoint"
AI:
1. 檢查新增的 endpoint
2. 更新 openapi.yaml
3. 重新產生 swagger.html
