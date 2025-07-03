import * as Handlebars from 'handlebars';
import type { Logger } from '../../utils/logger';
import type { ReportTemplate } from './types';
/**
 * Template Manager for HTML Report Generator
 *
 * Manages Handlebars templates for report generation including:
 * - Template loading and compilation
 * - Template caching
 * - Custom helper registration
 * - Template validation
 * - Dynamic template creation
 */
export declare class TemplateManager {
    private templates;
    private templateSources;
    private logger;
    private templateDirectory;
    private cacheEnabled;
    constructor(templateDirectory: string, logger: Logger, cacheEnabled?: boolean);
    /**
     * Initialize the template manager
     */
    initialize(): Promise<void>;
    /**
     * Get a compiled template by name
     */
    getTemplate(name: string): HandlebarsTemplateDelegate | undefined;
    /**
     * Add a new template
     */
    addTemplate(template: ReportTemplate): Promise<void>;
    /**
     * Remove a template
     */
    removeTemplate(name: string): boolean;
    /**
     * Get all template names
     */
    getTemplateNames(): string[];
    /**
     * Get template source code
     */
    getTemplateSource(name: string): string | undefined;
    /**
     * Render a template with context
     */
    render(templateName: string, context: any): string;
    /**
     * Register a custom helper
     */
    registerHelper(name: string, helper: Handlebars.HelperDelegate): void;
    /**
     * Register multiple helpers
     */
    registerHelpers(helpers: Record<string, Handlebars.HelperDelegate>): void;
    /**
     * Reload all templates from disk
     */
    reloadTemplates(): Promise<void>;
    /**
     * Get template statistics
     */
    getStatistics(): {
        totalTemplates: number;
        templatesByType: Record<string, number>;
        cacheEnabled: boolean;
        memoryUsage: number;
    };
    private ensureTemplateDirectory;
    private loadAllTemplates;
    private loadTemplateFile;
    private validateTemplate;
    private saveTemplateToFile;
    private registerBuiltInHelpers;
    private createDefaultTemplates;
    private estimateMemoryUsage;
}
//# sourceMappingURL=template-manager.d.ts.map