/**
 * Schema Validator for OpenAPI Specifications
 *
 * Handles loading, parsing, and validating OpenAPI schemas
 */
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { Logger } from '../../utils/logger/index';
import type { ValidationConfig } from '../../utils/config/index';
export type OpenAPISpec = OpenAPIV3.Document | OpenAPIV3_1.Document;
export interface SchemaValidationResult {
    isValid: boolean;
    errors: SchemaValidationError[];
    warnings: SchemaValidationWarning[];
}
export interface SchemaValidationError {
    path: string;
    message: string;
    value?: any;
    schema?: any;
}
export interface SchemaValidationWarning {
    path: string;
    message: string;
    suggestion?: string;
}
export declare class SchemaValidator {
    private logger;
    private _config;
    private ajv;
    private loadedSpecs;
    constructor(config: ValidationConfig, logger: Logger);
    /**
     * Initialize the schema validator
     */
    initialize(): Promise<void>;
    /**
     * Load and parse OpenAPI specification from file
     */
    loadSpecification(specPath: string): Promise<OpenAPISpec>;
    /**
     * Validate data against a schema from the OpenAPI specification
     */
    validateAgainstSchema(data: any, schema: any, schemaPath?: string): SchemaValidationResult;
    /**
     * Get schema for a specific path and method from OpenAPI spec
     */
    getPathSchema(spec: OpenAPISpec, path: string, method: string): any;
    /**
     * Get request body schema for a specific operation
     */
    getRequestBodySchema(operation: any, contentType?: string): any;
    /**
     * Get response schema for a specific operation and status code
     */
    getResponseSchema(operation: any, statusCode: string, contentType?: string): any;
    /**
     * Clear cached specifications
     */
    clearCache(): void;
    /**
     * Add custom OpenAPI format validators
     */
    private addOpenAPIFormats;
    /**
     * Get validation statistics
     */
    getStats(): {
        cachedSpecs: number;
    };
}
//# sourceMappingURL=index.d.ts.map