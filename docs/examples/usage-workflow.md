# MCP接口验证器使用工作流程

## 🎯 核心功能：AI代码生成前的接口验证注入

我们的MCP接口验证组件可以在用户下命令后、AI生成代码之前自动注入验证功能。

## 🚀 新功能：智能约束系统

智能约束系统是我们最新推出的功能，可以根据您的指令自动应用开发约束，确保代码质量和最佳实践的一致性。

### 🎮 快速开始使用智能约束

1. **激活约束**：在AI工具中输入 `.use interface` 或 `.使用接口`
2. **自动分析**：系统分析您的指令并应用最合适的模板
3. **实时验证**：获得接口兼容性和代码质量的即时反馈

### 📝 支持的指令

- `.use interface` / `.使用接口` - 激活智能约束
- `.apply constraints` / `.应用约束` - 应用特定约束模板
- `.list templates` / `.列出模板` - 显示可用的约束模板
- `.get status` / `.获取状态` - 检查当前约束状态

### 🎯 智能约束使用示例

#### 示例1：开发API接口
```
用户输入：.use interface
用户指令：开发一个用户注册API

系统响应：
✅ 已激活API约束模板
📋 自动应用OpenAPI 3.0规范
🛡️ 包含安全性验证要求
📝 确保RESTful设计原则
```

#### 示例2：创建前端组件
```
用户输入：.使用接口
用户指令：创建一个数据表格组件

系统响应：
✅ 已激活前端约束模板
⚛️ 应用React/Vue最佳实践
🎨 确保组件化设计原则
♿ 包含可访问性要求
```

### 🎨 可用的约束模板

#### 1. Default Template (默认模板)
- **适用场景**：通用开发任务
- **约束内容**：基础代码质量要求、命名规范、注释要求
- **自动激活**：当系统无法确定具体场景时

#### 2. Strict Template (严格模板)
- **适用场景**：生产环境、关键业务逻辑
- **约束内容**：严格的类型检查、完整的错误处理、详细的文档
- **关键词触发**：生产、关键、重要、严格

#### 3. API Template (API模板)
- **适用场景**：后端API开发
- **约束内容**：OpenAPI 3.0规范、RESTful设计、安全性验证
- **关键词触发**：API、接口、服务、后端

#### 4. Frontend Template (前端模板)
- **适用场景**：前端组件和页面开发
- **约束内容**：组件化设计、响应式布局、可访问性
- **关键词触发**：组件、页面、前端、UI

#### 5. Testing Template (测试模板)
- **适用场景**：测试代码编写
- **约束内容**：高覆盖率、边界测试、性能测试
- **关键词触发**：测试、单元测试、集成测试

### 🔧 配置文件管理

您可以通过配置文件自定义约束行为：

```yaml
# config/constraint-config.yaml
intelligentConstraints:
  enabled: true
  autoActivation: true
  defaultTemplate: "default"

templates:
  custom:
    name: "自定义模板"
    description: "针对特定项目的约束"
    constraints:
      - "使用TypeScript严格模式"
      - "遵循公司编码规范"
      - "包含完整的JSDoc注释"
```

## 🔄 完整工作流程

### 1. 用户发起代码生成请求

```
用户: "请帮我创建一个用户管理API的前端调用代码"
```

### 2. MCP验证器自动拦截

系统在AI开始生成代码前自动执行：

```javascript
// MCP验证器自动调用
const validationResult = await mcpValidator.validateInterface({
  specPath: "./api-spec.yaml",
  interfaceCode: "// 待生成的代码",
  validationType: "frontend"
});
```

### 3. 接口规范检查

验证器自动：
- 📋 解析OpenAPI规范文件
- 🔍 识别相关的API端点
- ✅ 验证参数和响应类型
- 🛡️ 检查安全性要求

### 4. 上下文注入

验证结果注入到AI的上下文中：

```json
{
  "context": {
    "apiSpec": {
      "endpoints": ["/api/users", "/api/users/{id}"],
      "methods": ["GET", "POST", "PUT", "DELETE"],
      "schemas": { "User": { "id": "number", "name": "string" } }
    },
    "validationRules": {
      "requireAuth": true,
      "responseFormat": "json",
      "errorHandling": "required"
    }
  }
}
```

### 5. AI生成符合规范的代码

AI基于注入的上下文生成代码：

```typescript
// 自动生成的符合规范的代码
import { ApiClient } from './api-client';

interface User {
  id: number;
  name: string;
  email: string;
}

class UserService {
  private apiClient = new ApiClient();

  async getUsers(): Promise<User[]> {
    return this.apiClient.get<User[]>('/api/users');
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    return this.apiClient.post<User>('/api/users', user);
  }
}
```

