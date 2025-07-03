/**
 * 约束模板引擎 - 生成约束提示词模板
 */
import type { ConstraintTemplate, TemplateInfo, ConstraintConfig, ProjectContext } from './types';
import type { UserIntent } from '../intelligent-context/types';
/**
 * 约束模板引擎接口
 */
export interface IConstraintTemplateEngine {
    generateConstraintPrompt(userIntent: UserIntent, projectContext: ProjectContext, config: ConstraintConfig): string;
    getAvailableTemplates(): TemplateInfo[];
    registerCustomTemplate(name: string, template: ConstraintTemplate): void;
    removeCustomTemplate(name: string): boolean;
    getTemplate(name: string): ConstraintTemplate | null;
}
/**
 * 约束模板引擎实现
 */
export declare class ConstraintTemplateEngine implements IConstraintTemplateEngine {
    private logger;
    private templates;
    constructor();
    /**
     * 生成约束提示词
     */
    generateConstraintPrompt(userIntent: UserIntent, projectContext: ProjectContext, config: ConstraintConfig): string;
    /**
     * 获取可用模板列表
     */
    getAvailableTemplates(): TemplateInfo[];
    /**
     * 注册自定义模板
     */
    registerCustomTemplate(name: string, template: ConstraintTemplate): void;
    /**
     * 移除自定义模板
     */
    removeCustomTemplate(name: string): boolean;
    /**
     * 获取模板
     */
    getTemplate(name: string): ConstraintTemplate | null;
    /**
     * 初始化默认模板
     */
    private initializeDefaultTemplates;
    /**
     * 选择合适的模板
     */
    private selectTemplate;
    /**
     * 准备变量替换
     */
    private prepareVariables;
    /**
     * 替换模板变量
     */
    private replaceVariables;
    /**
     * 生成命名约定
     */
    private generateNamingConvention;
    /**
     * 格式化响应格式
     */
    private formatResponseFormat;
    /**
     * 生成自定义规则部分
     */
    private generateCustomRulesSection;
    /**
     * 截断提示词
     */
    private truncatePrompt;
    /**
     * 验证模板
     */
    private validateTemplate;
    /**
     * 检查是否为默认模板
     */
    private isDefaultTemplate;
    /**
     * 获取模板描述
     */
    private getTemplateDescription;
}
//# sourceMappingURL=constraint-template-engine.d.ts.map