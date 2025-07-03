# MCP接口验证组件 - 智能约束功能使用指南

## 概述

智能约束功能是**MCP接口验证组件的增强特性**，通过在用户输入后添加`.use interface`指令来激活接口约束模式。该功能无缝集成到现有的MCP接口验证系统中，使用相同的部署配置和MCP服务器。

## 核心特性

- 🎯 **智能指令检测**: 自动识别`.use interface`后缀指令
- 🔄 **多AI工具支持**: 兼容Cursor、Windsurf、Trae、Augment等主流AI工具
- 🌐 **中英文支持**: 支持中文和英文指令处理
- ⚙️ **无缝集成**: 集成到现有MCP接口验证组件，无需额外配置
- 📝 **上下文增强**: 自动注入项目上下文和接口约束
- 🔧 **实时验证**: 结合现有验证功能，确保代码符合接口规范

## 快速开始

### 1. 基本使用

在任何AI工具中，在您的正常指令后添加`.use interface`：

```
开发用户登录系统 .use interface
```

或者：

```
创建用户注册API .use interface
```

系统会自动：
1. 检测到`.use interface`后缀
2. 分析用户意图（开发用户登录系统）
3. 选择合适的约束模板
4. 注入相关的OpenAPI约束提示词
5. 返回增强后的指令给AI工具

### 2. 指令格式

```
<您的正常开发指令> .use interface
```

**示例**：
- `创建用户注册API .use interface`
- `develop user profile management .use interface`
- `实现商品搜索功能 .use interface`

## 部署配置

智能约束功能**无需额外配置**，使用与现有MCP接口验证组件相同的部署方式：

### AI工具配置示例

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

### 可选配置

如需自定义约束模板，可在项目根目录创建配置文件：

#### JSON格式 (.mcp-config.json)
```json
{
  "intelligentConstraints": {
    "templates": {
      "api": {
        "templateType": "api",
        "language": "auto",
        "includeProjectContext": true,
        "customRules": [
          "必须遵循OpenAPI 3.0规范",
          "所有API端点必须包含适当的HTTP状态码",
          "请求和响应必须有明确的schema定义"
        ],
        "strictMode": false,
        "maxConstraintLength": 2000
      },
      "frontend": {
        "templateType": "frontend",
        "language": "auto",
        "includeProjectContext": true,
        "customRules": [
          "组件必须符合TypeScript类型定义",
          "使用React Hooks最佳实践",
          "确保响应式设计兼容性"
        ],
        "strictMode": true,
        "maxConstraintLength": 1500
      }
    }
  }
}
```

### 配置字段说明

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `templateType` | string | 'default' | 模板类型（api, frontend, backend, database等） |
| `language` | string | 'auto' | 目标语言（auto, zh, en） |
| `includeProjectContext` | boolean | true | 是否包含项目上下文信息 |
| `customRules` | string[] | [] | 自定义约束规则列表 |
| `strictMode` | boolean | false | 是否启用严格模式 |
| `maxConstraintLength` | number | 2000 | 约束文本最大长度 |

## MCP工具集成

智能约束功能通过现有MCP接口验证组件的**扩展工具**提供，新增5个专用工具：

### 自动激活
当用户输入包含`.use interface`后缀时，系统自动调用智能约束功能，无需手动调用MCP工具。

### 手动调用（高级用户）

#### 1. process-user-input
处理用户输入并应用智能约束。

```typescript
// 在AI工具中自动调用，也可手动调用
const result = await mcpClient.call('process-user-input', {
  input: '开发用户登录API .use interface',
  sessionId: 'cursor-session-001'
});
```

#### 2. add-config-template
添加新的配置模板。

```typescript
await mcpClient.call('add-config-template', {
  name: 'mobile-api',
  config: {
    templateType: 'api',
    language: 'auto',
    includeProjectContext: true,
    customRules: ['移动端API优化', '支持离线模式'],
    strictMode: false,
    maxConstraintLength: 1800
  }
});
```

#### 3. remove-config-template
删除指定的配置模板。

```typescript
await mcpClient.call('remove-config-template', {
  name: 'mobile-api'
});
```

#### 4. get-config-templates
获取所有配置模板。

```typescript
const templates = await mcpClient.call('get-config-templates');
```

