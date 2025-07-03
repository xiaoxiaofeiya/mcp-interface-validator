/**
 * 智能约束系统主入口
 */

export * from './types.js';
export * from './constraint-manager.js';
export * from './constraint-template-engine.js';
export * from './instruction-detector.js';
export * from './instruction-enhancer.js';

import { Logger } from '../../utils/logger/index.js';
import { IntelligentContextAnalyzer } from '../intelligent-context/index.js';
import { ConstraintManager } from './constraint-manager.js';
import { ConstraintTemplateEngine } from './constraint-template-engine.js';
import { InstructionDetector } from './instruction-detector.js';
import { InstructionEnhancer } from './instruction-enhancer.js';
import type {
  ConstraintConfig,
  GlobalConstraintConfig,
  ProjectContext,
  ConstraintApplicationResult,
  ConstraintCommand
} from './types.js';

/**
 * 智能约束系统
 */
export class IntelligentConstraintSystem {
  private logger: Logger;
  private constraintManager: ConstraintManager;
  private templateEngine: ConstraintTemplateEngine;
  private instructionDetector: InstructionDetector;
  private instructionEnhancer: InstructionEnhancer;
  private contextAnalyzer: IntelligentContextAnalyzer;
  private isDestroyed: boolean = false;

  constructor(
    contextAnalyzer: IntelligentContextAnalyzer,
    globalConfig?: Partial<GlobalConstraintConfig>,
    configFilePath?: string
  ) {
    this.logger = new Logger('IntelligentConstraintSystem');
    this.contextAnalyzer = contextAnalyzer;

    // 初始化组件
    this.constraintManager = new ConstraintManager(globalConfig, configFilePath);
    this.templateEngine = new ConstraintTemplateEngine();
    this.instructionDetector = new InstructionDetector();
    this.instructionEnhancer = new InstructionEnhancer(
      this.contextAnalyzer,
      this.templateEngine
    );

    this.logger.info('IntelligentConstraintSystem initialized');
  }

