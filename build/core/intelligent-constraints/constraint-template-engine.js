/**
 * 约束模板引擎 - 生成约束提示词模板
 */
import { Logger } from '../../utils/logger';
/**
 * 约束模板引擎实现
 */
export class ConstraintTemplateEngine {
    logger;
    templates;
    constructor() {
        this.logger = new Logger('ConstraintTemplateEngine');
        this.templates = new Map();
        this.initializeDefaultTemplates();
        this.logger.info('ConstraintTemplateEngine initialized');
    }
    /**
     * 生成约束提示词
     */
    generateConstraintPrompt(userIntent, projectContext, config) {
        try {
            this.logger.debug('Generating constraint prompt', {
                userIntent: userIntent.type,
                language: config.language,
                templateType: config.templateType
            });
            // 选择合适的模板
            const template = this.selectTemplate(config);
            if (!template) {
                throw new Error(`No template found for type: ${config.templateType}`);
            }
            // 准备变量替换
            const variables = this.prepareVariables(userIntent, projectContext, config);
            // 生成约束提示词
            let constraintPrompt = this.replaceVariables(template.content, variables);
            // 应用自定义规则
            if (config.customRules && config.customRules.length > 0) {
                const language = config.language === 'auto' ? 'en' : config.language || 'en';
                constraintPrompt += this.generateCustomRulesSection(config.customRules, language);
            }
            // 限制长度
            if (config.maxConstraintLength && constraintPrompt.length > config.maxConstraintLength) {
                constraintPrompt = this.truncatePrompt(constraintPrompt, config.maxConstraintLength);
            }
            this.logger.debug('Constraint prompt generated', {
                templateName: template.name,
                promptLength: constraintPrompt.length
            });
            return constraintPrompt;
        }
        catch (error) {
            this.logger.error('Failed to generate constraint prompt', { error });
            throw error;
        }
    }
    /**
     * 获取可用模板列表
     */
    getAvailableTemplates() {
        const templates = [];
        for (const template of this.templates.values()) {
            templates.push({
                name: template.name,
                language: template.language,
                category: template.category,
                description: this.getTemplateDescription(template),
                variables: template.variables
            });
        }
        return templates.sort((a, b) => a.name.localeCompare(b.name));
    }
    /**
     * 注册自定义模板
     */
    registerCustomTemplate(name, template) {
        try {
            // 验证模板
            this.validateTemplate(template);
            // 设置名称
            template.name = name;
            // 注册模板
            this.templates.set(name, template);
            this.logger.info('Custom template registered', {
                name,
                language: template.language,
                category: template.category
            });
        }
        catch (error) {
            this.logger.error('Failed to register custom template', { name, error });
            throw error;
        }
    }
    /**
     * 移除自定义模板
     */
    removeCustomTemplate(name) {
        if (this.isDefaultTemplate(name)) {
            this.logger.warn('Cannot remove default template', { name });
            return false;
        }
        const removed = this.templates.delete(name);
        if (removed) {
            this.logger.info('Custom template removed', { name });
        }
        return removed;
    }
    /**
     * 获取模板
     */
    getTemplate(name) {
        return this.templates.get(name) || null;
    }
    /**
     * 初始化默认模板
     */
    initializeDefaultTemplates() {
        // 中文默认模板
        this.templates.set('default-zh', {
            name: 'default-zh',
            language: 'zh',
            content: `🔒 接口开发约束要求：

1. **严格遵循OpenAPI 3.0规范**
   - 所有API端点必须符合现有规范
   - 新增端点必须遵循现有命名约定：{namingConvention}
   - 必须包含完整的请求/响应定义

2. **代码质量要求**
   - 必须包含完整的TypeScript类型定义
   - 必须实现适当的错误处理机制
   - 必须包含输入验证和安全检查

3. **项目上下文约束**
   - API基础路径: {basePath}
   - 认证方式: {authMethod}
   - 通用响应格式: {responseFormat}

4. **最佳实践要求**
   - 遵循RESTful设计原则
   - 使用标准HTTP状态码
   - 实现适当的错误响应格式

请基于以上约束要求完成开发任务。`,
            variables: ['namingConvention', 'basePath', 'authMethod', 'responseFormat'],
            priority: 1,
            category: 'api'
        });
        // 英文默认模板
        this.templates.set('default-en', {
            name: 'default-en',
            language: 'en',
            content: `🔒 INTERFACE DEVELOPMENT CONSTRAINTS:

1. **STRICT OpenAPI 3.0 Compliance**
   - ALL endpoints MUST conform to existing specifications
   - NEW endpoints MUST follow naming convention: {namingConvention}
   - COMPLETE request/response definitions REQUIRED

2. **CODE QUALITY REQUIREMENTS**
   - COMPLETE TypeScript type definitions MANDATORY
   - PROPER error handling implementation REQUIRED
   - INPUT validation and security checks ESSENTIAL

3. **PROJECT CONTEXT CONSTRAINTS**
   - API Base Path: {basePath}
   - Authentication: {authMethod}
   - Response Format: {responseFormat}

4. **BEST PRACTICES ENFORCEMENT**
   - RESTful design principles MANDATORY
   - Standard HTTP status codes REQUIRED
   - Proper error response format ESSENTIAL

STRICTLY ADHERE to these constraints while completing the development task.`,
            variables: ['namingConvention', 'basePath', 'authMethod', 'responseFormat'],
            priority: 1,
            category: 'api'
        });
        // 中文严格模板
        this.templates.set('strict-zh', {
            name: 'strict-zh',
            language: 'zh',
            content: `🚨 严格接口开发约束 - 必须100%遵循：

⚠️ 违反任何约束将导致代码被拒绝 ⚠️

1. **强制性OpenAPI 3.0规范遵循**
   - 🔴 所有端点必须与现有规范完全匹配
   - 🔴 禁止偏离既定的命名约定：{namingConvention}
   - 🔴 必须包含详尽的请求/响应模式定义

2. **强制性代码质量标准**
   - 🔴 必须包含100%完整的TypeScript类型
   - 🔴 必须实现全面的错误处理和恢复机制
   - 🔴 必须包含严格的输入验证和安全防护

3. **强制性项目约束**
   - 🔴 API路径: {basePath} (不可更改)
   - 🔴 认证: {authMethod} (必须使用)
   - 🔴 响应格式: {responseFormat} (严格遵循)

4. **强制性最佳实践**
   - 🔴 100%RESTful设计，无例外
   - 🔴 标准HTTP状态码，禁止自定义
   - 🔴 统一错误响应格式，不可偏离

⚡ 在开始编码前，请确认理解并接受所有约束条件。`,
            variables: ['namingConvention', 'basePath', 'authMethod', 'responseFormat'],
            priority: 2,
            category: 'api'
        });
        // 英文严格模板
        this.templates.set('strict-en', {
            name: 'strict-en',
            language: 'en',
            content: `🚨 STRICT INTERFACE DEVELOPMENT CONSTRAINTS - 100% COMPLIANCE REQUIRED:

⚠️ VIOLATION OF ANY CONSTRAINT WILL RESULT IN CODE REJECTION ⚠️

1. **MANDATORY OpenAPI 3.0 Specification Compliance**
   - 🔴 ALL endpoints MUST match existing specifications EXACTLY
   - 🔴 DEVIATION from naming convention FORBIDDEN: {namingConvention}
   - 🔴 COMPREHENSIVE request/response schema definitions MANDATORY

2. **MANDATORY Code Quality Standards**
   - 🔴 100% COMPLETE TypeScript type definitions REQUIRED
   - 🔴 COMPREHENSIVE error handling and recovery mechanisms MANDATORY
   - 🔴 STRICT input validation and security protection ESSENTIAL

3. **MANDATORY Project Constraints**
   - 🔴 API Path: {basePath} (UNCHANGEABLE)
   - 🔴 Authentication: {authMethod} (MUST USE)
   - 🔴 Response Format: {responseFormat} (STRICT ADHERENCE)

4. **MANDATORY Best Practices**
   - 🔴 100% RESTful design, NO EXCEPTIONS
   - 🔴 Standard HTTP status codes, NO CUSTOM CODES
   - 🔴 Unified error response format, NO DEVIATIONS

⚡ CONFIRM understanding and acceptance of ALL constraints before coding.`,
            variables: ['namingConvention', 'basePath', 'authMethod', 'responseFormat'],
            priority: 2,
            category: 'api'
        });
        this.logger.info('Default templates initialized', {
            count: this.templates.size
        });
    }
    /**
     * 选择合适的模板
     */
    selectTemplate(config) {
        const language = config.language === 'auto' ? 'zh' : config.language;
        const templateKey = `${config.templateType}-${language}`;
        let template = this.templates.get(templateKey);
        // 如果找不到指定模板，尝试默认模板
        if (!template) {
            template = this.templates.get(`default-${language}`);
        }
        // 如果还是找不到，使用中文默认模板
        if (!template) {
            template = this.templates.get('default-zh');
        }
        return template || null;
    }
    /**
     * 准备变量替换
     */
    prepareVariables(userIntent, projectContext, _config) {
        return {
            namingConvention: this.generateNamingConvention(userIntent),
            basePath: projectContext.basePath || '/api/v1',
            authMethod: projectContext.authMethod || 'Bearer Token',
            responseFormat: this.formatResponseFormat(projectContext.responseFormat),
            domain: userIntent.domain || 'general',
            operations: userIntent.operations?.join(', ') || 'CRUD',
            entities: userIntent.entities?.join(', ') || 'resource'
        };
    }
    /**
     * 替换模板变量
     */
    replaceVariables(content, variables) {
        let result = content;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            result = result.replace(regex, value);
        }
        return result;
    }
    /**
     * 生成命名约定
     */
    generateNamingConvention(userIntent) {
        const domain = userIntent.domain || 'resource';
        return `/${domain.toLowerCase()}/{id?}`;
    }
    /**
     * 格式化响应格式
     */
    formatResponseFormat(responseFormat) {
        if (!responseFormat) {
            return '{ success: boolean, data: any, message?: string }';
        }
        if (typeof responseFormat === 'object') {
            return JSON.stringify(responseFormat, null, 2);
        }
        return String(responseFormat);
    }
    /**
     * 生成自定义规则部分
     */
    generateCustomRulesSection(customRules, language) {
        const header = language === 'zh' ? '\n\n5. **自定义约束规则**\n' : '\n\n5. **CUSTOM CONSTRAINT RULES**\n';
        const rules = customRules.map(rule => `   - ${rule}`).join('\n');
        return header + rules;
    }
    /**
     * 截断提示词
     */
    truncatePrompt(prompt, maxLength) {
        if (prompt.length <= maxLength) {
            return prompt;
        }
        const truncated = prompt.substring(0, maxLength - 50);
        const lastNewline = truncated.lastIndexOf('\n');
        if (lastNewline > maxLength * 0.8) {
            return truncated.substring(0, lastNewline) + '\n\n[约束内容已截断...]';
        }
        return truncated + '\n\n[约束内容已截断...]';
    }
    /**
     * 验证模板
     */
    validateTemplate(template) {
        if (!template.content || template.content.trim().length === 0) {
            throw new Error('Template content cannot be empty');
        }
        if (!template.language || !['zh', 'en'].includes(template.language)) {
            throw new Error('Template language must be "zh" or "en"');
        }
        if (!template.category) {
            throw new Error('Template category is required');
        }
    }
    /**
     * 检查是否为默认模板
     */
    isDefaultTemplate(name) {
        return ['default-zh', 'default-en', 'strict-zh', 'strict-en'].includes(name);
    }
    /**
     * 获取模板描述
     */
    getTemplateDescription(template) {
        const descriptions = {
            'default-zh': '中文默认约束模板，包含基本的接口开发约束',
            'default-en': 'English default constraint template with basic interface development constraints',
            'strict-zh': '中文严格约束模板，包含强制性的接口开发要求',
            'strict-en': 'English strict constraint template with mandatory interface development requirements'
        };
        return descriptions[template.name] || `${template.category} template in ${template.language}`;
    }
}
//# sourceMappingURL=constraint-template-engine.js.map