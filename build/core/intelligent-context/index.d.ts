/**
 * Intelligent Context Analyzer
 *
 * Handles ambiguous user instructions and provides intelligent suggestions
 * for API interface generation and validation.
 */
import type { UserIntent } from './types.js';
export type { UserIntent } from './types.js';
export interface ContextSuggestion {
    suggestedEndpoints: string[];
    suggestedSchemas: any;
    suggestedSecurity: string[];
    reasoning: string;
    confidence: number;
}
export interface MissingSpecHandling {
    shouldCreateSpec: boolean;
    suggestedStructure: any;
    reasoning: string;
}
export declare class IntelligentContextAnalyzer {
    private logger;
    private commonPatterns;
    constructor();
    /**
     * Analyze user instruction to understand intent
     */
    analyzeUserInstruction(instruction: string): Promise<UserIntent>;
    /**
     * Handle missing OpenAPI specification
     */
    handleMissingSpec(userIntent: UserIntent, projectContext: any): Promise<MissingSpecHandling>;
    /**
     * Generate context suggestions for AI
     */
    generateContextSuggestions(userIntent: UserIntent, existingSpec?: any): Promise<ContextSuggestion>;
    /**
     * Initialize common instruction patterns
     */
    private initializeCommonPatterns;
    /**
     * Perform advanced NLP analysis (simplified implementation)
     */
    private performAdvancedAnalysis;
    /**
     * Extract entities from instruction
     */
    private extractEntities;
    /**
     * Extract operations from instruction
     */
    private extractOperations;
    /**
     * Determine domain from instruction and entities
     */
    private determineDomain;
    /**
     * Determine API operation type
     */
    private determineType;
    /**
     * Generate API endpoints based on intent
     */
    private generateEndpoints;
    /**
     * Generate schemas based on intent
     */
    private generateSchemas;
    /**
     * Generate security requirements
     */
    private generateSecurity;
    /**
     * Get base path for domain
     */
    private getBasePath;
    /**
     * Get entity schema template
     */
    private getEntitySchema;
    /**
     * Filter out existing endpoints
     */
    private filterExistingEndpoints;
    /**
     * Generate reasoning for suggestions
     */
    private generateReasoning;
    /**
     * Generate OpenAPI spec structure
     */
    private generateSpecStructure;
    /**
     * Generate paths structure for OpenAPI spec
     */
    private generatePathsStructure;
    /**
     * Capitalize first letter
     */
    private capitalize;
}
//# sourceMappingURL=index.d.ts.map