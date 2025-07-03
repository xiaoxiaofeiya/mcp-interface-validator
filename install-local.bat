@echo off
echo 🚀 安装MCP接口验证器到本地...

echo 📦 构建项目...
call npm run build

echo 🔗 创建全局链接...
call npm link

echo ✅ 安装完成！现在可以使用 mcp-interface-validator 命令了

echo 🧪 测试安装...
mcp-interface-validator --version

pause
