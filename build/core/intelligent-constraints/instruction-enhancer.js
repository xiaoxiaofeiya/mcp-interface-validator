/**
 * 指令增强器 - 增强用户指令并注入约束
 */
import { Logger } from '../../utils/logger/index.js';
import { IntelligentContextAnalyzer } from '../intelligent-context/index.js';
/**
 * 指令增强器实现
 */
export class InstructionEnhancer {
    logger;
    contextAnalyzer;
    templateEngine;
    constructor(contextAnalyzer, templateEngine) {
        this.logger = new Logger('InstructionEnhancer');
        this.contextAnalyzer = contextAnalyzer;
        this.templateEngine = templateEngine;
        this.logger.info('InstructionEnhancer initialized');
    }
    /**
     * 增强用户指令
     */
    enhanceInstruction(userInstruction, constraintPrompt, options) {
        try {
            const opts = this.getDefaultOptions(options);
            // 生成增强指令
            const enhancedInstruction = this.combineInstructionAndConstraints(userInstruction, constraintPrompt, opts);
            // 创建增强指令对象
            const result = {
                originalInstruction: userInstruction,
                constraintPrompt,
                enhancedInstruction,
                metadata: {
                    userIntent: null, // 将在后续填充
                    appliedConstraints: this.extractAppliedConstraints(constraintPrompt),
                    confidence: this.calculateEnhancementConfidence(userInstruction, constraintPrompt),
                    timestamp: new Date(),
                    sessionId: this.generateSessionId()
                }
            };
            this.logger.debug('Instruction enhanced', {
                originalLength: userInstruction.length,
                enhancedLength: enhancedInstruction.length,
                confidence: result.metadata.confidence
            });
            return result;
        }
        catch (error) {
            this.logger.error('Failed to enhance instruction', { userInstruction, error });
            throw error;
        }
    }
    /**
     * 分析用户意图
     */
    async analyzeUserIntent(instruction) {
        try {
            return await this.contextAnalyzer.analyzeUserInstruction(instruction);
        }
        catch (error) {
            this.logger.error('Failed to analyze user intent', { instruction, error });
            throw error;
        }
    }
    /**
     * 格式化增强指令
     */
    formatEnhancedInstruction(instruction) {
        const { enhancedInstruction, metadata } = instruction;
        // 构建格式化的增强指令
        let formatted = enhancedInstruction;
        formatted += '\n\n---\n';
        formatted += `📊 增强信息：\n`;
        formatted += `- 置信度: ${(metadata.confidence * 100).toFixed(1)}%\n`;
        formatted += `- 应用约束: ${metadata.appliedConstraints.join(', ')}\n`;
        formatted += `- 处理时间: ${metadata.timestamp.toISOString()}\n`;
        return formatted;
    }
    /**
     * 应用约束
     */
    async applyConstraints(userInstruction, config, projectContext) {
        const startTime = Date.now();
        try {
            this.logger.debug('Applying constraints', {
                instruction: userInstruction,
                config: config.templateType
            });
            // 分析用户意图
            const userIntent = await this.analyzeUserIntent(userInstruction);
            // 生成约束提示词
            const constraintPrompt = this.templateEngine.generateConstraintPrompt(userIntent, projectContext, config);
            // 增强指令
            const enhancedInstruction = this.enhanceInstruction(userInstruction, constraintPrompt, { includeMetadata: false });
            // 更新用户意图
            enhancedInstruction.metadata.userIntent = userIntent;
            const processingTime = Math.max(1, Date.now() - startTime); // 确保至少为1ms
            const result = {
                success: true,
                enhancedInstruction,
                appliedConstraints: enhancedInstruction.metadata.appliedConstraints,
                processingTime
            };
            this.logger.info('Constraints applied successfully', {
                processingTime,
                constraintsCount: result.appliedConstraints.length
            });
            return result;
        }
        catch (error) {
            const processingTime = Math.max(1, Date.now() - startTime); // 确保至少为1ms
            this.logger.error('Failed to apply constraints', {
                userInstruction,
                error,
                processingTime
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                appliedConstraints: [],
                processingTime
            };
        }
    }
    /**
     * 合并指令和约束
     */
    combineInstructionAndConstraints(userInstruction, constraintPrompt, options) {
        const separator = options.customSeparator || '\n\n';
        let combined = '';
        if (options.preserveOriginalFormat) {
            // 保持原始格式，约束作为前缀
            combined = `${constraintPrompt}${separator}用户需求：${userInstruction}`;
        }
        else {
            // 标准格式，用户指令在前
            combined = `${userInstruction}${separator}${constraintPrompt}`;
        }
        // 应用长度限制
        if (options.maxLength && combined.length > options.maxLength) {
            combined = this.truncateEnhancedInstruction(combined, options.maxLength);
        }
        return combined;
    }
    /**
     * 提取应用的约束
     */
    extractAppliedConstraints(constraintPrompt) {
        const constraints = [];
        // 检查常见约束类型
        if (constraintPrompt.includes('OpenAPI')) {
            constraints.push('OpenAPI规范');
        }
        if (constraintPrompt.includes('TypeScript')) {
            constraints.push('TypeScript类型');
        }
        if (constraintPrompt.includes('错误处理') || constraintPrompt.includes('error handling')) {
            constraints.push('错误处理');
        }
        if (constraintPrompt.includes('验证') || constraintPrompt.includes('validation')) {
            constraints.push('输入验证');
        }
        if (constraintPrompt.includes('RESTful')) {
            constraints.push('RESTful设计');
        }
        if (constraintPrompt.includes('安全') || constraintPrompt.includes('security')) {
            constraints.push('安全检查');
        }
        return constraints.length > 0 ? constraints : ['通用约束'];
    }
    /**
     * 计算增强置信度
     */
    calculateEnhancementConfidence(userInstruction, constraintPrompt) {
        let confidence = 0.7; // 基础置信度
        // 用户指令质量评估
        if (userInstruction.length >= 5 && userInstruction.length <= 200) {
            confidence += 0.1;
        }
        // 约束提示词质量评估
        if (constraintPrompt.length >= 100) {
            confidence += 0.1;
        }
        // 检查关键词匹配
        const keywords = ['API', '接口', '开发', '系统', 'develop', 'create', 'build'];
        const hasKeywords = keywords.some(keyword => userInstruction.toLowerCase().includes(keyword.toLowerCase()));
        if (hasKeywords) {
            confidence += 0.1;
        }
        return Math.min(1.0, Math.max(0.0, confidence));
    }
    /**
     * 生成会话ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 获取默认选项
     */
    getDefaultOptions(options) {
        return {
            preserveOriginalFormat: false,
            includeMetadata: false,
            customSeparator: '\n\n',
            maxLength: 4000,
            ...options
        };
    }
    /**
     * 截断增强指令
     */
    truncateEnhancedInstruction(instruction, maxLength) {
        if (instruction.length <= maxLength) {
            return instruction;
        }
        // 尝试在合适的位置截断
        const truncated = instruction.substring(0, maxLength - 100);
        const lastNewline = truncated.lastIndexOf('\n');
        if (lastNewline > maxLength * 0.7) {
            return truncated.substring(0, lastNewline) + '\n\n[内容已截断，请查看完整约束要求...]';
        }
        return truncated + '\n\n[内容已截断，请查看完整约束要求...]';
    }
    /**
     * 验证增强结果
     */
    validateEnhancedInstruction(instruction) {
        try {
            // 检查必要字段
            if (!instruction.originalInstruction || !instruction.enhancedInstruction) {
                return false;
            }
            // 检查增强指令是否包含原始指令的关键信息
            const originalWords = instruction.originalInstruction.toLowerCase().split(/\s+/);
            const enhancedText = instruction.enhancedInstruction.toLowerCase();
            const keywordMatch = originalWords.some(word => word.length > 2 && enhancedText.includes(word));
            return keywordMatch;
        }
        catch (error) {
            this.logger.error('Failed to validate enhanced instruction', { error });
            return false;
        }
    }
    /**
     * 获取增强统计
     */
    getEnhancementStats() {
        // 这里可以添加统计信息收集逻辑
        return {
            totalEnhancements: 0,
            averageConfidence: 0,
            averageProcessingTime: 0
        };
    }
}
//# sourceMappingURL=instruction-enhancer.js.map