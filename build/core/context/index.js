/**
 * Context Enhancer for API Specification Management
 *
 * Manages and injects API specification context for different tech stacks
 * and development environments
 */
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { Logger } from '../../utils/logger/index.js';
export class ContextEnhancer {
    logger;
    // private _config: ValidationConfig;
    templates = new Map();
    contextCache = new Map();
    templatesPath;
    constructor(_config, logger, templatesPath) {
        // this._config = config;
        this.logger = logger;
        this.templatesPath = templatesPath || resolve(__dirname, '../../../templates');
    }
    /**
     * Initialize the context enhancer
     */
    async initialize() {
        try {
            this.logger.info('Initializing Context Enhancer...');
            // Ensure templates directory exists
            if (!existsSync(this.templatesPath)) {
                mkdirSync(this.templatesPath, { recursive: true });
            }
            // Load built-in templates
            await this.loadBuiltInTemplates();
            // Load custom templates
            await this.loadCustomTemplates();
            this.logger.info('Context Enhancer initialized successfully', {
                templatesLoaded: this.templates.size,
                templatesPath: this.templatesPath
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize Context Enhancer:', error);
            throw error;
        }
    }
    /**
     * Generate context for API specification
     */
    async generateContext(contextData, options = {}) {
        try {
            this.logger.info('Generating context', {
                templateId: options.templateId,
                techStack: contextData.techStack
            });
            // Select appropriate template
            const template = await this.selectTemplate(contextData, options.templateId);
            // Prepare template variables
            const variables = await this.prepareVariables(contextData, template, options.variables);
            // Generate content
            const content = await this.renderTemplate(template, variables);
            // Create generated context
            const generatedContext = {
                id: this.generateContextId(template.id, contextData.spec.version),
                templateId: template.id,
                content,
                format: template.outputFormat,
                metadata: {
                    specVersion: contextData.spec.version,
                    techStack: this.extractTechStackNames(contextData.techStack),
                    variables,
                    ...(options.outputPath && { outputPath: options.outputPath })
                },
                generatedAt: new Date()
            };
            // Cache the generated context
            this.contextCache.set(generatedContext.id, generatedContext);
            // Save to file if output path specified
            if (options.outputPath) {
                await this.saveContextToFile(generatedContext, options.outputPath);
            }
            this.logger.info('Context generated successfully', {
                contextId: generatedContext.id,
                templateId: template.id,
                contentLength: content.length
            });
            return generatedContext;
        }
        catch (error) {
            this.logger.error('Failed to generate context:', error);
            throw new Error(`Context generation failed: ${error}`);
        }
    }
    /**
     * Update context with new data
     */
    async updateContext(contextId, newData, options = {}) {
        const existingContext = this.contextCache.get(contextId);
        if (!existingContext) {
            throw new Error(`Context not found: ${contextId}`);
        }
        // Get the template
        const template = this.templates.get(existingContext.templateId);
        if (!template) {
            throw new Error(`Template not found: ${existingContext.templateId}`);
        }
        // Merge existing metadata with new data
        const mergedData = this.mergeContextData(existingContext.metadata, newData);
        // Regenerate context
        return await this.generateContext(mergedData, {
            ...options,
            templateId: template.id
        });
    }
    /**
     * Get available templates
     */
    getAvailableTemplates() {
        return Array.from(this.templates.values());
    }
    /**
     * Get templates for specific tech stack
     */
    getTemplatesForTechStack(techStack) {
        return Array.from(this.templates.values()).filter(template => template.techStack.some(stack => techStack.some(ts => ts.toLowerCase().includes(stack.toLowerCase()))));
    }
    /**
     * Register custom template
     */
    registerTemplate(template) {
        this.templates.set(template.id, template);
        this.logger.debug('Template registered', { templateId: template.id });
    }
    /**
     * Load built-in templates
     */
    async loadBuiltInTemplates() {
        const builtInTemplates = [
            {
                id: 'openapi-typescript',
                name: 'OpenAPI TypeScript Client',
                description: 'Generate TypeScript client context from OpenAPI specification',
                techStack: ['typescript', 'javascript', 'react', 'vue', 'angular'],
                template: this.getBuiltInTemplate('openapi-typescript'),
                variables: [
                    { name: 'clientName', type: 'string', description: 'Name of the client class', required: true },
                    { name: 'baseUrl', type: 'string', description: 'Base URL for API calls', required: false },
                    { name: 'includeAuth', type: 'boolean', description: 'Include authentication helpers', required: false, defaultValue: true }
                ],
                outputFormat: 'markdown'
            },
            {
                id: 'openapi-python',
                name: 'OpenAPI Python Client',
                description: 'Generate Python client context from OpenAPI specification',
                techStack: ['python', 'django', 'flask', 'fastapi'],
                template: this.getBuiltInTemplate('openapi-python'),
                variables: [
                    { name: 'packageName', type: 'string', description: 'Name of the Python package', required: true },
                    { name: 'className', type: 'string', description: 'Name of the client class', required: true },
                    { name: 'asyncSupport', type: 'boolean', description: 'Include async/await support', required: false, defaultValue: true }
                ],
                outputFormat: 'markdown'
            },
            {
                id: 'openapi-java',
                name: 'OpenAPI Java Client',
                description: 'Generate Java client context from OpenAPI specification',
                techStack: ['java', 'spring', 'springboot'],
                template: this.getBuiltInTemplate('openapi-java'),
                variables: [
                    { name: 'packageName', type: 'string', description: 'Java package name', required: true },
                    { name: 'className', type: 'string', description: 'Name of the client class', required: true },
                    { name: 'useSpring', type: 'boolean', description: 'Use Spring framework features', required: false, defaultValue: false }
                ],
                outputFormat: 'markdown'
            }
        ];
        builtInTemplates.forEach(template => {
            this.templates.set(template.id, template);
        });
        this.logger.debug('Built-in templates loaded', { count: builtInTemplates.length });
    }
    /**
     * Load custom templates from templates directory
     */
    async loadCustomTemplates() {
        // Implementation for loading custom templates from files
        // This would scan the templates directory for .json or .yaml files
        this.logger.debug('Custom templates loading skipped (not implemented)');
    }
    /**
     * Select appropriate template based on context data
     */
    async selectTemplate(contextData, templateId) {
        if (templateId) {
            const template = this.templates.get(templateId);
            if (!template) {
                throw new Error(`Template not found: ${templateId}`);
            }
            return template;
        }
        // Auto-select based on tech stack
        const techStackNames = this.extractTechStackNames(contextData.techStack);
        const compatibleTemplates = this.getTemplatesForTechStack(techStackNames);
        if (compatibleTemplates.length === 0) {
            // Fallback to first available template
            const firstTemplate = Array.from(this.templates.values())[0];
            if (!firstTemplate) {
                throw new Error('No templates available');
            }
            return firstTemplate;
        }
        return compatibleTemplates[0] || this.getDefaultTemplate();
    }
    /**
     * Get default template when no compatible templates found
     */
    getDefaultTemplate() {
        return {
            id: 'default',
            name: 'Default Template',
            description: 'Default context template',
            template: '// Default context template\n{{spec}}',
            techStack: [],
            variables: [],
            outputFormat: 'text'
        };
    }
    /**
     * Prepare template variables
     */
    async prepareVariables(contextData, template, customVariables) {
        const variables = {
            // Built-in variables
            specTitle: contextData.spec.metadata.title,
            specVersion: contextData.spec.metadata.version,
            specDescription: contextData.spec.metadata.description,
            operationCount: contextData.spec.operations.length,
            schemaCount: contextData.spec.schemas.length,
            projectName: contextData.projectInfo.name,
            projectVersion: contextData.projectInfo.version,
            ...customVariables
        };
        // Set default values for template variables
        template.variables.forEach(variable => {
            if (!(variable.name in variables) && variable.defaultValue !== undefined) {
                variables[variable.name] = variable.defaultValue;
            }
        });
        return variables;
    }
    /**
     * Render template with variables
     */
    async renderTemplate(template, variables) {
        let content = template.template;
        // Simple template variable replacement
        Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            content = content.replace(regex, String(value));
        });
        return content;
    }
    /**
     * Extract tech stack names from tech stack info
     */
    extractTechStackNames(techStack) {
        const names = [];
        if (techStack.frontend?.name)
            names.push(techStack.frontend.name);
        if (techStack.backend?.name)
            names.push(techStack.backend.name);
        if (techStack.database?.type)
            names.push(techStack.database.type);
        if (techStack.deployment?.platform)
            names.push(techStack.deployment.platform);
        if (techStack.testing?.frameworks)
            names.push(...techStack.testing.frameworks);
        return names;
    }
    /**
     * Generate unique context ID
     */
    generateContextId(templateId, specVersion) {
        const timestamp = Date.now();
        return `${templateId}-${specVersion}-${timestamp}`;
    }
    /**
     * Inject enhanced context into the development environment
     */
    async injectContext(context) {
        try {
            this.logger.info('Injecting enhanced context...');
            // Store in cache
            this.contextCache.set(context.metadata.specVersion, context);
            // Save to file if output path is specified
            if (context.metadata.outputPath) {
                await this.saveContextToFile(context, context.metadata.outputPath);
            }
            this.logger.info('Context injected successfully');
            return true;
        }
        catch (error) {
            this.logger.error('Failed to inject context:', error);
            return false;
        }
    }
    /**
     * Save generated context to file
     */
    async saveContextToFile(context, outputPath) {
        const fullPath = resolve(outputPath);
        const dir = dirname(fullPath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(fullPath, context.content, 'utf-8');
        this.logger.debug('Context saved to file', { path: fullPath });
    }
    /**
     * Merge context data for updates
     */
    mergeContextData(existingMetadata, newData) {
        // Create a base context data structure from existing metadata
        const baseContextData = {
            spec: {
                version: existingMetadata.specVersion,
                format: 'openapi',
                spec: {}, // Add the required spec field
                metadata: {
                    title: 'Updated API',
                    version: existingMetadata.specVersion,
                    description: 'Updated API Description'
                },
                operations: [],
                schemas: [],
                paths: []
            },
            projectInfo: {
                name: 'updated-project',
                version: '1.0.0',
                rootPath: '/updated/project'
            },
            techStack: {}
        };
        // Merge with new data
        return {
            ...baseContextData,
            ...newData,
            projectInfo: {
                ...baseContextData.projectInfo,
                ...newData.projectInfo
            },
            techStack: {
                ...baseContextData.techStack,
                ...newData.techStack
            }
        };
    }
    /**
     * Get built-in template content
     */
    getBuiltInTemplate(templateId) {
        const templates = {
            'openapi-typescript': `
# {{specTitle}} TypeScript Client

Generated from OpenAPI specification version {{specVersion}}.

## Overview
{{specDescription}}

## Client Configuration
\`\`\`typescript
const client = new {{clientName}}({
  baseURL: '{{baseUrl}}',
  {{#if includeAuth}}
  auth: {
    // Authentication configuration
  }
  {{/if}}
});
\`\`\`

## Available Operations
Total operations: {{operationCount}}

## Schema Definitions
Total schemas: {{schemaCount}}
`,
            'openapi-python': `
# {{specTitle}} Python Client

Generated from OpenAPI specification version {{specVersion}}.

## Overview
{{specDescription}}

## Installation
\`\`\`bash
pip install {{packageName}}
\`\`\`

## Usage
\`\`\`python
from {{packageName}} import {{className}}

{{#if asyncSupport}}
import asyncio

async def main():
    client = {{className}}()
    # Use client methods here
{{else}}
client = {{className}}()
# Use client methods here
{{/if}}
\`\`\`

## Available Operations
Total operations: {{operationCount}}
`,
            'openapi-java': `
# {{specTitle}} Java Client

Generated from OpenAPI specification version {{specVersion}}.

## Overview
{{specDescription}}

## Maven Dependency
\`\`\`xml
<dependency>
    <groupId>{{packageName}}</groupId>
    <artifactId>{{projectName}}-client</artifactId>
    <version>{{projectVersion}}</version>
</dependency>
\`\`\`

## Usage
\`\`\`java
{{#if useSpring}}
@Autowired
private {{className}} client;
{{else}}
{{className}} client = new {{className}}();
{{/if}}
\`\`\`

## Available Operations
Total operations: {{operationCount}}
`
        };
        return templates[templateId] || '';
    }
    /**
     * Clear context cache
     */
    clearCache() {
        this.contextCache.clear();
        this.logger.debug('Context cache cleared');
    }
    /**
     * Get context enhancer statistics
     */
    getStats() {
        return {
            templatesLoaded: this.templates.size,
            cachedContexts: this.contextCache.size,
            templatesPath: this.templatesPath
        };
    }
}
//# sourceMappingURL=index.js.map