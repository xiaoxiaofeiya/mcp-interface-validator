# MCP接口验证器部署指南

## 🚀 快速开始

### 全局安装（推荐）

```bash
npm install -g mcp-interface-validator
```

### 本地项目安装

```bash
npm install mcp-interface-validator
```

## 🔧 AI工具集成配置

### Augment Code

在Augment配置中添加：

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

### Claude Desktop

1. 打开Claude Desktop配置文件：
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. 添加MCP服务器配置：

```json
{
  "mcpServers": {
    "mcp-interface-validator": {
      "command": "npx",
      "args": ["mcp-interface-validator"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Cline (Claude in VSCode)

在VSCode的Cline扩展设置中添加：

```json
{
  "cline.mcpServers": {
    "mcp-interface-validator": {
      "command": "npx",
      "args": ["mcp-interface-validator"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Codex (GitHub Copilot)

在GitHub Copilot配置中添加：

```json
{
  "github.copilot.advanced": {
    "mcpServers": {
      "interface-validator": {
        "command": "mcp-interface-validator",
        "args": ["--stdio"],
        "enabled": true
      }
    }
  }
}
```

### Cursor AI

在Cursor设置中添加：

```json
{
  "mcp": {
    "servers": {
      "interface-validator": {
        "command": "mcp-interface-validator",
        "args": ["--stdio"],
        "env": {
          "NODE_ENV": "production"
        }
      }
    }
  }
}
```

### Roo (Roo.dev)

在Roo配置文件中添加：

```json
{
  "tools": {
    "mcp-interface-validator": {
      "type": "mcp",
      "command": "mcp-interface-validator",
      "args": ["--stdio"],
      "description": "API interface validation for generated code"
    }
  }
}
```

### Trae AI

在Trae配置中添加：

```json
{
  "integrations": {
    "mcp": {
      "servers": {
        "interface-validator": {
          "command": "mcp-interface-validator",
          "transport": "stdio",
          "autoStart": true
        }
      }
    }
  }
}
```

### VSCode (with MCP extension)

在VSCode的settings.json中添加：

```json
{
  "mcp.servers": {
    "interface-validator": {
      "command": "mcp-interface-validator",
      "args": ["--stdio"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Windsurf

在Windsurf配置中添加：

```json
{
  "extensions": {
    "mcp-interface-validator": {
      "enabled": true,
      "command": "mcp-interface-validator",
      "args": ["--stdio"],
      "config": "./config/mcp-validator.json"
    }
  }
}
```

## 📋 配置文件设置

### 创建配置文件

在项目根目录创建 `mcp-validator.json`：

```json
{
  "server": {
    "name": "mcp-interface-validator",
    "version": "1.0.0",
    "description": "MCP Interface Validation Component"
  },
  "validation": {
    "strictMode": true,
    "allowAdditionalProperties": false,
    "validateExamples": true,
    "customRules": [
      "require-response-schemas",
      "validate-parameter-types",
      "check-security-definitions"
    ]
  },
  "integrations": {
    "cursor": { "enabled": true },
    "windsurf": { "enabled": true },
    "augment": { "enabled": true },
    "trae": { "enabled": true }
  },
  "monitoring": {
    "watchPatterns": [
      "**/*.ts", "**/*.js", "**/*.json", "**/*.yaml"
    ],
    "ignorePatterns": [
      "node_modules/**", "build/**", "dist/**"
    ],
    "debounceMs": 500
  }
}
```

## 🧪 验证安装

### 测试MCP服务器

```bash
# 检查版本
mcp-interface-validator --version

# 测试STDIO通信
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {"tools": {}}, "clientInfo": {"name": "test", "version": "1.0.0"}}}' | mcp-interface-validator
```

### 测试工具功能

```bash
# 列出可用工具
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}}' | mcp-interface-validator
```

## 🔍 使用示例

### 基本验证

```bash
# 验证API接口
mcp-interface-validator validate --spec ./api-spec.yaml --code ./src/api.ts
```

### 实时监控

```bash
# 启动文件监控
mcp-interface-validator monitor --watch ./src --spec ./api-spec.yaml
```

## 🛠️ 故障排除

### 常见问题

1. **命令未找到**
   ```bash
   # 确保全局安装
   npm install -g mcp-interface-validator
   
   # 或使用npx
   npx mcp-interface-validator --version
   ```

2. **权限错误**
   ```bash
   # Windows (以管理员身份运行)
   npm install -g mcp-interface-validator
   
   # macOS/Linux
   sudo npm install -g mcp-interface-validator
   ```

3. **配置文件未找到**
   ```bash
   # 创建默认配置
   mcp-interface-validator init
   ```

### 调试模式

```bash
# 启用详细日志
DEBUG=mcp-interface-validator* mcp-interface-validator

# 或设置环境变量
export NODE_ENV=development
mcp-interface-validator --verbose
```

## 📊 性能优化

### 大型项目配置

```json
{
  "monitoring": {
    "maxFileSize": 1048576,
    "debounceMs": 1000,
    "ignorePatterns": [
      "node_modules/**",
      "**/*.test.*",
      "**/*.spec.*",
      "coverage/**"
    ]
  },
  "validation": {
    "cacheEnabled": true,
    "parallelProcessing": true,
    "maxConcurrency": 4
  }
}
```

## 🔐 安全配置

### 生产环境

```json
{
  "security": {
    "enableSandbox": true,
    "allowedPaths": ["./src", "./api"],
    "maxFileSize": 1048576,
    "timeoutMs": 30000
  },
  "logging": {
    "level": "warn",
    "sanitizeOutput": true
  }
}
```

## 📈 监控和日志

### 日志配置

```json
{
  "logging": {
    "level": "info",
    "format": "structured",
    "output": "./logs/mcp-validator.log",
    "rotation": {
      "enabled": true,
      "maxSize": "10MB",
      "maxFiles": 5
    }
  }
}
```

## 🚀 生产部署

### Docker部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["mcp-interface-validator", "--port", "3000"]
```

### 系统服务

```bash
# 创建systemd服务
sudo tee /etc/systemd/system/mcp-validator.service > /dev/null <<EOF
[Unit]
Description=MCP Interface Validator
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=/opt/mcp-validator
ExecStart=/usr/bin/node /opt/mcp-validator/build/index.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
sudo systemctl enable mcp-validator
sudo systemctl start mcp-validator
```
