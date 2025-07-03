# MCP Interface Validator - Intelligent Interface Constraints & Validation

[![Website](https://img.shields.io/badge/GitHub-mcp--interface--validator-blue)](https://github.com/xiaoxiaofeiya/mcp-interface-validator)
[![npm](https://img.shields.io/badge/npm-install%20-g-red)](https://www.npmjs.com/package/mcp-interface-validator)

## ❌ Without MCP Interface Validator

AI-generated frontend and backend code may have interface inconsistency issues:

- ❌ Frontend API calls don't match backend implementations
- ❌ Inconsistent data structure definitions causing runtime errors
- ❌ Lack of unified interface specifications, making team collaboration difficult
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

### Configure in Augment

```{
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

### Configure in Cursor

Add the following configuration to `~/.cursor/mcp.json` file:

```{
  "mcpServers": {
    "interface-validator": {
      "command": "mcp-interface-validator",
      "args": ["--stdio"],
      "env": {}
    }
  }
}
```

### Configure in Windsurf

```{
  "extensions": {
    "mcp": {
      "servers": {
        "interface-validator": {
          "command": "mcp-interface-validator",
          "transport": "stdio"
        }
      }
    }
  }
}
```

### Configure in Claude Desktop

Add the following to `claude_desktop_config.json`:

```{
  "mcpServers": {
    "interface-validator": {
      "command": "mcp-interface-validator",
      "args": [],
      "env": {}
    }
  }
}
```

### Configure in Trae

Add the following to `trae/config.json`:

```{
  "integrations": {
    "mcp": {
      "servers": {
        "interface-validator": {
          "command": "mcp-interface-validator",
          "transport": "stdio"
        }
      }
    }
  }
}
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
