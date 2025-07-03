/**
 * 智能约束系统集成测试
 */

import { IntelligentConstraintSystem } from '../../../src/core/intelligent-constraints';
import { IntelligentContextAnalyzer } from '../../../src/core/intelligent-context';

describe('IntelligentConstraintSystem', () => {
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
    constraintSystem.destroy();
  });

  describe('用户输入处理', () => {
    test('应该处理中文约束指令', async () => {
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

    test('应该处理英文约束指令', async () => {
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
      expect(result.result?.success).toBe(true);
    });

    test('应该拒绝非约束指令', async () => {
      const userInput = '普通的开发需求描述';

      const result = await constraintSystem.processUserInput(
        userInput,
        testSessionId
      );

      expect(result.isConstraintCommand).toBe(false);
      expect(result.activationResult).toBeUndefined();
      expect(result.result).toBeUndefined();
    });

    test('应该处理错误情况', async () => {
      const userInput = '.use interface'; // 缺少用户指令

      const result = await constraintSystem.processUserInput(
        userInput,
        testSessionId
      );

      expect(result.isConstraintCommand).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('约束激活和管理', () => {
    test('应该激活约束模式', async () => {
      const command = {
        command: '.use interface',
        userInstruction: '开发聊天功能',
        language: 'zh' as const
      };

      const activationResult = await constraintSystem.activateConstraints(
        testSessionId,
        command
      );

      expect(activationResult).toContain('接口约束模式已激活');
      expect(activationResult).toContain('开发聊天功能');

      const status = constraintSystem.getConstraintStatus(testSessionId);
      expect(status.isActive).toBe(true);
      expect(status.config?.language).toBe('zh');
    });

    test('应该停用约束模式', () => {
      // 先激活
      constraintSystem.activateConstraints(testSessionId, {
        command: '.use interface',
        userInstruction: '测试',
        language: 'zh'
      });

      expect(constraintSystem.getConstraintStatus(testSessionId).isActive).toBe(true);

      // 停用
      const result = constraintSystem.deactivateConstraints(testSessionId);
      expect(result).toBe(true);
      expect(constraintSystem.getConstraintStatus(testSessionId).isActive).toBe(false);
    });

    test('应该获取约束状态', () => {
      const status = constraintSystem.getConstraintStatus(testSessionId);
      expect(status.isActive).toBe(false);
      expect(status.config).toBeUndefined();

      // 激活后再检查
      constraintSystem.activateConstraints(testSessionId, {
        command: '.use interface',
        userInstruction: '测试',
        language: 'zh'
      });

      const activeStatus = constraintSystem.getConstraintStatus(testSessionId);
      expect(activeStatus.isActive).toBe(true);
      expect(activeStatus.config).toBeTruthy();
      expect(activeStatus.stats).toBeTruthy();
    });
  });

  describe('约束应用', () => {
    beforeEach(async () => {
      // 激活约束模式
      await constraintSystem.activateConstraints(testSessionId, {
        command: '.use interface',
        userInstruction: '测试',
        language: 'zh'
      });
    });

    test('应该应用约束到用户指令', async () => {
      const userInstruction = '开发用户注册接口';
      const projectContext = {
        basePath: '/api/v1',
        authMethod: 'JWT'
      };

      const result = await constraintSystem.applyConstraintsToInstruction(
        userInstruction,
        testSessionId,
        projectContext
      );

      expect(result.success).toBe(true);
      expect(result.enhancedInstruction).toBeTruthy();
      expect(result.enhancedInstruction?.originalInstruction).toBe(userInstruction);
      expect(result.enhancedInstruction?.enhancedInstruction).toContain('OpenAPI');
      expect(result.appliedConstraints.length).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    test('应该处理未激活的会话', async () => {
      const inactiveSessionId = 'inactive-session';
      const result = await constraintSystem.applyConstraintsToInstruction(
        '测试指令',
        inactiveSessionId,
        {}
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No active constraint session found');
    });
  });

  describe('系统功能', () => {
    test('应该获取支持的指令', () => {
      const commands = constraintSystem.getSupportedCommands();
      expect(commands).toContain('.use interface');
      expect(commands).toContain('.使用接口');
      expect(Array.isArray(commands)).toBe(true);
    });

    test('应该获取可用模板', () => {
      const templates = constraintSystem.getAvailableTemplates();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      const template = templates[0];
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('language');
      expect(template).toHaveProperty('category');
      expect(template).toHaveProperty('description');
    });

    test('应该注册自定义模板', () => {
      const customTemplate = {
        name: 'test-template',
        language: 'zh' as const,
        content: '测试模板内容 {basePath}',
        variables: ['basePath'],
        priority: 1,
        category: 'custom' as const
      };

      constraintSystem.registerCustomTemplate('test-template', customTemplate);
      
      const templates = constraintSystem.getAvailableTemplates();
      const testTemplate = templates.find(t => t.name === 'test-template');
      expect(testTemplate).toBeTruthy();
    });

    test('应该清理过期会话', () => {
      // 创建多个会话
      constraintSystem.activateConstraints('session-1', {
        command: '.use interface',
        userInstruction: '测试1',
        language: 'zh'
      });
      
      constraintSystem.activateConstraints('session-2', {
        command: '.use interface',
        userInstruction: '测试2',
        language: 'zh'
      });

      const cleanedCount = constraintSystem.cleanupExpiredSessions();
      expect(typeof cleanedCount).toBe('number');
      expect(cleanedCount).toBeGreaterThanOrEqual(0);
    });

    test('应该获取系统统计信息', () => {
      const stats = constraintSystem.getSystemStats();
      
      expect(stats).toHaveProperty('constraints');
      expect(stats).toHaveProperty('enhancements');
      expect(stats).toHaveProperty('activeSessions');
      expect(stats).toHaveProperty('supportedCommands');
      expect(stats).toHaveProperty('availableTemplates');
      
      expect(typeof stats.activeSessions).toBe('number');
      expect(typeof stats.supportedCommands).toBe('number');
      expect(typeof stats.availableTemplates).toBe('number');
    });
  });

  describe('错误处理和边界情况', () => {
    test('应该处理空用户输入', async () => {
      const result = await constraintSystem.processUserInput('', testSessionId);
      expect(result.isConstraintCommand).toBe(false);
    });

    test('应该处理无效的项目上下文', async () => {
      const userInput = '.use interface 开发API';
      const invalidContext = null;

      const result = await constraintSystem.processUserInput(
        userInput,
        testSessionId,
        invalidContext as any
      );

      expect(result.isConstraintCommand).toBe(true);
      // 系统应该能够处理无效上下文
    });

    test('应该处理长用户指令', async () => {
      const longInstruction = '开发一个复杂的用户管理系统，包括用户注册、登录、权限管理、角色分配、密码重置、邮箱验证、双因子认证、用户资料管理、头像上传、活动日志记录等功能'.repeat(5);
      
      const userInput = `.use interface ${longInstruction}`;
      
      const result = await constraintSystem.processUserInput(
        userInput,
        testSessionId
      );

      expect(result.isConstraintCommand).toBe(true);
      expect(result.result?.success).toBe(true);
    });

    test('应该处理并发会话', async () => {
      const sessions = ['session-1', 'session-2', 'session-3'];
      const promises = sessions.map(sessionId =>
        constraintSystem.processUserInput(
          '.use interface 开发API',
          sessionId
        )
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.isConstraintCommand).toBe(true);
        expect(result.result?.success).toBe(true);
      });
    });

    test('应该处理系统销毁', () => {
      constraintSystem.activateConstraints(testSessionId, {
        command: '.use interface',
        userInstruction: '测试',
        language: 'zh'
      });

      expect(constraintSystem.getConstraintStatus(testSessionId).isActive).toBe(true);

      constraintSystem.destroy();

      // 销毁后应该无法使用
      expect(() => {
        constraintSystem.getConstraintStatus(testSessionId);
      }).toThrow();
    });
  });
});