  /**
   * 处理用户输入 - 主要入口点
   */
  async processUserInput(
    input: string,
    sessionId: string,
    projectContext?: ProjectContext
  ): Promise<{
    isConstraintCommand: boolean;
    result?: ConstraintApplicationResult;
    activationResult?: string;
    error?: string;
  }> {
    try {
      this.logger.debug('Processing user input', { input, sessionId });

      // 检测是否为约束指令
      const detectionResult = this.instructionDetector.analyzeInstruction(input);

      if (!detectionResult.isConstraintCommand) {
        // 检查是否有激活的约束会话
        const isConstraintActive = this.constraintManager.isConstraintActive(sessionId);
        if (isConstraintActive) {
          // 对普通指令应用约束
          const applicationResult = await this.applyConstraintsToInstruction(
            input,
            sessionId,
            projectContext || {}
          );

          return {
            isConstraintCommand: false,
            result: applicationResult
          };
        }

        return { isConstraintCommand: false };
      }

      const command = detectionResult.command!;

      // 验证用户指令是否存在
      if (!command.userInstruction || command.userInstruction.trim().length === 0) {
        return {
          isConstraintCommand: false,
          error: 'Missing user instruction. Please provide a description of what you want to develop after the constraint command.'
        };
      }
      
      // 激活约束模式
      const activationResult = await this.activateConstraints(
        sessionId,
        command,
        projectContext
      );

      // 应用约束到用户指令
      const applicationResult = await this.applyConstraintsToInstruction(
        command.userInstruction,
        sessionId,
        projectContext || {}
      );

      return {
        isConstraintCommand: true,
        result: applicationResult,
        activationResult
      };
    } catch (error) {
      this.logger.error('Failed to process user input', { input, sessionId, error });
      return {
        isConstraintCommand: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 激活约束模式
   */
  async activateConstraints(
    sessionId: string,
    command: ConstraintCommand,
    _projectContext?: ProjectContext
  ): Promise<string> {
    try {
      // 确定约束配置
      const config: ConstraintConfig = {
        templateType: 'default',
        language: command.language || 'auto',
        includeProjectContext: true,
        customRules: [],
        strictMode: false
      };

      // 激活约束
      this.constraintManager.activateConstraints(sessionId, config);

      // 生成激活确认消息
      const message = this.generateActivationMessage(command, config);
      
      this.logger.info('Constraints activated', { sessionId, command: command.command });
      
      return message;
    } catch (error) {
      this.logger.error('Failed to activate constraints', { sessionId, error });
      throw error;
    }
  }

  /**
   * 应用约束到指令
   */
  async applyConstraintsToInstruction(
    userInstruction: string,
    sessionId: string,
    projectContext: ProjectContext
  ): Promise<ConstraintApplicationResult> {
    try {
      // 获取约束配置
      const config = this.constraintManager.getConstraintConfig(sessionId);
      if (!config) {
        throw new Error('No active constraint session found');
      }

      // 应用约束
      const result = await this.instructionEnhancer.applyConstraints(
        userInstruction,
        config,
        projectContext
      );

      // 更新统计
      this.constraintManager.updateStats(
        result.success ? 'application' : 'error',
        result.processingTime
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to apply constraints to instruction', {
        userInstruction,
        sessionId,
        error
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        appliedConstraints: [],
        processingTime: 0
      };
    }
  }

  /**
   * 停用约束模式
   */
  deactivateConstraints(sessionId: string): boolean {
    try {
      this.constraintManager.deactivateConstraints(sessionId);
      this.logger.info('Constraints deactivated', { sessionId });
      return true;
    } catch (error) {
      this.logger.error('Failed to deactivate constraints', { sessionId, error });
      return false;
    }
  }

  /**
   * 检查约束状态
   */
  getConstraintStatus(sessionId: string): {
    isActive: boolean;
    config?: ConstraintConfig;
    stats?: any;
  } {
    if (this.isDestroyed) {
      throw new Error('IntelligentConstraintSystem has been destroyed');
    }

    const isActive = this.constraintManager.isConstraintActive(sessionId);
    const config = this.constraintManager.getConstraintConfig(sessionId);
    const stats = this.constraintManager.getStats();

    return {
      isActive,
      ...(config && { config }),
      stats
    };
  }

  /**
   * 获取支持的指令
   */
  getSupportedCommands(): string[] {
    return this.instructionDetector.getSupportedCommands();
  }

  /**
   * 获取可用模板
   */
  getAvailableTemplates() {
    return this.templateEngine.getAvailableTemplates();
  }

  /**
   * 注册自定义模板
   */
  registerCustomTemplate(name: string, template: any): void {
    this.templateEngine.registerCustomTemplate(name, template);
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions(): number {
    return this.constraintManager.cleanupExpiredSessions();
  }

  /**
   * 生成激活确认消息
   */
  private generateActivationMessage(
    command: ConstraintCommand,
    config: ConstraintConfig
  ): string {
    const isChineseCommand = command.language === 'zh' || 
      command.command.includes('使用') || 
      command.command.includes('接口');

    if (isChineseCommand) {
      return `✅ 接口约束模式已激活

🎯 **用户需求**: ${command.userInstruction}

📋 **约束配置**:
- 模板类型: ${this.getTemplateTypeDescription(config.templateType, 'zh')}
- 语言模式: ${config.language === 'auto' ? '自动检测' : config.language === 'zh' ? '中文' : '英文'}
- 项目上下文: ${config.includeProjectContext ? '已启用' : '已禁用'}

🚀 **下一步**: 系统将自动为您的开发需求注入接口验证约束，确保生成的代码符合OpenAPI规范和最佳实践。

💡 **提示**: 您现在可以继续描述具体的开发需求，系统会自动应用约束指导。`;
    } else {
      return `✅ Interface Constraint Mode Activated

🎯 **User Requirement**: ${command.userInstruction}

📋 **Constraint Configuration**:
- Template Type: ${this.getTemplateTypeDescription(config.templateType, 'en')}
- Language Mode: ${config.language === 'auto' ? 'Auto-detect' : config.language}
- Project Context: ${config.includeProjectContext ? 'Enabled' : 'Disabled'}

🚀 **Next Step**: The system will automatically inject interface validation constraints for your development needs, ensuring generated code complies with OpenAPI specifications and best practices.

💡 **Tip**: You can now continue describing your specific development requirements, and the system will automatically apply constraint guidance.`;
    }
  }

  /**
   * 获取模板类型描述
   */
  private getTemplateTypeDescription(templateType: string, language: 'zh' | 'en'): string {
    const descriptions = {
      zh: {
        default: '默认约束',
        strict: '严格约束',
        custom: '自定义约束'
      },
      en: {
        default: 'Default Constraints',
        strict: 'Strict Constraints',
        custom: 'Custom Constraints'
      }
    };

    return descriptions[language][templateType as keyof typeof descriptions.zh] || templateType;
  }

  /**
   * 获取系统统计信息
   */
  getSystemStats(): any {
    const constraintStats = this.constraintManager.getStats();
    const enhancementStats = this.instructionEnhancer.getEnhancementStats();
    const activeSessions = this.constraintManager.getAllActiveSessions();

    return {
      constraints: constraintStats,
      enhancements: enhancementStats,
      activeSessions: activeSessions.length,
      supportedCommands: this.getSupportedCommands().length,
      availableTemplates: this.getAvailableTemplates().length
    };
  }

  /**
   * 配置管理方法
   */

  /**
   * 从文件加载配置
   */
  async loadConfigFromFile(filePath: string): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('IntelligentConstraintSystem has been destroyed');
    }

    try {
      await this.constraintManager.loadConfigFromFile(filePath);
      this.logger.info('Configuration loaded from file', { filePath });
    } catch (error) {
      this.logger.error('Failed to load configuration from file', { filePath, error });
      throw error;
    }
  }

  /**
   * 保存配置到文件
   */
  async saveConfigToFile(filePath: string): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('IntelligentConstraintSystem has been destroyed');
    }

    try {
      await this.constraintManager.saveConfigToFile(filePath);
      this.logger.info('Configuration saved to file', { filePath });
    } catch (error) {
      this.logger.error('Failed to save configuration to file', { filePath, error });
      throw error;
    }
  }

