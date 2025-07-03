# MCP接口验证组件 - 智能约束扩展工具 API 参考

智能约束功能通过**现有MCP接口验证组件**提供5个扩展工具，使用相同的MCP服务器和部署配置。

## 工具概览

| 工具名称 | 功能描述 | 输入参数 | 输出类型 | 自动调用 |
|----------|----------|----------|----------|----------|
| `process-user-input` | 处理用户输入并应用智能约束 | `input`, `sessionId` | `ConstraintProcessingResult` | ✅ |
| `add-config-template` | 添加新的配置模板 | `name`, `config` | `boolean` | ❌ |
| `remove-config-template` | 删除指定的配置模板 | `name` | `boolean` | ❌ |
| `get-config-templates` | 获取所有配置模板 | 无 | `Record<string, ConstraintConfig>` | ❌ |
| `load-config-from-file` | 从文件加载配置 | `filePath` | `void` | ❌ |

> **注意**: `process-user-input`工具在检测到`.use interface`后缀时自动调用，其他工具供高级用户手动调用。

## 详细API

### 1. process-user-input

处理用户输入，检测`.use interface`指令并应用相应的约束。

#### 请求格式

```json
{
  "method": "tools/call",
  "params": {
    "name": "process-user-input",
    "arguments": {
      "input": "string",
      "sessionId": "string (optional)"
    }
  }
}
```

#### 参数说明

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `input` | string | 是 | 用户输入的文本 |
| `sessionId` | string | 否 | 会话标识符，用于会话管理 |

#### 响应格式

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"isConstraintCommand\": boolean, \"originalInput\": string, \"result\": {...}, \"error\": string}"
    }
  ]
}
```

#### 响应数据结构

```typescript
interface ConstraintProcessingResult {
  isConstraintCommand: boolean;      // 是否为约束指令
  originalInput: string;             // 原始输入
  result?: {
    enhancedInstruction: {
      enhancedInstruction: string;   // 增强后的指令
      appliedConstraints: string[];  // 应用的约束列表
      templateUsed: string;          // 使用的模板名称
      processingTime: number;        // 处理时间（毫秒）
    };
    sessionInfo: {
      sessionId: string;             // 会话ID
      timestamp: string;             // 时间戳
    };
  };
  error?: string;                    // 错误信息
}
```

#### 使用示例

```javascript
// Cursor IDE 中的调用示例
const response = await mcpClient.callTool('process-user-input', {
  input: '.use interface 开发用户登录API',
  sessionId: 'cursor-session-001'
});

const result = JSON.parse(response.content[0].text);
if (result.isConstraintCommand && result.result) {
  console.log('增强指令:', result.result.enhancedInstruction.enhancedInstruction);
}
```

### 2. add-config-template

添加新的配置模板到系统中。

#### 请求格式

```json
{
  "method": "tools/call",
  "params": {
    "name": "add-config-template",
    "arguments": {
      "name": "string",
      "config": {
        "templateType": "string",
        "language": "string",
        "includeProjectContext": "boolean",
        "customRules": ["string"],
        "strictMode": "boolean",
        "maxConstraintLength": "number"
      }
    }
  }
}
```

#### 参数说明

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 模板名称，必须唯一 |
| `config` | ConstraintConfig | 是 | 约束配置对象 |

#### ConstraintConfig 结构

```typescript
interface ConstraintConfig {
  templateType: string;              // 模板类型（如'api', 'frontend', 'backend'）
  language: 'auto' | 'zh' | 'en';   // 语言设置
  includeProjectContext: boolean;    // 是否包含项目上下文
  customRules: string[];             // 自定义规则列表
  strictMode: boolean;               // 是否启用严格模式
  maxConstraintLength: number;       // 约束文本最大长度
}
```

#### 响应格式

```json
{
  "content": [
    {
      "type": "text", 
      "text": "true"
    }
  ]
}
```

#### 使用示例

```javascript
await mcpClient.callTool('add-config-template', {
  name: 'mobile-api',
  config: {
    templateType: 'api',
    language: 'auto',
    includeProjectContext: true,
    customRules: [
      '优化移动端性能',
      '支持离线模式',
      '遵循RESTful设计原则'
    ],
    strictMode: false,
    maxConstraintLength: 1800
  }
});
```

### 3. remove-config-template

删除指定名称的配置模板。

#### 请求格式

```json
{
  "method": "tools/call",
  "params": {
    "name": "remove-config-template",
    "arguments": {
      "name": "string"
    }
  }
}
```

#### 参数说明

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 要删除的模板名称 |

#### 响应格式

```json
{
  "content": [
    {
      "type": "text",
      "text": "true"
    }
  ]
}
```

返回值：
- `true`: 删除成功
- `false`: 模板不存在

#### 使用示例

```javascript
const success = await mcpClient.callTool('remove-config-template', {
  name: 'old-template'
});

