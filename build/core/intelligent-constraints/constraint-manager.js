/**
 * 约束管理器 - 管理约束状态和会话
 */
import { Logger } from '../../utils/logger/index.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname } from 'path';
import { mkdirSync } from 'fs';
import * as yaml from 'js-yaml';
/**
 * 约束管理器实现
 */
export class ConstraintManager {
    logger;
    sessions;
    globalConfig;
    stats;
    configTemplates;
    configFilePath;
    constructor(globalConfig, configFilePath) {
        this.logger = new Logger('ConstraintManager');
        this.sessions = new Map();
        this.configTemplates = new Map();
        this.configFilePath = configFilePath || '';
        this.globalConfig = {
            defaultLanguage: 'auto',
            defaultTemplateType: 'default',
            enableAutoDetection: true,
            maxSessionDuration: 24 * 60 * 60 * 1000, // 24小时
            supportedCommands: ['.use interface', '.使用接口', '.apply constraints'],
            enableLogging: true,
            ...globalConfig
        };
        this.stats = {
            totalActivations: 0,
            totalApplications: 0,
            successRate: 0,
            averageProcessingTime: 0,
            mostUsedTemplates: [],
            errorCount: 0
        };
        // 初始化默认模板
        this.initializeDefaultTemplates();
        // 如果提供了配置文件路径，尝试加载
        if (this.configFilePath && existsSync(this.configFilePath)) {
            this.loadConfigFromFile(this.configFilePath).catch(error => {
                this.logger.warn('Failed to load config file on initialization', { error });
            });
        }
        this.logger.info('ConstraintManager initialized', {
            globalConfig: this.globalConfig,
            configFilePath: this.configFilePath,
            templatesCount: this.configTemplates.size
        });
    }
    /**
     * 激活约束模式
     */
    activateConstraints(sessionId, config) {
        try {
            const defaultConfig = {
                templateType: this.globalConfig.defaultTemplateType,
                language: this.globalConfig.defaultLanguage,
                includeProjectContext: true,
                customRules: [],
                strictMode: false,
                maxConstraintLength: 2000
            };
            const finalConfig = { ...defaultConfig, ...config };
            const sessionState = {
                sessionId,
                isActive: true,
                config: finalConfig,
                activatedAt: new Date(),
                lastUsedAt: new Date(),
                usageCount: 0,
                metadata: {
                    userAgent: 'mcp-interface-validator',
                    version: '1.0.0'
                }
            };
            this.sessions.set(sessionId, sessionState);
            this.stats.totalActivations++;
            this.logger.info('Constraints activated for session', {
                sessionId,
                config: finalConfig
            });
        }
        catch (error) {
            this.logger.error('Failed to activate constraints', { sessionId, error });
            this.stats.errorCount++;
            throw error;
        }
    }
    /**
     * 停用约束模式
     */
    deactivateConstraints(sessionId) {
        try {
            const session = this.sessions.get(sessionId);
            if (session) {
                session.isActive = false;
                this.sessions.delete(sessionId);
                this.logger.info('Constraints deactivated for session', {
                    sessionId,
                    usageCount: session.usageCount,
                    duration: Date.now() - session.activatedAt.getTime()
                });
            }
            else {
                this.logger.warn('Attempted to deactivate non-existent session', { sessionId });
            }
        }
        catch (error) {
            this.logger.error('Failed to deactivate constraints', { sessionId, error });
            this.stats.errorCount++;
            throw error;
        }
    }
    /**
     * 检查约束是否激活
     */
    isConstraintActive(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }
        // 检查会话是否过期
        const now = Date.now();
        const sessionAge = now - session.activatedAt.getTime();
        if (sessionAge > this.globalConfig.maxSessionDuration) {
            this.logger.info('Session expired, deactivating', { sessionId, age: sessionAge });
            this.deactivateConstraints(sessionId);
            return false;
        }
        return session.isActive;
    }
    /**
     * 获取约束配置
     */
    getConstraintConfig(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session && this.isConstraintActive(sessionId)) {
            // 更新最后使用时间
            session.lastUsedAt = new Date();
            session.usageCount++;
            return session.config;
        }
        return null;
    }
    /**
     * 更新约束配置
     */
    updateConstraintConfig(sessionId, config) {
        try {
            const session = this.sessions.get(sessionId);
            if (session && this.isConstraintActive(sessionId)) {
                session.config = { ...session.config, ...config };
                session.lastUsedAt = new Date();
                this.logger.info('Constraint config updated', {
                    sessionId,
                    newConfig: config
                });
            }
            else {
                throw new Error(`No active session found for sessionId: ${sessionId}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to update constraint config', { sessionId, error });
            this.stats.errorCount++;
            throw error;
        }
    }
    /**
     * 获取会话状态
     */
    getSessionState(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session && this.isConstraintActive(sessionId)) {
            return { ...session }; // 返回副本
        }
        return null;
    }
    /**
     * 获取所有活跃会话
     */
    getAllActiveSessions() {
        const activeSessions = [];
        for (const [sessionId, session] of this.sessions) {
            if (this.isConstraintActive(sessionId)) {
                activeSessions.push({ ...session });
            }
        }
        return activeSessions;
    }
    /**
     * 清理过期会话
     */
    cleanupExpiredSessions() {
        let cleanedCount = 0;
        const now = Date.now();
        for (const [sessionId, session] of this.sessions) {
            const sessionAge = now - session.activatedAt.getTime();
            if (sessionAge > this.globalConfig.maxSessionDuration) {
                this.sessions.delete(sessionId);
                cleanedCount++;
                this.logger.debug('Cleaned up expired session', {
                    sessionId,
                    age: sessionAge,
                    usageCount: session.usageCount
                });
            }
        }
        if (cleanedCount > 0) {
            this.logger.info('Cleaned up expired sessions', { count: cleanedCount });
        }
        return cleanedCount;
    }
    /**
     * 获取统计信息
     */
    getStats() {
        // 计算成功率
        const totalOperations = this.stats.totalActivations + this.stats.totalApplications;
        this.stats.successRate = totalOperations > 0
            ? ((totalOperations - this.stats.errorCount) / totalOperations) * 100
            : 100;
        return { ...this.stats };
    }
    /**
     * 更新统计信息
     */
    updateStats(operation, processingTime) {
        switch (operation) {
            case 'application':
                this.stats.totalApplications++;
                if (processingTime) {
                    // 更新平均处理时间
                    const totalTime = this.stats.averageProcessingTime * (this.stats.totalApplications - 1);
                    this.stats.averageProcessingTime = (totalTime + processingTime) / this.stats.totalApplications;
                }
                break;
            case 'error':
                this.stats.errorCount++;
                break;
        }
    }
    /**
     * 获取全局配置
     */
    getGlobalConfig() {
        return { ...this.globalConfig };
    }
    /**
     * 更新全局配置
     */
    updateGlobalConfig(config) {
        this.globalConfig = { ...this.globalConfig, ...config };
        this.logger.info('Global config updated', { newConfig: config });
    }
    /**
     * 重置统计信息
     */
    resetStats() {
        this.stats = {
            totalActivations: 0,
            totalApplications: 0,
            successRate: 0,
            averageProcessingTime: 0,
            mostUsedTemplates: [],
            errorCount: 0
        };
        this.logger.info('Stats reset');
    }
    /**
     * 从文件加载配置
     */
    async loadConfigFromFile(filePath) {
        try {
            this.logger.info('Loading config from file', { filePath });
            if (!existsSync(filePath)) {
                throw new Error(`Config file not found: ${filePath}`);
            }
            const fileContent = readFileSync(filePath, 'utf-8');
            let configData;
            // 根据文件扩展名解析
            if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
                configData = yaml.load(fileContent);
            }
            else if (filePath.endsWith('.json')) {
                configData = JSON.parse(fileContent);
            }
            else {
                throw new Error(`Unsupported config file format: ${filePath}`);
            }
            // 验证配置版本
            if (!configData.version) {
                this.logger.warn('Config file missing version, assuming latest');
            }
            // 更新全局配置
            if (configData.global) {
                this.globalConfig = { ...this.globalConfig, ...configData.global };
            }
            // 加载模板
            if (configData.templates) {
                this.configTemplates.clear();
                for (const [name, template] of Object.entries(configData.templates)) {
                    // 为缺失的字段设置默认值
                    const normalizedTemplate = {
                        templateType: template.templateType || 'default',
                        language: template.language || 'auto',
                        includeProjectContext: template.includeProjectContext !== undefined ? template.includeProjectContext : true,
                        customRules: template.customRules || [],
                        strictMode: template.strictMode !== undefined ? template.strictMode : false,
                        maxConstraintLength: template.maxConstraintLength || 2000
                    };
                    this.configTemplates.set(name, normalizedTemplate);
                }
            }
            this.configFilePath = filePath;
            this.logger.info('Config loaded successfully', {
                templatesCount: this.configTemplates.size,
                globalConfig: this.globalConfig
            });
        }
        catch (error) {
            this.logger.error('Failed to load config from file', { filePath, error });
            throw error;
        }
    }
    /**
     * 保存配置到文件
     */
    async saveConfigToFile(filePath) {
        try {
            this.logger.info('Saving config to file', { filePath });
            const configData = {
                version: '1.0.0',
                global: this.globalConfig,
                templates: Object.fromEntries(this.configTemplates)
            };
            // 确保目录存在
            const dir = dirname(filePath);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
            let fileContent;
            // 根据文件扩展名格式化
            if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
                fileContent = yaml.dump(configData, { indent: 2 });
            }
            else if (filePath.endsWith('.json')) {
                fileContent = JSON.stringify(configData, null, 2);
            }
            else {
                throw new Error(`Unsupported config file format: ${filePath}`);
            }
            writeFileSync(filePath, fileContent, 'utf-8');
            this.configFilePath = filePath;
            this.logger.info('Config saved successfully', { filePath });
        }
        catch (error) {
            this.logger.error('Failed to save config to file', { filePath, error });
            throw error;
        }
    }
    /**
     * 获取配置模板
     */
    getConfigTemplates() {
        return Object.fromEntries(this.configTemplates);
    }
    /**
     * 添加模板
     */
    addTemplate(name, template) {
        try {
            this.configTemplates.set(name, { ...template });
            this.logger.info('Template added', { name, template });
            // 如果有配置文件路径，自动保存
            if (this.configFilePath) {
                this.saveConfigToFile(this.configFilePath).catch(error => {
                    this.logger.warn('Failed to auto-save config after adding template', { error });
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to add template', { name, error });
            throw error;
        }
    }
    /**
     * 移除模板
     */
    removeTemplate(name) {
        try {
            const removed = this.configTemplates.delete(name);
            if (removed) {
                this.logger.info('Template removed', { name });
                // 如果有配置文件路径，自动保存
                if (this.configFilePath) {
                    this.saveConfigToFile(this.configFilePath).catch(error => {
                        this.logger.warn('Failed to auto-save config after removing template', { error });
                    });
                }
            }
            return removed;
        }
        catch (error) {
            this.logger.error('Failed to remove template', { name, error });
            return false;
        }
    }
    /**
     * 获取模板
     */
    getTemplate(name) {
        const template = this.configTemplates.get(name);
        return template ? { ...template } : null;
    }
    /**
     * 列出所有模板名称
     */
    listTemplates() {
        return Array.from(this.configTemplates.keys());
    }
    /**
     * 初始化默认模板
     */
    initializeDefaultTemplates() {
        // 默认模板
        this.configTemplates.set('default', {
            templateType: 'default',
            language: 'auto',
            includeProjectContext: true,
            customRules: [],
            strictMode: false,
            maxConstraintLength: 2000
        });
        // 严格模式模板
        this.configTemplates.set('strict', {
            templateType: 'strict',
            language: 'auto',
            includeProjectContext: true,
            customRules: [
                '必须包含完整的错误处理',
                '必须包含输入验证',
                '必须遵循安全最佳实践'
            ],
            strictMode: true,
            maxConstraintLength: 3000
        });
        // API开发模板
        this.configTemplates.set('api', {
            templateType: 'custom',
            language: 'auto',
            includeProjectContext: true,
            customRules: [
                '严格遵循OpenAPI 3.0规范',
                '必须包含完整的请求/响应定义',
                '必须实现适当的HTTP状态码',
                '必须包含API文档注释'
            ],
            strictMode: true,
            maxConstraintLength: 2500
        });
        // 前端开发模板
        this.configTemplates.set('frontend', {
            templateType: 'custom',
            language: 'auto',
            includeProjectContext: true,
            customRules: [
                '必须遵循组件化设计原则',
                '必须包含TypeScript类型定义',
                '必须实现响应式设计',
                '必须考虑无障碍访问性'
            ],
            strictMode: false,
            maxConstraintLength: 2200
        });
        // 测试开发模板
        this.configTemplates.set('testing', {
            templateType: 'custom',
            language: 'auto',
            includeProjectContext: true,
            customRules: [
                '必须包含单元测试',
                '必须包含集成测试',
                '必须达到80%以上的代码覆盖率',
                '必须包含边界条件测试'
            ],
            strictMode: true,
            maxConstraintLength: 2800
        });
        this.logger.info('Default templates initialized', {
            count: this.configTemplates.size,
            templates: this.listTemplates()
        });
    }
    /**
     * 销毁管理器
     */
    destroy() {
        this.sessions.clear();
        this.configTemplates.clear();
        this.logger.info('ConstraintManager destroyed');
    }
}
//# sourceMappingURL=constraint-manager.js.map