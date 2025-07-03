/**
 * Enhanced OpenAPI/Swagger Parser
 *
 * Provides comprehensive parsing, validation, and conversion utilities
 * for OpenAPI 3.0/3.1 and Swagger 2.0 specifications
 */
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { Logger } from '../../utils/logger/index';
import type { ValidationConfig } from '../../utils/config/index';
export type OpenAPISpec = OpenAPIV3.Document | OpenAPIV3_1.Document;
export type SwaggerSpec = any;
export interface ParsedSpec {
    spec: OpenAPISpec | SwaggerSpec;
    version: string;
    format: 'openapi' | 'swagger';
    paths: string[];
    operations: OperationInfo[];
    schemas: SchemaInfo[];
    metadata: SpecMetadata;
}
export interface OperationInfo {
    path: string;
    method: string;
    operationId?: string;
    summary?: string;
    description?: string;
    tags?: string[];
    parameters?: ParameterInfo[];
    requestBody?: RequestBodyInfo;
    responses?: ResponseInfo[];
    security?: SecurityRequirement[];
}
export interface ParameterInfo {
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    required: boolean;
    schema: any;
    description?: string;
}
export interface RequestBodyInfo {
    required: boolean;
    contentTypes: string[];
    schema: any;
    description?: string;
}
export interface ResponseInfo {
    statusCode: string;
    description: string;
    contentTypes: string[];
    schema?: any;
    headers?: {
        [key: string]: any;
    };
}
export interface SecurityRequirement {
    [key: string]: string[];
}
export interface SchemaInfo {
    name: string;
    schema: any;
    type: 'component' | 'inline';
    usageCount: number;
}
export interface SpecMetadata {
    title: string;
    version: string;
    description?: string;
    servers?: ServerInfo[];
    contact?: ContactInfo;
    license?: LicenseInfo;
    externalDocs?: ExternalDocsInfo;
    tags?: TagInfo[];
}
export interface ServerInfo {
    url: string;
    description?: string;
    variables?: {
        [key: string]: any;
    };
}
export interface ContactInfo {
    name?: string;
    url?: string;
    email?: string;
}
export interface LicenseInfo {
    name: string;
    url?: string;
}
export interface ExternalDocsInfo {
    description?: string;
    url: string;
}
export interface TagInfo {
    name: string;
    description?: string;
    externalDocs?: ExternalDocsInfo;
}
export interface ParserOptions {
    dereference?: boolean;
    validateSpec?: boolean;
    resolveExternalRefs?: boolean;
    continueOnError?: boolean;
    preserveRefs?: boolean;
    maxDepth?: number;
}
export interface ConversionOptions {
    targetVersion: '3.0' | '3.1';
    preserveExtensions?: boolean;
    updateRefs?: boolean;
    validateResult?: boolean;
}
export declare class SpecParser {
    private logger;
    private parsedSpecs;
    constructor(_config: ValidationConfig, logger: Logger);
    /**
     * Initialize the parser
     */
    initialize(): Promise<void>;
    /**
     * Parse OpenAPI/Swagger specification from file or object
     * Alias for parseSpecification
     */
    parseSpec(input: string | object, options?: ParserOptions): Promise<{
        success: boolean;
        spec?: ParsedSpec;
        error?: string;
    }>;
    /**
     * Parse OpenAPI/Swagger specification from file or object
     */
    parseSpecification(input: string | object, options?: ParserOptions): Promise<ParsedSpec>;
    /**
     * Load specification from file
     */
    private loadSpecFromFile;
    /**
     * Process specification with $RefParser
     */
    private processSpecification;
    /**
     * Extract structured information from specification
     */
    private extractSpecInfo;
    /**
     * Detect specification format (OpenAPI vs Swagger)
     */
    private detectSpecFormat;
    /**
     * Extract version from specification
     */
    private extractVersion;
    /**
     * Extract all paths from specification
     */
    private extractPaths;
    /**
     * Extract all operations from specification
     */
    private extractOperations;
    /**
     * Extract operation information
     */
    private extractOperationInfo;
    /**
     * Extract parameter information
     */
    private extractParameterInfo;
    /**
     * Extract request body information
     */
    private extractRequestBodyInfo;
    /**
     * Extract response information
     */
    private extractResponseInfo;
    /**
     * Extract schema information
     */
    private extractSchemas;
    /**
     * Extract metadata from specification
     */
    private extractMetadata;
    /**
     * Extract server information
     */
    private extractServers;
    /**
     * Clear parser cache
     */
    clearCache(): void;
    /**
     * Convert Swagger 2.0 to OpenAPI 3.0/3.1
     */
    convertSwaggerToOpenAPI(swaggerSpec: any, options?: ConversionOptions): Promise<OpenAPISpec>;
    /**
     * Convert Swagger servers to OpenAPI format
     */
    private convertSwaggerServers;
    /**
     * Convert Swagger paths to OpenAPI format
     */
    private convertSwaggerPaths;
    /**
     * Convert Swagger operation to OpenAPI format
     */
    private convertSwaggerOperation;
    /**
     * Convert Swagger parameter to OpenAPI format
     */
    private convertSwaggerParameter;
    /**
     * Convert Swagger responses to OpenAPI format
     */
    private convertSwaggerResponses;
    /**
     * Convert Swagger security definitions to OpenAPI format
     */
    private convertSwaggerSecurityDefinitions;
    /**
     * Convert Swagger OAuth2 flows to OpenAPI format
     */
    private convertSwaggerOAuth2Flows;
    /**
     * Validate OpenAPI specification
     */
    validateOpenAPISpec(spec: any): Promise<void>;
    /**
     * Get parser statistics
     */
    getStats(): {
        cachedSpecs: number;
    };
}
//# sourceMappingURL=index.d.ts.map