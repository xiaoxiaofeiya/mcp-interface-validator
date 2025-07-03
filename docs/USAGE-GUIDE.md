# 🚀 MCP接口验证器使用指南

## 📋 核心概念

**重要**：MCP接口验证器是**自动运行**的，不需要用户手动启动！

```
用户在AI工具中编程 → AI工具自动启动MCP服务器 → 验证器拦截代码生成 → 注入验证结果
```

## 🎯 实际使用流程

### 1. **一次性配置**
```bash
# 在项目目录中安装
cd "D:\Program Files (x86)\xiangmu\MCP"
npm run build
npm link
```

### 2. **AI工具配置**
在您使用的AI工具中添加MCP服务器配置（只需配置一次）

### 3. **正常开发**
之后就像平常一样使用AI工具编程，验证器会自动工作！

## 🛠️ 各AI工具的使用方式

### 🤖 Claude Desktop
```
1. 打开Claude Desktop（自动启动MCP服务器）
2. 正常对话编程：
   用户："帮我创建用户管理API的前端代码"
3. 验证器自动工作：
   - 读取项目OpenAPI规范
   - 验证API接口
   - 注入验证结果
4. Claude生成符合规范的代码
```

### 🎨 Cursor AI
```
1. 打开Cursor项目（自动连接MCP服务器）
2. 使用AI助手：
   - Ctrl+K 生成代码
   - 或在聊天中请求代码
3. 验证器在后台自动验证
4. 确保生成的代码符合接口规范
```

### 🔧 Cline (VSCode)
```
1. 打开VSCode项目
2. 启动Cline扩展
3. 在Cline中请求生成API代码
4. 验证器自动验证接口一致性
```

### 🌊 Windsurf
```
1. 打开Windsurf项目
2. 使用AI编程助手
3. 请求生成API相关代码
4. 验证器自动确保代码符合规范
```

## 🔄 自动触发场景

### **代码生成前验证**
```
用户请求 → AI准备生成代码 → 验证器拦截 → 检查OpenAPI规范 → 注入验证上下文 → AI生成符合规范的代码
```

**示例对话**：
```
用户: "帮我创建一个获取用户列表的API调用"

验证器自动工作：
1. 检查 api-spec.yaml 中的 /users 端点
2. 验证返回类型为 User[] 
3. 检查认证要求
4. 注入验证结果到AI上下文

AI生成的代码：
```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

async function getUsers(): Promise<User[]> {
  const response = await fetch('/api/users', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}
```

### **文件变更监控**
```
用户修改API文件 → monitor-changes自动触发 → 实时验证 → 提供即时反馈
```

## 🧪 手动调试命令

虽然正常使用时不需要手动运行，但开发调试时可以使用：

### **验证特定接口**
```bash
# 验证前端代码
node build/index.js validate --spec ./api-spec.yaml --code ./src/api.ts --type frontend

# 验证后端代码  
node build/index.js validate --spec ./api-spec.yaml --code ./src/routes.js --type backend

# 验证两端一致性
node build/index.js validate --spec ./api-spec.yaml --code ./src --type both
```

### **启动文件监控**
```bash
# 监控API文件变更
node build/index.js monitor --watch ./src/api --spec ./api-spec.yaml

# 监控整个项目
node build/index.js monitor --watch ./src --spec ./api-spec.yaml
```

### **生成API文档**
```bash
# 生成HTML文档
node build/index.js generate-docs --spec ./api-spec.yaml --output ./docs --format html

# 生成Markdown文档
node build/index.js generate-docs --spec ./api-spec.yaml --output ./docs --format markdown
```

### **检查MCP状态**
```bash
# 检查MCP服务器状态
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node build/index.js

# 测试验证工具
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "validate-interface", "arguments": {"interfaceCode": "fetch(\"/users\")", "specPath": "./api-spec.yaml"}}}' | node build/index.js
```

## 📊 验证结果示例

### **成功验证**
```
✅ 接口验证通过
- 端点 /api/users 存在于OpenAPI规范中
- 请求方法 GET 匹配
- 返回类型 User[] 符合schema定义
- 认证要求已正确实现
- 错误处理完整

建议：
- 考虑添加分页参数
- 建议实现缓存机制
```

### **发现问题**
```
❌ 接口验证失败
- 端点 /api/user 不存在（应为 /api/users）
- 缺少必需的Authorization头
- 返回类型不匹配：期望User[]，实际any

修复建议：
1. 将端点改为 /api/users
2. 添加认证头：Authorization: Bearer <token>
3. 添加类型定义：Promise<User[]>
```

## 🎯 最佳实践

### **项目结构建议**
```
project/
├── api-spec.yaml          # OpenAPI规范文件
├── src/
│   ├── api/              # API调用代码
│   ├── types/            # TypeScript类型定义
│   └── routes/           # 后端路由
└── docs/                 # 生成的API文档
```

### **OpenAPI规范示例**
```yaml
openapi: 3.0.0
info:
  title: User Management API
  version: 1.0.0
paths:
  /api/users:
    get:
      summary: Get all users
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        email:
          type: string
          format: email
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
```

## 🔧 故障排除

如果验证器没有自动工作：

1. **检查MCP配置**：确保AI工具中的MCP服务器配置正确
2. **检查OpenAPI文件**：确保项目中有有效的OpenAPI规范文件
3. **查看日志**：检查AI工具的日志输出
4. **手动测试**：使用上面的调试命令测试验证器功能

## 🎉 享受智能编程

配置完成后，您就可以享受：
- 🚫 **零接口不匹配**：AI生成的代码自动符合API规范
- ⚡ **提高效率**：减少调试和修复时间
- 📋 **规范一致性**：确保团队代码风格统一
- 🔄 **实时反馈**：即时发现和修复问题
