/**
 * Code Example Generator for API Documentation
 *
 * Generates code examples in multiple programming languages for API operations
 */
import type { CodeExampleConfig, OperationData, CodeExample } from './types';
export declare class CodeExampleGenerator {
    private logger;
    constructor();
    /**
     * Generate code examples for an operation
     */
    generateExamples(operation: OperationData, config: CodeExampleConfig): Promise<CodeExample[]>;
    /**
     * Generate request example
     */
    private generateRequestExample;
    /**
     * Generate TypeScript request example
     */
    private generateTypeScriptRequest;
    /**
     * Generate JavaScript request example
     */
    private generateJavaScriptRequest;
    /**
     * Generate Python request example
     */
    private generatePythonRequest;
    /**
     * Generate Java request example
     */
    private generateJavaRequest;
    /**
     * Generate cURL request example
     */
    private generateCurlRequest;
    /**
     * Generate response examples
     */
    private generateResponseExamples;
    /**
     * Generate error examples
     */
    private generateErrorExamples;
    /**
     * Generate response JSON example
     */
    private generateResponseJson;
    /**
     * Generate example data from schema
     */
    private generateExampleFromSchema;
    /**
     * Create example generation error
     */
    private createExampleError;
}
//# sourceMappingURL=code-example-generator.d.ts.map