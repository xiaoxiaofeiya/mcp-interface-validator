# 🚀 MCP Interface Validator

**让AI开发更智能，接口验证更简单！**

## ⚡ 快速安装 (Quick Installation)

### 全局安装 (Global Installation)
```bash
npm install -g mcp-interface-validator
```

### 配置使用 (Configuration)
1. 在AI工具中配置MCP服务器JSON
2. 使用 `.use interface` 指令激活智能约束功能

📚 **详细配置说明**: [INSTALL.md](./INSTALL.md) | [用户指南](./USER_README.md) | [English Guide](./USER_README_EN.md)

## 📖 项目简介

MCP Interface Validator 是一个基于 Model Context Protocol (MCP) 的智能接口验证组件，专为AI辅助开发设计。它通过智能约束系统，确保AI生成的前后端代码接口一致性，大幅提升开发效率和代码质量。

### 🌟 核心特性

- **🧠 智能约束系统**: `.use interface` 指令自动注入接口验证约束
- **🔄 实时验证**: 文件监听和自动验证功能
- **🛠️ 多AI工具支持**: Claude Desktop、Cursor、Windsurf、Trae、Augment
- **📋 OpenAPI 3.0**: 完整支持 OpenAPI/Swagger 规范
- **🌐 跨平台**: Windows、macOS、Linux 全平台支持
- **🔌 模块化架构**: 可扩展的插件系统

### 💡 解决的核心问题

**传统AI开发痛点**:
- AI生成的前后端接口不一致
- 手动检查接口耗时费力
- 团队协作缺乏统一标准
- 接口文档与代码脱节

**MCP Validator解决方案**:
- 自动检测并修正接口不一致
- 实时验证，即时反馈
- 统一的API开发规范
- 文档与代码同步更新

## 🚀 快速开始

### 1. 安装

```bash
# 全局安装
npm install -g mcp-interface-validator

# 或本地安装
npm install mcp-interface-validator
```

### 2. 配置AI工具

#### Claude Desktop
在 `%APPDATA%\Claude\claude_desktop_config.json` 中添加：

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

#### Cursor
在项目根目录创建 `.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "mcp-interface-validator": {
      "command": "npx",
      "args": ["mcp-interface-validator"],
      "env": {}
    }
  }
}
```

#### Windsurf
在项目根目录创建 `.windsurf/mcp.json`：

```json
{
  "mcpServers": {
    "mcp-interface-validator": {
      "command": "npx",
      "args": ["mcp-interface-validator"],
      "env": {}
    }
  }
}
```

### 3. 开始使用

```bash
# 启动MCP服务器
mcp-interface-validator --start

# 在AI工具中使用智能约束
.use interface 开发用户管理API
.use interface create product catalog interface
```

## 📋 主要功能

### 🧠 智能约束模式

使用 `.use interface` 指令激活智能约束：

```
.use interface 开发电商平台的商品搜索API，支持多条件筛选、分页、排序
.use interface create user authentication system with JWT tokens
.use interface 实现订单处理接口，包含状态流转和支付集成
```

### 🔍 接口验证

```bash
# 验证单个文件
validate-interface --file "./src/api/user.ts"

# 验证整个项目
validate-interface --directory "./src"

# 批量验证
validate-interface --batch --parallel
```

### ⚙️ 约束管理

```bash
# 激活约束
activate-interface-constraints --project-path "."

# 查看状态
get-constraint-status

# 更新配置
update-constraint-config --template "strict"
```

## 📁 项目结构

```
mcp-interface-validator/
├── src/                    # 源代码
│   ├── core/              # 核心功能
│   ├── adapters/          # AI工具适配器
│   ├── integrations/      # 集成模块
│   └── utils/             # 工具函数
├── config/                # 配置文件
├── docs/                  # 文档
├── tests/                 # 测试文件
├── USER_README.md         # 中文用户指南
├── USER_README_EN.md      # 英文用户指南
├── TECHNICAL.md           # 技术文档
├── API_REFERENCE.md       # API参考
└── BEST_PRACTICES.md      # 最佳实践
```

## 📚 文档

- **[用户指南](./USER_README.md)** - 完整的中文使用指南
- **[User Guide (English)](./USER_README_EN.md)** - Complete English user guide
- **[技术文档](./TECHNICAL.md)** - 深入的技术实现细节
- **[API参考](./API_REFERENCE.md)** - 完整的工具命令参考
- **[最佳实践](./BEST_PRACTICES.md)** - 开发和使用最佳实践

## 🔧 系统要求

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **内存**: 最少 512MB 可用内存
- **磁盘**: 最少 100MB 可用空间

## 🤝 支持与反馈

- **📧 邮箱支持**: 1334089073@qq.com
- **🐛 问题报告**: [GitHub Issues](https://github.com/your-repo/issues)
- **💬 社区讨论**: [GitHub Discussions](https://github.com/your-repo/discussions)

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

**让AI开发更智能，让接口验证更简单！** 🚀

立即开始使用，体验前所未有的开发效率提升！
