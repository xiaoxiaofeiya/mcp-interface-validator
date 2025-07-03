# 🧠 智能约束系统架构设计

## 📋 系统概述

智能约束系统为MCP接口验证组件添加了`.use interface`指令功能，能够自动拦截用户输入并注入接口验证约束提示词，确保AI生成符合OpenAPI规范的高质量代码。

## 🏗️ 核心架构

### 1. 系统组件图

```
┌─────────────────────────────────────────────────────────────┐
│                    智能约束系统                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  指令检测器      │  │  约束管理器      │  │  模板引擎        │ │
│  │ InstructionDet  │  │ ConstraintMgr   │  │ TemplateEngine  │ │
│  │ ector           │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│           │                     │                     │        │
│           └─────────────────────┼─────────────────────┘        │
│                                 │                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  指令增强器      │  │  上下文注入器    │  │  会话管理器      │ │
│  │ InstructionEnh  │  │ ContextInjector │  │ SessionManager  │ │
│  │ ancer           │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MCP工具接口                                │
├─────────────────────────────────────────────────────────────────┤
│  • activate-interface-constraints                              │
│  • apply-interface-constraints                                 │
│  • validate-interface (增强版)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. 数据流程图

```
用户输入: ".use interface 开发聊天功能"
                    │
                    ▼
            ┌─────────────────┐
            │   指令检测器     │ ──── 检测 .use interface
            └─────────────────┘
                    │
                    ▼
            ┌─────────────────┐
            │   约束管理器     │ ──── 激活约束模式
            └─────────────────┘
                    │
                    ▼
            ┌─────────────────┐
            │   模板引擎       │ ──── 生成约束提示词
            └─────────────────┘
                    │
                    ▼
            ┌─────────────────┐
            │   指令增强器     │ ──── 合并用户指令+约束
            └─────────────────┘
                    │
                    ▼
            ┌─────────────────┐
            │   返回增强指令   │ ──── 供用户使用
            └─────────────────┘
```

## 🔧 核心组件设计

### 1. InstructionDetector (指令检测器)

**职责**：
- 检测用户输入中的 `.use interface` 指令
- 支持中英文指令变体
- 提取用户的实际需求内容

**接口设计**：
```typescript
interface InstructionDetector {
  detectConstraintCommand(input: string): ConstraintCommand | null;
  extractUserInstruction(input: string): string;
  getSupportedCommands(): string[];
}

interface ConstraintCommand {
  command: string;           // ".use interface"
  userInstruction: string;   // "开发聊天功能"
  options?: any;            // 可选参数
}
```

### 2. ConstraintManager (约束管理器)

**职责**：
- 管理约束模式的激活状态
- 维护会话级别的约束配置
- 提供约束状态查询和控制

**接口设计**：
```typescript
interface ConstraintManager {
  activateConstraints(sessionId: string, config?: ConstraintConfig): void;
  deactivateConstraints(sessionId: string): void;
  isConstraintActive(sessionId: string): boolean;
  getConstraintConfig(sessionId: string): ConstraintConfig | null;
  updateConstraintConfig(sessionId: string, config: ConstraintConfig): void;
}

interface ConstraintConfig {
  templateType: 'default' | 'strict' | 'custom';
  language: 'zh' | 'en' | 'auto';
  includeProjectContext: boolean;
  customRules?: string[];
}
```

### 3. ConstraintTemplateEngine (约束模板引擎)

**职责**：
- 生成约束提示词模板
- 支持项目上下文注入
- 提供多语言模板支持

**接口设计**：
```typescript
interface ConstraintTemplateEngine {
  generateConstraintPrompt(
    userIntent: UserIntent,
    projectContext: ProjectContext,
    config: ConstraintConfig
  ): string;
  
  getAvailableTemplates(): TemplateInfo[];
  registerCustomTemplate(name: string, template: ConstraintTemplate): void;
}

interface ConstraintTemplate {
  name: string;
  language: 'zh' | 'en';
  content: string;
  variables: string[];
  priority: number;
}
```

### 4. InstructionEnhancer (指令增强器)

**职责**：
- 分析用户指令意图
- 合并用户指令和约束提示词
- 生成最终的增强指令

**接口设计**：
```typescript
interface InstructionEnhancer {
  enhanceInstruction(
    userInstruction: string,
    constraintPrompt: string,
    options?: EnhanceOptions
  ): EnhancedInstruction;
  
  analyzeUserIntent(instruction: string): UserIntent;
  formatEnhancedInstruction(instruction: EnhancedInstruction): string;
}

interface EnhancedInstruction {
  originalInstruction: string;
  constraintPrompt: string;
  enhancedInstruction: string;
  metadata: {
    userIntent: UserIntent;
    appliedConstraints: string[];
    confidence: number;
  };
}
```

## 🎯 约束提示词模板设计

### 1. 基础约束模板 (中文)

```
🔒 接口开发约束要求：

