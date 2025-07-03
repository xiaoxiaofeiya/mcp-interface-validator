# 🛠️ MCP接口验证器故障排除指南

## ❌ 常见错误及解决方案

### 错误1：命令未找到
```
'mcp-interface-validator' 不是内部或外部命令，也不是可运行的程序或批处理文件
```

**原因**：MCP接口验证器还没有全局安装到系统中。

**解决方案**：

#### 方案A：本地链接安装（推荐）
```bash
# 1. 在项目根目录运行
npm run build

# 2. 创建全局链接
npm link

# 3. 验证安装
mcp-interface-validator --version
```

#### 方案B：使用绝对路径
更新AI工具配置，使用绝对路径：

**Claude Desktop配置**：
```json
{
  "mcpServers": {
    "mcp-interface-validator": {
      "command": "node",
      "args": ["D:\\Program Files (x86)\\xiangmu\\MCP\\build\\index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Cursor AI配置**：
```json
{
  "mcp": {
    "servers": {
      "interface-validator": {
        "command": "node",
        "args": ["D:\\Program Files (x86)\\xiangmu\\MCP\\build\\index.js", "--stdio"],
        "env": {
          "NODE_ENV": "production"
        }
      }
    }
  }
}
```

#### 方案C：使用相对路径
如果AI工具在项目目录中运行：
```json
{
  "mcpServers": {
    "mcp-interface-validator": {
      "command": "node",
      "args": ["./build/index.js"]
    }
  }
}
```

### 错误2：权限问题
```
Error: EACCES: permission denied
```

**解决方案**：
```bash
# Windows (以管理员身份运行PowerShell)
npm link

# 或者使用yarn
yarn link
```

### 错误3：Node.js版本不兼容
```
Error: Unsupported Node.js version
```

**解决方案**：
```bash
# 检查Node.js版本
node --version

# 需要Node.js >= 18.0.0
# 如果版本过低，请升级Node.js
```

### 错误4：依赖缺失
```
Error: Cannot find module '@modelcontextprotocol/sdk'
```

**解决方案**：
```bash
# 安装依赖
npm install

# 重新构建
npm run build

# 重新链接
npm link
```

## 🧪 验证安装

### 测试命令可用性
```bash
# 检查版本
mcp-interface-validator --version

# 测试帮助
mcp-interface-validator --help
```

### 测试MCP通信
```bash
# 测试工具列表
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | mcp-interface-validator

# 测试初始化
echo '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {"tools": {}}, "clientInfo": {"name": "test", "version": "1.0.0"}}}' | mcp-interface-validator
```

### 测试验证功能
```bash
# 创建测试API规范
echo 'openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      responses:
        "200":
          description: Success' > test-spec.yaml

# 测试验证
mcp-interface-validator validate --spec test-spec.yaml --code "fetch('/users')"
```

## 🔧 配置文件修复

### 自动生成正确配置
运行以下脚本生成适合您系统的配置：

```bash
# Windows
node -e "
const path = require('path');
const projectPath = process.cwd();
const config = {
  mcpServers: {
    'mcp-interface-validator': {
      command: 'node',
      args: [path.join(projectPath, 'build', 'index.js')]
    }
  }
};
console.log(JSON.stringify(config, null, 2));
"
```

### 环境变量配置
```bash
# 设置项目路径环境变量
set MCP_VALIDATOR_PATH=D:\Program Files (x86)\xiangmu\MCP

# 在配置中使用
{
  "command": "node",
  "args": ["%MCP_VALIDATOR_PATH%\\build\\index.js"]
}
```

## 📋 快速修复脚本

### Windows批处理脚本
创建 `fix-mcp.bat`：
```batch
@echo off
echo 🔧 修复MCP接口验证器...

cd /d "D:\Program Files (x86)\xiangmu\MCP"

echo 📦 安装依赖...
call npm install

echo 🏗️ 构建项目...
call npm run build

echo 🔗 创建全局链接...
call npm link

echo ✅ 修复完成！

echo 🧪 测试安装...
mcp-interface-validator --version

pause
```

### PowerShell脚本
创建 `fix-mcp.ps1`：
```powershell
Write-Host "🔧 修复MCP接口验证器..." -ForegroundColor Green

Set-Location "D:\Program Files (x86)\xiangmu\MCP"

Write-Host "📦 安装依赖..." -ForegroundColor Yellow
npm install

Write-Host "🏗️ 构建项目..." -ForegroundColor Yellow
npm run build

Write-Host "🔗 创建全局链接..." -ForegroundColor Yellow
npm link

Write-Host "✅ 修复完成！" -ForegroundColor Green

Write-Host "🧪 测试安装..." -ForegroundColor Cyan
mcp-interface-validator --version
```

## 🆘 如果问题仍然存在

1. **检查PATH环境变量**：确保npm全局bin目录在PATH中
2. **重启终端**：npm link后可能需要重启终端
3. **检查npm配置**：`npm config get prefix` 查看全局安装路径
4. **使用绝对路径**：直接使用完整路径运行

## � MCP接口验证器的启动和使用

### 📋 重要概念
**MCP接口验证器不需要用户手动启动**，而是由AI工具自动管理：

```
用户在AI工具中编程 → AI工具自动启动MCP服务器 → 验证器拦截代码生成 → 注入验证结果
```

### 🎯 实际使用场景

#### 场景1：Claude Desktop开发
```
1. 打开Claude Desktop（自动启动MCP服务器）
2. 用户："帮我创建用户管理API的前端代码"
3. 验证器自动：
   - 读取项目的OpenAPI规范
   - 验证API端点和参数
   - 注入验证结果到AI上下文
4. Claude生成符合规范的代码
```

#### 场景2：Cursor AI开发
```
1. 打开Cursor项目（自动连接MCP服务器）
2. 用户使用AI助手生成API调用代码
3. 验证器在后台自动工作
4. 确保生成的代码符合接口规范
```

#### 场景3：实时文件监控
```
1. 用户修改API相关文件
2. monitor-changes工具自动触发
3. 实时验证接口一致性
4. 提供即时反馈和修复建议
```

### 🔧 手动调试命令

开发调试时可以手动运行：

```bash
# 验证特定API接口
node build/index.js validate --spec ./api-spec.yaml --code ./src/api.ts

# 启动文件监控
node build/index.js monitor --watch ./src --spec ./api-spec.yaml

# 生成API文档
node build/index.js generate-docs --spec ./api-spec.yaml --output ./docs

# 检查MCP服务器状态
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node build/index.js
```

### 📊 MCP工具自动调用示例

当AI工具需要验证时，会自动发送JSON-RPC请求：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "validate-interface",
    "arguments": {
      "interfaceCode": "fetch('/api/users').then(r => r.json())",
      "specPath": "./api-spec.yaml",
      "validationType": "frontend"
    }
  }
}
```

验证器返回结果：
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "✅ 接口验证通过\n- 端点 /api/users 存在\n- 返回类型匹配User[]规范\n- 建议添加错误处理"
      }
    ]
  }
}
```

## �📞 获取帮助

如果以上方案都无法解决问题，请：
1. 运行 `npm doctor` 检查npm环境
2. 提供完整的错误信息
3. 提供系统信息（Windows版本、Node.js版本、npm版本）
