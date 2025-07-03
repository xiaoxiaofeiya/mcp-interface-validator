/**
 * API Documentation Generator
 *
 * Main entry point for automatic API documentation generation system
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { Logger } from '../../utils/logger/index.js';
import { SpecParser } from '../parser/index.js';
import { CodeParser } from '../code-parser/index.js';
import { TemplateManager } from './template-manager.js';
import { CodeExampleGenerator } from './code-example-generator.js';
export class DocumentationGenerator {
    logger;
    specParser;
    codeParser;
    templateManager;
    exampleGenerator;
    constructor() {
        this.logger = new Logger('DocumentationGenerator');
        this.specParser = new SpecParser({}, this.logger);
        this.codeParser = new CodeParser();
        this.templateManager = new TemplateManager();
        this.exampleGenerator = new CodeExampleGenerator();
    }
    /**
     * Generate documentation from OpenAPI specification
     */
    async generateFromSpec(specPath, config) {
        try {
            this.logger.info('Starting documentation generation', {
                specPath,
                format: config.format,
                outputDir: config.output.outputDir
            });
            const startTime = Date.now();
            // Parse OpenAPI specification
            this.logger.debug('Parsing OpenAPI specification');
            const parsedSpec = await this.specParser.parseSpecification(specPath);
            // Extract operations and schemas
            const operations = await this.extractOperations(parsedSpec);
            const schemas = await this.extractSchemas(parsedSpec);
            // Generate code examples
            this.logger.debug('Generating code examples');
            const operationsWithExamples = await this.generateCodeExamples(operations, config.codeExamples);
            // Prepare template data
            const templateData = await this.prepareTemplateData(parsedSpec, operationsWithExamples, schemas, config, startTime);
            // Load and render template
            this.logger.debug('Loading and rendering template');
            const template = await this.templateManager.loadTemplate(config.template);
            const renderedContent = await this.templateManager.renderTemplate(template, templateData);
            // Generate output files
            const files = await this.generateOutputFiles(renderedContent, config);
            // Create final documentation object
            const documentation = {
                content: renderedContent,
                format: config.format,
                files,
                metadata: templateData.metadata
            };
            this.logger.info('Documentation generation completed', {
                fileCount: files.length,
                totalSize: files.reduce((sum, f) => sum + f.size, 0),
                duration: Date.now() - startTime
            });
            return documentation;
        }
        catch (error) {
            this.logger.error('Documentation generation failed', error);
            throw this.createDocumentationError('GENERATION_FAILED', 'Failed to generate documentation', error);
        }
    }
    /**
     * Generate documentation from code files
     */
    async generateFromCode(codePaths, config) {
        try {
            this.logger.info('Generating documentation from code files', {
                codePathCount: codePaths.length,
                format: config.format
            });
            const startTime = Date.now();
            const operations = [];
            const schemas = [];
            // Parse code files to extract API information
            for (const codePath of codePaths) {
                this.logger.debug('Parsing code file', { codePath });
                const parsedCode = await this.codeParser.parseFile(codePath);
                // Extract API endpoints from parsed code
                const codeOperations = await this.extractOperationsFromCode(parsedCode);
                operations.push(...codeOperations);
                // Extract schemas from interfaces and classes
                const codeSchemas = await this.extractSchemasFromCode(parsedCode);
                schemas.push(...codeSchemas);
            }
            // Generate code examples
            const operationsWithExamples = await this.generateCodeExamples(operations, config.codeExamples);
            // Create mock spec for template data
            const mockSpec = {
                info: {
                    title: 'API Documentation',
                    version: '1.0.0',
                    description: 'Generated from code analysis'
                },
                openapi: '3.0.0',
                paths: {}
            };
            // Prepare template data
            const templateData = await this.prepareTemplateData({ spec: mockSpec }, operationsWithExamples, schemas, config, startTime);
            // Load and render template
            const template = await this.templateManager.loadTemplate(config.template);
            const renderedContent = await this.templateManager.renderTemplate(template, templateData);
            // Generate output files
            const files = await this.generateOutputFiles(renderedContent, config);
            const documentation = {
                content: renderedContent,
                format: config.format,
                files,
                metadata: templateData.metadata
            };
            this.logger.info('Code-based documentation generation completed', {
                operationCount: operations.length,
                schemaCount: schemas.length,
                duration: Date.now() - startTime
            });
            return documentation;
        }
        catch (error) {
            this.logger.error('Code-based documentation generation failed', error);
            throw this.createDocumentationError('CODE_GENERATION_FAILED', 'Failed to generate documentation from code', error);
        }
    }
    /**
     * Extract operations from parsed specification
     */
    async extractOperations(parsedSpec) {
        const operations = [];
        for (const operation of parsedSpec.operations) {
            const operationData = {
                operationId: operation.operationId || `${operation.method}_${operation.path}`,
                method: operation.method,
                path: operation.path,
                summary: operation.summary,
                description: operation.description,
                tags: operation.tags || [],
                parameters: operation.parameters || [],
                requestBody: operation.requestBody,
                responses: operation.responses || [],
                security: operation.security,
                examples: [] // Will be populated later
            };
            operations.push(operationData);
        }
        return operations;
    }
    /**
     * Extract schemas from parsed specification
     */
    async extractSchemas(parsedSpec) {
        const schemas = [];
        for (const schema of parsedSpec.schemas) {
            const schemaData = {
                name: schema.name,
                schema: schema.schema,
                description: schema.description,
                type: schema.type,
                properties: schema.properties,
                required: schema.required,
                example: schema.example
            };
            schemas.push(schemaData);
        }
        return schemas;
    }
    /**
     * Extract operations from parsed code
     */
    async extractOperationsFromCode(parsedCode) {
        const operations = [];
        // Extract API endpoints from parsed code
        for (const endpoint of parsedCode.apiEndpoints || []) {
            const operation = {
                operationId: endpoint.name || `${endpoint.method}_${endpoint.path}`,
                method: endpoint.method,
                path: endpoint.path,
                summary: endpoint.summary,
                description: endpoint.description,
                tags: endpoint.tags || [],
                parameters: endpoint.parameters || [],
                requestBody: endpoint.requestBody,
                responses: endpoint.responses || [],
                security: endpoint.security,
                examples: []
            };
            operations.push(operation);
        }
        return operations;
    }
    /**
     * Extract schemas from parsed code
     */
    async extractSchemasFromCode(parsedCode) {
        const schemas = [];
        // Extract schemas from interfaces
        for (const interfaceInfo of parsedCode.interfaces || []) {
            const schema = {
                name: interfaceInfo.name,
                schema: {
                    type: 'object',
                    properties: interfaceInfo.properties || {},
                    required: interfaceInfo.required || []
                },
                description: interfaceInfo.description,
                type: 'object',
                properties: interfaceInfo.properties,
                required: interfaceInfo.required
            };
            schemas.push(schema);
        }
        // Extract schemas from classes
        for (const classInfo of parsedCode.classes || []) {
            const schema = {
                name: classInfo.name,
                schema: {
                    type: 'object',
                    properties: classInfo.properties || {},
                    required: []
                },
                description: classInfo.description,
                type: 'object',
                properties: classInfo.properties
            };
            schemas.push(schema);
        }
        return schemas;
    }
    /**
     * Generate code examples for operations
     */
    async generateCodeExamples(operations, config) {
        const operationsWithExamples = [...operations];
        for (const operation of operationsWithExamples) {
            try {
                operation.examples = await this.exampleGenerator.generateExamples(operation, config);
            }
            catch (error) {
                this.logger.warn('Failed to generate examples for operation', {
                    operationId: operation.operationId,
                    error: error instanceof Error ? error.message : String(error)
                });
                operation.examples = [];
            }
        }
        return operationsWithExamples;
    }
    /**
     * Prepare template data
     */
    async prepareTemplateData(parsedSpec, operations, schemas, config, startTime) {
        const metadata = {
            generatedAt: new Date(),
            generatorVersion: '1.0.0',
            sourceSpec: {
                title: parsedSpec.spec?.info?.title || 'API Documentation',
                version: parsedSpec.spec?.info?.version || '1.0.0',
                format: parsedSpec.format || 'openapi',
                operationCount: operations.length,
                schemaCount: schemas.length
            },
            stats: {
                totalFiles: 1,
                totalSize: 0, // Will be calculated later
                generationTime: Date.now() - startTime,
                templateEngine: config.template.engine,
                codeExampleCount: operations.reduce((sum, op) => sum + op.examples.length, 0)
            },
            config
        };
        return {
            spec: parsedSpec.spec || {},
            operations,
            schemas,
            codeExamples: {},
            config,
            metadata,
            helpers: {} // Will be provided by template manager
        };
    }
    /**
     * Generate output files
     */
    async generateOutputFiles(content, config) {
        const files = [];
        const outputDir = resolve(config.output.outputDir);
        // Ensure output directory exists
        if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true });
        }
        // Generate main documentation file
        const mainFileName = config.output.filenamePattern || 'api-documentation';
        const extension = config.format === 'html' ? 'html' : 'md';
        const mainFilePath = join(outputDir, `${mainFileName}.${extension}`);
        writeFileSync(mainFilePath, content, 'utf-8');
        const mainFile = {
            path: `${mainFileName}.${extension}`,
            content,
            type: 'documentation',
            size: Buffer.byteLength(content, 'utf-8')
        };
        files.push(mainFile);
        this.logger.info('Output files generated', {
            mainFile: mainFilePath,
            fileCount: files.length
        });
        return files;
    }
    /**
     * Create documentation error
     */
    createDocumentationError(code, message, cause) {
        const error = new Error(message);
        error.code = code;
        error.context = { cause };
        error.suggestions = [
            'Check input specification is valid',
            'Verify configuration is correct',
            'Ensure output directory is writable'
        ];
        return error;
    }
}
// Export types and main class
export * from './types.js';
export { TemplateManager } from './template-manager.js';
export { CodeExampleGenerator } from './code-example-generator.js';
//# sourceMappingURL=index.js.map