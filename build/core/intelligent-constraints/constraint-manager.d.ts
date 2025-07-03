/**
 * 约束管理器 - 管理约束状态和会话
 */
import type { ConstraintConfig, GlobalConstraintConfig, SessionState, ConstraintStats, ProjectConstraintConfig } from './types.js';
/**
 * 配置文件格式
 */
export interface ConstraintConfigFile {
    version: string;
    global: GlobalConstraintConfig;
    templates: Record<string, ConstraintConfig>;
    aiTools?: Record<string, any>;
    project?: ProjectConstraintConfig;
}
/**
 * 约束管理器接口
 */
export interface IConstraintManager {
    activateConstraints(sessionId: string, config?: ConstraintConfig): void;
    deactivateConstraints(sessionId: string): void;
    isConstraintActive(sessionId: string): boolean;
    getConstraintConfig(sessionId: string): ConstraintConfig | null;
    updateConstraintConfig(sessionId: string, config: ConstraintConfig): void;
    getSessionState(sessionId: string): SessionState | null;
    getAllActiveSessions(): SessionState[];
    cleanupExpiredSessions(): number;
    getStats(): ConstraintStats;
    loadConfigFromFile(filePath: string): Promise<void>;
    saveConfigToFile(filePath: string): Promise<void>;
    getConfigTemplates(): Record<string, ConstraintConfig>;
    addTemplate(name: string, template: ConstraintConfig): void;
    removeTemplate(name: string): boolean;
    getTemplate(name: string): ConstraintConfig | null;
    listTemplates(): string[];
}
/**
 * 约束管理器实现
 */
export declare class ConstraintManager implements IConstraintManager {
    private logger;
    private sessions;
    private globalConfig;
    private stats;
    private configTemplates;
    private configFilePath?;
    constructor(globalConfig?: Partial<GlobalConstraintConfig>, configFilePath?: string);
    /**
     * 激活约束模式
     */
    activateConstraints(sessionId: string, config?: ConstraintConfig): void;
    /**
     * 停用约束模式
     */
    deactivateConstraints(sessionId: string): void;
    /**
     * 检查约束是否激活
     */
    isConstraintActive(sessionId: string): boolean;
    /**
     * 获取约束配置
     */
    getConstraintConfig(sessionId: string): ConstraintConfig | null;
    /**
     * 更新约束配置
     */
    updateConstraintConfig(sessionId: string, config: ConstraintConfig): void;
    /**
     * 获取会话状态
     */
    getSessionState(sessionId: string): SessionState | null;
    /**
     * 获取所有活跃会话
     */
    getAllActiveSessions(): SessionState[];
    /**
     * 清理过期会话
     */
    cleanupExpiredSessions(): number;
    /**
     * 获取统计信息
     */
    getStats(): ConstraintStats;
    /**
     * 更新统计信息
     */
    updateStats(operation: 'application' | 'error', processingTime?: number): void;
    /**
     * 获取全局配置
     */
    getGlobalConfig(): GlobalConstraintConfig;
    /**
     * 更新全局配置
     */
    updateGlobalConfig(config: Partial<GlobalConstraintConfig>): void;
    /**
     * 重置统计信息
     */
    resetStats(): void;
    /**
     * 从文件加载配置
     */
    loadConfigFromFile(filePath: string): Promise<void>;
    /**
     * 保存配置到文件
     */
    saveConfigToFile(filePath: string): Promise<void>;
    /**
     * 获取配置模板
     */
    getConfigTemplates(): Record<string, ConstraintConfig>;
    /**
     * 添加模板
     */
    addTemplate(name: string, template: ConstraintConfig): void;
    /**
     * 移除模板
     */
    removeTemplate(name: string): boolean;
    /**
     * 获取模板
     */
    getTemplate(name: string): ConstraintConfig | null;
    /**
     * 列出所有模板名称
     */
    listTemplates(): string[];
    /**
     * 初始化默认模板
     */
    private initializeDefaultTemplates;
    /**
     * 销毁管理器
     */
    destroy(): void;
}
//# sourceMappingURL=constraint-manager.d.ts.map