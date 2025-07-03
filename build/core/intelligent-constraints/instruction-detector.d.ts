/**
 * 指令检测器 - 检测和解析约束指令
 */
import type { ConstraintCommand, InstructionDetectionResult } from './types.js';
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
export declare class InstructionDetector implements IInstructionDetector {
    private logger;
    private supportedCommands;
    private commandPatterns;
    constructor();
    /**
     * 检测约束指令
     */
    detectConstraintCommand(input: string): ConstraintCommand | null;
    /**
     * 提取用户指令
     */
    extractUserInstruction(input: string): string;
    /**
     * 获取支持的指令列表
     */
    getSupportedCommands(): string[];
    /**
     * 分析指令
     */
    analyzeInstruction(input: string): InstructionDetectionResult;
    /**
     * 初始化指令模式
     */
    private initializeCommandPatterns;
    /**
     * 从匹配结果中提取指令
     */
    private extractInstructionFromMatch;
    /**
     * 检测语言
     */
    private detectLanguage;
    /**
     * 提取选项
     */
    private extractOptions;
    /**
     * 计算置信度
     */
    private calculateConfidence;
    /**
     * 添加自定义指令模式
     */
    addCustomCommand(command: string, pattern: RegExp): void;
    /**
     * 移除自定义指令模式
     */
    removeCustomCommand(command: string): boolean;
    /**
     * 验证指令格式
     */
    validateCommandFormat(input: string): boolean;
    /**
     * 获取指令建议
     */
    getCommandSuggestions(partialInput: string): string[];
}
//# sourceMappingURL=instruction-detector.d.ts.map