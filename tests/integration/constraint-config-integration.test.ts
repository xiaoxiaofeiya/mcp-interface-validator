/**
 * 智能约束配置文件集成测试
 * 测试配置文件的读写、模板管理和持久化功能
 */

import { IntelligentConstraintSystem } from '../../src/core/intelligent-constraints';
import { IntelligentContextAnalyzer } from '../../src/core/intelligent-context';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
import * as yaml from 'js-yaml';

describe('智能约束配置文件集成测试', () => {
  let constraintSystem: IntelligentConstraintSystem;
  let tempDir: string;
  let jsonConfigPath: string;
  let yamlConfigPath: string;

  beforeEach(async () => {
    // 创建临时目录
    tempDir = fs.mkdtempSync(path.join(tmpdir(), 'constraint-config-integration-'));
    jsonConfigPath = path.join(tempDir, 'config.json');
    yamlConfigPath = path.join(tempDir, 'config.yaml');
    
    // 初始化智能约束系统
    const contextAnalyzer = new IntelligentContextAnalyzer();
    constraintSystem = new IntelligentConstraintSystem(contextAnalyzer);
  });

  afterEach(() => {
    // 清理临时文件
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('JSON配置文件操作', () => {
    test('应该能够保存配置到JSON文件', async () => {
      // 添加自定义模板
      const constraintManager = (constraintSystem as any).constraintManager;
      constraintManager.addTemplate('test-template', {
        name: 'test-template',
        description: '测试模板',
        keywords: ['test', '测试'],
        priority: 1,
        constraints: ['测试约束1', '测试约束2']
      });

      // 保存配置
      await constraintSystem.saveConfigToFile(jsonConfigPath);

      // 验证文件存在
      expect(fs.existsSync(jsonConfigPath)).toBe(true);

      // 验证文件内容
      const savedConfig = JSON.parse(fs.readFileSync(jsonConfigPath, 'utf-8'));
      expect(savedConfig.templates['test-template']).toBeDefined();
      expect(savedConfig.templates['test-template'].name).toBe('test-template');
      expect(savedConfig.templates['test-template'].constraints).toEqual(['测试约束1', '测试约束2']);
    });

    test('应该能够从JSON文件加载配置', async () => {
      // 创建测试配置文件
      const testConfig = {
        templates: {
          'loaded-template': {
            templateType: 'custom',
            language: 'auto',
            includeProjectContext: true,
            customRules: ['加载约束1', '加载约束2'],
            strictMode: false,
            maxConstraintLength: 2000
          }
        },
        settings: {
          autoSave: false,
          defaultTemplate: 'loaded-template'
        }
      };

      fs.writeFileSync(jsonConfigPath, JSON.stringify(testConfig, null, 2));

      // 加载配置
      await constraintSystem.loadConfigFromFile(jsonConfigPath);

      // 验证模板已加载
      const templates = await constraintSystem.getConfigTemplates();
      expect(templates['loaded-template']).toBeDefined();
      expect(templates['loaded-template'].customRules).toContain('加载约束1');
      expect(templates['loaded-template'].customRules).toContain('加载约束2');
    });

    test('应该能够更新现有JSON配置文件', async () => {
      // 创建初始配置
      const initialConfig = {
        templates: {
          'initial-template': {
            name: 'initial-template',
            description: '初始模板',
            keywords: ['initial'],
            priority: 1,
            constraints: ['初始约束']
          }
        }
      };

      fs.writeFileSync(jsonConfigPath, JSON.stringify(initialConfig, null, 2));

      // 加载配置
      await constraintSystem.loadConfigFromFile(jsonConfigPath);

      // 添加新模板
      const constraintManager2 = (constraintSystem as any).constraintManager;
      constraintManager2.addTemplate('new-template', {
        name: 'new-template',
        description: '新模板',
        keywords: ['new'],
        priority: 2,
        constraints: ['新约束']
      });

      // 保存更新的配置
      await constraintSystem.saveConfigToFile(jsonConfigPath);

      // 验证文件包含两个模板
      const updatedConfig = JSON.parse(fs.readFileSync(jsonConfigPath, 'utf-8'));
      expect(Object.keys(updatedConfig.templates)).toHaveLength(2);
      expect(updatedConfig.templates['initial-template']).toBeDefined();
      expect(updatedConfig.templates['new-template']).toBeDefined();
    });
  });

  describe('YAML配置文件操作', () => {
    test('应该能够保存配置到YAML文件', async () => {
      // 添加自定义模板
      const constraintManager3 = (constraintSystem as any).constraintManager;
      constraintManager3.addTemplate('yaml-template', {
        name: 'yaml-template',
        description: 'YAML测试模板',
        keywords: ['yaml', 'test'],
        priority: 1,
        constraints: ['YAML约束1', 'YAML约束2']
      });

      // 保存配置到YAML文件
      await constraintSystem.saveConfigToFile(yamlConfigPath);

      // 验证文件存在
      expect(fs.existsSync(yamlConfigPath)).toBe(true);

      // 验证文件内容
      const savedConfig = yaml.load(fs.readFileSync(yamlConfigPath, 'utf-8')) as any;
      expect(savedConfig.templates['yaml-template']).toBeDefined();
      expect(savedConfig.templates['yaml-template'].name).toBe('yaml-template');
      expect(savedConfig.templates['yaml-template'].constraints).toEqual(['YAML约束1', 'YAML约束2']);
    });

    test('应该能够从YAML文件加载配置', async () => {
      // 创建测试YAML配置文件
      const testConfig = {
        templates: {
          'yaml-loaded-template': {
            templateType: 'custom',
            language: 'auto',
            includeProjectContext: true,
            customRules: ['YAML加载约束1', 'YAML加载约束2'],
            strictMode: true,
            maxConstraintLength: 2500
          }
        },
        settings: {
          autoSave: true,
          defaultTemplate: 'yaml-loaded-template'
        }
      };

      fs.writeFileSync(yamlConfigPath, yaml.dump(testConfig));

      // 加载配置
      await constraintSystem.loadConfigFromFile(yamlConfigPath);

      // 验证模板已加载
      const templates = await constraintSystem.getConfigTemplates();
      expect(templates['yaml-loaded-template']).toBeDefined();
      expect(templates['yaml-loaded-template'].customRules).toContain('YAML加载约束1');
      expect(templates['yaml-loaded-template'].strictMode).toBe(true);
    });
  });

  describe('模板管理操作', () => {
    test('应该能够添加和删除模板', async () => {
      // 添加模板
      const constraintManager4 = (constraintSystem as any).constraintManager;
      constraintManager4.addTemplate('temp-template', {
        name: 'temp-template',
        description: '临时模板',
        keywords: ['temp'],
        priority: 1,
        constraints: ['临时约束']
      });

      // 验证模板已添加
      let templates = await constraintSystem.getConfigTemplates();
      expect(templates['temp-template']).toBeDefined();

      // 删除模板
      constraintSystem.removeConfigTemplate('temp-template');

      // 验证模板已删除
      templates = await constraintSystem.getConfigTemplates();
      expect(templates['temp-template']).toBeUndefined();
    });

    test('应该能够更新现有模板', async () => {
      // 添加初始模板
      const constraintManager5 = (constraintSystem as any).constraintManager;
      constraintManager5.addTemplate('update-template', {
        name: 'update-template',
        description: '待更新模板',
        keywords: ['update'],
        priority: 1,
        constraints: ['原始约束']
      });

      // 更新模板
      constraintManager5.addTemplate('update-template', {
        name: 'update-template',
        description: '已更新模板',
        keywords: ['update', 'modified'],
        priority: 2,
        constraints: ['更新约束1', '更新约束2']
      });

      // 验证模板已更新
      const templates = await constraintSystem.getConfigTemplates();
      expect(templates['update-template'].description).toBe('已更新模板');
      expect(templates['update-template'].priority).toBe(2);
      expect(templates['update-template'].constraints).toEqual(['更新约束1', '更新约束2']);
    });

    test('应该能够获取所有模板列表', async () => {
      // 添加多个模板
      const templateNames = ['template1', 'template2', 'template3'];
      
      const constraintManager6 = (constraintSystem as any).constraintManager;
      for (const name of templateNames) {
        constraintManager6.addTemplate(name, {
          name,
          description: `${name}描述`,
          keywords: [name],
          priority: 1,
          constraints: [`${name}约束`]
        });
      }

      // 获取模板列表
      const templates = await constraintSystem.getConfigTemplates();
      
      // 验证所有模板都存在（包括预定义模板）
      templateNames.forEach(name => {
        expect(templates[name]).toBeDefined();
      });
    });
  });

  describe('配置持久化和自动保存', () => {
    test('应该在启用自动保存时自动保存配置', async () => {
      // 创建带自动保存的配置文件
      const configWithAutoSave = {
        templates: {},
        settings: {
          autoSave: true,
          defaultTemplate: 'default'
        }
      };

      fs.writeFileSync(jsonConfigPath, JSON.stringify(configWithAutoSave, null, 2));

      // 使用配置文件初始化系统
      const contextAnalyzer = new IntelligentContextAnalyzer();
      const autoSaveSystem = new IntelligentConstraintSystem(contextAnalyzer, undefined, jsonConfigPath);

      // 添加模板（应该触发自动保存）
      autoSaveSystem.addConfigTemplate('auto-save-template', {
        templateType: 'custom',
        language: 'auto',
        includeProjectContext: true,
        customRules: ['自动保存约束'],
        strictMode: false,
        maxConstraintLength: 2000
      });

      // 等待一小段时间确保自动保存完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 验证配置已自动保存到文件
      const savedConfig = JSON.parse(fs.readFileSync(jsonConfigPath, 'utf-8'));
      expect(savedConfig.templates['auto-save-template']).toBeDefined();
    });

    test('应该处理配置文件权限错误', async () => {
      // 尝试保存到无效路径应该抛出错误
      const invalidPath = '\0invalid\0path\0config.json'; // 包含空字符的无效路径

      // 尝试保存到无效位置应该抛出错误
      await expect(constraintSystem.saveConfigToFile(invalidPath))
        .rejects.toThrow();
    });

    test('应该处理损坏的配置文件', async () => {
      // 创建损坏的JSON文件
      fs.writeFileSync(jsonConfigPath, '{ invalid json content');

      // 尝试加载损坏的配置应该抛出错误
      await expect(constraintSystem.loadConfigFromFile(jsonConfigPath))
        .rejects.toThrow();
    });
  });

  describe('配置文件格式兼容性', () => {
    test('应该能够在JSON和YAML格式之间转换', async () => {
      // 创建JSON配置
      const originalConfig = {
        templates: {
          'convert-template': {
            templateType: 'custom',
            language: 'auto',
            includeProjectContext: true,
            customRules: ['转换约束'],
            strictMode: false,
            maxConstraintLength: 2000
          }
        }
      };

      fs.writeFileSync(jsonConfigPath, JSON.stringify(originalConfig, null, 2));

      // 从JSON加载
      await constraintSystem.loadConfigFromFile(jsonConfigPath);

      // 保存为YAML
      await constraintSystem.saveConfigToFile(yamlConfigPath);

      // 验证YAML文件内容
      const yamlConfig = yaml.load(fs.readFileSync(yamlConfigPath, 'utf-8')) as any;
      expect(yamlConfig.templates['convert-template']).toBeDefined();
      expect(yamlConfig.templates['convert-template'].customRules).toContain('转换约束');
      expect(yamlConfig.templates['convert-template'].templateType).toBe('custom');
    });

    test('应该能够处理不同版本的配置文件格式', async () => {
      // 创建旧版本格式的配置文件（模拟向后兼容）
      const legacyConfig = {
        templates: {
          'legacy-template': {
            templateType: 'custom',
            language: 'auto',
            includeProjectContext: true,
            customRules: ['旧版约束']
            // 注意：没有strictMode和maxConstraintLength字段
          }
        }
      };

      fs.writeFileSync(jsonConfigPath, JSON.stringify(legacyConfig, null, 2));

      // 加载配置应该成功，并为缺失字段提供默认值
      await constraintSystem.loadConfigFromFile(jsonConfigPath);

      const templates = await constraintSystem.getConfigTemplates();
      expect(templates['legacy-template']).toBeDefined();
      expect(templates['legacy-template'].strictMode).toBeDefined(); // 应该有默认值
      expect(templates['legacy-template'].maxConstraintLength).toBeDefined(); // 应该有默认值
    });
  });
});
