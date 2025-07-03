@echo off
echo ========================================
echo MCP Interface Validator 发布打包脚本
echo ========================================

:: 设置变量
set PROJECT_NAME=mcp-interface-validator
set VERSION=1.0.0
set RELEASE_DIR=%PROJECT_NAME%-v%VERSION%

echo.
echo 📦 开始打包发布版本...
echo 项目名称: %PROJECT_NAME%
echo 版本号: %VERSION%
echo 输出目录: %RELEASE_DIR%
echo.

:: 创建发布目录
if exist "%RELEASE_DIR%" (
    echo 🗑️  清理旧的发布目录...
    rmdir /s /q "%RELEASE_DIR%"
)

echo 📁 创建发布目录...
mkdir "%RELEASE_DIR%"

:: 复制核心文件
echo 📋 复制核心文件...
copy "README.md" "%RELEASE_DIR%\"
copy "INSTALL.md" "%RELEASE_DIR%\"
copy "LICENSE" "%RELEASE_DIR%\"
copy "USER_README.md" "%RELEASE_DIR%\"
copy "USER_README_EN.md" "%RELEASE_DIR%\"
copy "TECHNICAL.md" "%RELEASE_DIR%\"
copy "API_REFERENCE.md" "%RELEASE_DIR%\"
copy "BEST_PRACTICES.md" "%RELEASE_DIR%\"
copy "package.json" "%RELEASE_DIR%\"
copy "package-lock.json" "%RELEASE_DIR%\"
copy "tsconfig.json" "%RELEASE_DIR%\"
copy "jest.config.js" "%RELEASE_DIR%\"
copy ".eslintrc.json" "%RELEASE_DIR%\"
copy ".gitignore" "%RELEASE_DIR%\"
copy ".env.example" "%RELEASE_DIR%\"
copy "install-local.bat" "%RELEASE_DIR%\"

:: 复制目录
echo 📂 复制源代码目录...
xcopy "src" "%RELEASE_DIR%\src" /E /I /Q

echo 📂 复制配置目录...
xcopy "config" "%RELEASE_DIR%\config" /E /I /Q

echo 📂 复制文档目录...
xcopy "docs" "%RELEASE_DIR%\docs" /E /I /Q

echo 📂 复制脚本目录...
xcopy "scripts" "%RELEASE_DIR%\scripts" /E /I /Q

echo 📂 复制测试目录...
xcopy "tests" "%RELEASE_DIR%\tests" /E /I /Q

:: 复制数据目录（排除测试数据库）
echo 📂 复制数据目录...
mkdir "%RELEASE_DIR%\data"
mkdir "%RELEASE_DIR%\data\plugins"
xcopy "data\plugins" "%RELEASE_DIR%\data\plugins" /E /I /Q

:: 创建空的数据库文件
echo 🗄️  创建空数据库文件...
echo. > "%RELEASE_DIR%\data\validation-history.db"

:: 创建发布信息文件
echo 📄 创建发布信息...
(
echo # MCP Interface Validator v%VERSION%
echo.
echo 发布时间: %date% %time%
echo 发布版本: %VERSION%
echo.
echo ## 包含内容
echo.
echo - 完整源代码
echo - 配置文件和模板
echo - 详细文档（中英文）
echo - 测试套件
echo - 安装脚本
echo.
echo ## 快速开始
echo.
echo 1. 安装依赖: `npm install`
echo 2. 构建项目: `npm run build`
echo 3. 全局安装: `npm install -g .`
echo 4. 配置AI工具（参考 INSTALL.md）
echo 5. 开始使用: `.use interface your requirements`
echo.
echo ## 文档
echo.
echo - README.md - 项目简介
echo - INSTALL.md - 安装指南
echo - USER_README.md - 中文用户指南
echo - USER_README_EN.md - 英文用户指南
echo - TECHNICAL.md - 技术文档
echo - API_REFERENCE.md - API参考
echo - BEST_PRACTICES.md - 最佳实践
echo.
echo 更多信息请访问: https://github.com/your-repo/mcp-interface-validator
) > "%RELEASE_DIR%\RELEASE_NOTES.md"