  /**
   * 获取所有配置模板
   */
  getConfigTemplates(): Record<string, ConstraintConfig> {
    if (this.isDestroyed) {
      throw new Error('IntelligentConstraintSystem has been destroyed');
    }

    return this.constraintManager.getConfigTemplates();
  }

  /**
   * 添加配置模板
   */
  addConfigTemplate(name: string, template: ConstraintConfig): void {
    if (this.isDestroyed) {
      throw new Error('IntelligentConstraintSystem has been destroyed');
    }

    this.constraintManager.addTemplate(name, template);
    this.logger.info('Configuration template added', { name });
  }

  /**
   * 移除配置模板
   */
  removeConfigTemplate(name: string): boolean {
    if (this.isDestroyed) {
      throw new Error('IntelligentConstraintSystem has been destroyed');
    }

    const removed = this.constraintManager.removeTemplate(name);
    if (removed) {
      this.logger.info('Configuration template removed', { name });
    }
    return removed;
  }

  /**
   * 获取配置模板
   */
  getConfigTemplate(name: string): ConstraintConfig | null {
    if (this.isDestroyed) {
      throw new Error('IntelligentConstraintSystem has been destroyed');
    }

    return this.constraintManager.getTemplate(name);
  }

  /**
   * 列出所有配置模板名称
   */
  listConfigTemplates(): string[] {
    if (this.isDestroyed) {
      throw new Error('IntelligentConstraintSystem has been destroyed');
    }

    return this.constraintManager.listTemplates();
  }

  /**
   * 应用配置模板到会话
   */
  async applyConfigTemplate(sessionId: string, templateName: string): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('IntelligentConstraintSystem has been destroyed');
    }

    try {
      const template = this.constraintManager.getTemplate(templateName);
      if (!template) {
        throw new Error(`Configuration template not found: ${templateName}`);
      }

      this.constraintManager.updateConstraintConfig(sessionId, template);
      this.logger.info('Configuration template applied to session', { sessionId, templateName });
    } catch (error) {
      this.logger.error('Failed to apply configuration template', { sessionId, templateName, error });
      throw error;
    }
  }

  /**
   * 创建配置模板从当前会话
   */
  createConfigTemplateFromSession(sessionId: string, templateName: string): void {
    if (this.isDestroyed) {
      throw new Error('IntelligentConstraintSystem has been destroyed');
    }

    try {
      const currentConfig = this.constraintManager.getConstraintConfig(sessionId);
      if (!currentConfig) {
        throw new Error(`No active session found: ${sessionId}`);
      }

      this.constraintManager.addTemplate(templateName, currentConfig);
      this.logger.info('Configuration template created from session', { sessionId, templateName });
    } catch (error) {
      this.logger.error('Failed to create configuration template from session', { sessionId, templateName, error });
      throw error;
    }
  }

  /**
   * 销毁系统
   */
  destroy(): void {
    this.constraintManager.destroy();
    this.isDestroyed = true;
    this.logger.info('IntelligentConstraintSystem destroyed');
  }
}
