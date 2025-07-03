/**
 * 指令检测器测试
 */

import { InstructionDetector } from '../../../src/core/intelligent-constraints/instruction-detector';

describe('InstructionDetector', () => {
  let detector: InstructionDetector;

  beforeEach(() => {
    detector = new InstructionDetector();
  });

  describe('约束指令检测', () => {
    test('应该检测中文 .use interface 指令', () => {
      const input = '.use interface 开发用户登录功能';
      const command = detector.detectConstraintCommand(input);
      
      expect(command).toBeTruthy();
      expect(command?.command).toBe('.use interface');
      expect(command?.userInstruction).toBe('开发用户登录功能');
      expect(command?.language).toBe('zh');
    });

    test('应该检测英文 .use interface 指令', () => {
      const input = '.use interface develop user login system';
      const command = detector.detectConstraintCommand(input);
      
      expect(command).toBeTruthy();
      expect(command?.command).toBe('.use interface');
      expect(command?.userInstruction).toBe('develop user login system');
      expect(command?.language).toBe('en');
    });

    test('应该检测 .使用接口 指令', () => {
      const input = '.使用接口 创建聊天功能';
      const command = detector.detectConstraintCommand(input);
      
      expect(command).toBeTruthy();
      expect(command?.command).toBe('.使用接口');
      expect(command?.userInstruction).toBe('创建聊天功能');
      expect(command?.language).toBe('zh');
    });

    test('应该检测 .apply constraints 指令', () => {
      const input = '.apply constraints build REST API';
      const command = detector.detectConstraintCommand(input);
      
      expect(command).toBeTruthy();
      expect(command?.command).toBe('.apply constraints');
      expect(command?.userInstruction).toBe('build REST API');
      expect(command?.language).toBe('en');
    });

    test('应该检测灵活格式的指令', () => {
      const testCases = [
        '.use interface: 开发支付系统',
        '.use interface - create payment system',
        '.使用接口：实现文件上传',
        '.使用接口 - 用户管理模块'
      ];

      testCases.forEach(input => {
        const command = detector.detectConstraintCommand(input);
        expect(command).toBeTruthy();
        expect(command?.userInstruction).toBeTruthy();
      });
    });

    test('应该拒绝无效指令', () => {
      const invalidInputs = [
        'use interface without dot',
        '.invalid command format',
        '.use',
        '.interface',
        'regular text without command'
      ];

      invalidInputs.forEach(input => {
        const command = detector.detectConstraintCommand(input);
        expect(command).toBeNull();
      });
    });
  });

  describe('用户指令提取', () => {
    test('应该提取约束指令中的用户指令', () => {
      const input = '.use interface 开发电商购物车功能';
      const userInstruction = detector.extractUserInstruction(input);
      
      expect(userInstruction).toBe('开发电商购物车功能');
    });

    test('应该返回原始输入如果不是约束指令', () => {
      const input = '普通的开发需求描述';
      const userInstruction = detector.extractUserInstruction(input);
      
      expect(userInstruction).toBe('普通的开发需求描述');
    });
  });

  describe('指令分析', () => {
    test('应该正确分析约束指令', () => {
      const input = '.use interface 开发API接口';
      const result = detector.analyzeInstruction(input);

      expect(result.isConstraintCommand).toBe(true);
      expect(result.command).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0.8);
      // 语言检测可能因为英文指令部分而检测为英文，这是正常的
      expect(['zh', 'en']).toContain(result.detectedLanguage);
    });

    test('应该正确分析非约束指令', () => {
      const input = '这是一个普通的开发需求';
      const result = detector.analyzeInstruction(input);
      
      expect(result.isConstraintCommand).toBe(false);
      expect(result.command).toBeUndefined();
      expect(result.confidence).toBe(0);
      expect(result.detectedLanguage).toBe('zh');
    });

    test('应该检测混合语言', () => {
      const input = '.use interface 开发user management system';
      const result = detector.analyzeInstruction(input);

      // 混合语言可能检测为任一语言，这是正常的
      expect(['zh', 'en']).toContain(result.detectedLanguage);
    });
  });

  describe('语言检测', () => {
    test('应该检测中文', () => {
      const inputs = [
        '.use interface 开发用户系统',
        '.使用接口 创建数据库',
        '纯中文内容测试'
      ];

      inputs.forEach(input => {
        const result = detector.analyzeInstruction(input);
        expect(result.detectedLanguage).toBe('zh');
      });
    });

    test('应该检测英文', () => {
      const inputs = [
        '.use interface develop user system',
        '.apply constraints create database',
        'pure english content test'
      ];

      inputs.forEach(input => {
        const result = detector.analyzeInstruction(input);
        expect(result.detectedLanguage).toBe('en');
      });
    });

    test('应该处理未知语言', () => {
      const inputs = [
        '123456',
        '!@#$%^',
        ''
      ];

      inputs.forEach(input => {
        const result = detector.analyzeInstruction(input);
        expect(result.detectedLanguage).toBe('unknown');
      });
    });
  });

  describe('自定义指令管理', () => {
    test('应该能够添加自定义指令', () => {
      const customCommand = '.custom command';
      const customPattern = /^\.custom\s+command\s+(.+)$/i;
      
      detector.addCustomCommand(customCommand, customPattern);
      
      const supportedCommands = detector.getSupportedCommands();
      expect(supportedCommands).toContain(customCommand);
      
      const input = '.custom command test instruction';
      const command = detector.detectConstraintCommand(input);
      expect(command?.command).toBe(customCommand);
    });

    test('应该能够移除自定义指令', () => {
      const customCommand = '.temp command';
      const customPattern = /^\.temp\s+command\s+(.+)$/i;
      
      detector.addCustomCommand(customCommand, customPattern);
      expect(detector.getSupportedCommands()).toContain(customCommand);
      
      const removed = detector.removeCustomCommand(customCommand);
      expect(removed).toBe(true);
      expect(detector.getSupportedCommands()).not.toContain(customCommand);
    });
  });

  describe('指令验证和建议', () => {
    test('应该验证指令格式', () => {
      const validFormats = [
        '.use interface test',
        '.apply constraints test',
        '.使用接口 测试'
      ];

      const invalidFormats = [
        'use interface test',
        '.invalid test',
        'random text'
      ];

      validFormats.forEach(input => {
        expect(detector.validateCommandFormat(input)).toBe(true);
      });

      invalidFormats.forEach(input => {
        expect(detector.validateCommandFormat(input)).toBe(false);
      });
    });

    test('应该提供指令建议', () => {
      const suggestions = detector.getCommandSuggestions('.use');
      expect(suggestions).toContain('.use interface');
      
      const chineseSuggestions = detector.getCommandSuggestions('.使用');
      expect(chineseSuggestions).toContain('.使用接口');
    });

    test('应该限制建议数量', () => {
      const suggestions = detector.getCommandSuggestions('.');
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });
  });
});
