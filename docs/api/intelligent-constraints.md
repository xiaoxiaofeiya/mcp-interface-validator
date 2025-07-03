# MCP接口验证组件 - 智能约束功能 API 参考

## 概述

智能约束功能是**MCP接口验证组件的扩展模块**，通过现有的MCP服务器提供服务。该功能无需独立部署，使用与主组件相同的配置和启动方式。

## IntelligentConstraintSystem 类

智能约束功能的核心类，集成在MCP接口验证组件中。

### 集成方式

智能约束功能通过以下方式集成到现有系统：

```typescript
// 在现有MCP服务器中自动初始化
import { MCPInterfaceValidator } from 'mcp-interface-validator';

const validator = new MCPInterfaceValidator({
  // 现有配置保持不变
  intelligentConstraints: {
    enabled: true,  // 默认启用
    debug: false,
    sessionTimeout: 1800000
  }
});
```

### 配置选项

智能约束配置作为现有配置的一部分：

```typescript
interface MCPValidatorConfig {
  // 现有配置...
  intelligentConstraints?: {
    enabled: boolean;                  // 是否启用智能约束，默认true
    debug: boolean;                    // 调试模式，默认false
    logLevel: 'error' | 'warn' | 'info' | 'debug'; // 日志级别
    sessionTimeout: number;            // 会话超时时间（毫秒）
    maxConcurrentSessions: number;     // 最大并发会话数
    configPath: string;                // 配置文件路径
  };
}
```

### 主要方法

#### processUserInput

处理用户输入并应用智能约束。

```typescript
async processUserInput(
  input: string, 
  sessionId?: string
): Promise<ConstraintProcessingResult>
```

**参数**:
- `input`: 用户输入的文本
- `sessionId`: 可选的会话ID，用于会话管理

**返回值**:
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
  error?: string;                    // 错误信息（如果有）
}
```

**示例**:
```typescript
const result = await constraintSystem.processUserInput(
  '.use interface 开发用户登录API',
  'session-001'
);

if (result.isConstraintCommand && result.result) {
  console.log('增强后的指令:', result.result.enhancedInstruction.enhancedInstruction);
  console.log('应用的约束:', result.result.enhancedInstruction.appliedConstraints);
}
```

#### addConfigTemplate

添加新的配置模板。

```typescript
addConfigTemplate(name: string, config: ConstraintConfig): void
```

**参数**:
- `name`: 模板名称
- `config`: 约束配置对象

**示例**:
```typescript
constraintSystem.addConfigTemplate('mobile-api', {
  templateType: 'api',
  language: 'auto',
  includeProjectContext: true,
  customRules: ['移动端优化', '支持离线模式'],
  strictMode: false,
  maxConstraintLength: 1800
});
```

#### removeConfigTemplate

删除指定的配置模板。

```typescript
removeConfigTemplate(name: string): boolean
```

**参数**:
- `name`: 要删除的模板名称

**返回值**:
- `boolean`: 删除成功返回true，模板不存在返回false

#### getConfigTemplates

获取所有配置模板。

```typescript
getConfigTemplates(): Record<string, ConstraintConfig>
```

**返回值**:
- `Record<string, ConstraintConfig>`: 所有模板的键值对

#### loadConfigFromFile

从文件加载配置。

```typescript
async loadConfigFromFile(filePath: string): Promise<void>
```

**参数**:
- `filePath`: 配置文件路径（支持JSON和YAML格式）

**示例**:
```typescript
await constraintSystem.loadConfigFromFile('./config/production-constraints.yaml');
```

#### saveConfigToFile

将当前配置保存到文件。

```typescript
async saveConfigToFile(filePath: string, format?: 'json' | 'yaml'): Promise<void>
```

**参数**:
- `filePath`: 保存路径
- `format`: 文件格式，默认根据文件扩展名判断

#### getSessionInfo

获取会话信息。

```typescript
getSessionInfo(sessionId: string): SessionInfo | undefined
```

**返回值**:
```typescript
interface SessionInfo {
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
  requestCount: number;
  metadata: Record<string, any>;
}
```

#### clearSession

清除指定会话。

```typescript
clearSession(sessionId: string): boolean
```

#### destroy

销毁约束系统实例，清理资源。

```typescript
destroy(): void
```

### 事件系统

智能约束系统支持事件监听：

```typescript
// 监听约束处理事件
constraintSystem.on('constraintApplied', (event) => {
  console.log('约束已应用:', event.templateName, event.constraints);
});