### 6. 实时验证反馈

如果检测到不匹配：

```json
{
  "validation": {
    "isValid": false,
    "issues": [
      {
        "type": "endpoint_mismatch",
        "message": "端点 '/api/user' 不存在，应该是 '/api/users'",
        "suggestion": "使用正确的端点路径"
      }
    ]
  }
}
```

## 🛠️ 支持的AI工具集成

### Claude Desktop (支持智能约束)
```json
{
  "mcpServers": {
    "mcp-interface-validator": {
      "command": "npx",
      "args": ["mcp-interface-validator"],
      "env": {
        "NODE_ENV": "production",
        "CONSTRAINT_CONFIG_PATH": "./config/constraint-config.yaml"
      }
    }
  }
}
```

### Cursor AI (支持智能约束)
```json
{
  "mcpServers": {
    "mcp-interface-validator": {
      "command": "npx",
      "args": ["mcp-interface-validator"],
      "env": {
        "NODE_ENV": "production",
        "CONSTRAINT_CONFIG_PATH": "./config/constraint-config.yaml"
      }
    }
  },
  "intelligentConstraints": {
    "enabled": true,
    "autoActivation": true,
    "keyboardShortcuts": {
      "activateConstraints": "Ctrl+Shift+I"
    }
  }
}
```

### Windsurf (支持智能约束)
```json
{
  "mcpServers": {
    "mcp-interface-validator": {
      "command": "npx",
      "args": ["mcp-interface-validator"],
      "env": {
        "NODE_ENV": "production",
        "CONSTRAINT_CONFIG_PATH": "./config/constraint-config.yaml"
      }
    }
  },
  "intelligentConstraints": {
    "enabled": true,
    "realTimeValidation": true
  }
}
```

### Trae (支持智能约束)
```json
{
  "mcpServers": {
    "mcp-interface-validator": {
      "command": "npx",
      "args": ["mcp-interface-validator"],
      "env": {
        "NODE_ENV": "production",
        "CONSTRAINT_CONFIG_PATH": "./config/constraint-config.yaml"
      }
    }
  },
  "intelligentConstraints": {
    "enabled": true,
    "workflowIntegration": true
  }
}
```

### Augment (支持智能约束)
```json
{
  "mcpServers": {
    "mcp-interface-validator": {
      "command": "npx",
      "args": ["mcp-interface-validator"],
      "env": {
        "NODE_ENV": "production",
        "CONSTRAINT_CONFIG_PATH": "./config/constraint-config.yaml"
      }
    }
  },
  "intelligentConstraints": {
    "enabled": true,
    "contextAwareValidation": true
  }
}
```

## 🎯 实际使用场景

### 场景1：前端API调用生成

**用户命令**：
```
"创建一个React组件来显示用户列表"
```

**系统自动执行**：
1. 🔍 检测到需要API调用
2. 📋 读取OpenAPI规范
3. ✅ 验证用户相关端点
4. 💡 注入正确的API接口信息
5. 🚀 生成符合规范的React代码

### 场景2：后端路由实现

**用户命令**：
```
"实现用户CRUD操作的Express路由"
```

**系统自动执行**：
1. 📖 解析OpenAPI规范中的用户端点
2. 🔍 验证请求/响应模式
3. 🛡️ 检查安全性要求
4. 💡 注入验证中间件需求
5. 🚀 生成完整的Express路由代码

### 场景3：接口不匹配检测

**用户命令**：
```
"修改用户更新API的前端调用"
```

**系统检测到问题**：
```json
{
  "issues": [
    {
      "type": "parameter_mismatch",
      "message": "缺少必需参数 'email'",
      "location": "PUT /api/users/{id}",
      "suggestion": "添加email字段到请求体"
    }
  ]
}
```

## 🎉 核心价值

1. **🚫 防止接口不匹配**：在代码生成前就发现问题
2. **⚡ 提高开发效率**：减少调试和修复时间
3. **📋 确保规范一致性**：所有生成的代码都符合OpenAPI规范
4. **🔄 实时反馈**：即时提供修复建议
5. **🛠️ 无缝集成**：支持主流AI编程工具

## 🚀 开始使用

1. **安装**：`npm install -g mcp-interface-validator`
2. **配置**：在AI工具中添加MCP服务器配置
3. **使用**：正常使用AI工具，系统自动提供接口验证
