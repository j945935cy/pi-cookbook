# 第二十章：實戰案例

真實場景的 Pi 使用範例。

## 20.1 案例 1：快速原型開發

### 場景
建立一個 Todo App 的 React 前端。

### Prompt
```
建立一個完整的 Todo App，使用 React + TypeScript + Tailwind CSS。
功能：新增、刪除、標記完成、篩選。
```

### 結果
```typescript
// 使用 Pi 生成的程式碼結構
src/
├── components/
│   ├── TodoInput.tsx
│   ├── TodoList.tsx
│   ├── TodoItem.tsx
│   └── TodoFilter.tsx
├── hooks/
│   └── useTodos.ts
├── types/
│   └── todo.ts
├── App.tsx
└── main.tsx
```

### 時間比較
- 手動開發：2-3 小時
- 使用 Pi：15-30 分鐘

## 20.2 案例 2：API 整合

### 場景
整合第三方 API 到現有專案。

### Prompt
```
整合 Stripe 付款 API。需要：
1. 建立付款 session
2. 處理 webhook
3. 錯誤處理
```

### 結果
```typescript
// src/api/stripe.ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(items: CartItem[]) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: items.map(item => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    })),
    mode: "payment",
    success_url: `${process.env.APP_URL}/success`,
    cancel_url: `${process.env.APP_URL}/cancel`,
  });
  
  return session;
}
```

## 20.3 案例 3：Bug 修復

### 場景
修復一個複雜的 async/await 問題。

### Prompt
```
這個函數有 race condition 問題，請修復它：
[提供程式碼]
```

### 結果
```typescript
// Before
async function fetchData() {
  const data = cache.get(key);
  if (!data) {
    const fresh = await fetch(url);
    cache.set(key, fresh);
    return fresh;
  }
  return data;
}

// After
async function fetchData() {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const lock = getLock(key);
  await lock.acquire();
  
  try {
    // Double check
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const fresh = await fetch(url);
    cache.set(key, fresh);
    return fresh;
  } finally {
    lock.release();
  }
}
```

## 20.4 案例 4：測試撰寫

### 場景
為現有程式碼撰寫單元測試。

### Prompt
```
為 UserService 撰寫完整的單元測試，覆蓋所有邊界情況。
```

### 結果
```typescript
// src/__tests__/UserService.test.ts
describe("UserService", () => {
  describe("createUser", () => {
    it("should create user with valid data", async () => {
      const user = await service.createUser({
        email: "test@example.com",
        name: "Test User"
      });
      
      expect(user).toHaveProperty("id");
      expect(user.email).toBe("test@example.com");
    });
    
    it("should throw on duplicate email", async () => {
      await service.createUser({
        email: "existing@example.com",
        name: "User"
      });
      
      await expect(
        service.createUser({
          email: "existing@example.com",
          name: "Another"
        })
      ).rejects.toThrow("Email already exists");
    });
    
    it("should validate email format", async () => {
      await expect(
        service.createUser({
          email: "invalid",
          name: "User"
        })
      ).rejects.toThrow("Invalid email");
    });
  });
});
```

## 20.5 案例 5：文件產生

### 場景
自動產生 API 文件。

### Prompt
```
根據 src/api/ 目錄中的程式碼，產生 OpenAPI 3.0 spec。
```

### 結果
```yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0

paths:
  /api/users:
    get:
      summary: Get all users
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
    post:
      summary: Create user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUser'
      responses:
        '201':
          description: Created

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
        name:
          type: string
```

## 20.6 經驗總結

### 最佳實踐
1. **明確的 Prompt**：清楚描述需求
2. **提供上下文**：分享相關程式碼
3. **迭代改進**：根據結果調整
4. **驗證結果**：始終測試生成的程式碼

### 常見陷阱
1. 過度依賴 AI
2. 不驗證生成的程式碼
3. 忽略安全性考量
4. Prompt 過於模糊

---

> **下一步**：深入了解效能與基準。