// 监听错误事件
constraintSystem.on('error', (error) => {
  console.error('约束系统错误:', error);
});

// 监听配置变更事件
constraintSystem.on('configChanged', (event) => {
  console.log('配置已更新:', event.templateName);
});
```

### 错误处理

系统定义了以下错误类型：

```typescript
class ConstraintSystemError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ConstraintSystemError';
  }
}

// 错误代码
enum ErrorCodes {
  INVALID_INPUT = 'INVALID_INPUT',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  CONFIG_LOAD_ERROR = 'CONFIG_LOAD_ERROR',
  SESSION_LIMIT_EXCEEDED = 'SESSION_LIMIT_EXCEEDED',
  SYSTEM_DESTROYED = 'SYSTEM_DESTROYED'
}
```

### 性能监控

```typescript
// 获取性能统计
const stats = constraintSystem.getPerformanceStats();
console.log('平均处理时间:', stats.averageProcessingTime);
console.log('总请求数:', stats.totalRequests);
console.log('活跃会话数:', stats.activeSessions);
```

### 类型定义

#### ConstraintConfig

```typescript
interface ConstraintConfig {
  templateType: string;              // 模板类型
  language: 'auto' | 'zh' | 'en';   // 语言设置
  includeProjectContext: boolean;    // 是否包含项目上下文
  customRules: string[];             // 自定义规则列表
  strictMode: boolean;               // 严格模式
  maxConstraintLength: number;       // 最大约束长度
}
```

#### TemplateSelectionContext

```typescript
interface TemplateSelectionContext {
  input: string;                     // 用户输入
  sessionId: string;                 // 会话ID
  projectContext?: ProjectContext;   // 项目上下文
  userPreferences?: UserPreferences; // 用户偏好
}
```

#### ProjectContext

```typescript
interface ProjectContext {
  hasTypeScript: boolean;            // 是否使用TypeScript
  hasESLint: boolean;               // 是否使用ESLint
  framework?: string;               // 使用的框架
  dependencies: string[];           // 依赖列表
  apiSpecs: OpenAPISpec[];         // API规范
}
```

### 扩展性

#### 自定义模板选择器

```typescript
constraintSystem.setTemplateSelector((context: TemplateSelectionContext) => {
  // 自定义模板选择逻辑
  if (context.input.includes('移动端')) return 'mobile';
  if (context.input.includes('后台管理')) return 'admin';
  return 'default';
});
```

#### 自定义约束生成器

```typescript
constraintSystem.setConstraintGenerator((template: ConstraintConfig, context: any) => {
  // 动态生成约束
  const constraints = [...template.customRules];
  
  if (context.hasTypeScript) {
    constraints.push('使用TypeScript严格类型检查');
  }
  
  return constraints;
});
```

### 最佳实践

1. **资源管理**: 使用完毕后调用`destroy()`方法清理资源
2. **错误处理**: 始终包装异步调用在try-catch块中
3. **会话管理**: 为不同的用户或上下文使用不同的sessionId
4. **性能优化**: 定期监控性能统计，调整配置参数
5. **配置备份**: 定期备份重要的配置模板

### 版本兼容性

- **v1.0.0**: 初始API版本
- 向后兼容性保证：主版本号变更时可能包含破坏性变更
- 建议使用语义化版本控制进行依赖管理

### 调试技巧

```typescript
// 启用详细日志
const constraintSystem = new IntelligentConstraintSystem({
  debug: true,
  logLevel: 'debug'
});

// 监听内部事件
constraintSystem.on('templateSelected', (event) => {
  console.log('选择的模板:', event.templateName);
});

constraintSystem.on('constraintGenerated', (event) => {
  console.log('生成的约束:', event.constraints);
});
```
