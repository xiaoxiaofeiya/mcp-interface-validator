/**
 * Validation Engine for MCP Interface Validator
 *
 * Core validation logic for API interfaces against OpenAPI specifications
 */
import { Logger } from '../../utils/logger/index';
import { ConfigManager } from '../../utils/config/index';
import { type ContextSuggestion } from '../intelligent-context/index';
export interface ValidationRequest {
    code: string;
    specPath: string;
    type: 'frontend' | 'backend' | 'both';
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
    metadata: ValidationMetadata;
}
export interface ValidationError {
    code: string;
    message: string;
    severity: 'error' | 'warning';
    location?: {
        line: number;
        column: number;
        path?: string;
    };
    rule: string;
}
export interface ValidationWarning {
    code: string;
    message: string;
    location?: {
        line: number;
        column: number;
        path?: string;
    };
    rule: string;
}
export interface ValidationSuggestion {
    message: string;
    fix?: string;
    location?: {
        line: number;
        column: number;
        path?: string;
    };
}
export interface ValidationMetadata {
    timestamp: string;
    duration: number;
    specVersion: string;
    validationType: string;
    rulesApplied: string[];
}
export interface MonitoringRequest {
    paths: string[];
    specPath: string;
}
export interface CodeAnalysis {
    paths: PathDefinition[];
    methods: MethodDefinition[];
    schemas: SchemaDefinition[];
    parameters: ParameterDefinition[];
}
export interface PathDefinition {
    path: string;
    line: number;
    source: string;
}
export interface MethodDefinition {
    method: string;
    line: number;
    source: string;
}
export interface SchemaDefinition {
    name: string;
    line: number;
    source: string;
}
export interface ParameterDefinition {
    name: string;
    type: string;
    line: number;
    source: string;
}
export interface ValidationSubResult {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
}
export declare class ValidationEngine {
    private logger;
    private config;
    private schemaValidator;
    private fileMonitor;
    private intelligentAnalyzer;
    private isInitialized;
    constructor(configManager: ConfigManager, logger: Logger);
    /**
     * Initialize the validation engine
     */
    initialize(): Promise<void>;
    /**
     * Validate OpenAPI specification
     */
    validateSpec(spec: any): Promise<ValidationResult>;
    /**
     * Validate interface code against OpenAPI specification
     */
    validateInterface(request: ValidationRequest): Promise<ValidationResult>;
    /**
     * Start monitoring files for changes
     */
    startMonitoring(request: MonitoringRequest): Promise<void>;
    /**
     * Stop monitoring files
     */
    stopMonitoring(): Promise<void>;
    /**
     * Perform the actual validation logic
     */
    private performValidation;
    /**
     * Handle file change events
     */
    private handleFileChange;
    /**
     * Determine validation type based on file characteristics
     */
    private determineValidationType;
    /**
     * Get validation engine status
     */
    getStatus(): {
        initialized: boolean;
        monitoring: boolean;
    };
    /**
     * Analyze code to extract API definitions
     */
    private analyzeCode;
    /**
     * Get line number from string index
     */
    private getLineNumber;
    /**
     * Validate API paths against OpenAPI specification
     */
    private validatePaths;
    /**
     * Validate HTTP methods against OpenAPI specification
     */
    private validateMethods;
    /**
     * Validate schemas against OpenAPI specification
     */
    private validateSchemas;
    /**
     * Validate parameters against OpenAPI specification
     */
    private validateParameters;
    /**
     * Apply custom validation rule
     */
    private applyCustomRule;
    /**
     * Find similar paths using simple string similarity
     */
    private findSimilarPaths;
    /**
     * Calculate API path similarity with enhanced logic
     */
    private calculateSimilarity;
    /**
     * Calculate Levenshtein distance
     */
    private levenshteinDistance;
    /**
     * Intelligent validation with context analysis
     * Handles ambiguous user instructions and missing specifications
     */
    validateWithIntelligentContext(userInstruction: string, code: string, specPath?: string, projectContext?: any): Promise<ValidationResult & {
        contextSuggestions?: ContextSuggestion;
        missingSpecHandling?: any;
    }>;
    /**
     * Load OpenAPI specification from file
     */
    private loadOpenAPISpec;
}
//# sourceMappingURL=index.d.ts.map