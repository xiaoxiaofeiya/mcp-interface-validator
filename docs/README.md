# MCP Interface Validator - Intelligent Interface Constraints & Validation

[![Website](https://img.shields.io/badge/GitHub-mcp--interface--validator-blue)](https://github.com/xiaoxiaofeiya/mcp-interface-validator)
[![npm](https://img.shields.io/badge/npm-install%20-g-red)](https://www.npmjs.com/package/mcp-interface-validator)

## ❌ Without MCP Interface Validator

AI-generated frontend and backend code may have interface inconsistency issues:

- ❌ Frontend API calls don't match backend implementations
- ❌ Inconsistent data structure definitions causing runtime errors
- ❌ Lack of unified interface specifications
- ❌ Manual interface consistency checking is inefficient

## ✅ With MCP Interface Validator

MCP Interface Validator automatically validates interface consistency between AI-generated frontend and backend code using OpenAPI 3.0 specifications.

Add `.use interface` to your prompts in Cursor:

```txt
Develop a user login system with frontend form and backend API. .use interface
```

```txt
Create a product management module with CRUD operations. .use interface
```

MCP Interface Validator will:
- 🔍 **Smart Constraint Injection** - Automatically add interface validation constraints to AI prompts
- 📋 **OpenAPI Specification Validation** - Ensure generated code follows API specifications
- 🔄 **Real-time Interface Checking** - Validate frontend-backend interface consistency
- 🛠️ **Multi-tool Support** - Support Cursor, Windsurf, Trae, Augment and other AI tools

## 🚀 Core Features

### Intelligent Constraint System
- **`.use interface` Command** - One-click activation of interface validation constraints
- **Automatic Prompt Injection** - Smart recognition and injection of OpenAPI constraint prompts
- **Multi-language Support** - Support for Chinese and English commands
- **Fuzzy Instruction Processing** - Handle imprecise user instructions

### Interface Validation Engine
- **OpenAPI 3.0 Support** - Complete Swagger specification validation
- **Real-time Validation** - Real-time interface checking during code generation
- **Error Reporting** - Detailed interface inconsistency reports
- **Auto-fix Suggestions** - Provide interface repair suggestions

### Multi-tool Integration
- **Cursor** - Full support for Cursor AI programming assistant
- **Windsurf** - Integration with Windsurf development environment
- **Trae** - Support for Trae AI tools
- **Augment** - Compatible with Augment code assistant
- **Claude Desktop** - Support for Claude desktop application

## 🛠️ Quick Start

### Requirements
- Node.js >= v18.0.0
- AI tools supporting MCP protocol (Cursor, Windsurf, Claude Desktop, etc.)

### Global Installation

```bash
npm install -g mcp-interface-validator
```

### Install from GitHub

```bash
npm install -g https://github.com/xiaoxiaofeiya/mcp-interface-validator.git
```

## 📦 Configuration Setup

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


## 🎯 Usage

### Basic Usage

1. **Activate Smart Constraints**: Add `.use interface` to your AI prompts
2. **Describe Requirements**: Normally describe your development needs
3. **Automatic Validation**: System automatically injects interface validation constraints
4. **Get Results**: Receive code that complies with OpenAPI specifications

### Example Scenarios

**User Management System**:
```txt
Develop user registration and login functionality with frontend form validation and backend API. .use interface
```

**Product Management Module**:
```txt
Create product CRUD operations, frontend using React, backend using Express. .use interface
```

**Order Processing System**:
```txt
Implement order creation, query, and update functions, ensuring frontend-backend data structure consistency. .use interface
```

## 🔧 Advanced Configuration

### Custom Constraint Rules

Create `constraint-config.json` file:

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

### Multi-language Support

Supported command formats:
- Chinese: `.use interface`, `.使用接口`
- English: `.use interface`, `.apply constraints`

## 📚 Documentation Links

- [Complete Deployment Guide](./COMPLETE-DEPLOYMENT-GUIDE.md)
- [Intelligent Constraints Guide](./INTELLIGENT-VALIDATION-GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [API Reference](./api/README.md)
- [Usage Examples](./examples/README.md)

## 🌟 Key Advantages

- **Zero Configuration Startup** - Ready to use after installation, no complex configuration needed
- **Smart Recognition** - Automatically recognize interface validation requirements
- **Real-time Feedback** - Instant interface consistency checking
- **Cross-platform Support** - Full support for Windows, macOS, Linux
- **Open Source & Free** - MIT license, completely open source

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License - See [LICENSE](../LICENSE) file for details
