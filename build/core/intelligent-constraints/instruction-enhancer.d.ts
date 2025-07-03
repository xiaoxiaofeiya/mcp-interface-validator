/**
 * 指令增强器 - 增强用户指令并注入约束
 */
import type { UserIntent } from '../intelligent-context/types';
import { IntelligentContextAnalyzer } from '../intelligent-context';
import type { EnhancedInstruction, EnhanceOptions, ConstraintApplicationResult, ConstraintConfig, ProjectContext } from './types';
import type { IConstraintTemplateEngine } from './constraint-template-engine';
/**
 * 指令增强器接口
 */
export interface IInstructionEnhancer {
    enhanceInstruction(userInstruction: string, constraintPrompt: string, options?: EnhanceOptions): EnhancedInstruction;
    analyzeUserIntent(instruction: string): Promise<UserIntent>;
    formatEnhancedInstruction(instruction: EnhancedInstruction): string;
    applyConstraints(userInstruction: string, config: ConstraintConfig, projectContext: ProjectContext): Promise<ConstraintApplicationResult>;
}
/**
 * 指令增强器实现
 */
export declare class InstructionEnhancer implements IInstructionEnhancer {
    private logger;
    private contextAnalyzer;
    private templateEngine;
    constructor(contextAnalyzer: IntelligentContextAnalyzer, templateEngine: IConstraintTemplateEngine);
    /**
     * 增强用户指令
     */
    enhanceInstruction(userInstruction: string, constraintPrompt: string, options?: EnhanceOptions): EnhancedInstruction;
    /**
     * 分析用户意图
     */
    analyzeUserIntent(instruction: string): Promise<UserIntent>;
    /**
     * 格式化增强指令
     */
    formatEnhancedInstruction(instruction: EnhancedInstruction): string;
    /**
     * 应用约束
     */
    applyConstraints(userInstruction: string, config: ConstraintConfig, projectContext: ProjectContext): Promise<ConstraintApplicationResult>;
    /**
     * 合并指令和约束
     */
    private combineInstructionAndConstraints;
    /**
     * 提取应用的约束
     */
    private extractAppliedConstraints;
    /**
     * 计算增强置信度
     */
    private calculateEnhancementConfidence;
    /**
     * 生成会话ID
     */
    private generateSessionId;
    /**
     * 获取默认选项
     */
    private getDefaultOptions;
    /**
     * 截断增强指令
     */
    private truncateEnhancedInstruction;
    /**
     * 验证增强结果
     */
    validateEnhancedInstruction(instruction: EnhancedInstruction): boolean;
    /**
     * 获取增强统计
     */
    getEnhancementStats(): any;
}
//# sourceMappingURL=instruction-enhancer.d.ts.map