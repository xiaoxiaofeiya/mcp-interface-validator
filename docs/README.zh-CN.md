# MCP 接口验证器 - 智能接口约束与验证

[![网站](https://img.shields.io/badge/GitHub-mcp--interface--validator-blue)](https://github.com/xiaoxiaofeiya/mcp-interface-validator)
[![npm](https://img.shields.io/badge/npm-install%20-g-red)](https://www.npmjs.com/package/mcp-interface-validator)

## ❌ 不使用MCP接口验证器

AI工具生成的前后端代码可能存在接口不一致问题：

- ❌ 前端调用的API接口与后端实现不匹配
- ❌ 数据结构定义不一致，导致运行时错误
- ❌ 缺乏统一的接口规范，团队协作困难
- ❌ 手动检查接口一致性，效率低下

## ✅ 使用MCP接口验证器

MCP接口验证器通过OpenAPI 3.0规范自动验证AI生成的前后端代码接口一致性。

在Cursor中添加 `.use interface` 到你的提示：

```txt
开发一个用户登录系统，包含前端表单和后端API。.use interface
```

```txt
创建一个商品管理模块，支持增删改查操作。.use interface
```

MCP接口验证器将：
- 🔍 **智能约束注入** - 自动为AI提示添加接口验证约束
- 📋 **OpenAPI规范验证** - 确保生成的代码符合API规范
- 🔄 **实时接口检查** - 验证前后端接口一致性
- 🛠️ **多工具支持** - 支持Cursor、Windsurf、Trae、Augment等AI工具

## 🚀 核心功能

### 智能约束系统
- **`.use interface`指令** - 一键激活接口验证约束
- **自动提示注入** - 智能识别并注入OpenAPI约束提示词
- **多语言支持** - 支持中文和英文指令
- **模糊指令处理** - 处理不精确的用户指令

### 接口验证引擎
- **OpenAPI 3.0支持** - 完整的Swagger规范验证
- **实时验证** - 代码生成过程中的实时接口检查
- **错误报告** - 详细的接口不一致性报告
- **自动修复建议** - 提供接口修复建议

### 多工具集成
- **Cursor** - 完整支持Cursor AI编程助手
- **Windsurf** - 集成Windsurf开发环境
- **Trae** - 支持Trae AI工具
- **Augment** - 兼容Augment代码助手
- **Claude Desktop** - 支持Claude桌面应用

## 🛠️ 快速开始

### 系统要求
- Node.js >= v18.0.0
- 支持MCP协议的AI工具（Cursor、Windsurf、Claude Desktop等）

### 全局安装

```bash
npm install -g mcp-interface-validator
```

### 从GitHub安装

```bash
npm install -g https://github.com/xiaoxiaofeiya/mcp-interface-validator.git
```

## 📦 配置安装

### 在Cursor中配置

将以下配置添加到 `~/.cursor/mcp.json` 文件：

```json
{
  "mcpServers": {
    "interface-validator": {
      "command": "mcp-interface-validator",
      "args": []
    }
  }
}
```

### 在Windsurf中配置

```json
{
  "mcpServers": {
    "interface-validator": {
      "command": "mcp-interface-validator",
      "args": []
    }
  }
}
```

### 在Claude Desktop中配置

将以下内容添加到 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "interface-validator": {
      "command": "mcp-interface-validator",
      "args": []
    }
  }
}
```

### 在VSCode中配置

```json
{
  "servers": {
    "interface-validator": {
      "type": "stdio",
      "command": "mcp-interface-validator",
      "args": []
    }
  }
}
```

## 🎯 使用方法

### 基础使用

1. **激活智能约束**：在AI提示中添加 `.use interface`
2. **描述需求**：正常描述你的开发需求
3. **自动验证**：系统自动注入接口验证约束
4. **获得结果**：获得符合OpenAPI规范的代码

### 示例场景

**用户管理系统**：
```txt
开发用户注册和登录功能，包含前端表单验证和后端API。.use interface
```

**商品管理模块**：
```txt
创建商品CRUD操作，前端使用React，后端使用Express。.use interface
```

**订单处理系统**：
```txt
实现订单创建、查询、更新功能，确保前后端数据结构一致。.use interface
```

## 🔧 高级配置

### 自定义约束规则

创建 `constraint-config.json` 文件：

```json
{
  "openapi": {
    "version": "3.0.0",
    "strictMode": true,
    "validateResponses": true
  },
  "validation": {
    "realTime": true,
    "autoFix": true
  }
}
```

### 多语言支持

支持的指令格式：
- 中文：`.use interface`、`.使用接口`
- 英文：`.use interface`、`.apply constraints`



## 🌟 特色优势

- **零配置启动** - 安装即用，无需复杂配置
- **智能识别** - 自动识别接口验证需求
- **实时反馈** - 即时的接口一致性检查
- **跨平台支持** - Windows、macOS、Linux全平台支持
- **开源免费** - MIT许可证，完全开源

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件
