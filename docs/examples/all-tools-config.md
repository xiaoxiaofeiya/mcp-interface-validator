# 所有AI工具的MCP接口验证器配置示例

本文档提供了所有支持的AI编程工具的完整配置示例。

## 🚀 Augment Code

**配置方式**：Augment工作空间配置

```json
{
  "mcpServers": {
    "interface-validator": {
      "command": "mcp-interface-validator",
      "transport": "stdio",
      "env": {
        "NODE_ENV": "production"
      },
      "description": "API interface validation for generated code",
      "autoStart": true
    }
  },
  "codeGeneration": {
    "preValidation": true,
    "mcpTools": ["validate-interface", "monitor-changes"]
  }
}
```

## 🤖 Claude Desktop

**配置文件位置**：
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mcp-interface-validator": {
      "command": "npx",
      "args": ["mcp-interface-validator"],
      "env": {
        "NODE_ENV": "production",
        "MCP_VALIDATOR_CONFIG": "./config/mcp-validator.json"
      }
    }
  }
}
```

## 🔧 Cline (Claude in VSCode)

**配置方式**：VSCode设置 → 扩展 → Cline

```json
{
  "cline.mcpServers": {
    "mcp-interface-validator": {
      "command": "npx",
      "args": ["mcp-interface-validator"],
      "env": {
        "NODE_ENV": "production"
      },
      "description": "API interface validation for generated code"
    }
  }
}
```

## 💻 Codex (GitHub Copilot)

**配置方式**：GitHub Copilot高级设置

```json
{
  "github.copilot.advanced": {
    "mcpServers": {
      "interface-validator": {
        "command": "mcp-interface-validator",
        "args": ["--stdio"],
        "enabled": true,
        "description": "Validate API interfaces against OpenAPI specs"
      }
    }
  }
}
```

## 🎨 Cursor AI

**配置文件**：Cursor设置 → 高级 → MCP服务器

```json
{
  "mcp": {
    "servers": {
      "interface-validator": {
        "command": "mcp-interface-validator",
        "args": ["--stdio"],
        "env": {
          "NODE_ENV": "production"
        },
        "description": "Real-time API interface validation"
      }
    }
  }
}
```

## 🦘 Roo (Roo.dev)

**配置文件**：项目根目录的 `.roo/config.json`

```json
{
  "tools": {
    "mcp-interface-validator": {
      "type": "mcp",
      "command": "mcp-interface-validator",
      "args": ["--stdio"],
      "description": "API interface validation for generated code",
      "autoStart": true,
      "timeout": 30000
    }
  },
  "validation": {
    "enablePreGeneration": true,
    "strictMode": true
  }
}
```

## ⚡ Trae AI

**配置文件**：Trae工作空间配置

```json
{
  "integrations": {
    "mcp": {
      "servers": {
        "interface-validator": {
          "command": "mcp-interface-validator",
          "transport": "stdio",
          "autoStart": true,
          "description": "Validate API interfaces before code generation"
        }
      }
    }
  },
  "codeGeneration": {
    "preValidation": true,
    "mcpTools": ["validate-interface", "monitor-changes"]
  }
}
```

## 📝 VSCode (with MCP extension)

**配置文件**：VSCode的 `settings.json`

```json
{
  "mcp.servers": {
    "interface-validator": {
      "command": "mcp-interface-validator",
      "args": ["--stdio"],
      "env": {
        "NODE_ENV": "production"
      },
      "description": "API interface validation",
      "autoRestart": true
    }
  },
  "mcp.enableLogging": true,
  "mcp.logLevel": "info"
}
```

## 🌊 Windsurf

**配置文件**：Windsurf扩展设置

```json
{
  "extensions": {
    "mcp-interface-validator": {
      "enabled": true,
      "command": "mcp-interface-validator",
      "args": ["--stdio"],
      "config": "./config/mcp-validator.json",
      "description": "Real-time API interface validation",
      "features": {
        "preGeneration": true,
        "realTimeMonitoring": true,
        "contextInjection": true
      }
    }
  }
}
```

## 🔄 通用环境变量配置

所有工具都可以使用以下环境变量：

```bash
# MCP验证器配置文件路径
export MCP_VALIDATOR_CONFIG="./config/mcp-validator.json"

# 日志级别
export MCP_VALIDATOR_LOG_LEVEL="info"

# 启用调试模式
export DEBUG="mcp-interface-validator*"

# 工作目录
export MCP_VALIDATOR_WORKDIR="./src"

# OpenAPI规范文件路径
export MCP_VALIDATOR_SPEC_PATH="./api-spec.yaml"
```

## 🧪 验证配置

使用以下命令验证配置是否正确：

```bash
# 检查MCP服务器状态
mcp-interface-validator --version

# 测试工具列表
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | mcp-interface-validator

# 测试验证功能
mcp-interface-validator validate --spec ./api-spec.yaml --code ./src/api.ts
```

## 🚀 快速启动脚本

创建 `start-mcp-validator.sh` 脚本：

```bash
#!/bin/bash
export NODE_ENV=production
export MCP_VALIDATOR_CONFIG="./config/mcp-validator.json"
export DEBUG="mcp-interface-validator*"

echo "🚀 Starting MCP Interface Validator..."
mcp-interface-validator --stdio
```

## 📋 配置模板

创建 `mcp-validator-template.json`：

```json
{
  "server": {
    "name": "mcp-interface-validator",
    "version": "1.0.0"
  },
  "validation": {
    "strictMode": true,
    "preGeneration": true,
    "realTimeMonitoring": true
  },
  "integrations": {
    "augment": { "enabled": true },
    "claude": { "enabled": true },
    "cline": { "enabled": true },
    "codex": { "enabled": true },
    "cursor": { "enabled": true },
    "roo": { "enabled": true },
    "trae": { "enabled": true },
    "vscode": { "enabled": true },
    "windsurf": { "enabled": true }
  }
}
```