#### 5. load-config-from-file
从文件加载配置。

```typescript
await mcpClient.call('load-config-from-file', {
  filePath: './.mcp-config.json'
});
```

## 使用场景

### 场景1：API开发
```
用户输入: 创建用户认证API .use interface
系统响应:
- 检测到API开发意图
- 应用API模板约束
- 注入OpenAPI 3.0规范要求
- 结合现有接口验证功能
- 确保生成的API符合项目规范
```

### 场景2：前端组件开发
```
用户输入: 开发商品列表组件 .use interface
系统响应:
- 检测到前端开发意图
- 应用前端模板约束
- 注入TypeScript类型约束
- 结合现有接口验证
- 确保组件与后端API接口匹配
```

### 场景3：全栈开发
```
用户输入: 实现用户注册功能 .use interface
系统响应:
- 检测到全栈开发意图
- 应用前后端约束模板
- 注入接口一致性要求
- 利用现有验证历史
- 确保前后端接口完全匹配
```

## 最佳实践

### 1. 与现有验证功能结合
- **渐进式使用**: 先熟悉基础接口验证，再使用智能约束
- **配合使用**: 智能约束生成代码后，使用现有验证工具检查
- **历史参考**: 利用验证历史优化约束模板

### 2. 约束规则编写
- **具体明确**: 避免模糊的描述
- **可执行**: 确保AI能够理解和执行
- **与项目规范一致**: 约束规则应与现有项目规范保持一致

### 3. 配置管理
- **统一配置**: 将智能约束配置与现有MCP配置放在一起
- **版本控制**: 将配置文件纳入版本控制
- **团队共享**: 确保团队成员使用相同的约束配置

## 故障排除

### 常见问题

#### 1. 智能约束未激活
**问题**: 输入包含`.use interface`的指令后没有约束效果
**解决方案**:
- 确认指令格式：`您的指令 .use interface`
- 检查MCP接口验证组件是否正常运行
- 验证AI工具的MCP配置是否正确

#### 2. 约束效果不明显
**问题**: 生成的代码没有明显的约束改进
**解决方案**:
- 检查是否有自定义约束模板配置
- 尝试更具体的开发指令
- 查看系统日志确认约束是否正确应用

#### 3. 与现有验证冲突
**问题**: 智能约束与现有接口验证产生冲突
**解决方案**:
- 调整约束模板以与现有规范保持一致
- 使用现有验证历史优化约束规则
- 联系团队统一约束标准

### 调试模式

通过环境变量启用调试模式：

```bash
# 启用智能约束调试
DEBUG=mcp-interface-validator:intelligent-constraints npm start

# 或在AI工具配置中添加环境变量
{
  "mcpServers": {
    "mcp-interface-validator": {
      "command": "npx",
      "args": ["mcp-interface-validator"],
      "env": {
        "DEBUG": "mcp-interface-validator:*"
      }
    }
  }
}
```

## 高级功能

### 1. 自定义约束模板
通过配置文件自定义约束模板：

```json
{
  "intelligentConstraints": {
    "templates": {
      "mobile-api": {
        "templateType": "api",
        "customRules": [
          "优化移动端性能",
          "支持离线模式",
          "遵循RESTful设计"
        ]
      }
    }
  }
}
```

### 2. 项目特定配置
在项目根目录创建`.mcp-config.json`：

```json
{
  "intelligentConstraints": {
    "defaultTemplate": "api",
    "autoDetectLanguage": true,
    "includeProjectContext": true
  }
}
```

## 与现有功能的集成

智能约束功能与MCP接口验证组件的其他功能完美集成：

- **接口验证**: 约束生成的代码会自动通过现有验证流程
- **验证历史**: 利用历史验证数据优化约束效果
- **错误恢复**: 结合现有错误恢复机制
- **报告生成**: 约束应用情况包含在验证报告中

## 更新日志

### v1.0.0 (智能约束功能)
- 集成到现有MCP接口验证组件
- 支持`.use interface`后缀指令
- 提供5个扩展MCP工具
- 支持自定义约束模板
- 中英文双语支持
- 无缝集成现有部署配置

---

如需更多帮助，请查看：
- [MCP接口验证组件完整文档](../README.md)
- [API参考文档](./api/)
- [FAQ文档](./faq.md)
