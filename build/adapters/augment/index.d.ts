/**
 * Augment Tool Adapter
 *
 * Provides integration with Augment Code AI assistant for intelligent
 * codebase analysis, real-time API interface validation, and context-aware
 * code generation assistance.
 */
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger/index.js';
import { ValidationEngine } from '../../core/validation/index.js';
import { ContextEnhancer } from '../../core/context/index.js';
import { SpecParser } from '../../core/parser/index.js';
export interface AugmentAdapterConfig {
    enableRealTimeValidation: boolean;
    contextInjectionMode: 'auto' | 'manual' | 'disabled';
    validationTriggers: string[];
    codebaseIndexing?: boolean;
    semanticAnalysis?: boolean;
    workspaceRoot?: string;
    capabilities?: AugmentCapabilities;
    requestTimeout?: number;
    maxContextSize?: number;
}
export interface AugmentCapabilities {
    codebaseRetrieval?: boolean;
    semanticSearch?: boolean;
    contextualValidation?: boolean;
    intelligentSuggestions?: boolean;
    crossFileAnalysis?: boolean;
}
export interface AugmentValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
    contextId?: string;
    timestamp: number;
    metadata?: {
        codebaseContext?: string[];
        semanticMatches?: string[];
        relatedFiles?: string[];
        confidenceScore?: number;
    };
}
export interface AugmentContextData {
    documentPath: string;
    content: string;
    language: string;
    projectInfo?: {
        name: string;
        version: string;
        type: string;
        dependencies?: string[];
    };
    codebaseContext?: {
        relatedFiles?: string[];
        semanticContext?: string;
        apiPatterns?: string[];
    };
}
export interface AugmentCodebaseQuery {
    query: string;
    fileTypes?: string[];
    maxResults?: number;
    includeContext?: boolean;
}
export interface AugmentCodebaseResult {
    files: Array<{
        path: string;
        relevanceScore: number;
        snippet?: string;
        context?: string;
    }>;
    totalMatches: number;
    queryTime: number;
}
/**
 * Base Adapter Class for common functionality
 */
declare abstract class BaseAdapter extends EventEmitter {
    protected logger: Logger;
    protected validationEngine: ValidationEngine;
    protected contextEnhancer: ContextEnhancer;
    protected specParser: SpecParser;
    protected config: any;
    constructor(config: any);
    abstract initialize(): Promise<void>;
    abstract dispose(): Promise<void>;
}
/**
 * Augment Tool Adapter Class
 *
 * Integrates with Augment Code AI assistant to provide:
 * - Intelligent codebase analysis
 * - Context-aware validation
 * - Semantic code search
 * - Real-time API interface validation
 */
export declare class AugmentAdapter extends BaseAdapter {
    private isActive;
    private validationCache;
    private codebaseIndex;
    private contextCache;
    constructor(config: AugmentAdapterConfig);
    /**
     * Initialize the Augment adapter
     */
    initialize(): Promise<void>;
    /**
     * Validate a document using intelligent context analysis
     */
    validateDocument(contextData: AugmentContextData): Promise<AugmentValidationResult>;
    /**
     * Inject context into the development environment
     */
    injectContext(contextData: AugmentContextData): Promise<boolean>;
    /**
     * Perform intelligent codebase search
     */
    searchCodebase(query: AugmentCodebaseQuery): Promise<AugmentCodebaseResult>;
    /**
     * Start real-time monitoring
     */
    startRealTimeMonitoring(): Promise<void>;
    /**
     * Stop real-time monitoring
     */
    stopRealTimeMonitoring(): Promise<void>;
    /**
     * Get adapter statistics
     */
    getStatistics(): any;
    /**
     * Clear validation cache
     */
    clearValidationCache(): void;
    /**
     * Dispose of the adapter and clean up resources
     */
    dispose(): Promise<void>;
    /**
     * Build codebase index for intelligent search
     */
    private buildCodebaseIndex;
    /**
     * Enhance context with codebase intelligence
     */
    private enhanceContextWithCodebase;
    /**
     * Enhance context with semantic analysis
     */
    private enhanceContextWithSemantics;
    /**
     * Check if content is an API specification
     */
    private isApiSpecification;
    /**
     * Validate API specification with intelligence
     */
    private validateApiSpecification;
    /**
     * Validate code with context awareness
     */
    private validateCodeWithContext;
    /**
     * Generate cache key for validation results
     */
    private generateCacheKey;
    /**
     * Hash content for cache key generation
     */
    private hashContent;
    /**
     * Get programming language from file path
     */
    private getLanguageFromPath;
    /**
     * Generate semantic tags for a file
     */
    private generateSemanticTags;
    /**
     * Find files related to the current context
     */
    private findRelatedFiles;
    /**
     * Generate semantic context for the given data
     */
    private generateSemanticContext;
    /**
     * Extract API patterns from content
     */
    private extractApiPatterns;
    /**
     * Analyze intent of the content
     */
    private analyzeIntent;
    /**
     * Identify patterns in content
     */
    private identifyPatterns;
    /**
     * Generate contextual suggestions
     */
    private generateSuggestions;
    /**
     * Generate contextual suggestions based on codebase context
     */
    private generateContextualSuggestions;
    /**
     * Identify potential issues in the code
     */
    private identifyPotentialIssues;
    /**
     * Find semantic matches for the given context
     */
    private findSemanticMatches;
    /**
     * Find related API files
     */
    private findRelatedApiFiles;
    /**
     * Calculate confidence score for validation result
     */
    private calculateConfidenceScore;
    /**
     * Check if two file paths have similar names
     */
    private haveSimilarNames;
    /**
     * Find common words between two content strings
     */
    private findCommonWords;
    /**
     * Check if file data matches the search query
     */
    private matchesQuery;
    /**
     * Calculate relevance score for search results
     */
    private calculateRelevanceScore;
    /**
     * Extract relevant snippet from file data
     */
    private extractRelevantSnippet;
    /**
     * Generate context summary for a file
     */
    private generateContextSummary;
}
export {};
//# sourceMappingURL=index.d.ts.map