/**
 * Enhanced OpenAPI/Swagger Parser
 * 
 * Provides comprehensive parsing, validation, and conversion utilities
 * for OpenAPI 3.0/3.1 and Swagger 2.0 specifications
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import { parse as parseYaml } from 'yaml';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

import { Logger } from '../../utils/logger/index.js';
import type { ValidationConfig } from '../../utils/config/index.js';

export type OpenAPISpec = OpenAPIV3.Document | OpenAPIV3_1.Document;
export type SwaggerSpec = any; // Swagger 2.0 type

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
  headers?: { [key: string]: any };
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
  variables?: { [key: string]: any };
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

export class SpecParser {
  private logger: Logger;
  // private _config: ValidationConfig;
  private parsedSpecs: Map<string, ParsedSpec> = new Map();

  constructor(_config: ValidationConfig, logger: Logger) {
    // this._config = config;
    this.logger = logger;
  }

  /**
   * Initialize the parser
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing OpenAPI/Swagger Parser...');
      
      // Initialize any required resources
      
      this.logger.info('OpenAPI/Swagger Parser initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize OpenAPI/Swagger Parser:', error);
      throw error;
    }
  }

  /**
   * Parse OpenAPI/Swagger specification from file or object
   * Alias for parseSpecification
   */
  async parseSpec(
    input: string | object,
    options: ParserOptions = {}
  ): Promise<{ success: boolean; spec?: ParsedSpec; error?: string }> {
    try {
      const spec = await this.parseSpecification(input, options);
      return { success: true, spec };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Parse OpenAPI/Swagger specification from file or object
   */
  async parseSpecification(
    input: string | object,
    options: ParserOptions = {}
  ): Promise<ParsedSpec> {
    try {
      this.logger.info('Parsing OpenAPI/Swagger specification', { 
        input: typeof input === 'string' ? input : 'object',
        options 
      });

      let rawSpec: any;
      let specPath: string | undefined;

      // Load specification
      if (typeof input === 'string') {
        specPath = resolve(input);
        
        // Check cache first
        if (this.parsedSpecs.has(specPath) && !options.validateSpec) {
          this.logger.debug('Using cached parsed specification', { specPath });
          return this.parsedSpecs.get(specPath)!;
        }

        if (!existsSync(specPath)) {
          throw new Error(`Specification file not found: ${specPath}`);
        }

        rawSpec = await this.loadSpecFromFile(specPath);
      } else {
        rawSpec = input;
      }

      // Validate and process specification
      const processedSpec = await this.processSpecification(rawSpec, options);
      
      // Parse into structured format
      const parsedSpec = await this.extractSpecInfo(processedSpec, options);

      // Cache if loaded from file
      if (specPath) {
        this.parsedSpecs.set(specPath, parsedSpec);
      }

      this.logger.info('Specification parsed successfully', {
        format: parsedSpec.format,
        version: parsedSpec.version,
        pathCount: parsedSpec.paths.length,
        operationCount: parsedSpec.operations.length,
        schemaCount: parsedSpec.schemas.length
      });

      return parsedSpec;
    } catch (error) {
      this.logger.error('Failed to parse specification:', error);
      throw new Error(`Failed to parse specification: ${error}`);
    }
  }

  /**
   * Load specification from file
   */
  private async loadSpecFromFile(filePath: string): Promise<any> {
    const content = readFileSync(filePath, 'utf-8');
    const ext = extname(filePath).toLowerCase();

    if (ext === '.json') {
      return JSON.parse(content);
    } else if (ext === '.yaml' || ext === '.yml') {
      return parseYaml(content);
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  /**
   * Process specification with $RefParser
   */
  private async processSpecification(spec: any, options: ParserOptions): Promise<any> {
    const parserOptions = {
      continueOnError: options.continueOnError || false,
      dereference: {
        circular: options.continueOnError || false
      },
      resolve: {
        external: options.resolveExternalRefs !== false
      }
    };

    if (options.dereference) {
      return await $RefParser.dereference(spec, parserOptions);
    } else {
      const parser = new $RefParser();
      await parser.parse(spec, parserOptions);
      return parser.schema;
    }
  }

  /**
   * Extract structured information from specification
   */
  private async extractSpecInfo(spec: any, _options: ParserOptions): Promise<ParsedSpec> {
    const format = this.detectSpecFormat(spec);
    const version = this.extractVersion(spec, format);
    
    return {
      spec,
      version,
      format,
      paths: this.extractPaths(spec),
      operations: this.extractOperations(spec),
      schemas: this.extractSchemas(spec),
      metadata: this.extractMetadata(spec, format)
    };
  }

  /**
   * Detect specification format (OpenAPI vs Swagger)
   */
  private detectSpecFormat(spec: any): 'openapi' | 'swagger' {
    if (spec.openapi) {
      return 'openapi';
    } else if (spec.swagger) {
      return 'swagger';
    } else {
      throw new Error('Invalid specification: missing openapi or swagger field');
    }
  }

  /**
   * Extract version from specification
   */
  private extractVersion(spec: any, format: 'openapi' | 'swagger'): string {
    return format === 'openapi' ? spec.openapi : spec.swagger;
  }

  /**
   * Extract all paths from specification
   */
  private extractPaths(spec: any): string[] {
    return Object.keys(spec.paths || {});
  }

  /**
   * Extract all operations from specification
   */
  private extractOperations(spec: any): OperationInfo[] {
    const operations: OperationInfo[] = [];
    const paths = spec.paths || {};

    for (const [path, pathItem] of Object.entries(paths)) {
      const pathObj = pathItem as any;
      const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'trace'];

      for (const method of httpMethods) {
        const operation = pathObj[method];
        if (operation) {
          operations.push(this.extractOperationInfo(path, method, operation, pathObj.parameters));
        }
      }
    }

    return operations;
  }

  /**
   * Extract operation information
   */
  private extractOperationInfo(
    path: string, 
    method: string, 
    operation: any, 
    pathParameters?: any[]
  ): OperationInfo {
    const parameters = [
      ...(pathParameters || []),
      ...(operation.parameters || [])
    ].map(param => this.extractParameterInfo(param));

    const requestBody = operation.requestBody 
      ? this.extractRequestBodyInfo(operation.requestBody)
      : undefined;

    const responses = Object.entries(operation.responses || {})
      .map(([statusCode, response]) => 
        this.extractResponseInfo(statusCode, response as any)
      );

    const result: OperationInfo = {
      path,
      method: method.toUpperCase(),
      operationId: operation.operationId,
      summary: operation.summary,
      description: operation.description,
      tags: operation.tags,
      parameters,
      responses,
      security: operation.security
    };

    if (requestBody) {
      result.requestBody = requestBody;
    }

    return result;
  }

  /**
   * Extract parameter information
   */
  private extractParameterInfo(param: any): ParameterInfo {
    return {
      name: param.name,
      in: param.in,
      required: param.required || param.in === 'path',
      schema: param.schema || param,
      description: param.description
    };
  }

  /**
   * Extract request body information
   */
  private extractRequestBodyInfo(requestBody: any): RequestBodyInfo {
    const content = requestBody.content || {};
    const contentTypes = Object.keys(content);
    const firstContentType = contentTypes[0];
    const schema = firstContentType ? content[firstContentType]?.schema : undefined;

    return {
      required: requestBody.required || false,
      contentTypes,
      schema,
      description: requestBody.description
    };
  }

  /**
   * Extract response information
   */
  private extractResponseInfo(statusCode: string, response: any): ResponseInfo {
    const content = response.content || {};
    const contentTypes = Object.keys(content);
    const firstContentType = contentTypes[0];
    const schema = firstContentType ? content[firstContentType]?.schema : undefined;

    return {
      statusCode,
      description: response.description || '',
      contentTypes,
      schema,
      headers: response.headers
    };
  }

  /**
   * Extract schema information
   */
  private extractSchemas(spec: any): SchemaInfo[] {
    const schemas: SchemaInfo[] = [];
    const components = spec.components || spec.definitions || {};
    const schemaDefinitions = components.schemas || components;

    for (const [name, schema] of Object.entries(schemaDefinitions || {})) {
      schemas.push({
        name,
        schema: schema as any,
        type: 'component',
        usageCount: 0 // TODO: Calculate actual usage
      });
    }

    return schemas;
  }

  /**
   * Extract metadata from specification
   */
  private extractMetadata(spec: any, format: 'openapi' | 'swagger'): SpecMetadata {
    const info = spec.info || {};
    
    return {
      title: info.title || 'Untitled API',
      version: info.version || '1.0.0',
      description: info.description,
      servers: this.extractServers(spec, format),
      contact: info.contact,
      license: info.license,
      externalDocs: spec.externalDocs,
      tags: spec.tags
    };
  }

  /**
   * Extract server information
   */
  private extractServers(spec: any, format: 'openapi' | 'swagger'): ServerInfo[] {
    if (format === 'openapi' && spec.servers) {
      return spec.servers.map((server: any) => ({
        url: server.url,
        description: server.description,
        variables: server.variables
      }));
    } else if (format === 'swagger') {
      const schemes = spec.schemes || ['https'];
      const host = spec.host || 'localhost';
      const basePath = spec.basePath || '';
      
      return schemes.map((scheme: string) => ({
        url: `${scheme}://${host}${basePath}`,
        description: `${scheme.toUpperCase()} server`
      }));
    }
    
    return [];
  }

  /**
   * Clear parser cache
   */
  clearCache(): void {
    this.parsedSpecs.clear();
    this.logger.debug('Parser cache cleared');
  }

  /**
   * Convert Swagger 2.0 to OpenAPI 3.0/3.1
   */
  async convertSwaggerToOpenAPI(
    swaggerSpec: any,
    options: ConversionOptions = { targetVersion: '3.0' }
  ): Promise<OpenAPISpec> {
    try {
      this.logger.info('Converting Swagger 2.0 to OpenAPI', { targetVersion: options.targetVersion });

      if (!swaggerSpec.swagger || !swaggerSpec.swagger.startsWith('2.')) {
        throw new Error('Input is not a valid Swagger 2.0 specification');
      }

      const openApiSpec: any = {
        openapi: options.targetVersion,
        info: swaggerSpec.info || {},
        paths: {},
        components: {
          schemas: {},
          responses: {},
          parameters: {},
          examples: {},
          requestBodies: {},
          headers: {},
          securitySchemes: {},
          links: {},
          callbacks: {}
        }
      };

      // Convert servers
      if (swaggerSpec.host || swaggerSpec.basePath || swaggerSpec.schemes) {
        openApiSpec.servers = this.convertSwaggerServers(swaggerSpec);
      }

      // Convert paths
      if (swaggerSpec.paths) {
        openApiSpec.paths = this.convertSwaggerPaths(swaggerSpec.paths, swaggerSpec.definitions);
      }

      // Convert definitions to components/schemas
      if (swaggerSpec.definitions) {
        openApiSpec.components.schemas = swaggerSpec.definitions;
      }

      // Convert security definitions
      if (swaggerSpec.securityDefinitions) {
        openApiSpec.components.securitySchemes = this.convertSwaggerSecurityDefinitions(
          swaggerSpec.securityDefinitions
        );
      }

      // Convert global security
      if (swaggerSpec.security) {
        openApiSpec.security = swaggerSpec.security;
      }

      // Copy other fields
      if (swaggerSpec.tags) openApiSpec.tags = swaggerSpec.tags;
      if (swaggerSpec.externalDocs) openApiSpec.externalDocs = swaggerSpec.externalDocs;

      // Validate result if requested
      if (options.validateResult) {
        await this.validateOpenAPISpec(openApiSpec);
      }

      this.logger.info('Swagger to OpenAPI conversion completed successfully');
      return openApiSpec;
    } catch (error) {
      this.logger.error('Failed to convert Swagger to OpenAPI:', error);
      throw new Error(`Swagger to OpenAPI conversion failed: ${error}`);
    }
  }

  /**
   * Convert Swagger servers to OpenAPI format
   */
  private convertSwaggerServers(swaggerSpec: any): ServerInfo[] {
    const schemes = swaggerSpec.schemes || ['https'];
    const host = swaggerSpec.host || 'localhost';
    const basePath = swaggerSpec.basePath || '';

    return schemes.map((scheme: string) => ({
      url: `${scheme}://${host}${basePath}`,
      description: `${scheme.toUpperCase()} server`
    }));
  }

  /**
   * Convert Swagger paths to OpenAPI format
   */
  private convertSwaggerPaths(swaggerPaths: any, definitions?: any): any {
    const openApiPaths: any = {};

    for (const [path, pathItem] of Object.entries(swaggerPaths)) {
      const pathObj = pathItem as any;
      const convertedPathItem: any = {};

      // Convert operations
      const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
      for (const method of httpMethods) {
        if (pathObj[method]) {
          convertedPathItem[method] = this.convertSwaggerOperation(pathObj[method], definitions);
        }
      }

      // Convert path-level parameters
      if (pathObj.parameters) {
        convertedPathItem.parameters = pathObj.parameters.map((param: any) =>
          this.convertSwaggerParameter(param, definitions)
        );
      }

      openApiPaths[path] = convertedPathItem;
    }

    return openApiPaths;
  }

  /**
   * Convert Swagger operation to OpenAPI format
   */
  private convertSwaggerOperation(swaggerOperation: any, definitions?: any): any {
    const openApiOperation: any = {
      ...swaggerOperation
    };

    // Convert parameters
    if (swaggerOperation.parameters) {
      const bodyParams = swaggerOperation.parameters.filter((p: any) => p.in === 'body');
      const otherParams = swaggerOperation.parameters.filter((p: any) => p.in !== 'body');

      // Convert non-body parameters
      openApiOperation.parameters = otherParams.map((param: any) =>
        this.convertSwaggerParameter(param, definitions)
      );

      // Convert body parameters to requestBody
      if (bodyParams.length > 0) {
        const bodyParam = bodyParams[0];
        openApiOperation.requestBody = {
          description: bodyParam.description,
          required: bodyParam.required || false,
          content: {
            'application/json': {
              schema: bodyParam.schema
            }
          }
        };
      }
    }

    // Convert responses
    if (swaggerOperation.responses) {
      openApiOperation.responses = this.convertSwaggerResponses(
        swaggerOperation.responses,
        definitions
      );
    }

    return openApiOperation;
  }

  /**
   * Convert Swagger parameter to OpenAPI format
   */
  private convertSwaggerParameter(swaggerParam: any, _definitions?: any): any {
    const openApiParam: any = {
      name: swaggerParam.name,
      in: swaggerParam.in,
      description: swaggerParam.description,
      required: swaggerParam.required || swaggerParam.in === 'path'
    };

    // Convert schema
    if (swaggerParam.schema) {
      openApiParam.schema = swaggerParam.schema;
    } else {
      // Convert primitive type to schema
      openApiParam.schema = {
        type: swaggerParam.type,
        format: swaggerParam.format,
        enum: swaggerParam.enum,
        default: swaggerParam.default,
        minimum: swaggerParam.minimum,
        maximum: swaggerParam.maximum,
        minLength: swaggerParam.minLength,
        maxLength: swaggerParam.maxLength,
        pattern: swaggerParam.pattern
      };

      // Remove undefined properties
      Object.keys(openApiParam.schema).forEach(key => {
        if (openApiParam.schema[key] === undefined) {
          delete openApiParam.schema[key];
        }
      });
    }

    return openApiParam;
  }

  /**
   * Convert Swagger responses to OpenAPI format
   */
  private convertSwaggerResponses(swaggerResponses: any, _definitions?: any): any {
    const openApiResponses: any = {};

    for (const [statusCode, response] of Object.entries(swaggerResponses)) {
      const responseObj = response as any;
      const openApiResponse: any = {
        description: responseObj.description || ''
      };

      // Convert schema to content
      if (responseObj.schema) {
        openApiResponse.content = {
          'application/json': {
            schema: responseObj.schema
          }
        };
      }

      // Convert headers
      if (responseObj.headers) {
        openApiResponse.headers = responseObj.headers;
      }

      openApiResponses[statusCode] = openApiResponse;
    }

    return openApiResponses;
  }

  /**
   * Convert Swagger security definitions to OpenAPI format
   */
  private convertSwaggerSecurityDefinitions(swaggerSecurityDefs: any): any {
    const openApiSecuritySchemes: any = {};

    for (const [name, securityDef] of Object.entries(swaggerSecurityDefs)) {
      const securityDefObj = securityDef as any;

      if (securityDefObj.type === 'oauth2') {
        openApiSecuritySchemes[name] = {
          type: 'oauth2',
          flows: this.convertSwaggerOAuth2Flows(securityDefObj)
        };
      } else {
        openApiSecuritySchemes[name] = securityDefObj;
      }
    }

    return openApiSecuritySchemes;
  }

  /**
   * Convert Swagger OAuth2 flows to OpenAPI format
   */
  private convertSwaggerOAuth2Flows(swaggerOAuth2: any): any {
    const flows: any = {};

    if (swaggerOAuth2.flow === 'implicit') {
      flows.implicit = {
        authorizationUrl: swaggerOAuth2.authorizationUrl,
        scopes: swaggerOAuth2.scopes || {}
      };
    } else if (swaggerOAuth2.flow === 'password') {
      flows.password = {
        tokenUrl: swaggerOAuth2.tokenUrl,
        scopes: swaggerOAuth2.scopes || {}
      };
    } else if (swaggerOAuth2.flow === 'application') {
      flows.clientCredentials = {
        tokenUrl: swaggerOAuth2.tokenUrl,
        scopes: swaggerOAuth2.scopes || {}
      };
    } else if (swaggerOAuth2.flow === 'accessCode') {
      flows.authorizationCode = {
        authorizationUrl: swaggerOAuth2.authorizationUrl,
        tokenUrl: swaggerOAuth2.tokenUrl,
        scopes: swaggerOAuth2.scopes || {}
      };
    }

    return flows;
  }

  /**
   * Validate OpenAPI specification
   */
  async validateOpenAPISpec(spec: any): Promise<void> {
    try {
      // Use $RefParser to dereference and validate the specification
      await $RefParser.dereference(spec);
      this.logger.debug('OpenAPI specification validation passed');
    } catch (error) {
      this.logger.error('OpenAPI specification validation failed:', error);
      throw new Error(`OpenAPI specification validation failed: ${error}`);
    }
  }

  /**
   * Get parser statistics
   */
  getStats(): { cachedSpecs: number } {
    return {
      cachedSpecs: this.parsedSpecs.size
    };
  }
}
