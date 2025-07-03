/**
 * 智能约束系统主入口
 */
export * from './types';
export * from './constraint-manager';
export * from './constraint-template-engine';
export * from './instruction-detector';
export * from './instruction-enhancer';
import { IntelligentContextAnalyzer } from '../intelligent-context';
import type { ConstraintConfig, GlobalConstraintConfig, ProjectContext, ConstraintApplicationResult, ConstraintCommand } from './types';
/**
 * 智能约束系统
 */
export declare class IntelligentConstraintSystem {
    private logger;
    private constraintManager;
    private templateEngine;
    private instructionDetector;
    private instructionEnhancer;
    private contextAnalyzer;
    private isDestroyed;
    constructor(contextAnalyzer: IntelligentContextAnalyzer, globalConfig?: Partial<GlobalConstraintConfig>, configFilePath?: string);
    /**
     * 处理用户输入 - 主要入口点
     */
    processUserInput(input: string, sessionId: string, projectContext?: ProjectContext): Promise<{
        isConstraintCommand: boolean;
        result?: ConstraintApplicationResult;
        activationResult?: string;
        error?: string;
    }>;
    /**
     * 激活约束模式
     */
    activateConstraints(sessionId: string, command: ConstraintCommand, _projectContext?: ProjectContext): Promise<string>;
    /**
     * 应用约束到指令
     */
    applyConstraintsToInstruction(userInstruction: string, sessionId: string, projectContext: ProjectContext): Promise<ConstraintApplicationResult>;
    /**
     * 停用约束模式
     */
    deactivateConstraints(sessionId: string): boolean;
    /**
     * 检查约束状态
     */
    getConstraintStatus(sessionId: string): {
        isActive: boolean;
        config?: ConstraintConfig;
        stats?: any;
    };
    /**
     * 获取支持的指令
     */
    getSupportedCommands(): string[];
    /**
     * 获取可用模板
     */
    getAvailableTemplates(): import("./types").TemplateInfo[];
    /**
     * 注册自定义模板
     */
    registerCustomTemplate(name: string, template: any): void;
    /**
     * 清理过期会话
     */
    cleanupExpiredSessions(): number;
    /**
     * 生成激活确认消息
     */
    private generateActivationMessage;
    /**
     * 获取模板类型描述
     */
    private getTemplateTypeDescription;
    /**
     * 获取系统统计信息
     */
    getSystemStats(): any;
    /**
     * 配置管理方法
     */
    /**
     * 从文件加载配置
     */
    loadConfigFromFile(filePath: string): Promise<void>;
    /**
     * 保存配置到文件
     */
    saveConfigToFile(filePath: string): Promise<void>;
    /**
     * 获取所有配置模板
     */
    getConfigTemplates(): Record<string, ConstraintConfig>;
    /**
     * 添加配置模板
     */
    addConfigTemplate(name: string, template: ConstraintConfig): void;
    /**
     * 移除配置模板
     */
    removeConfigTemplate(name: string): boolean;
    /**
     * 获取配置模板
     */
    getConfigTemplate(name: string): ConstraintConfig | null;
    /**
     * 列出所有配置模板名称
     */
    listConfigTemplates(): string[];
    /**
     * 应用配置模板到会话
     */
    applyConfigTemplate(sessionId: string, templateName: string): Promise<void>;
    /**
     * 创建配置模板从当前会话
     */
    createConfigTemplateFromSession(sessionId: string, templateName: string): void;
    /**
     * 销毁系统
     */
    destroy(): void;
}
//# sourceMappingURL=index.d.ts.map