if (JSON.parse(success.content[0].text)) {
  console.log('模板删除成功');
}
```

### 4. get-config-templates

获取所有已配置的模板。

#### 请求格式

```json
{
  "method": "tools/call",
  "params": {
    "name": "get-config-templates",
    "arguments": {}
  }
}
```

#### 响应格式

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"template1\": {...}, \"template2\": {...}}"
    }
  ]
}
```

#### 使用示例

```javascript
const response = await mcpClient.callTool('get-config-templates');
const templates = JSON.parse(response.content[0].text);

Object.keys(templates).forEach(name => {
  console.log(`模板: ${name}`, templates[name]);
});
```

### 5. load-config-from-file

从指定文件路径加载配置。

#### 请求格式

```json
{
  "method": "tools/call",
  "params": {
    "name": "load-config-from-file",
    "arguments": {
      "filePath": "string"
    }
  }
}
```

#### 参数说明

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `filePath` | string | 是 | 配置文件路径（支持JSON和YAML格式） |

#### 响应格式

```json
{
  "content": [
    {
      "type": "text",
      "text": "配置加载成功"
    }
  ]
}
```

#### 使用示例

```javascript
await mcpClient.callTool('load-config-from-file', {
  filePath: './config/production-constraints.yaml'
});
```

## AI工具集成示例

### 使用现有MCP配置

智能约束功能使用与MCP接口验证组件**完全相同的配置**：

#### Cursor IDE
```json
{
  "mcpServers": {
    "mcp-interface-validator": {
      "command": "npx",
      "args": ["mcp-interface-validator"]
    }
  }
}
```

#### Windsurf
```json
{
  "mcp": {
    "servers": {
      "interface-validator": {
        "command": "npx",
        "args": ["mcp-interface-validator"]
      }
    }
  }
}
```

#### Augment
```json
{
  "servers": {
    "mcp-interface-validator": {
      "command": "npx",
      "args": ["mcp-interface-validator"]
    }
  }
}
```

### 自动激活示例

```typescript
// 用户在AI工具中输入：
"创建用户登录API .use interface"

// 系统自动调用 process-user-input 工具
// 无需手动配置或调用
```

### 手动调用示例（高级用户）

```typescript
// 仅在需要程序化控制时使用
const result = await mcp.callTool('process-user-input', {
  input: '开发商品管理系统 .use interface',
  sessionId: 'manual-session-001'
});
```

## 错误处理

### 常见错误代码

| 错误代码 | 说明 | 解决方案 |
|----------|------|----------|
| `INVALID_INPUT` | 输入参数无效 | 检查参数格式和类型 |
| `TEMPLATE_NOT_FOUND` | 模板不存在 | 确认模板名称正确 |
| `CONFIG_LOAD_ERROR` | 配置文件加载失败 | 检查文件路径和格式 |
| `SESSION_LIMIT_EXCEEDED` | 会话数量超限 | 清理旧会话或增加限制 |
| `SYSTEM_DESTROYED` | 系统已销毁 | 重新初始化系统 |

### 错误响应格式

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"error\": \"错误描述\", \"code\": \"ERROR_CODE\"}"
    }
  ]
}
```

## 性能优化

### 批量操作

```javascript
// 批量添加模板
const templates = [
  { name: 'api-v1', config: {...} },
  { name: 'api-v2', config: {...} }
];

for (const template of templates) {
  await mcpClient.callTool('add-config-template', template);
}
```

### 会话管理

```javascript
// 使用有意义的会话ID
const sessionId = `${toolName}-${userId}-${timestamp}`;

await mcpClient.callTool('process-user-input', {
  input: userInput,
  sessionId: sessionId
});
```

## 安全考虑

1. **输入验证**: 所有输入都经过严格验证
2. **文件路径限制**: 配置文件路径受到安全限制
3. **会话隔离**: 不同会话之间完全隔离
4. **资源限制**: 防止资源耗尽攻击

## 版本兼容性

- **MCP协议版本**: 支持MCP v1.0+
- **Node.js版本**: 需要Node.js 16+
- **TypeScript版本**: 支持TypeScript 4.5+

## 调试和监控

### 启用调试模式

```javascript
// 在MCP服务器启动时启用调试
process.env.DEBUG = 'intelligent-constraints:*';
```

### 监控工具调用

```javascript
// 监听工具调用事件
mcpServer.on('toolCall', (event) => {
  console.log('工具调用:', event.toolName, event.arguments);
});
```
