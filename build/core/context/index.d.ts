/**
 * Context Enhancer for API Specification Management
 *
 * Manages and injects API specification context for different tech stacks
 * and development environments
 */
import { Logger } from '../../utils/logger/index';
import type { ValidationConfig } from '../../utils/config/index';
import type { ParsedSpec } from '../parser/index';
export interface ContextTemplate {
    id: string;
    name: string;
    description: string;
    techStack: string[];
    template: string;
    variables: ContextVariable[];
    outputFormat: 'markdown' | 'json' | 'yaml' | 'text';
}
export interface ContextVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required: boolean;
    defaultValue?: any;
    enumValues?: string[];
}
export interface ContextData {
    spec: ParsedSpec;
    projectInfo: ProjectInfo;
    techStack: TechStackInfo;
    customData?: Record<string, any>;
}
export interface ProjectInfo {
    name: string;
    version: string;
    description?: string;
    rootPath: string;
    packageManager?: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'composer' | 'maven' | 'gradle';
    framework?: string;
    language?: string;
}
export interface TechStackInfo {
    frontend?: FrameworkInfo;
    backend?: FrameworkInfo;
    database?: DatabaseInfo;
    deployment?: DeploymentInfo;
    testing?: TestingInfo;
}
export interface FrameworkInfo {
    name: string;
    version?: string;
    features?: string[];
    configFiles?: string[];
}
export interface DatabaseInfo {
    type: 'mysql' | 'postgresql' | 'mongodb' | 'sqlite' | 'redis' | 'other';
    version?: string;
    connectionString?: string;
}
export interface DeploymentInfo {
    platform: 'docker' | 'kubernetes' | 'aws' | 'azure' | 'gcp' | 'vercel' | 'netlify' | 'other';
    environment: 'development' | 'staging' | 'production';
    configFiles?: string[];
}
export interface TestingInfo {
    frameworks: string[];
    coverage?: boolean;
    e2e?: boolean;
}
export interface GeneratedContext {
    id: string;
    templateId: string;
    content: string;
    format: string;
    metadata: ContextMetadata;
    generatedAt: Date;
}
export interface ContextMetadata {
    specVersion: string;
    techStack: string[];
    variables: Record<string, any>;
    outputPath?: string;
}
export interface ContextOptions {
    templateId?: string;
    outputPath?: string;
    variables?: Record<string, any>;
    includeExamples?: boolean;
    includeTests?: boolean;
    optimizeForSize?: boolean;
}
export declare class ContextEnhancer {
    private logger;
    private templates;
    private contextCache;
    private templatesPath;
    constructor(_config: ValidationConfig, logger: Logger, templatesPath?: string);
    /**
     * Initialize the context enhancer
     */
    initialize(): Promise<void>;
    /**
     * Generate context for API specification
     */
    generateContext(contextData: ContextData, options?: ContextOptions): Promise<GeneratedContext>;
    /**
     * Update context with new data
     */
    updateContext(contextId: string, newData: Partial<ContextData>, options?: ContextOptions): Promise<GeneratedContext>;
    /**
     * Get available templates
     */
    getAvailableTemplates(): ContextTemplate[];
    /**
     * Get templates for specific tech stack
     */
    getTemplatesForTechStack(techStack: string[]): ContextTemplate[];
    /**
     * Register custom template
     */
    registerTemplate(template: ContextTemplate): void;
    /**
     * Load built-in templates
     */
    private loadBuiltInTemplates;
    /**
     * Load custom templates from templates directory
     */
    private loadCustomTemplates;
    /**
     * Select appropriate template based on context data
     */
    private selectTemplate;
    /**
     * Get default template when no compatible templates found
     */
    private getDefaultTemplate;
    /**
     * Prepare template variables
     */
    private prepareVariables;
    /**
     * Render template with variables
     */
    private renderTemplate;
    /**
     * Extract tech stack names from tech stack info
     */
    private extractTechStackNames;
    /**
     * Generate unique context ID
     */
    private generateContextId;
    /**
     * Inject enhanced context into the development environment
     */
    injectContext(context: GeneratedContext): Promise<boolean>;
    /**
     * Save generated context to file
     */
    private saveContextToFile;
    /**
     * Merge context data for updates
     */
    private mergeContextData;
    /**
     * Get built-in template content
     */
    private getBuiltInTemplate;
    /**
     * Clear context cache
     */
    clearCache(): void;
    /**
     * Get context enhancer statistics
     */
    getStats(): {
        templatesLoaded: number;
        cachedContexts: number;
        templatesPath: string;
    };
}
//# sourceMappingURL=index.d.ts.map