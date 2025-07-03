/**
 * Schema Validator for OpenAPI Specifications
 * 
 * Handles loading, parsing, and validating OpenAPI schemas
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { parse as parseYaml } from 'yaml';
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

export class SchemaValidator {
  private logger: Logger;
  // @ts-ignore - TODO: Use config for validation settings
  private _config: ValidationConfig;
  private ajv: Ajv;
  private loadedSpecs: Map<string, OpenAPISpec> = new Map();

  constructor(config: ValidationConfig, logger: Logger) {
    this._config = config;
    this.logger = logger;
    
    // Initialize AJV with OpenAPI-compatible settings
    this.ajv = new Ajv({
      strict: !config.allowAdditionalProperties,
      allErrors: true,
      verbose: true,
      validateFormats: true,
      addUsedSchema: false
    });
    
    // Add format validators
    addFormats(this.ajv);
    
    // Add custom OpenAPI formats
    this.addOpenAPIFormats();
  }

  /**
   * Initialize the schema validator
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Schema Validator...');
      
      // Add any initialization logic here
      
      this.logger.info('Schema Validator initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Schema Validator:', error);
      throw error;
    }
  }

  /**
   * Load and parse OpenAPI specification from file
   */
  async loadSpecification(specPath: string): Promise<OpenAPISpec> {
    const resolvedPath = resolve(specPath);
    
    // Check cache first
    if (this.loadedSpecs.has(resolvedPath)) {
      this.logger.debug('Using cached specification', { specPath: resolvedPath });
      return this.loadedSpecs.get(resolvedPath)!;
    }

    if (!existsSync(resolvedPath)) {
      throw new Error(`OpenAPI specification file not found: ${resolvedPath}`);
    }

    try {
      this.logger.info('Loading OpenAPI specification', { specPath: resolvedPath });

      // Read and parse the file
      const content = readFileSync(resolvedPath, 'utf-8');
      let spec: any;

      if (resolvedPath.endsWith('.json')) {
        spec = JSON.parse(content);
      } else if (resolvedPath.endsWith('.yaml') || resolvedPath.endsWith('.yml')) {
        spec = parseYaml(content);
      } else {
        throw new Error(`Unsupported specification file format: ${resolvedPath}`);
      }

      // Validate and dereference the specification
      const dereferencedSpec = await $RefParser.dereference(spec) as OpenAPISpec;

      // Cache the loaded specification
      this.loadedSpecs.set(resolvedPath, dereferencedSpec);

      this.logger.info('OpenAPI specification loaded successfully', {
        specPath: resolvedPath,
        version: dereferencedSpec.openapi || (dereferencedSpec as any).swagger,
        pathCount: Object.keys(dereferencedSpec.paths || {}).length
      });

      return dereferencedSpec;
    } catch (error) {
      this.logger.error('Failed to load OpenAPI specification:', error);
      throw new Error(`Failed to load OpenAPI specification from ${resolvedPath}: ${error}`);
    }
  }

  /**
   * Validate data against a schema from the OpenAPI specification
   */
  validateAgainstSchema(data: any, schema: any, schemaPath: string = ''): SchemaValidationResult {
    try {
      const validate = this.ajv.compile(schema);
      const isValid = validate(data);

      const errors: SchemaValidationError[] = [];
      const warnings: SchemaValidationWarning[] = [];

      if (!isValid && validate.errors) {
        for (const error of validate.errors) {
          errors.push({
            path: `${schemaPath}${error.instancePath}`,
            message: error.message || 'Validation error',
            value: error.data,
            schema: error.schema
          });
        }
      }

      return {
        isValid,
        errors,
        warnings
      };
    } catch (error) {
      this.logger.error('Schema validation failed:', error);
      return {
        isValid: false,
        errors: [{
          path: schemaPath,
          message: `Schema validation error: ${error}`,
          value: data
        }],
        warnings: []
      };
    }
  }

  /**
   * Get schema for a specific path and method from OpenAPI spec
   */
  getPathSchema(spec: OpenAPISpec, path: string, method: string): any {
    const pathItem = spec.paths?.[path];
    if (!pathItem) {
      throw new Error(`Path not found in specification: ${path}`);
    }

    const operation = pathItem[method.toLowerCase() as keyof typeof pathItem];
    if (!operation) {
      throw new Error(`Method ${method} not found for path ${path}`);
    }

    return operation;
  }

  /**
   * Get request body schema for a specific operation
   */
  getRequestBodySchema(operation: any, contentType: string = 'application/json'): any {
    const requestBody = operation.requestBody;
    if (!requestBody) {
      return null;
    }

    const content = requestBody.content?.[contentType];
    return content?.schema || null;
  }

  /**
   * Get response schema for a specific operation and status code
   */
  getResponseSchema(operation: any, statusCode: string, contentType: string = 'application/json'): any {
    const responses = operation.responses;
    if (!responses) {
      return null;
    }

    const response = responses[statusCode] || responses.default;
    if (!response) {
      return null;
    }

    const content = response.content?.[contentType];
    return content?.schema || null;
  }

  /**
   * Clear cached specifications
   */
  clearCache(): void {
    this.loadedSpecs.clear();
    this.logger.debug('Schema cache cleared');
  }

  /**
   * Add custom OpenAPI format validators
   */
  private addOpenAPIFormats(): void {
    // Add byte format
    this.ajv.addFormat('byte', {
      type: 'string',
      validate: (data: string) => {
        try {
          return btoa(atob(data)) === data;
        } catch {
          return false;
        }
      }
    });

    // Add binary format
    this.ajv.addFormat('binary', {
      type: 'string',
      validate: () => true // Binary data validation is context-dependent
    });

    // Add password format
    this.ajv.addFormat('password', {
      type: 'string',
      validate: () => true // Password validation is application-specific
    });
  }

  /**
   * Get validation statistics
   */
  getStats(): { cachedSpecs: number } {
    return {
      cachedSpecs: this.loadedSpecs.size
    };
  }
}
