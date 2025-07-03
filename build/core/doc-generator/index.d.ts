/**
 * API Documentation Generator
 *
 * Main entry point for automatic API documentation generation system
 */
import type { DocumentationConfig, GeneratedDocumentation } from './types';
export declare class DocumentationGenerator {
    private logger;
    private specParser;
    private codeParser;
    private templateManager;
    private exampleGenerator;
    constructor();
    /**
     * Generate documentation from OpenAPI specification
     */
    generateFromSpec(specPath: string, config: DocumentationConfig): Promise<GeneratedDocumentation>;
    /**
     * Generate documentation from code files
     */
    generateFromCode(codePaths: string[], config: DocumentationConfig): Promise<GeneratedDocumentation>;
    /**
     * Extract operations from parsed specification
     */
    private extractOperations;
    /**
     * Extract schemas from parsed specification
     */
    private extractSchemas;
    /**
     * Extract operations from parsed code
     */
    private extractOperationsFromCode;
    /**
     * Extract schemas from parsed code
     */
    private extractSchemasFromCode;
    /**
     * Generate code examples for operations
     */
    private generateCodeExamples;
    /**
     * Prepare template data
     */
    private prepareTemplateData;
    /**
     * Generate output files
     */
    private generateOutputFiles;
    /**
     * Create documentation error
     */
    private createDocumentationError;
}
export * from './types';
export { TemplateManager } from './template-manager';
export { CodeExampleGenerator } from './code-example-generator';
//# sourceMappingURL=index.d.ts.map