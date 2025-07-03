/**
 * Difference Analyzer for API Interface Comparison
 *
 * Compares frontend and backend code to detect API interface mismatches,
 * including endpoints, parameters, response types, and other inconsistencies.
 */
import { Logger } from '../../utils/logger/index.js';
import { type ParsedCode } from '../code-parser/index.js';
import type { ValidationConfig } from '../../utils/config/index.js';
export interface DiffAnalysisRequest {
    frontendCode: string;
    backendCode: string;
    frontendLanguage: string;
    backendLanguage: string;
    specPath?: string;
    options?: DiffAnalysisOptions;
}
export interface DiffAnalysisOptions {
    includeWarnings?: boolean;
    strictMode?: boolean;
    ignoreMinorDifferences?: boolean;
    customRules?: DiffRule[];
}
export interface DiffRule {
    name: string;
    description: string;
    severity: 'error' | 'warning' | 'info';
    check: (frontend: ParsedCode, backend: ParsedCode) => DiffIssue[];
}
export interface DiffAnalysisResult {
    isCompatible: boolean;
    issues: DiffIssue[];
    summary: DiffSummary;
    recommendations: DiffRecommendation[];
    metadata: DiffMetadata;
}
export interface DiffIssue {
    type: DiffIssueType;
    severity: 'error' | 'warning' | 'info';
    message: string;
    description: string;
    frontendLocation?: SourceLocation;
    backendLocation?: SourceLocation;
    expectedValue?: any;
    actualValue?: any;
    rule?: string;
    fix?: DiffFix;
}
export type DiffIssueType = 'endpoint_missing' | 'endpoint_extra' | 'method_mismatch' | 'parameter_missing' | 'parameter_extra' | 'parameter_type_mismatch' | 'response_type_mismatch' | 'schema_mismatch' | 'authentication_mismatch' | 'header_mismatch' | 'status_code_mismatch';
export interface SourceLocation {
    line: number;
    column: number;
    file?: string;
}
export interface DiffFix {
    description: string;
    frontendChanges?: CodeChange[];
    backendChanges?: CodeChange[];
    automatic?: boolean;
}
export interface CodeChange {
    type: 'add' | 'remove' | 'modify';
    location: SourceLocation;
    oldCode?: string;
    newCode: string;
    description: string;
}
export interface DiffSummary {
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    compatibilityScore: number;
    affectedEndpoints: string[];
    missingEndpoints: string[];
    extraEndpoints: string[];
}
export interface DiffRecommendation {
    priority: 'high' | 'medium' | 'low';
    category: 'security' | 'performance' | 'compatibility' | 'maintainability';
    message: string;
    action: string;
    impact: string;
}
export interface DiffMetadata {
    timestamp: string;
    duration: number;
    frontendAnalysis: {
        endpointCount: number;
        classCount: number;
        methodCount: number;
    };
    backendAnalysis: {
        endpointCount: number;
        classCount: number;
        methodCount: number;
    };
    rulesApplied: string[];
}
export declare class DiffAnalyzer {
    private logger;
    private codeParser;
    private defaultRules;
    constructor(_config: ValidationConfig, logger: Logger);
    /**
     * Initialize the difference analyzer
     */
    initialize(): Promise<void>;
    /**
     * Analyze differences between frontend and backend code
     */
    analyzeDifferences(request: DiffAnalysisRequest): Promise<DiffAnalysisResult>;
    /**
     * Apply analysis rules to detect differences
     */
    private applyAnalysisRules;
    /**
     * Generate analysis summary
     */
    private generateSummary;
    /**
     * Generate recommendations based on analysis results
     */
    private generateRecommendations;
    /**
     * Extract endpoint information from issue
     */
    private extractEndpointFromIssue;
    /**
     * Create default analysis rules
     */
    private createDefaultRules;
    /**
     * Check endpoint consistency between frontend and backend
     */
    private checkEndpointConsistency;
    /**
     * Check HTTP method consistency
     */
    private checkMethodConsistency;
    /**
     * Check parameter consistency
     */
    private checkParameterConsistency;
    /**
     * Check response type consistency
     */
    private checkResponseTypeConsistency;
    /**
     * Find similar HTTP method for suggestions
     */
    private findSimilarMethod;
    /**
     * Create empty parsed code result for error cases
     */
    private createEmptyParsedCode;
    /**
     * Get analysis statistics
     */
    getStats(): {
        rulesCount: number;
    };
}
//# sourceMappingURL=index.d.ts.map