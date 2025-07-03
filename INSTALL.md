# 🚀 MCP Interface Validator 安装指南

## 📋 系统要求

### 基础要求
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0 或 **yarn**: >= 1.22.0
- **操作系统**: 
  - Windows 10+ (x64)
  - macOS 10.15+ (Intel/Apple Silicon)
  - Ubuntu 18.04+ / Debian 10+ / CentOS 8+

### 硬件要求
- **内存**: 最少 512MB 可用内存
- **磁盘**: 最少 100MB 可用空间
- **网络**: 安装时需要网络连接

## 🔧 安装方式

### 方式一：全局安装（推荐）

```bash
# 使用 npm
npm install -g mcp-interface-validator

# 使用 yarn
yarn global add mcp-interface-validator

# 验证安装
mcp-interface-validator --version
```

### 方式二：本地项目安装

```bash
# 进入项目目录
cd your-project

# 使用 npm
npm install mcp-interface-validator

# 使用 yarn
yarn add mcp-interface-validator

# 验证安装
npx mcp-interface-validator --version
```

### 方式三：从源码安装

```bash
# 克隆项目
git clone https://github.com/your-repo/mcp-interface-validator.git
cd mcp-interface-validator

# 安装依赖
npm install

# 构建项目
npm run build

# 本地安装
npm install -g .

# 验证安装
mcp-interface-validator --version
```

## ⚙️ AI工具配置

### Claude Desktop

1. 打开配置文件：
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
      "env": {}
    }
  }
}
```

3. 重启Claude Desktop

### Cursor

1. 在项目根目录创建 `.cursor/mcp.json`：

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

2. 重启Cursor

### Windsurf

1. 在项目根目录创建 `.windsurf/mcp.json`：

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

2. 重启Windsurf

### Trae

1. 在项目根目录创建 `.trae/mcp.json`：

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

2. 重启Trae

### Augment

1. 在项目根目录创建 `.augment/mcp.json`：

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

2. 重启Augment

## 🔍 安装验证

### 基础验证

```bash
# 检查版本
mcp-interface-validator --version

# 检查帮助
mcp-interface-validator --help

# 检查系统状态
mcp-interface-validator --system-check
```

### 功能验证

```bash
# 启动MCP服务器
mcp-interface-validator --start

# 在另一个终端测试连接
curl http://localhost:3000/health

# 停止服务器
mcp-interface-validator --stop
```

### AI工具集成验证

1. 在AI工具中输入：`.use interface test`
2. 如果看到约束提示，说明集成成功
3. 如果没有响应，检查MCP服务器配置

## 🛠️ 故障排除

### 常见问题

#### 1. Node.js版本过低
```bash
# 检查版本
node --version

# 升级Node.js（推荐使用nvm）
nvm install 18
nvm use 18
```

#### 2. 权限问题（Linux/macOS）
```bash
# 使用sudo安装
sudo npm install -g mcp-interface-validator

# 或配置npm全局目录
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

#### 3. 网络问题
```bash
# 使用国内镜像
npm install -g mcp-interface-validator --registry=https://registry.npmmirror.com

# 或配置代理
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
```

#### 4. MCP服务器无法启动
```bash
# 检查端口占用
netstat -an | grep 3000

# 使用不同端口
mcp-interface-validator --port 3001

# 查看详细日志
mcp-interface-validator --debug --log-level verbose
```

### 获取帮助

如果遇到其他问题：

1. **查看日志**: `mcp-interface-validator --debug`
2. **检查配置**: `mcp-interface-validator --validate-config`
3. **重置配置**: `mcp-interface-validator --reset-config`
4. **联系支持**: 1334089073@qq.com

## 🎉 安装完成

安装成功后，您可以：

1. **阅读用户指南**: [USER_README.md](./USER_README.md)
2. **查看技术文档**: [TECHNICAL.md](./TECHNICAL.md)
3. **学习最佳实践**: [BEST_PRACTICES.md](./BEST_PRACTICES.md)
4. **开始使用**: 在AI工具中输入 `.use interface your requirements`

**祝您使用愉快！** 🚀