:: 创建快速安装脚本
echo 🚀 创建快速安装脚本...
(
echo @echo off
echo echo ========================================
echo echo MCP Interface Validator 快速安装
echo echo ========================================
echo echo.
echo echo 📦 安装依赖...
echo npm install
echo if errorlevel 1 ^(
echo     echo ❌ 依赖安装失败！
echo     pause
echo     exit /b 1
echo ^)
echo.
echo echo 🔨 构建项目...
echo npm run build
echo if errorlevel 1 ^(
echo     echo ❌ 项目构建失败！
echo     pause
echo     exit /b 1
echo ^)
echo.
echo echo 🌐 全局安装...
echo npm install -g .
echo if errorlevel 1 ^(
echo     echo ❌ 全局安装失败！
echo     pause
echo     exit /b 1
echo ^)
echo.
echo echo ✅ 安装完成！
echo echo.
echo echo 📋 下一步：
echo echo 1. 配置AI工具（参考 INSTALL.md）
echo echo 2. 启动服务: mcp-interface-validator --start
echo echo 3. 开始使用: .use interface your requirements
echo echo.
echo pause
) > "%RELEASE_DIR%\quick-install.bat"

:: 创建Linux/macOS安装脚本
echo 🐧 创建Linux/macOS安装脚本...
(
echo #!/bin/bash
echo echo "========================================"
echo echo "MCP Interface Validator 快速安装"
echo echo "========================================"
echo echo
echo echo "📦 安装依赖..."
echo npm install
echo if [ $? -ne 0 ]; then
echo     echo "❌ 依赖安装失败！"
echo     exit 1
echo fi
echo echo
echo echo "🔨 构建项目..."
echo npm run build
echo if [ $? -ne 0 ]; then
echo     echo "❌ 项目构建失败！"
echo     exit 1
echo fi
echo echo
echo echo "🌐 全局安装..."
echo npm install -g .
echo if [ $? -ne 0 ]; then
echo     echo "❌ 全局安装失败！"
echo     exit 1
echo fi
echo echo
echo echo "✅ 安装完成！"
echo echo
echo echo "📋 下一步："
echo echo "1. 配置AI工具（参考 INSTALL.md）"
echo echo "2. 启动服务: mcp-interface-validator --start"
echo echo "3. 开始使用: .use interface your requirements"
echo echo
) > "%RELEASE_DIR%\quick-install.sh"

:: 设置执行权限（如果在WSL或Git Bash中）
if exist "%RELEASE_DIR%\quick-install.sh" (
    echo 🔧 设置脚本执行权限...
    attrib +R "%RELEASE_DIR%\quick-install.sh"
)

:: 创建压缩包（如果有7zip）
where 7z >nul 2>nul
if %errorlevel% == 0 (
    echo 📦 创建压缩包...
    7z a -tzip "%PROJECT_NAME%-v%VERSION%.zip" "%RELEASE_DIR%\*"
    echo ✅ 压缩包已创建: %PROJECT_NAME%-v%VERSION%.zip
) else (
    echo ⚠️  未找到7zip，跳过压缩包创建
    echo 💡 您可以手动压缩 %RELEASE_DIR% 目录
)

echo.
echo ========================================
echo ✅ 发布包创建完成！
echo ========================================
echo.
echo 📁 发布目录: %RELEASE_DIR%
echo 📦 压缩包: %PROJECT_NAME%-v%VERSION%.zip
echo.
echo 📋 包含内容:
echo   - 完整源代码和配置
echo   - 中英文文档
echo   - 安装脚本
echo   - 测试套件
echo.
echo 🚀 可以开始分发了！
echo.
pause
