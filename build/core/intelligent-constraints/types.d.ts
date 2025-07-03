/**
 * 智能约束系统类型定义
 */
/**
 * 约束指令
 */
export interface ConstraintCommand {
    command: string;
    userInstruction: string;
    options?: any;
    language?: 'zh' | 'en';
}
/**
 * 约束配置
 */
export interface ConstraintConfig {
    templateType: 'default' | 'strict' | 'custom';
    language: 'zh' | 'en' | 'auto';
    includeProjectContext: boolean;
    customRules?: string[];
    strictMode?: boolean;
    maxConstraintLength?: number;
}
/**
 * 全局约束配置
 */
export interface GlobalConstraintConfig {
    defaultLanguage: 'zh' | 'en' | 'auto';
    defaultTemplateType: 'default' | 'strict' | 'custom';
    enableAutoDetection: boolean;
    maxSessionDuration: number;
    supportedCommands: string[];
    enableLogging: boolean;
}
/**
 * 项目约束配置
 */
export interface ProjectConstraintConfig {
    apiBasePath: string;
    authenticationMethod: string;
    responseFormat: any;
    customConstraints: string[];
    excludedPaths: string[];
    strictMode: boolean;
    projectName?: string;
    version?: string;
}
/**
 * 约束模板
 */
export interface ConstraintTemplate {
    name: string;
    language: 'zh' | 'en';
    content: string;
    variables: string[];
    priority: number;
    category: 'api' | 'security' | 'quality' | 'custom';
}
/**
 * 配置模板
 */
export interface ConfigTemplate {
    name: string;
    description: string;
    category: 'development' | 'production' | 'testing' | 'custom';
    version: string;
    author?: string;
    tags: string[];
    config: ConstraintConfig;
    requirements?: string[];
    compatibility?: {
        minVersion?: string;
        maxVersion?: string;
        platforms?: string[];
    };
}
/**
 * 模板信息
 */
export interface TemplateInfo {
    name: string;
    language: 'zh' | 'en';
    category: string;
    description: string;
    variables: string[];
}
/**
 * 增强指令
 */
export interface EnhancedInstruction {
    originalInstruction: string;
    constraintPrompt: string;
    enhancedInstruction: string;
    metadata: {
        userIntent: any;
        appliedConstraints: string[];
        confidence: number;
        timestamp: Date;
        sessionId: string;
    };
}
/**
 * 增强选项
 */
export interface EnhanceOptions {
    preserveOriginalFormat?: boolean;
    includeMetadata?: boolean;
    customSeparator?: string;
    maxLength?: number;
}
/**
 * 会话状态
 */
export interface SessionState {
    sessionId: string;
    isActive: boolean;
    config: ConstraintConfig;
    activatedAt: Date;
    lastUsedAt: Date;
    usageCount: number;
    metadata?: any;
}
/**
 * 约束应用结果
 */
export interface ConstraintApplicationResult {
    success: boolean;
    enhancedInstruction?: EnhancedInstruction;
    error?: string;
    warnings?: string[];
    appliedConstraints: string[];
    processingTime: number;
}
/**
 * 项目上下文
 */
export interface ProjectContext {
    basePath?: string;
    authMethod?: string;
    responseFormat?: any;
    existingEndpoints?: string[];
    schemas?: any;
    securitySchemes?: any;
    customContext?: any;
}
/**
 * 约束统计
 */
export interface ConstraintStats {
    totalActivations: number;
    totalApplications: number;
    successRate: number;
    averageProcessingTime: number;
    mostUsedTemplates: string[];
    errorCount: number;
}
/**
 * 指令检测结果
 */
export interface InstructionDetectionResult {
    isConstraintCommand: boolean;
    command?: ConstraintCommand;
    confidence: number;
    detectedLanguage: 'zh' | 'en' | 'unknown';
}
/**
 * 约束验证结果
 */
export interface ConstraintValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
    appliedConstraints: string[];
}
//# sourceMappingURL=types.d.ts.map