# 智能约束系统使用指南

## 🎯 概述

智能约束系统是MCP接口验证器的核心新功能，它能够根据您的开发指令自动应用合适的约束模板，确保代码质量和最佳实践的一致性。

## 🚀 快速开始

### 1. 激活智能约束

在任何支持的AI工具中输入以下指令之一：

```
.use interface
.使用接口
.apply constraints
.应用约束
```

### 2. 系统自动分析

系统会自动分析您的后续指令，并应用最合适的约束模板。

### 3. 获得智能建议

系统会在代码生成过程中提供实时的约束建议和验证反馈。

## 📋 可用的MCP工具

### activate-constraints
**功能**：激活智能约束系统
**用法**：
```json
{
  "name": "activate-constraints",
  "arguments": {
    "template": "default",
    "autoMode": true
  }
}
```

### apply-constraint-template
**功能**：应用特定的约束模板
**用法**：
```json
{
  "name": "apply-constraint-template",
  "arguments": {
    "templateName": "api",
    "context": "开发用户管理API"
  }
}
```

### load-constraint-config
**功能**：从配置文件加载约束设置
**用法**：
```json
{
  "name": "load-constraint-config",
  "arguments": {
    "configPath": "./config/constraint-config.yaml"
  }
}
```

### list-constraint-templates
**功能**：列出所有可用的约束模板
**用法**：
```json
{
  "name": "list-constraint-templates",
  "arguments": {}
}
```

### get-constraint-status
**功能**：获取当前约束系统状态
**用法**：
```json
{
  "name": "get-constraint-status",
  "arguments": {}
}
```

## 🎨 约束模板详解

### Default Template (默认模板)
- **触发条件**：通用开发指令
- **约束内容**：
  - 遵循基本编码规范
  - 添加必要的注释
  - 使用有意义的变量名
  - 基础错误处理

### Strict Template (严格模板)
- **触发条件**：包含"生产"、"关键"、"重要"等关键词
- **约束内容**：
  - 严格的类型检查
  - 完整的错误处理
  - 详细的文档注释
  - 性能优化考虑

### API Template (API模板)
- **触发条件**：包含"API"、"接口"、"服务"等关键词
- **约束内容**：
  - 遵循OpenAPI 3.0规范
  - RESTful设计原则
  - 安全性验证
  - 统一的响应格式

### Frontend Template (前端模板)
- **触发条件**：包含"组件"、"页面"、"前端"等关键词
- **约束内容**：
  - 组件化设计原则
  - 响应式布局
  - 可访问性要求
  - 性能优化

### Testing Template (测试模板)
- **触发条件**：包含"测试"、"单元测试"等关键词
- **约束内容**：
  - 高测试覆盖率
  - 边界条件测试
  - 性能测试
  - 集成测试

## 🔧 配置文件

### YAML格式配置
```yaml
intelligentConstraints:
  enabled: true
  autoActivation: true
  defaultTemplate: "default"
  
templates:
  custom:
    name: "自定义模板"
    description: "针对特定项目的约束"
    constraints:
      - "使用TypeScript严格模式"
      - "遵循公司编码规范"
      - "包含完整的JSDoc注释"
    keywords:
      - "自定义"
      - "项目特定"
```

### JSON格式配置
```json
{
  "intelligentConstraints": {
    "enabled": true,
    "autoActivation": true,
    "defaultTemplate": "default"
  },
  "templates": {
    "custom": {
      "name": "自定义模板",
      "description": "针对特定项目的约束",
      "constraints": [
        "使用TypeScript严格模式",
        "遵循公司编码规范",
        "包含完整的JSDoc注释"
      ],
      "keywords": ["自定义", "项目特定"]
    }
  }
}
```

## 🎯 实际使用场景

### 场景1：API开发
```
用户：.use interface
用户：开发一个用户注册API

系统响应：
✅ 已激活API约束模板
📋 应用OpenAPI 3.0规范
🛡️ 包含安全性验证
📝 确保RESTful设计
```

### 场景2：前端组件开发
```
用户：.使用接口
用户：创建一个数据表格组件

系统响应：
✅ 已激活前端约束模板
⚛️ 应用React最佳实践
🎨 确保组件化设计
♿ 包含可访问性要求
```

### 场景3：测试代码编写
```
用户：.apply constraints
用户：为用户服务编写单元测试

系统响应：
✅ 已激活测试约束模板
🧪 确保高测试覆盖率
🔍 包含边界条件测试
⚡ 添加性能测试
```

## 🛠️ 高级功能

### 自定义模板创建
您可以创建自己的约束模板：

```yaml
templates:
  myCustomTemplate:
    name: "我的自定义模板"
    description: "针对特定需求的约束"
    constraints:
      - "使用特定的设计模式"
      - "遵循团队编码标准"
      - "包含性能监控代码"
    keywords:
      - "特定关键词"
    priority: 10
```

### 动态约束调整
系统支持在运行时动态调整约束：

```json
{
  "name": "apply-constraint-template",
  "arguments": {
    "templateName": "api",
    "overrides": {
      "strictMode": true,
      "additionalConstraints": [
        "添加请求限流",
        "实现缓存机制"
      ]
    }
  }
}
```

## 🎉 最佳实践

1. **明确指令**：使用清晰、具体的开发指令
2. **合理配置**：根据项目需求配置合适的默认模板
3. **定期更新**：定期更新约束模板以适应新的最佳实践
4. **团队协作**：在团队中统一约束配置，确保代码一致性
5. **持续改进**：根据使用反馈不断优化约束规则

## 🔍 故障排除

### 常见问题

**Q: 约束没有自动激活？**
A: 检查配置文件中的 `autoActivation` 设置，确保为 `true`

**Q: 模板选择不准确？**
A: 可以手动指定模板，或者调整关键词匹配规则

**Q: 配置文件加载失败？**
A: 检查配置文件路径和格式是否正确

### 调试模式
启用调试模式获取详细信息：

```json
{
  "name": "activate-constraints",
  "arguments": {
    "debugMode": true
  }
}
```
