# 附錄 B：Configuration 參考

Pi 的配置選項。

## B.1 配置檔案位置

```
~/.pi/config.json          # 全域配置
.pi/config.json            # 專案配置
.pi/extensions/            # Extensions 目錄
.pi/skills/                # Skills 目錄
```

## B.2 全域配置

```json
// ~/.pi/config.json
{
  "model": {
    "provider": "anthropic",
    "id": "claude-sonnet-4-20250514"
  },
  "theme": "dark",
  "keybindings": "vi",
  "auto_compaction": true,
  "compaction_threshold": 40000
}
```

## B.3 專案配置

```json
// .pi/config.json
{
  "model": {
    "provider": "anthropic",
    "id": "claude-sonnet-4-20250514"
  },
  "extensions": ["auto-commit", "test-guard"],
  "permissions": {
    "bash": ["npm test", "npm run lint"],
    "write": ["./src", "./tests"]
  }
}
```

## B.4 AGENTS.md 配置

```markdown
# AGENTS.md

## Model Configuration
- Default model: claude-sonnet-4-20250514
- Fallback model: gemini-2.0-flash

## Project Context
This is a React TypeScript project.

## Code Style
- Use functional components
- Use TypeScript strict mode
- Follow ESLint rules

## Testing
- Use Vitest
- Aim for 80% coverage
- Test all edge cases
```

## B.5 Extension 配置

```json
// .pi/extensions.json
{
  "extensions": {
    "auto-commit": {
      "enabled": true,
      "options": {
        "auto_push": false
      }
    },
    "test-guard": {
      "enabled": true,
      "blocked_commands": ["npm publish", "rm -rf"]
    }
  }
}
```

## B.6 Sandbox 配置

```json
// .pi/sandbox.json
{
  "docker": {
    "image": "node:20-slim",
    "network": "none",
    "volumes": [".:/workspace:rw"],
    "resources": {
      "memory": "512m",
      "cpus": "1.0"
    }
  }
}
```
