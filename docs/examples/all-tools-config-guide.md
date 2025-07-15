# 🔧 所有AI工具的MCP配置指南

## 📋 支持的AI工具

我们的MCP接口验证组件支持以下5个主流AI开发工具：

- ✅ **Claude Desktop** - 完全支持
- ✅ **Augment** - 完全支持  
- ✅ **Cursor** - 完全支持
- ✅ **Windsurf** - 完全支持
- ✅ **Trae** - 完全支持

## 🚀 快速配置

### 1. Claude Desktop

**配置文件路径**：
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**配置内容**：
```json
{
  "mcpServers": {
    "interface-validator": {
      "command": "mcp-interface-validator",
      "transport": "stdio",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 2. Augment

**配置文件**: `augment.config.json` 或在Augment设置中配置

**配置内容**：
```json
{
  "mcpServers": {
    "interface-validator": {
      "command": "mcp-interface-validator",
      "transport": "stdio",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 3. Cursor

**配置文件**: `.cursor/config.json` 或在Cursor设置中配置

**配置内容**：
```json
{
  "mcpServers": {
    "interface-validator": {
      "command": "mcp-interface-validator",
      "transport": "stdio",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 4. Windsurf

**配置文件**: `windsurf.config.json` 或在Windsurf设置中配置

**配置内容**：
```json
{
  "mcpServers": {
    "interface-validator": {
      "command": "mcp-interface-validator",
      "transport": "stdio",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 5. Trae

**配置文件**: `.trae/config.json` 或在Trae设置中配置

**配置内容**：
```json
{
  "mcpServers": {
    "interface-validator": {
      "command": "mcp-interface-validator",
      "transport": "stdio",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## ✅ 配置验证

配置完成后，重启AI工具并验证：

1. **检查工具列表**：应该能看到以下MCP工具：
   - `validate-interface`
   - `activate-interface-constraints`
   - `apply-interface-constraints`
   - `monitor-changes`

2. **测试智能约束**：
   ```
   .use interface 开发用户登录功能
   ```

3. **验证连接状态**：
   ```
   get-constraint-status
   ```

## 🔧 常见问题

### 问题1: JSON格式错误
**症状**: "Invalid JSON format" 错误
**解决**: 检查JSON语法，确保所有括号和逗号正确

### 问题2: 命令未找到
**症状**: "mcp-interface-validator command not found"
**解决**: 确保已全局安装包：`npm install -g mcp-interface-validator`

### 问题3: 工具不显示
**症状**: AI工具中看不到MCP工具
**解决**: 
1. 重启AI工具
2. 检查配置文件路径
3. 验证JSON格式

## 📚 更多信息

- [安装指南](../INSTALLATION.md)
- [用户手册](../USER_README.md)
- [故障排除](../docs/TROUBLESHOOTING.md)
