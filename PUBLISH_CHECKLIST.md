# 📦 NPM发布检查清单

## 🔍 发布前检查

### 1. 项目基础检查
- [x] package.json 配置正确
- [x] 版本号设置为 1.0.0
- [x] 仓库URL正确
- [x] 许可证设置为 MIT
- [ ] README.md 完整
- [ ] 构建文件存在

### 2. 功能测试
- [ ] 本地构建成功
- [ ] 所有测试通过
- [ ] MCP服务器启动正常
- [ ] 工具命令可用

### 3. 文档检查
- [x] 用户文档完整
- [x] API文档存在
- [x] 配置示例正确
- [ ] 安装说明准确

### 4. 发布配置
- [x] publishConfig 设置为 public
- [x] files 字段包含必要文件
- [x] bin 字段配置正确
- [ ] .npmignore 文件存在

## 🚀 发布步骤

### 步骤1: 构建项目
```bash
npm run clean
npm run build
npm test
```

### 步骤2: 版本检查
```bash
npm version --no-git-tag-version 1.0.0
```

### 步骤3: 发布到NPM
```bash
npm login
npm publish --access public
```

### 步骤4: 验证发布
```bash
npm info mcp-interface-validator
npx mcp-interface-validator --version
```

## 🔧 常见问题解决

### 问题1: 权限错误
```bash
npm login
# 确保使用正确的NPM账户
```

### 问题2: 包名冲突
- 检查包名是否已存在
- 考虑使用作用域包名 @username/package-name

### 问题3: 构建失败
```bash
npm run clean
rm -rf node_modules
npm install
npm run build
```
