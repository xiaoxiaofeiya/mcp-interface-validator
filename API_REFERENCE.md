# MCP接口验证组件 - API参考手册

## 📋 目录

- [MCP工具API](#mcp工具api)
- [核心验证API](#核心验证api)
- [智能约束API](#智能约束api)
- [历史管理API](#历史管理api)
- [配置管理API](#配置管理api)
- [错误代码参考](#错误代码参考)

## 🛠️ MCP工具API

### validate-interface

验证API接口的一致性和合规性。

**语法：**
```bash
validate-interface [options]
```

**参数：**
| 参数 | 类型 | 必需 | 描述 | 默认值 |
|------|------|------|------|--------|
| `--endpoint` | string | 否 | 要验证的API端点路径 | 全部端点 |
| `--method` | string | 否 | HTTP方法 (GET/POST/PUT/DELETE) | 全部方法 |
| `--project-path` | string | 否 | 项目根目录路径 | 当前目录 |
| `--spec-file` | string | 否 | OpenAPI规范文件路径 | 自动检测 |
| `--recursive` | boolean | 否 | 递归扫描子目录 | false |
| `--watch` | boolean | 否 | 监听文件变化 | false |
| `--auto-fix` | boolean | 否 | 自动修复简单问题 | false |
| `--format` | string | 否 | 输出格式 (json/table/html) | table |
| `--output` | string | 否 | 输出文件路径 | 控制台 |

**返回值：**
```typescript
interface ValidationResponse {
  success: boolean;
  results: ValidationResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  errors?: string[];
}
```

**示例：**
```bash
# 验证特定端点
validate-interface --endpoint "/api/users" --method "POST"

# 验证整个项目
validate-interface --project-path "./src" --recursive

# 监听模式
validate-interface --watch --auto-fix
```

### load-openapi-spec

加载和解析OpenAPI规范文件。

**语法：**
```bash
load-openapi-spec --file <spec-file> [options]
```

**参数：**
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `--file` | string | 是 | OpenAPI规范文件路径 |
| `--validate` | boolean | 否 | 验证规范文件格式 |
| `--cache` | boolean | 否 | 缓存解析结果 |
| `--verbose` | boolean | 否 | 详细输出 |

**返回值：**
```typescript
interface LoadSpecResponse {
  success: boolean;
  spec: OpenAPISpec;
  version: string;
  endpoints: EndpointInfo[];
  schemas: SchemaInfo[];
  errors?: string[];
}
```

### analyze-code-structure

分析代码结构并提取API定义。

**语法：**
```bash
analyze-code-structure --path <code-path> [options]
```

**参数：**
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `--path` | string | 是 | 代码文件或目录路径 |
| `--language` | string | 否 | 编程语言 (auto/typescript/javascript/python) |
| `--include-types` | boolean | 否 | 包含类型定义 |
| `--extract-docs` | boolean | 否 | 提取文档注释 |

**返回值：**
```typescript
interface CodeAnalysisResponse {
  success: boolean;
  structure: {
    files: FileInfo[];
    classes: ClassInfo[];
    functions: FunctionInfo[];
    interfaces: InterfaceInfo[];
    types: TypeInfo[];
  };
  apiDefinitions: APIDefinition[];
  dependencies: DependencyInfo[];
}
```

## 🧠 智能约束API

### activate-interface-constraints

激活智能接口约束系统。

**语法：**
```bash
activate-interface-constraints [options]
```

**参数：**
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `--project-path` | string | 否 | 项目路径 |
| `--template` | string | 否 | 约束模板 (strict/relaxed/custom) |
| `--config-file` | string | 否 | 自定义配置文件 |
| `--force` | boolean | 否 | 强制重新激活 |

**返回值：**
```typescript
interface ActivateConstraintsResponse {
  success: boolean;
  sessionId: string;
  template: string;
  constraints: ConstraintInfo[];
  expiresAt: Date;
}
```

### apply-interface-constraints

将约束应用到代码或指令。

**语法：**
```bash
apply-interface-constraints [options]
```

**参数：**
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `--code` | string | 否 | 要约束的代码 |
| `--instruction` | string | 否 | 要增强的指令 |
| `--file` | string | 否 | 代码文件路径 |
| `--constraints-file` | string | 否 | 约束配置文件 |

**返回值：**
```typescript
interface ApplyConstraintsResponse {
  success: boolean;
  enhancedInstruction?: string;
  constrainedCode?: string;
  appliedConstraints: string[];
  suggestions: string[];
}
```

### get-constraint-status

获取当前约束系统状态。

**语法：**
```bash
get-constraint-status
```

**返回值：**
```typescript
interface ConstraintStatusResponse {
  active: boolean;
  sessionId?: string;
  template: string;
  projectPath?: string;
  constraints: {
    name: string;
    enabled: boolean;
    config: any;
  }[];
  statistics: {
    applicationsCount: number;
    lastApplied: Date;
  };
}
```

## 📊 历史管理API

### get-validation-history

获取验证历史记录。

**语法：**
```bash
get-validation-history [options]
```

**参数：**
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `--limit` | number | 否 | 返回记录数量限制 |
| `--offset` | number | 否 | 分页偏移量 |
| `--project-path` | string | 否 | 过滤项目路径 |
| `--status` | string | 否 | 过滤状态 (success/warning/error) |
| `--since` | string | 否 | 起始时间 (ISO格式) |
| `--until` | string | 否 | 结束时间 (ISO格式) |

**返回值：**
```typescript
interface ValidationHistoryResponse {
  success: boolean;
  records: ValidationRecord[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  statistics: {
    totalValidations: number;
    successRate: number;
    averageResponseTime: number;
  };
}
```

### export-validation-data

导出验证数据。

**语法：**
```bash
export-validation-data --format <format> [options]
```

**参数：**
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `--format` | string | 是 | 导出格式 (json/csv/pdf/html) |
| `--output` | string | 否 | 输出文件路径 |
| `--filter` | string | 否 | 过滤条件 (JSON格式) |
| `--include-details` | boolean | 否 | 包含详细信息 |

**返回值：**
```typescript
interface ExportDataResponse {
  success: boolean;
  filePath: string;
  format: string;
  recordCount: number;
  fileSize: number;
}
```

## ⚙️ 配置管理API

### update-constraint-config

更新约束配置。

**语法：**
```bash
update-constraint-config [options]
```

**参数：**
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `--template` | string | 否 | 预定义模板名称 |
| `--config` | string | 否 | 配置JSON字符串 |
| `--config-file` | string | 否 | 配置文件路径 |
| `--merge` | boolean | 否 | 合并现有配置 |

**返回值：**
```typescript
interface UpdateConfigResponse {
  success: boolean;
  config: ConstraintConfig;
  changes: ConfigChange[];
  validationErrors?: string[];
}
```

### get-project-config

获取项目配置信息。

**语法：**
```bash
get-project-config [--project-path <path>]
```

**返回值：**
```typescript
interface ProjectConfigResponse {
  success: boolean;
  config: {
    projectPath: string;
    openApiSpec?: string;
    constraints: ConstraintConfig;
    validation: ValidationConfig;
    cache: CacheConfig;
    plugins: PluginConfig[];
  };
  autoDetected: {
    packageManager: string;
    framework: string;
    language: string;
  };
}
```

## 📈 报告生成API

### generate-interface-report

生成接口验证报告。

**语法：**
```bash
generate-interface-report [options]
```

**参数：**
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `--format` | string | 否 | 报告格式 (html/pdf/json) |
| `--output` | string | 否 | 输出目录 |
| `--template` | string | 否 | 报告模板 |
| `--include-charts` | boolean | 否 | 包含图表 |
| `--include-suggestions` | boolean | 否 | 包含改进建议 |

**返回值：**
```typescript
interface GenerateReportResponse {
  success: boolean;
  reportPath: string;
  format: string;
  sections: ReportSection[];
  generatedAt: Date;
}
```

## 🔧 实用工具API

### cleanup-validation-history

清理验证历史数据。

**语法：**
```bash
cleanup-validation-history [options]
```

**参数：**
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `--days` | number | 否 | 保留天数 |
| `--keep-errors` | boolean | 否 | 保留错误记录 |
| `--dry-run` | boolean | 否 | 预览清理结果 |

### validate-openapi-spec

验证OpenAPI规范文件格式。

**语法：**
```bash
validate-openapi-spec --file <spec-file>
```

**返回值：**
```typescript
interface ValidateSpecResponse {
  valid: boolean;
  version: string;
  errors: SpecError[];
  warnings: SpecWarning[];
  statistics: {
    endpoints: number;
    schemas: number;
    parameters: number;
  };
}
```

## ❌ 错误代码参考

### 通用错误代码

| 代码 | 名称 | 描述 | 解决方案 |
|------|------|------|----------|
| `E001` | INVALID_PARAMETERS | 参数无效 | 检查参数格式和类型 |
| `E002` | FILE_NOT_FOUND | 文件未找到 | 确认文件路径正确 |
| `E003` | PERMISSION_DENIED | 权限不足 | 检查文件权限 |
| `E004` | NETWORK_ERROR | 网络错误 | 检查网络连接 |
| `E005` | TIMEOUT | 操作超时 | 增加超时时间或优化操作 |

### 验证错误代码

| 代码 | 名称 | 描述 |
|------|------|------|
| `V001` | SPEC_PARSE_ERROR | OpenAPI规范解析失败 |
| `V002` | ENDPOINT_MISMATCH | 端点不匹配 |
| `V003` | PARAMETER_TYPE_ERROR | 参数类型错误 |
| `V004` | RESPONSE_SCHEMA_ERROR | 响应模式错误 |
| `V005` | SECURITY_VIOLATION | 安全规则违反 |

### 约束错误代码

| 代码 | 名称 | 描述 |
|------|------|------|
| `C001` | CONSTRAINT_NOT_ACTIVE | 约束系统未激活 |
| `C002` | TEMPLATE_NOT_FOUND | 约束模板未找到 |
| `C003` | CONFIG_VALIDATION_ERROR | 配置验证失败 |
| `C004` | CONSTRAINT_APPLICATION_ERROR | 约束应用失败 |

## 📝 响应格式

### 标准响应格式

所有API响应都遵循以下格式：

```typescript
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
}
```

### 分页响应格式

```typescript
interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

## 🔧 高级API功能

### 批量操作API

#### batch-validate-interfaces

批量验证多个接口。

**语法：**
```bash
batch-validate-interfaces --config <batch-config> [options]
```

**批量配置格式：**
```json
{
  "tasks": [
    {
      "id": "task1",
      "endpoint": "/api/users",
      "method": "POST",
      "priority": "high"
    },
    {
      "id": "task2",
      "endpoint": "/api/orders",
      "method": "GET",
      "priority": "normal"
    }
  ],
  "options": {
    "parallel": true,
    "maxConcurrency": 4,
    "failFast": false
  }
}
```

**返回值：**
```typescript
interface BatchValidationResponse {
  success: boolean;
  results: {
    [taskId: string]: ValidationResult;
  };
  summary: {
    total: number;
    completed: number;
    failed: number;
    skipped: number;
  };
  timing: {
    startTime: Date;
    endTime: Date;
    duration: number;
  };
}
```

### 实时监控API

#### start-validation-monitor

启动实时验证监控。

**语法：**
```bash
start-validation-monitor [options]
```

**参数：**
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `--project-path` | string | 否 | 监控的项目路径 |
| `--watch-patterns` | string | 否 | 监控文件模式 |
| `--debounce` | number | 否 | 防抖延迟(ms) |
| `--webhook-url` | string | 否 | 通知webhook地址 |

**返回值：**
```typescript
interface MonitorResponse {
  success: boolean;
  monitorId: string;
  watchedFiles: string[];
  config: MonitorConfig;
}
```

#### stop-validation-monitor

停止验证监控。

**语法：**
```bash
stop-validation-monitor --monitor-id <id>
```

### 插件管理API

#### list-plugins

列出所有可用插件。

**语法：**
```bash
list-plugins [options]
```

**参数：**
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `--status` | string | 否 | 过滤状态 (active/inactive/error) |
| `--category` | string | 否 | 过滤类别 |

**返回值：**
```typescript
interface PluginListResponse {
  success: boolean;
  plugins: {
    name: string;
    version: string;
    status: 'active' | 'inactive' | 'error';
    description: string;
    author: string;
    category: string;
    dependencies: string[];
    tools: string[];
  }[];
}
```

#### install-plugin

安装插件。

**语法：**
```bash
install-plugin --name <plugin-name> [options]
```

**参数：**
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `--name` | string | 是 | 插件名称 |
| `--version` | string | 否 | 指定版本 |
| `--source` | string | 否 | 安装源 (npm/github/local) |
| `--config` | string | 否 | 插件配置 |

#### activate-plugin / deactivate-plugin

激活或停用插件。

**语法：**
```bash
activate-plugin --name <plugin-name>
deactivate-plugin --name <plugin-name>
```

## 📡 WebSocket API

### 连接建立

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  console.log('MCP WebSocket连接已建立');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleMCPMessage(message);
};
```

### 消息格式

#### 验证请求消息
```json
{
  "jsonrpc": "2.0",
  "id": "req-123",
  "method": "validate-interface",
  "params": {
    "endpoint": "/api/users",
    "method": "POST",
    "code": "...",
    "options": {}
  }
}
```

#### 验证响应消息
```json
{
  "jsonrpc": "2.0",
  "id": "req-123",
  "result": {
    "success": true,
    "validationResult": {
      "status": "success",
      "errors": [],
      "warnings": [],
      "suggestions": []
    }
  }
}
```

#### 实时通知消息
```json
{
  "jsonrpc": "2.0",
  "method": "notification",
  "params": {
    "type": "file-changed",
    "data": {
      "filePath": "/src/api/users.ts",
      "changeType": "modified",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  }
}
```

## 🔍 查询和过滤API

### 高级查询语法

#### 查询表达式
```bash
# 基础查询
get-validation-history --query "status:error"

# 复合查询
get-validation-history --query "status:error AND project:/api AND method:POST"

# 时间范围查询
get-validation-history --query "timestamp:[2024-01-01 TO 2024-01-31]"

# 正则表达式查询
get-validation-history --query "endpoint:/api\/users\/.*/"
```

#### 查询操作符
| 操作符 | 描述 | 示例 |
|--------|------|------|
| `AND` | 逻辑与 | `status:error AND method:POST` |
| `OR` | 逻辑或 | `status:error OR status:warning` |
| `NOT` | 逻辑非 | `NOT status:success` |
| `:` | 字段匹配 | `endpoint:/api/users` |
| `[TO]` | 范围查询 | `timestamp:[2024-01-01 TO 2024-01-31]` |
| `*` | 通配符 | `endpoint:/api/*` |
| `/regex/` | 正则表达式 | `endpoint:/api\/users\/\d+/` |

### 聚合查询API

#### aggregate-validation-data

聚合验证数据。

**语法：**
```bash
aggregate-validation-data --aggregation <config> [options]
```

**聚合配置：**
```json
{
  "groupBy": ["status", "method"],
  "metrics": [
    {
      "field": "responseTime",
      "operation": "avg",
      "alias": "avgResponseTime"
    },
    {
      "field": "*",
      "operation": "count",
      "alias": "totalCount"
    }
  ],
  "filters": {
    "timestamp": {
      "gte": "2024-01-01",
      "lte": "2024-01-31"
    }
  },
  "orderBy": [
    {
      "field": "totalCount",
      "direction": "desc"
    }
  ],
  "limit": 100
}
```

**返回值：**
```typescript
interface AggregationResponse {
  success: boolean;
  data: {
    groups: {
      [key: string]: any;
    }[];
    summary: {
      totalGroups: number;
      totalRecords: number;
      aggregationTime: number;
    };
  };
}
```

## 🔄 工作流集成API

### CI/CD集成

#### generate-ci-config

生成CI/CD配置文件。

**语法：**
```bash
generate-ci-config --platform <platform> [options]
```

**支持的平台：**
- `github-actions`
- `gitlab-ci`
- `jenkins`
- `azure-devops`
- `circleci`

**返回值：**
```typescript
interface CIConfigResponse {
  success: boolean;
  platform: string;
  configFile: string;
  content: string;
  instructions: string[];
}
```

#### validate-ci-integration

验证CI/CD集成配置。

**语法：**
```bash
validate-ci-integration --config-file <file> [options]
```

### Git钩子集成

#### install-git-hooks

安装Git钩子。

**语法：**
```bash
install-git-hooks [options]
```

**参数：**
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `--hooks` | string | 否 | 要安装的钩子 (pre-commit,pre-push) |
| `--force` | boolean | 否 | 强制覆盖现有钩子 |

## 📊 分析和报告API

### 趋势分析API

#### analyze-validation-trends

分析验证趋势。

**语法：**
```bash
analyze-validation-trends [options]
```

**参数：**
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `--period` | string | 否 | 分析周期 (daily/weekly/monthly) |
| `--metrics` | string | 否 | 分析指标 |
| `--format` | string | 否 | 输出格式 |

**返回值：**
```typescript
interface TrendAnalysisResponse {
  success: boolean;
  trends: {
    period: string;
    metrics: {
      [metricName: string]: {
        current: number;
        previous: number;
        change: number;
        changePercent: number;
        trend: 'up' | 'down' | 'stable';
      };
    };
    insights: string[];
    recommendations: string[];
  };
}
```

### 质量评分API

#### calculate-api-quality-score

计算API质量评分。

**语法：**
```bash
calculate-api-quality-score [options]
```

**评分维度：**
- **一致性** (40%) - 接口规范一致性
- **文档完整性** (25%) - API文档覆盖率
- **安全性** (20%) - 安全规则遵循度
- **性能** (15%) - 响应时间和错误率

**返回值：**
```typescript
interface QualityScoreResponse {
  success: boolean;
  score: {
    overall: number; // 0-100
    dimensions: {
      consistency: number;
      documentation: number;
      security: number;
      performance: number;
    };
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    improvements: {
      dimension: string;
      impact: number;
      suggestions: string[];
    }[];
  };
}
```

## 🛠️ 开发者工具API

### 代码生成API

#### generate-interface-code

根据OpenAPI规范生成接口代码。

**语法：**
```bash
generate-interface-code --spec <spec-file> --language <language> [options]
```

**支持的语言：**
- `typescript`
- `javascript`
- `python`
- `java`
- `csharp`
- `go`

**返回值：**
```typescript
interface CodeGenerationResponse {
  success: boolean;
  language: string;
  files: {
    path: string;
    content: string;
    type: 'interface' | 'implementation' | 'test';
  }[];
  dependencies: string[];
}
```

### 模拟数据API

#### generate-mock-data

生成模拟数据。

**语法：**
```bash
generate-mock-data --schema <schema> [options]
```

**参数：**
| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `--schema` | string | 是 | JSON Schema或OpenAPI路径 |
| `--count` | number | 否 | 生成数据条数 |
| `--locale` | string | 否 | 数据本地化 |
| `--seed` | number | 否 | 随机种子 |

---

## 🔗 相关链接

- [用户使用指南](./USER_README.md)
- [技术文档](./TECHNICAL.md)
- [最佳实践指南](./BEST_PRACTICES.md)
- [故障排除指南](./TROUBLESHOOTING.md)
- [插件开发指南](./PLUGIN_DEVELOPMENT.md)
