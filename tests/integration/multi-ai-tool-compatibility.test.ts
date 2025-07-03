/**
 * 多AI工具兼容性测试
 * 测试智能约束系统与不同AI工具的集成兼容性
 */

import { IntelligentConstraintSystem } from '../../src/core/intelligent-constraints';
import { IntelligentContextAnalyzer } from '../../src/core/intelligent-context';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';

describe('多AI工具兼容性测试', () => {
  let constraintSystem: IntelligentConstraintSystem;
  let tempDir: string;
  let configPath: string;

  beforeEach(async () => {
    // 创建临时目录和配置文件
    tempDir = fs.mkdtempSync(path.join(tmpdir(), 'multi-ai-tool-'));
    configPath = path.join(tempDir, 'constraint-config.json');

    // 创建测试配置文件
    const testConfig = {
      templates: {
        cursor: {
          name: 'cursor',
          description: 'Cursor AI工具专用模板',
          keywords: ['cursor', 'ide', 'editor'],
          priority: 2,
          constraints: [
            '请确保代码符合Cursor IDE的最佳实践',
            '请使用适当的代码注释和文档',
            '请考虑代码的可读性和维护性'
          ]
        },
        windsurf: {
          name: 'windsurf',
          description: 'Windsurf AI工具专用模板',
          keywords: ['windsurf', 'development', 'workflow'],
          priority: 2,
          constraints: [
            '请遵循Windsurf开发工作流程',
            '请确保代码质量和性能优化',
            '请实现适当的错误处理机制'
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

    // 初始化系统
    const contextAnalyzer = new IntelligentContextAnalyzer();
    constraintSystem = new IntelligentConstraintSystem(contextAnalyzer, {}, configPath);

    // 加载配置
    const constraintManager = (constraintSystem as any).constraintManager;
    await constraintManager.loadConfigFromFile(configPath);
  });

  afterEach(() => {
    // 清理临时文件
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('基本功能测试', () => {
    test('应该能够处理Cursor相关请求', async () => {
      const userInput = '.use interface 在Cursor IDE中开发React组件';
      const result = await constraintSystem.processUserInput(userInput, 'cursor-session');

      expect(result.isConstraintCommand).toBe(true);
      expect(result.result).toBeDefined();
    });

    test('应该能够处理Windsurf相关请求', async () => {
      const userInput = '.use interface 在Windsurf环境中开发微服务';
      const result = await constraintSystem.processUserInput(userInput, 'windsurf-session');

      expect(result.isConstraintCommand).toBe(true);
      expect(result.result).toBeDefined();
    });

    test('应该能够处理非约束指令', async () => {
      const userInput = '普通的开发请求';
      const result = await constraintSystem.processUserInput(userInput, 'test-session');

      expect(result.isConstraintCommand).toBe(false);
    });
  });

});
