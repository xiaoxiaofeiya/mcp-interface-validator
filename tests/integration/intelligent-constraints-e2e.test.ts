/**
 * 智能约束系统端到端测试
 * 测试 .use interface 指令功能的完整工作流程
 */

import { IntelligentConstraintSystem } from '../../src/core/intelligent-constraints';
import { IntelligentContextAnalyzer } from '../../src/core/intelligent-context';
import { MCPServer } from '../../src/core/mcp-server';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';

describe('智能约束系统端到端测试', () => {
  let constraintSystem: IntelligentConstraintSystem;
  let mcpServer: MCPServer;
  let tempDir: string;
  let configPath: string;

  beforeEach(async () => {
    // 创建临时目录和配置文件
    tempDir = fs.mkdtempSync(path.join(tmpdir(), 'intelligent-constraints-e2e-'));
    configPath = path.join(tempDir, 'constraint-config.json');
    
    // 创建测试配置文件
    const testConfig = {
      templates: {
        default: {
          name: 'default',
          description: '默认约束模板',
          keywords: ['interface', '接口', 'api'],
          priority: 1,
          constraints: [
            '请确保所有API接口都遵循OpenAPI 3.0规范',
            '请为所有接口提供详细的参数说明和示例',
            '请确保接口的错误处理和状态码定义完整'
          ]
        },
        api: {
          name: 'api',
          description: 'API开发约束模板',
          keywords: ['api', 'rest', 'endpoint', '接口', '端点'],
          priority: 2,
          constraints: [
            '请遵循RESTful API设计原则',
            '请使用标准HTTP状态码',
            '请实现适当的认证和授权机制',
            '请添加API版本控制',
            '请提供完整的API文档'
          ]
        },
        frontend: {
          name: 'frontend',
          description: '前端开发约束模板',
          keywords: ['frontend', 'ui', 'component', '前端', '组件', '界面'],
          priority: 2,
          constraints: [
            '请确保组件的可复用性和可维护性',
            '请遵循响应式设计原则',
            '请实现适当的错误边界处理',
            '请添加必要的无障碍访问支持',
            '请优化性能和加载速度'
          ]
        }
      },
      settings: {
        autoSave: true,
        defaultTemplate: 'default',
        enableLogging: true
      }
    };

    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    // 初始化智能约束系统
    const contextAnalyzer = new IntelligentContextAnalyzer();
    constraintSystem = new IntelligentConstraintSystem(contextAnalyzer, configPath);
    
    // 初始化MCP服务器
    mcpServer = new MCPServer();
  });

  afterEach(async () => {
    // 清理MCP服务器
    if (mcpServer) {
      await mcpServer.stop();
    }

    // 清理临时文件
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('指令检测和处理', () => {
    test('应该正确检测中文 .use interface 指令', async () => {
      const userInput = '.使用接口 开发用户登录系统';
      const result = await constraintSystem.processUserInput(userInput);

      expect(result.isConstraintCommand).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.activationResult).toBeDefined();
      expect(result.result?.enhancedInstruction?.enhancedInstruction).toContain('开发用户登录系统');
    });

    test('应该正确检测英文 .use interface 指令', async () => {
      const userInput = '.use interface develop user authentication API';
      const result = await constraintSystem.processUserInput(userInput);

      expect(result.isConstraintCommand).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.activationResult).toBeDefined();
      expect(result.result?.enhancedInstruction?.enhancedInstruction).toContain('develop user authentication API');
    });

    test('应该正确处理非约束指令', async () => {
      const userInput = '请帮我写一个简单的函数';
      const result = await constraintSystem.processUserInput(userInput);

      expect(result.isConstraintCommand).toBe(false);
      expect(result.result).toBeUndefined();
    });
  });

  describe('模板自动选择', () => {
    test('应该根据关键词自动选择API模板', async () => {
      const userInput = '.use interface 创建REST API端点';
      const result = await constraintSystem.processUserInput(userInput);

      expect(result.isConstraintCommand).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result?.success).toBe(true);
      expect(result.result?.enhancedInstruction?.enhancedInstruction).toContain('API');
    });

    test('应该根据关键词自动选择前端模板', async () => {
      const userInput = '.use interface 开发用户界面组件';
      const result = await constraintSystem.processUserInput(userInput);

      expect(result.isConstraintCommand).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result?.success).toBe(true);
      expect(result.result?.enhancedInstruction?.enhancedInstruction).toContain('组件');
    });

    test('应该在没有匹配关键词时使用默认模板', async () => {
      const userInput = '.use interface 开发数据处理逻辑';
      const result = await constraintSystem.processUserInput(userInput);

      expect(result.isConstraintCommand).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result?.success).toBe(true);
      expect(result.result?.enhancedInstruction?.enhancedInstruction).toContain('数据处理逻辑');
    });
  });

  describe('MCP工具集成测试', () => {
    test('智能约束系统应该与MCP服务器正确集成', async () => {
      // 测试约束系统是否正确初始化
      expect(constraintSystem).toBeDefined();
      expect(mcpServer).toBeDefined();

      // 测试基本的约束处理功能
      const result = await constraintSystem.processUserInput(
        '.use interface 开发API接口',
        'test-session'
      );

      expect(result.isConstraintCommand).toBe(true);
      expect(result.result).toBeDefined();
    });

    test('约束系统应该支持配置文件加载', async () => {
      // 测试配置文件功能
      const constraintManager = (constraintSystem as any).constraintManager;
      expect(constraintManager).toBeDefined();

      // 测试模板获取
      const templates = constraintManager.getConfigTemplates();
      expect(templates).toBeDefined();
      expect(Object.keys(templates)).toContain('default');
    });
  });

  describe('错误处理和边界情况', () => {
    test('应该处理空的用户输入', async () => {
      const result = await constraintSystem.processUserInput('', 'test-session');

      expect(result.isConstraintCommand).toBe(false);
    });

    test('应该处理只有指令没有请求内容的输入', async () => {
      const result = await constraintSystem.processUserInput('.use interface', 'test-session');

      expect(result.isConstraintCommand).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('应该处理非约束指令', async () => {
      const result = await constraintSystem.processUserInput('普通的开发请求', 'test-session');

      expect(result.isConstraintCommand).toBe(false);
    });
  });

  describe('性能和并发测试', () => {
    test('应该能够处理并发的约束请求', async () => {
      const requests = [
        '.use interface 开发用户API',
        '.use interface 创建前端组件',
        '.use interface 设计数据库接口',
        '.use interface 实现认证系统',
        '.use interface 构建支付模块'
      ];

      const promises = requests.map((input, index) =>
        constraintSystem.processUserInput(input, `test-session-${index}`)
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.isConstraintCommand).toBe(true);
        expect(result.result).toBeDefined();
      });
    });

    test('应该在合理时间内完成处理', async () => {
      const startTime = Date.now();

      await constraintSystem.processUserInput('.use interface 开发复杂的微服务架构系统', 'test-session');

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // 处理时间应该少于1秒
      expect(processingTime).toBeLessThan(1000);
    });
  });
});