1. **严格遵循OpenAPI 3.0规范**
   - 所有API端点必须符合现有规范
   - 新增端点必须遵循现有命名约定
   - 必须包含完整的请求/响应定义

2. **代码质量要求**
   - 必须包含完整的TypeScript类型定义
   - 必须实现适当的错误处理机制
   - 必须包含输入验证和安全检查

3. **项目上下文约束**
   - API基础路径: {basePath}
   - 认证方式: {authMethod}
   - 通用响应格式: {responseFormat}

4. **最佳实践要求**
   - 遵循RESTful设计原则
   - 使用标准HTTP状态码
   - 实现适当的错误响应格式

请基于以上约束要求完成开发任务。
```

### 2. 严格约束模板 (英文)

```
🔒 STRICT INTERFACE DEVELOPMENT CONSTRAINTS:

1. **MANDATORY OpenAPI 3.0 Compliance**
   - ALL endpoints MUST conform to existing specifications
   - NEW endpoints MUST follow established naming conventions
   - COMPLETE request/response definitions REQUIRED

2. **CODE QUALITY REQUIREMENTS**
   - COMPLETE TypeScript type definitions MANDATORY
   - PROPER error handling implementation REQUIRED
   - INPUT validation and security checks ESSENTIAL

3. **PROJECT CONTEXT CONSTRAINTS**
   - API Base Path: {basePath}
   - Authentication: {authMethod}
   - Response Format: {responseFormat}

4. **BEST PRACTICES ENFORCEMENT**
   - RESTful design principles MANDATORY
   - Standard HTTP status codes REQUIRED
   - Proper error response format ESSENTIAL

STRICTLY ADHERE to these constraints while completing the development task.
```

## 🚀 工作流程设计

### 1. 指令激活流程

```
1. 用户输入: ".use interface 开发聊天功能"
2. InstructionDetector 检测到约束指令
3. ConstraintManager 激活约束模式
4. 提取用户指令: "开发聊天功能"
5. 返回确认信息和后续指导
```

### 2. 约束应用流程

```
1. 用户调用 apply-interface-constraints 工具
2. InstructionEnhancer 分析用户意图
3. ConstraintTemplateEngine 生成约束提示词
4. 合并用户指令和约束提示词
5. 返回完整的增强指令
```

### 3. 智能验证流程

```
1. 用户调用 validate-interface 工具
2. 检查是否处于约束模式
3. 如果是，自动应用约束增强
4. 执行标准验证流程
5. 返回约束感知的验证结果
```

## 📊 配置系统设计

### 1. 全局配置

```typescript
interface GlobalConstraintConfig {
  defaultLanguage: 'zh' | 'en' | 'auto';
  defaultTemplateType: 'default' | 'strict' | 'custom';
  enableAutoDetection: boolean;
  maxSessionDuration: number;
  supportedCommands: string[];
}
```

### 2. 项目配置

```typescript
interface ProjectConstraintConfig {
  apiBasePath: string;
  authenticationMethod: string;
  responseFormat: any;
  customConstraints: string[];
  excludedPaths: string[];
  strictMode: boolean;
}
```

## 🔌 MCP工具接口设计

### 1. activate-interface-constraints

```json
{
  "name": "activate-interface-constraints",
  "description": "激活接口约束模式",
  "inputSchema": {
    "type": "object",
    "properties": {
      "mode": {
        "type": "string",
        "enum": ["activate", "deactivate", "status"],
        "description": "约束模式操作"
      },
      "config": {
        "type": "object",
        "description": "约束配置选项"
      }
    }
  }
}
```

### 2. apply-interface-constraints

```json
{
  "name": "apply-interface-constraints",
  "description": "应用接口约束到用户指令",
  "inputSchema": {
    "type": "object",
    "properties": {
      "userInstruction": {
        "type": "string",
        "description": "用户原始指令"
      },
      "constraintType": {
        "type": "string",
        "enum": ["default", "strict", "custom"],
        "description": "约束类型"
      },
      "projectContext": {
        "type": "object",
        "description": "项目上下文信息"
      }
    },
    "required": ["userInstruction"]
  }
}
```

## 🎯 预期效果

1. **用户体验**：
   - 简单的 `.use interface` 指令即可激活约束
   - 自动生成符合规范的增强指令
   - 无需手动配置复杂的约束规则

2. **代码质量**：
   - 确保AI生成的代码符合OpenAPI规范
   - 自动包含类型安全和错误处理
   - 遵循项目特定的接口约定

3. **开发效率**：
   - 减少接口不匹配的问题
   - 提供智能的开发指导
   - 支持模糊指令的精确处理

这个架构设计为实现智能约束系统提供了清晰的技术路线图。
