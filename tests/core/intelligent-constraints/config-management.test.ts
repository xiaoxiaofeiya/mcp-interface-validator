/**
 * 约束配置管理测试
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ConstraintManager } from '../../../src/core/intelligent-constraints/constraint-manager';
import { IntelligentConstraintSystem } from '../../../src/core/intelligent-constraints';
import { IntelligentContextAnalyzer } from '../../../src/core/intelligent-context';
import { ConstraintConfig } from '../../../src/core/intelligent-constraints/types';
import { existsSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

describe('约束配置管理', () => {
  let constraintManager: ConstraintManager;
  let constraintSystem: IntelligentConstraintSystem;
  let contextAnalyzer: IntelligentContextAnalyzer;
  let testConfigPath: string;

  beforeEach(() => {
    contextAnalyzer = new IntelligentContextAnalyzer();
    constraintManager = new ConstraintManager();
    constraintSystem = new IntelligentConstraintSystem(contextAnalyzer);
    testConfigPath = join(__dirname, 'test-config.json');
  });

  afterEach(() => {
    constraintManager.destroy();
    constraintSystem.destroy();
    
    // 清理测试文件
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
  });

  describe('配置模板管理', () => {
    it('应该能够添加自定义模板', () => {
      const customTemplate: ConstraintConfig = {
        templateType: 'custom',
        language: 'zh',
        includeProjectContext: true,
        customRules: ['自定义规则1', '自定义规则2'],
        strictMode: true,
        maxConstraintLength: 2500
      };

      constraintManager.addTemplate('custom-test', customTemplate);
      
      const retrievedTemplate = constraintManager.getTemplate('custom-test');
      expect(retrievedTemplate).toEqual(customTemplate);
    });

    it('应该能够移除模板', () => {
      const customTemplate: ConstraintConfig = {
        templateType: 'custom',
        language: 'en',
        includeProjectContext: false,
        customRules: [],
        strictMode: false,
        maxConstraintLength: 1500
      };

      constraintManager.addTemplate('temp-template', customTemplate);
      expect(constraintManager.getTemplate('temp-template')).not.toBeNull();

      const removed = constraintManager.removeTemplate('temp-template');
      expect(removed).toBe(true);
      expect(constraintManager.getTemplate('temp-template')).toBeNull();
    });

    it('应该能够列出所有模板', () => {
      const templates = constraintManager.listTemplates();
      
      // 应该包含默认模板
      expect(templates).toContain('default');
      expect(templates).toContain('strict');
      expect(templates).toContain('api');
      expect(templates).toContain('frontend');
      expect(templates).toContain('testing');
    });

    it('应该能够获取所有配置模板', () => {
      const allTemplates = constraintManager.getConfigTemplates();
      
      expect(allTemplates).toHaveProperty('default');
      expect(allTemplates).toHaveProperty('strict');
      expect(allTemplates.default.templateType).toBe('default');
      expect(allTemplates.strict.strictMode).toBe(true);
    });
  });

  describe('配置文件操作', () => {
    it('应该能够保存配置到JSON文件', async () => {
      // 添加自定义模板
      const customTemplate: ConstraintConfig = {
        templateType: 'custom',
        language: 'auto',
        includeProjectContext: true,
        customRules: ['测试规则'],
        strictMode: false,
        maxConstraintLength: 2000
      };
      
      constraintManager.addTemplate('test-template', customTemplate);
      
      // 保存配置
      await constraintManager.saveConfigToFile(testConfigPath);
      
      // 验证文件存在
      expect(existsSync(testConfigPath)).toBe(true);
    });

    it('应该能够从JSON文件加载配置', async () => {
      // 创建测试配置文件
      const testConfig = {
        version: '1.0.0',
        global: {
          defaultLanguage: 'zh',
          defaultTemplateType: 'strict',
          enableAutoDetection: false,
          maxSessionDuration: 3600000,
          supportedCommands: ['.test command'],
          enableLogging: false
        },
        templates: {
          'loaded-template': {
            templateType: 'custom',
            language: 'zh',
            includeProjectContext: false,
            customRules: ['加载的规则'],
            strictMode: true,
            maxConstraintLength: 1800
          }
        }
      };

      writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));

      // 加载配置
      await constraintManager.loadConfigFromFile(testConfigPath);

      // 验证全局配置
      const globalConfig = constraintManager.getGlobalConfig();
      expect(globalConfig.defaultLanguage).toBe('zh');
      expect(globalConfig.defaultTemplateType).toBe('strict');
      expect(globalConfig.enableAutoDetection).toBe(false);

      // 验证模板
      const loadedTemplate = constraintManager.getTemplate('loaded-template');
      expect(loadedTemplate).not.toBeNull();
      expect(loadedTemplate?.language).toBe('zh');
      expect(loadedTemplate?.customRules).toContain('加载的规则');
    });

    it('应该能够处理YAML配置文件', async () => {
      const yamlConfigPath = testConfigPath.replace('.json', '.yaml');
      
      // 创建YAML配置内容
      const yamlContent = `
version: "1.0.0"
global:
  defaultLanguage: "en"
  defaultTemplateType: "default"
  enableAutoDetection: true
  maxSessionDuration: 86400000
  supportedCommands:
    - ".use interface"
  enableLogging: true
templates:
  yaml-template:
    templateType: "custom"
    language: "en"
    includeProjectContext: true
    customRules:
      - "YAML rule 1"
      - "YAML rule 2"
    strictMode: false
    maxConstraintLength: 2200
`;

      writeFileSync(yamlConfigPath, yamlContent);

      try {
        // 加载YAML配置
        await constraintManager.loadConfigFromFile(yamlConfigPath);

        // 验证配置
        const yamlTemplate = constraintManager.getTemplate('yaml-template');
        expect(yamlTemplate).not.toBeNull();
        expect(yamlTemplate?.customRules).toContain('YAML rule 1');
        expect(yamlTemplate?.customRules).toContain('YAML rule 2');
      } finally {
        // 清理YAML文件
        if (existsSync(yamlConfigPath)) {
          unlinkSync(yamlConfigPath);
        }
      }
    });
  });

  describe('智能约束系统配置集成', () => {
    it('应该能够通过系统接口管理配置', async () => {
      const customTemplate: ConstraintConfig = {
        templateType: 'custom',
        language: 'auto',
        includeProjectContext: true,
        customRules: ['系统级规则'],
        strictMode: true,
        maxConstraintLength: 2300
      };

      // 通过系统添加模板
      constraintSystem.addConfigTemplate('system-template', customTemplate);
      
      // 验证模板存在
      const retrievedTemplate = constraintSystem.getConfigTemplate('system-template');
      expect(retrievedTemplate).toEqual(customTemplate);

      // 列出模板
      const templates = constraintSystem.listConfigTemplates();
      expect(templates).toContain('system-template');

      // 移除模板
      const removed = constraintSystem.removeConfigTemplate('system-template');
      expect(removed).toBe(true);
      expect(constraintSystem.getConfigTemplate('system-template')).toBeNull();
    });

    it('应该能够应用模板到会话', async () => {
      const sessionId = 'test-session-123';

      // 通过系统激活约束会话（这样会使用系统内部的约束管理器）
      await constraintSystem.activateConstraints(sessionId, {
        command: '.use interface',
        userInstruction: '测试指令',
        language: 'zh'
      });

      // 应用API模板
      await constraintSystem.applyConfigTemplate(sessionId, 'api');

      // 通过系统获取配置（确保使用同一个管理器实例）
      const sessionConfig = (constraintSystem as any).constraintManager.getConstraintConfig(sessionId);
      expect(sessionConfig).not.toBeNull();
      expect(sessionConfig?.templateType).toBe('custom');
      expect(sessionConfig?.strictMode).toBe(true);
      expect(sessionConfig?.customRules).toContain('严格遵循OpenAPI 3.0规范');
    });

    it('应该能够从会话创建模板', async () => {
      const sessionId = 'test-session-456';

      // 通过系统激活约束会话
      await constraintSystem.activateConstraints(sessionId, {
        command: '.use interface',
        userInstruction: '测试指令',
        language: 'zh'
      });

      // 通过系统内部的约束管理器更新会话配置
      (constraintSystem as any).constraintManager.updateConstraintConfig(sessionId, {
        templateType: 'custom',
        language: 'zh',
        includeProjectContext: true,
        customRules: ['从会话创建的规则'],
        strictMode: false,
        maxConstraintLength: 2100
      });

      // 从会话创建模板
      constraintSystem.createConfigTemplateFromSession(sessionId, 'session-template');

      // 验证模板
      const createdTemplate = constraintSystem.getConfigTemplate('session-template');
      expect(createdTemplate).not.toBeNull();
      expect(createdTemplate?.customRules).toContain('从会话创建的规则');
      expect(createdTemplate?.language).toBe('zh');
    });

    it('应该能够保存和加载系统配置', async () => {
      // 添加自定义模板
      constraintSystem.addConfigTemplate('persistent-template', {
        templateType: 'custom',
        language: 'en',
        includeProjectContext: false,
        customRules: ['持久化规则'],
        strictMode: true,
        maxConstraintLength: 2400
      });

      // 保存配置
      await constraintSystem.saveConfigToFile(testConfigPath);

      // 创建新的系统实例
      const newSystem = new IntelligentConstraintSystem(contextAnalyzer);
      
      try {
        // 加载配置
        await newSystem.loadConfigFromFile(testConfigPath);

        // 验证模板存在
        const loadedTemplate = newSystem.getConfigTemplate('persistent-template');
        expect(loadedTemplate).not.toBeNull();
        expect(loadedTemplate?.customRules).toContain('持久化规则');
      } finally {
        newSystem.destroy();
      }
    });
  });

  describe('错误处理', () => {
    it('应该处理不存在的配置文件', async () => {
      const nonExistentPath = join(__dirname, 'non-existent-config.json');
      
      await expect(constraintManager.loadConfigFromFile(nonExistentPath))
        .rejects.toThrow('Config file not found');
    });

    it('应该处理无效的配置文件格式', async () => {
      const invalidConfigPath = join(__dirname, 'invalid-config.json');
      writeFileSync(invalidConfigPath, '{ invalid json }');

      try {
        await expect(constraintManager.loadConfigFromFile(invalidConfigPath))
          .rejects.toThrow();
      } finally {
        if (existsSync(invalidConfigPath)) {
          unlinkSync(invalidConfigPath);
        }
      }
    });

    it('应该处理不支持的文件格式', async () => {
      const unsupportedPath = join(__dirname, 'config.txt');
      writeFileSync(unsupportedPath, 'some text');

      try {
        await expect(constraintManager.loadConfigFromFile(unsupportedPath))
          .rejects.toThrow('Unsupported config file format');
      } finally {
        if (existsSync(unsupportedPath)) {
          unlinkSync(unsupportedPath);
        }
      }
    });

    it('应该处理系统销毁后的操作', () => {
      constraintSystem.destroy();

      expect(() => constraintSystem.addConfigTemplate('test', {} as ConstraintConfig))
        .toThrow('IntelligentConstraintSystem has been destroyed');
      
      expect(() => constraintSystem.getConfigTemplates())
        .toThrow('IntelligentConstraintSystem has been destroyed');
    });
  });
});
