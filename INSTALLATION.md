# 📦 MCP接口验证组件 - 安装指南

## 🚀 快速安装

### 方法1：NPM全局安装（推荐）

```bash
# 安装包
npm install -g mcp-interface-validator

# 自动配置MCP
npm run install:global
```

### 方法2：从源码安装

```bash
# 克隆仓库
git clone https://github.com/xiaoxiaofeiya/mcp-interface-validator.git
cd mcp-interface-validator

# 安装依赖
npm install

# 构建项目
npm run build

# 全局链接
npm link
```

### 方法3：直接从GitHub安装

```bash
npm install -g https://github.com/xiaoxiaofeiya/mcp-interface-validator.git
```

## ⚙️ MCP配置

### Claude Desktop配置

**Windows路径**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS路径**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux路径**: `~/.config/Claude/claude_desktop_config.json`

**正确的配置格式**:
```json
{
  "mcpServers": {
    "interface-validator": {
      "command": "mcp-interface-validator",
      "transport": "stdio",
      "env": {
        "NODE_ENV": "production"
      },
      "autoStart": true
    }
  }
}
```

### 其他AI工具配置

#### Cursor
文件: `.cursor/config.json`
```json
{
  "mcp": {
    "servers": {
      "interface-validator": {
        "command": "mcp-interface-validator",
        "args": ["--port", "3001"]
      }
    }
  }
}
```

#### Windsurf
文件: `windsurf.config.json`
```json
{
  "mcpServers": {
    "interface-validator": {
      "command": "mcp-interface-validator",
      "transport": "stdio"
    }
  }
}
```

## 🔍 验证安装

### 1. 检查版本
```bash
mcp-interface-validator --version
```

### 2. 检查工具状态
```bash
mcp-interface-validator --status
```

### 3. 在AI工具中测试
重启AI工具后，应该能看到以下工具：
- `validate-interface`
- `activate-interface-constraints`
- `apply-interface-constraints`
- `monitor-changes`

## 🛠️ 故障排除

### 问题1: 命令未找到
```bash
# 检查全局安装
npm list -g mcp-interface-validator

# 重新安装
npm uninstall -g mcp-interface-validator
npm install -g mcp-interface-validator
```

### 问题2: MCP连接失败
1. 检查配置文件JSON格式是否正确
2. 确保命令路径正确
3. 重启AI工具

### 问题3: 权限错误
```bash
# Windows (以管理员身份运行)
npm install -g mcp-interface-validator

# macOS/Linux
sudo npm install -g mcp-interface-validator
```

## 📚 下一步

安装完成后，请查看：
- [用户指南](USER_README.md) - 详细使用说明
- [API文档](docs/api/) - 工具命令参考
- [示例配置](docs/examples/) - 更多配置示例

## 🆘 获取帮助

- 📧 邮件支持: 1334089073@qq.com
- 🐛 问题反馈: [GitHub Issues](https://github.com/xiaoxiaofeiya/mcp-interface-validator/issues)
- 📚 完整文档: [项目主页](https://github.com/xiaoxiaofeiya/mcp-interface-validator)
