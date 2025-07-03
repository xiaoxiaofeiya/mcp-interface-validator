/**
 * MCP约束工具集成测试
 */

import { IntelligentConstraintSystem } from '../../src/core/intelligent-constraints';
import { IntelligentContextAnalyzer } from '../../src/core/intelligent-context';

describe('MCP约束工具集成测试', () => {
  let constraintSystem: IntelligentConstraintSystem;
  let contextAnalyzer: IntelligentContextAnalyzer;
  const testSessionId = 'test-session-123';

  beforeEach(() => {
    contextAnalyzer = new IntelligentContextAnalyzer();
    constraintSystem = new IntelligentConstraintSystem(contextAnalyzer, {
      defaultLanguage: 'zh',
      defaultTemplateType: 'default',
      enableAutoDetection: true,
      maxSessionDuration: 60000,
      supportedCommands: ['.use interface', '.使用接口'],
      enableLogging: false
    });
  });

  afterEach(() => {
    if (constraintSystem) {
      constraintSystem.destroy();
    }
  });

  describe('约束系统核心功能', () => {
    test('应该成功激活中文约束指令', async () => {
      const userInput = '.use interface 开发用户登录功能';
      const projectContext = {
        basePath: '/api/v1',
        authMethod: 'JWT',
        responseFormat: { success: true, data: null, message: '' }
      };

      const result = await constraintSystem.processUserInput(
        userInput,
        testSessionId,
        projectContext
      );

      expect(result.isConstraintCommand).toBe(true);
      expect(result.activationResult).toContain('接口约束模式已激活');
      expect(result.result?.success).toBe(true);
      expect(result.result?.enhancedInstruction).toBeTruthy();
    });

    test('应该成功激活英文约束指令', async () => {
      const userInput = '.use interface develop user authentication system';
      const projectContext = {
        basePath: '/api/v1',
        authMethod: 'Bearer Token'
      };

      const result = await constraintSystem.processUserInput(
        userInput,
        testSessionId,
        projectContext
      );

      expect(result.isConstraintCommand).toBe(true);
      expect(result.activationResult).toContain('Interface Constraint Mode Activated');
    });

    test('应该拒绝无效的约束指令', async () => {
      const userInput = '普通的开发需求描述';

      const result = await constraintSystem.processUserInput(
        userInput,
        testSessionId
      );

      expect(result.isConstraintCommand).toBe(false);
      expect(result.activationResult).toBeUndefined();
    });
  });

  describe('约束应用功能', () => {
    test('应该成功应用约束到用户指令', async () => {
      // 首先激活约束模式
      await constraintSystem.processUserInput(
        '.use interface 开发API',
        testSessionId
      );

      // 然后应用约束
      const userInput = '创建用户注册接口';
      const projectContext = {
        basePath: '/api/v1',
        authMethod: 'JWT'
      };

      const result = await constraintSystem.processUserInput(
        userInput,
        testSessionId,
        projectContext
      );

      expect(result.isConstraintCommand).toBe(false);
      expect(result.result?.success).toBe(true);
      expect(result.result?.enhancedInstruction).toBeTruthy();
    });

    test('应该处理未激活约束模式的情况', async () => {
      const userInput = '创建用户注册接口';

      const result = await constraintSystem.processUserInput(
        userInput,
        'new-session-456'
      );

      expect(result.isConstraintCommand).toBe(false);
      expect(result.result).toBeUndefined();
    });
  });

  describe('多会话管理', () => {
    test('应该支持多个独立会话', async () => {
      const session1 = 'session-1';
      const session2 = 'session-2';

      // 激活第一个会话
      const result1 = await constraintSystem.processUserInput(
        '.use interface 开发用户系统',
        session1
      );

      // 激活第二个会话
      const result2 = await constraintSystem.processUserInput(
        '.use interface develop payment system',
        session2
      );

      expect(result1.isConstraintCommand).toBe(true);
      expect(result2.isConstraintCommand).toBe(true);
      expect(result1.activationResult).toContain('用户系统');
      expect(result2.activationResult).toContain('payment system');
    });
  });

});
