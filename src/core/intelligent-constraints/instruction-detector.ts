/**
 * 指令检测器 - 检测和解析约束指令
 */

import { Logger } from '../../utils/logger';
import type {
  ConstraintCommand,
  InstructionDetectionResult
} from './types';

/**
 * 指令检测器接口
 */
export interface IInstructionDetector {
  detectConstraintCommand(input: string): ConstraintCommand | null;
  extractUserInstruction(input: string): string;
  getSupportedCommands(): string[];
  analyzeInstruction(input: string): InstructionDetectionResult;
}

/**
 * 指令检测器实现
 */
export class InstructionDetector implements IInstructionDetector {
  private logger: Logger;
  private supportedCommands: string[];
  private commandPatterns: Map<string, RegExp>;

  constructor() {
    this.logger = new Logger('InstructionDetector');
    this.supportedCommands = [
      '.use interface',
      '.使用接口',
      '.apply constraints',
      '.应用约束',
      '.interface mode',
      '.接口模式'
    ];
    
    this.commandPatterns = new Map();
    this.initializeCommandPatterns();
    
    this.logger.info('InstructionDetector initialized', {
      supportedCommands: this.supportedCommands.length
    });
  }

  /**
   * 检测约束指令
   */
  detectConstraintCommand(input: string): ConstraintCommand | null {
    try {
      const trimmedInput = input.trim();
      
      // 检查每个支持的指令模式
      for (const [command, pattern] of this.commandPatterns) {
        const match = trimmedInput.match(pattern);
        if (match) {
          const userInstruction = this.extractInstructionFromMatch(trimmedInput, match);
          const detectedLang = this.detectLanguage(trimmedInput);
          const language = detectedLang === 'unknown' ? undefined : detectedLang;

          const constraintCommand: ConstraintCommand = {
            command,
            userInstruction,
            language: language || 'en',
            options: this.extractOptions(match)
          };

          this.logger.debug('Constraint command detected', {
            command,
            userInstruction,
            language
          });

          return constraintCommand;
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to detect constraint command', { input, error });
      return null;
    }
  }

  /**
   * 提取用户指令
   */
  extractUserInstruction(input: string): string {
    const command = this.detectConstraintCommand(input);
    if (command) {
      return command.userInstruction;
    }
    
    // 如果没有检测到约束指令，返回原始输入
    return input.trim();
  }

  /**
   * 获取支持的指令列表
   */
  getSupportedCommands(): string[] {
    return [...this.supportedCommands];
  }

  /**
   * 分析指令
   */
  analyzeInstruction(input: string): InstructionDetectionResult {
    const command = this.detectConstraintCommand(input);
    const language = this.detectLanguage(input);
    
    if (command) {
      return {
        isConstraintCommand: true,
        command,
        confidence: this.calculateConfidence(input, command),
        detectedLanguage: language
      };
    }

    return {
      isConstraintCommand: false,
      confidence: 0,
      detectedLanguage: language
    };
  }

  /**
   * 初始化指令模式
   */
  private initializeCommandPatterns(): void {
    // .use interface 模式 - 允许可选的用户指令
    this.commandPatterns.set('.use interface',
      /^\.use\s+interface(?:\s+(.+))?$/i
    );

    // .使用接口 模式 - 允许可选的用户指令
    this.commandPatterns.set('.使用接口',
      /^\.使用接口(?:\s+(.+))?$/
    );

    // .apply constraints 模式 - 允许可选的用户指令
    this.commandPatterns.set('.apply constraints',
      /^\.apply\s+constraints(?:\s+(.+))?$/i
    );

    // .应用约束 模式 - 允许可选的用户指令
    this.commandPatterns.set('.应用约束',
      /^\.应用约束(?:\s+(.+))?$/
    );

    // .interface mode 模式 - 允许可选的用户指令
    this.commandPatterns.set('.interface mode',
      /^\.interface\s+mode(?:\s+(.+))?$/i
    );

    // .接口模式 模式 - 允许可选的用户指令
    this.commandPatterns.set('.接口模式',
      /^\.接口模式(?:\s+(.+))?$/
    );

    // 更灵活的模式匹配 - 允许可选的用户指令
    this.commandPatterns.set('.use interface (flexible)',
      /^\.use\s+interface\s*[:\-]?\s*(.*)$/i
    );

    this.commandPatterns.set('.使用接口 (flexible)',
      /^\.使用接口\s*[：\-]?\s*(.*)$/
    );

    this.logger.debug('Command patterns initialized', {
      count: this.commandPatterns.size
    });
  }

  /**
   * 从匹配结果中提取指令
   */
  private extractInstructionFromMatch(input: string, match: RegExpMatchArray): string {
    // 获取捕获组中的用户指令
    const userInstruction = match[1]?.trim() || '';
    
    if (!userInstruction) {
      // 如果没有捕获到指令，尝试从输入中提取
      const parts = input.split(/\s+/);
      if (parts.length > 2) {
        return parts.slice(2).join(' ').trim();
      }
    }

    return userInstruction;
  }

  /**
   * 检测语言
   */
  private detectLanguage(input: string): 'zh' | 'en' | 'unknown' {
    // 检查中文字符
    const chinesePattern = /[\u4e00-\u9fff]/;
    const hasChineseChars = chinesePattern.test(input);

    // 检查英文单词
    const englishPattern = /[a-zA-Z]{2,}/;
    const hasEnglishWords = englishPattern.test(input);

    if (hasChineseChars && !hasEnglishWords) {
      return 'zh';
    } else if (hasEnglishWords && !hasChineseChars) {
      return 'en';
    } else if (hasChineseChars && hasEnglishWords) {
      // 混合语言，根据中文字符比例判断
      const chineseCharCount = (input.match(/[\u4e00-\u9fff]/g) || []).length;
      const totalCharCount = input.replace(/\s/g, '').length;
      const chineseRatio = chineseCharCount / totalCharCount;
      
      return chineseRatio > 0.3 ? 'zh' : 'en';
    }

    return 'unknown';
  }

  /**
   * 提取选项
   */
  private extractOptions(_match: RegExpMatchArray): any {
    // 目前返回空对象，未来可以扩展支持选项解析
    // 例如：.use interface --strict 开发聊天功能
    return {};
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(_input: string, command: ConstraintCommand): number {
    let confidence = 0.8; // 基础置信度

    // 如果用户指令不为空，增加置信度
    if (command.userInstruction && command.userInstruction.length > 0) {
      confidence += 0.1;
    }

    // 如果用户指令长度合理，增加置信度
    if (command.userInstruction.length >= 3 && command.userInstruction.length <= 100) {
      confidence += 0.1;
    }

    // 如果检测到明确的语言，增加置信度
    if (command.language) {
      confidence += 0.05;
    }

    // 确保置信度在0-1范围内
    return Math.min(1.0, Math.max(0.0, confidence));
  }

  /**
   * 添加自定义指令模式
   */
  addCustomCommand(command: string, pattern: RegExp): void {
    if (!this.supportedCommands.includes(command)) {
      this.supportedCommands.push(command);
    }
    
    this.commandPatterns.set(command, pattern);
    
    this.logger.info('Custom command added', { command });
  }

  /**
   * 移除自定义指令模式
   */
  removeCustomCommand(command: string): boolean {
    const index = this.supportedCommands.indexOf(command);
    if (index > -1) {
      this.supportedCommands.splice(index, 1);
    }
    
    const removed = this.commandPatterns.delete(command);
    
    if (removed) {
      this.logger.info('Custom command removed', { command });
    }
    
    return removed;
  }

  /**
   * 验证指令格式
   */
  validateCommandFormat(input: string): boolean {
    const trimmed = input.trim();
    
    // 检查是否以点开头
    if (!trimmed.startsWith('.')) {
      return false;
    }

    // 检查是否包含支持的指令关键词
    const lowerInput = trimmed.toLowerCase();
    const keywords = ['use', 'interface', 'apply', 'constraints', '使用', '接口', '应用', '约束', '模式'];
    
    return keywords.some(keyword => lowerInput.includes(keyword));
  }

  /**
   * 获取指令建议
   */
  getCommandSuggestions(partialInput: string): string[] {
    const suggestions: string[] = [];
    const lowerInput = partialInput.toLowerCase().trim();

    for (const command of this.supportedCommands) {
      if (command.toLowerCase().startsWith(lowerInput)) {
        suggestions.push(command);
      }
    }

    return suggestions.slice(0, 5); // 最多返回5个建议
  }
}
