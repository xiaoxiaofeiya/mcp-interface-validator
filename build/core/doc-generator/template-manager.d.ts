/**
 * Template Manager for API Documentation Generator
 *
 * Manages template loading, compilation, and rendering for documentation generation
 */
import type { TemplateConfig, TemplateData } from './types';
export declare class TemplateManager {
    private logger;
    private handlebars;
    private compiledTemplates;
    private helpers;
    constructor();
    /**
     * Load and compile template
     */
    loadTemplate(config: TemplateConfig): Promise<HandlebarsTemplateDelegate>;
    /**
     * Render template with data
     */
    renderTemplate(template: HandlebarsTemplateDelegate, data: TemplateData): Promise<string>;
    /**
     * Load custom template from directory
     */
    private loadCustomTemplate;
    /**
     * Load built-in template
     */
    private loadBuiltinTemplate;
    /**
     * Get default template content
     */
    private getDefaultTemplate;
    /**
     * Register template helpers
     */
    private registerHelpers;
    /**
     * Register template partials
     */
    private registerPartials;
    /**
     * Create template helpers
     */
    private createHelpers;
    /**
     * Get template cache key
     */
    private getTemplateKey;
    /**
     * Create template error
     */
    private createTemplateError;
    /**
     * Clear template cache
     */
    clearCache(): void;
}
//# sourceMappingURL=template-manager.d.ts.map