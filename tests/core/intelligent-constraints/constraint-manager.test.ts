/**
 * 约束管理器测试
 */

import { ConstraintManager } from '../../../src/core/intelligent-constraints/constraint-manager';
import { ConstraintConfig } from '../../../src/core/intelligent-constraints/types';

describe('ConstraintManager', () => {
  let constraintManager: ConstraintManager;
  const testSessionId = 'test-session-123';

  beforeEach(() => {
    constraintManager = new ConstraintManager({
      defaultLanguage: 'zh',
      defaultTemplateType: 'default',
      enableAutoDetection: true,
      maxSessionDuration: 60000, // 1分钟用于测试
      supportedCommands: ['.use interface', '.使用接口'],
      enableLogging: false
    });
  });

  afterEach(() => {
    constraintManager.destroy();
  });

  describe('约束激活和停用', () => {
    test('应该能够激活约束模式', () => {
      const config: ConstraintConfig = {
        templateType: 'default',
        language: 'zh',
        includeProjectContext: true
      };

      constraintManager.activateConstraints(testSessionId, config);
      
      expect(constraintManager.isConstraintActive(testSessionId)).toBe(true);
      
      const retrievedConfig = constraintManager.getConstraintConfig(testSessionId);
      expect(retrievedConfig).toEqual(expect.objectContaining(config));
    });

    test('应该能够停用约束模式', () => {
      constraintManager.activateConstraints(testSessionId);
      expect(constraintManager.isConstraintActive(testSessionId)).toBe(true);
      
      constraintManager.deactivateConstraints(testSessionId);
      expect(constraintManager.isConstraintActive(testSessionId)).toBe(false);
    });

    test('应该能够更新约束配置', () => {
      constraintManager.activateConstraints(testSessionId);
      
      const newConfig: Partial<ConstraintConfig> = {
        templateType: 'strict',
        strictMode: true
      };
      
      constraintManager.updateConstraintConfig(testSessionId, newConfig as ConstraintConfig);
      
      const updatedConfig = constraintManager.getConstraintConfig(testSessionId);
      expect(updatedConfig?.templateType).toBe('strict');
      expect(updatedConfig?.strictMode).toBe(true);
    });
  });

  describe('会话管理', () => {
    test('应该能够获取会话状态', () => {
      constraintManager.activateConstraints(testSessionId);
      
      const sessionState = constraintManager.getSessionState(testSessionId);
      expect(sessionState).toBeTruthy();
      expect(sessionState?.sessionId).toBe(testSessionId);
      expect(sessionState?.isActive).toBe(true);
    });

    test('应该能够获取所有活跃会话', () => {
      const sessionId1 = 'session-1';
      const sessionId2 = 'session-2';
      
      constraintManager.activateConstraints(sessionId1);
      constraintManager.activateConstraints(sessionId2);
      
      const activeSessions = constraintManager.getAllActiveSessions();
      expect(activeSessions).toHaveLength(2);
      expect(activeSessions.map(s => s.sessionId)).toContain(sessionId1);
      expect(activeSessions.map(s => s.sessionId)).toContain(sessionId2);
    });

    test('应该能够清理过期会话', async () => {
      // 使用短过期时间的管理器
      const shortLivedManager = new ConstraintManager({
        maxSessionDuration: 100 // 100ms
      });

      shortLivedManager.activateConstraints(testSessionId);
      expect(shortLivedManager.isConstraintActive(testSessionId)).toBe(true);
      
      // 等待会话过期
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const cleanedCount = shortLivedManager.cleanupExpiredSessions();
      expect(cleanedCount).toBeGreaterThan(0);
      expect(shortLivedManager.isConstraintActive(testSessionId)).toBe(false);
      
      shortLivedManager.destroy();
    });
  });

  describe('统计信息', () => {
    test('应该能够获取统计信息', () => {
      const stats = constraintManager.getStats();
      expect(stats).toHaveProperty('totalActivations');
      expect(stats).toHaveProperty('totalApplications');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('averageProcessingTime');
    });

    test('应该能够更新统计信息', () => {
      const initialStats = constraintManager.getStats();
      
      constraintManager.updateStats('application', 100);
      
      const updatedStats = constraintManager.getStats();
      expect(updatedStats.totalApplications).toBe(initialStats.totalApplications + 1);
      expect(updatedStats.averageProcessingTime).toBe(100);
    });

    test('应该能够重置统计信息', () => {
      constraintManager.updateStats('application', 100);
      constraintManager.updateStats('error');
      
      constraintManager.resetStats();
      
      const stats = constraintManager.getStats();
      expect(stats.totalActivations).toBe(0);
      expect(stats.totalApplications).toBe(0);
      expect(stats.errorCount).toBe(0);
    });
  });

  describe('错误处理', () => {
    test('应该处理不存在的会话', () => {
      expect(constraintManager.isConstraintActive('non-existent')).toBe(false);
      expect(constraintManager.getConstraintConfig('non-existent')).toBeNull();
      expect(constraintManager.getSessionState('non-existent')).toBeNull();
    });

    test('应该处理重复激活', () => {
      constraintManager.activateConstraints(testSessionId);
      
      // 重复激活应该覆盖之前的配置
      const newConfig: ConstraintConfig = {
        templateType: 'strict',
        language: 'en',
        includeProjectContext: false
      };
      
      constraintManager.activateConstraints(testSessionId, newConfig);
      
      const config = constraintManager.getConstraintConfig(testSessionId);
      expect(config?.templateType).toBe('strict');
      expect(config?.language).toBe('en');
    });

    test('应该处理更新不存在会话的配置', () => {
      expect(() => {
        constraintManager.updateConstraintConfig('non-existent', {
          templateType: 'default',
          language: 'zh',
          includeProjectContext: true
        });
      }).toThrow();
    });
  });

  describe('配置管理', () => {
    test('应该能够获取和更新全局配置', () => {
      const globalConfig = constraintManager.getGlobalConfig();
      expect(globalConfig.defaultLanguage).toBe('zh');
      
      constraintManager.updateGlobalConfig({
        defaultLanguage: 'en',
        enableAutoDetection: false
      });
      
      const updatedConfig = constraintManager.getGlobalConfig();
      expect(updatedConfig.defaultLanguage).toBe('en');
      expect(updatedConfig.enableAutoDetection).toBe(false);
    });

    test('应该使用默认配置激活约束', () => {
      constraintManager.activateConstraints(testSessionId);
      
      const config = constraintManager.getConstraintConfig(testSessionId);
      expect(config?.templateType).toBe('default');
      expect(config?.language).toBe('zh');
      expect(config?.includeProjectContext).toBe(true);
    });
  });
});
