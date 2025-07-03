/**
 * Template Manager for API Documentation Generator
 *
 * Manages template loading, compilation, and rendering for documentation generation
 */
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import Handlebars from 'handlebars';
import { Logger } from '../../utils/logger/index';
export class TemplateManager {
    logger;
    handlebars;
    compiledTemplates = new Map();
    helpers;
    constructor() {
        this.logger = new Logger('TemplateManager');
        this.handlebars = Handlebars.create();
        this.helpers = this.createHelpers();
        this.registerHelpers();
    }
    /**
     * Load and compile template
     */
    async loadTemplate(config) {
        try {
            this.logger.info('Loading template', {
                engine: config.engine,
                builtinTemplate: config.builtinTemplate,
                templateDir: config.templateDir
            });
            let templateContent;
            const templateKey = this.getTemplateKey(config);
            // Check if template is already compiled
            if (this.compiledTemplates.has(templateKey)) {
                this.logger.debug('Using cached template', { templateKey });
                return this.compiledTemplates.get(templateKey);
            }
            // Load template content
            if (config.templateDir) {
                templateContent = await this.loadCustomTemplate(config.templateDir);
            }
            else if (config.builtinTemplate) {
                templateContent = await this.loadBuiltinTemplate(config.builtinTemplate);
            }
            else {
                templateContent = await this.loadBuiltinTemplate('default');
            }
            // Register partials if provided
            if (config.partials) {
                this.registerPartials(config.partials);
            }
            // Compile template
            const compiledTemplate = this.handlebars.compile(templateContent);
            this.compiledTemplates.set(templateKey, compiledTemplate);
            this.logger.info('Template loaded and compiled successfully', { templateKey });
            return compiledTemplate;
        }
        catch (error) {
            this.logger.error('Failed to load template', error);
            throw this.createTemplateError('TEMPLATE_LOAD_FAILED', 'Failed to load template', error);
        }
    }
    /**
     * Render template with data
     */
    async renderTemplate(template, data) {
        try {
            this.logger.debug('Rendering template', {
                operationCount: data.operations.length,
                schemaCount: data.schemas.length
            });
            // Add helpers to template data
            const templateDataWithHelpers = {
                ...data,
                helpers: this.helpers
            };
            const rendered = template(templateDataWithHelpers);
            this.logger.info('Template rendered successfully', {
                outputLength: rendered.length
            });
            return rendered;
        }
        catch (error) {
            this.logger.error('Failed to render template', error);
            throw this.createTemplateError('TEMPLATE_RENDER_FAILED', 'Failed to render template', error);
        }
    }
    /**
     * Load custom template from directory
     */
    async loadCustomTemplate(templateDir) {
        const templatePath = resolve(templateDir);
        if (!existsSync(templatePath)) {
            throw new Error(`Template directory not found: ${templatePath}`);
        }
        // Look for main template file
        const possibleFiles = ['index.hbs', 'main.hbs', 'template.hbs', 'api.hbs'];
        for (const filename of possibleFiles) {
            const filePath = join(templatePath, filename);
            if (existsSync(filePath)) {
                this.logger.debug('Loading custom template', { filePath });
                return readFileSync(filePath, 'utf-8');
            }
        }
        throw new Error(`No template file found in directory: ${templatePath}`);
    }
    /**
     * Load built-in template
     */
    async loadBuiltinTemplate(templateName) {
        const templatesDir = join(__dirname, 'templates');
        const templatePath = join(templatesDir, `${templateName}.hbs`);
        if (!existsSync(templatePath)) {
            this.logger.warn(`Built-in template not found: ${templateName}, using default`);
            return this.getDefaultTemplate();
        }
        this.logger.debug('Loading built-in template', { templateName, templatePath });
        return readFileSync(templatePath, 'utf-8');
    }
    /**
     * Get default template content
     */
    getDefaultTemplate() {
        return `# {{spec.info.title}}

{{#if spec.info.description}}
{{spec.info.description}}
{{/if}}

**Version:** {{spec.info.version}}

{{#if spec.info.contact}}
**Contact:** {{#if spec.info.contact.name}}{{spec.info.contact.name}}{{/if}}{{#if spec.info.contact.email}} ({{spec.info.contact.email}}){{/if}}
{{/if}}

{{#if spec.info.license}}
**License:** {{spec.info.license.name}}{{#if spec.info.license.url}} ([{{spec.info.license.url}}]({{spec.info.license.url}})){{/if}}
{{/if}}

## Table of Contents

{{#each operations}}
- [{{uppercase method}} {{path}}](#{{anchor (concat method "-" path)}})
{{/each}}

## API Endpoints

{{#each operations}}
### {{uppercase method}} {{path}}

{{#if summary}}
**Summary:** {{summary}}
{{/if}}

{{#if description}}
{{description}}
{{/if}}

{{#if tags}}
**Tags:** {{join tags ", "}}
{{/if}}

{{#if parameters}}
#### Parameters

| Name | In | Type | Required | Description |
|------|----|----- |----------|-------------|
{{#each parameters}}
| {{name}} | {{in}} | {{schema.type}} | {{#if required}}Yes{{else}}No{{/if}} | {{description}} |
{{/each}}
{{/if}}

{{#if requestBody}}
#### Request Body

{{#if requestBody.description}}
{{requestBody.description}}
{{/if}}

**Required:** {{#if requestBody.required}}Yes{{else}}No{{/if}}

{{#each requestBody.content}}
**Content Type:** \`{{@key}}\`

{{#if schema}}
\`\`\`json
{{formatJson schema}}
\`\`\`
{{/if}}
{{/each}}
{{/if}}

#### Responses

{{#each responses}}
**{{statusCode}}** - {{description}}

{{#if content}}
{{#each content}}
**Content Type:** \`{{@key}}\`

{{#if schema}}
\`\`\`json
{{formatJson schema}}
\`\`\`
{{/if}}
{{/each}}
{{/if}}

{{/each}}

{{#if examples}}
#### Code Examples

{{#each examples}}
**{{capitalize language}}**

\`\`\`{{language}}
{{code}}
\`\`\`

{{/each}}
{{/if}}

---

{{/each}}

{{#if schemas}}
## Data Models

{{#each schemas}}
### {{name}}

{{#if description}}
{{description}}
{{/if}}

\`\`\`json
{{formatJson schema}}
\`\`\`

{{#if properties}}
#### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
{{#each properties}}
| {{@key}} | {{type}} | {{#if (includes ../required @key)}}Yes{{else}}No{{/if}} | {{description}} |
{{/each}}
{{/if}}

---

{{/each}}
{{/if}}

---

*Generated on {{formatDate metadata.generatedAt}} by API Documentation Generator v{{metadata.generatorVersion}}*`;
    }
    /**
     * Register template helpers
     */
    registerHelpers() {
        // Register all helpers with Handlebars
        Object.entries(this.helpers).forEach(([name, helper]) => {
            this.handlebars.registerHelper(name, helper);
        });
        // Register additional Handlebars-specific helpers
        this.handlebars.registerHelper('concat', (...args) => {
            args.pop(); // Remove options object
            return args.join('');
        });
        this.handlebars.registerHelper('includes', (array, item) => {
            return Array.isArray(array) && array.includes(item);
        });
        this.handlebars.registerHelper('eq', (a, b) => a === b);
        this.handlebars.registerHelper('ne', (a, b) => a !== b);
        this.handlebars.registerHelper('gt', (a, b) => a > b);
        this.handlebars.registerHelper('lt', (a, b) => a < b);
    }
    /**
     * Register template partials
     */
    registerPartials(partials) {
        Object.entries(partials).forEach(([name, content]) => {
            this.handlebars.registerPartial(name, content);
        });
    }
    /**
     * Create template helpers
     */
    createHelpers() {
        return {
            formatJson: (obj) => JSON.stringify(obj, null, 2),
            anchor: (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            httpMethod: (method) => method.toUpperCase(),
            statusCode: (code) => code,
            hasItems: (arr) => Array.isArray(arr) && arr.length > 0,
            first: (arr) => Array.isArray(arr) ? arr[0] : undefined,
            join: (arr, separator) => Array.isArray(arr) ? arr.join(separator) : '',
            lowercase: (str) => String(str).toLowerCase(),
            uppercase: (str) => String(str).toUpperCase(),
            capitalize: (str) => {
                const s = String(str);
                return s.charAt(0).toUpperCase() + s.slice(1);
            },
            formatDate: (date) => new Date(date).toISOString().split('T')[0] || '',
            uniqueId: (prefix = 'id') => `${prefix}-${Math.random().toString(36).substring(2, 11)}`
        };
    }
    /**
     * Get template cache key
     */
    getTemplateKey(config) {
        return JSON.stringify({
            engine: config.engine,
            templateDir: config.templateDir,
            builtinTemplate: config.builtinTemplate
        });
    }
    /**
     * Create template error
     */
    createTemplateError(code, message, cause) {
        const error = new Error(message);
        error.code = code;
        error.context = { cause };
        error.suggestions = [
            'Check template file exists and is readable',
            'Verify template syntax is valid',
            'Ensure all required partials are provided'
        ];
        return error;
    }
    /**
     * Clear template cache
     */
    clearCache() {
        this.compiledTemplates.clear();
        this.logger.info('Template cache cleared');
    }
}
//# sourceMappingURL=template-manager.js.map