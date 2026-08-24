# 附錄 C：Extension API 參考

Pi Extension 的 API 文件。

## C.1 Extension 介面

```typescript
interface Extension {
  name: string;
  init?: (ctx: ExtensionContext) => Promise<void>;
  tools?: Tool[];
  hooks?: Hooks;
  commands?: Command[];
}
```

## C.2 ExtensionContext

```typescript
interface ExtensionContext {
  agent: Agent;
  config: Config;
  logger: Logger;
}
```

## C.3 Tool 介面

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: {
    [key: string]: {
      type: string;
      description?: string;
      enum?: string[];
    }
  };
  execute: (args: any, signal: AbortSignal, ctx: any) => Promise<ToolResult>;
}
```

## C.4 ToolResult

```typescript
interface ToolResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}
```

## C.5 Hooks

```typescript
interface Hooks {
  beforeToolCall?: (ctx: HookContext) => Promise<HookResult>;
  afterToolCall?: (ctx: HookContext) => Promise<void>;
  turnStart?: (ctx: HookContext) => Promise<void>;
  turnEnd?: (ctx: HookContext) => Promise<void>;
}
```

## C.6 HookContext

```typescript
interface HookContext {
  toolCall: ToolCall;
  args: any;
  agent: Agent;
  toolResults?: ToolResult[];
}
```

## C.7 HookResult

```typescript
interface HookResult {
  block?: boolean;
  reason?: string;
  content?: Array<{ type: string; text: string }>;
}
```

## C.8 Command 介面

```typescript
interface Command {
  name: string;
  description: string;
  handler: (args: string) => Promise<string>;
}
```

## C.9 ToolCall

```typescript
interface ToolCall {
  name: string;
  id: string;
}
```
