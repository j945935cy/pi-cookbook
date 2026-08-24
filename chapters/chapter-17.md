# 第十七章：容器化部署

使用 Docker 容器化 Pi Agent。

## 17.1 Docker 基礎

### 基本 Dockerfile

```dockerfile
FROM node:20-slim

WORKDIR /app

# 安裝 Pi
RUN npm install -g --ignore-scripts @earendil-works/pi-coding-agent

# 設定環境
ENV PI_NON_INTERACTIVE=1

# 啟動
ENTRYPOINT ["pi"]
```

### 建立映像

```bash
docker build -t pi-agent .
```

### 執行容器

```bash
# 基本用法
docker run -it --rm \
  -e ANTHROPIC_API_KEY="sk-ant-..." \
  -v $(pwd):/workspace \
  pi-agent

# 執行特定命令
docker run --rm \
  -e ANTHROPIC_API_KEY="sk-ant-..." \
  -v $(pwd):/workspace \
  pi-agent -p "Write a React component"
```

## 17.2 Docker Compose

### docker-compose.yml

```yaml
version: '3.8'

services:
  pi-agent:
    build: .
    volumes:
      - .:/workspace
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - PI_NON_INTERACTIVE=1
    stdin_open: true
    tty: true
```

### 使用方式

```bash
# 啟動
docker-compose up -d

# 執行 prompt
docker-compose exec pi-agent pi -p "Hello"
```

## 17.3 Docker Desktop 整合

### 設定 Docker Desktop

1. 開啟 Docker Desktop
2. 建立新的 Container
3. 選擇 pi-agent 映像
4. 掛載工作目錄

### 使用方式

```bash
# 在 Docker Desktop Terminal 中
cd /workspace
pi
```

## 17.4 Kubernetes 部署

### Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pi-agent
spec:
  replicas: 1
  selector:
    matchLabels:
      app: pi-agent
  template:
    metadata:
      labels:
        app: pi-agent
    spec:
      containers:
      - name: pi-agent
        image: pi-agent:latest
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: pi-secrets
              key: api-key
        volumeMounts:
        - name: workspace
          mountPath: /workspace
      volumes:
      - name: workspace
        persistentVolumeClaim:
          claimName: pi-workspace
```

## 17.5 安全考量

### 1. API Key 保護

```bash
# 使用 Docker secrets
docker secret create api_key api_key.txt

# 或使用環境變數
docker run -e ANTHROPIC_API_KEY="sk-ant-..." pi-agent
```

### 2. 網路隔離

```yaml
# docker-compose.yml
services:
  pi-agent:
    networks:
      - internal
    # 不暴露端口

networks:
  internal:
    driver: bridge
    internal: true
```

### 3. 資源限制

```yaml
# docker-compose.yml
services:
  pi-agent:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## 17.6 CI/CD 整合

### GitHub Actions

```yaml
# .github/workflows/pi.yml
name: Pi Agent

on:
  push:
    branches: [main]

jobs:
  pi:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Run Pi Agent
      run: |
        docker run --rm \
          -e ANTHROPIC_API_KEY=${{ secrets.ANTHROPIC_API_KEY }} \
          -v $(pwd):/workspace \
          pi-agent -p "Run tests and lint"
```

---

> **下一步**：深入了解多模式運行。
