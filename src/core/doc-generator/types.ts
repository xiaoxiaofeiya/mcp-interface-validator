/**
 * API Documentation Generator Types
 * 
 * Type definitions for the automatic API documentation generation system
 */

export interface DocumentationConfig {
  /** Output format for generated documentation */
  format: 'markdown' | 'html' | 'json';
  
  /** Template configuration */
  template: TemplateConfig;
  
  /** Code example configuration */
  codeExamples: CodeExampleConfig;
  
  /** Interactive elements configuration */
  interactive: InteractiveConfig;
  
  /** Output configuration */
  output: OutputConfig;
}

export interface TemplateConfig {
  /** Template engine to use */
  engine: 'handlebars' | 'mustache' | 'ejs';
  
  /** Custom template directory */
  templateDir?: string;
  
  /** Built-in template name */
  builtinTemplate?: 'default' | 'minimal' | 'detailed' | 'api-reference';
  
  /** Custom template variables */
  variables?: Record<string, any>;
  
  /** Template partials */
  partials?: Record<string, string>;
}

export interface CodeExampleConfig {
  /** Languages to generate examples for */
  languages: ('typescript' | 'javascript' | 'python' | 'java' | 'curl')[];
  
  /** Include request examples */
  includeRequests: boolean;
  
  /** Include response examples */
  includeResponses: boolean;
  
  /** Include error examples */
  includeErrors: boolean;
  
  /** Auto-generate examples from schema */
  autoGenerate: boolean;
  
  /** Custom example overrides */
  customExamples?: Record<string, any>;
}

export interface InteractiveConfig {
  /** Enable interactive API explorer */
  apiExplorer: boolean;
  
  /** Enable try-it-out functionality */
  tryItOut: boolean;
  
  /** Enable schema visualization */
  schemaVisualization: boolean;
  
  /** Enable code playground */
  codePlayground: boolean;
  
  /** Interactive element styling */
  styling?: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor?: string;
    accentColor?: string;
  };
}

export interface OutputConfig {
  /** Output directory */
  outputDir: string;
  
  /** Output filename pattern */
  filenamePattern: string;
  
  /** Include table of contents */
  includeTableOfContents: boolean;
  
  /** Include search functionality */
  includeSearch: boolean;
  
  /** Split into multiple files */
  splitByTag?: boolean;
  
  /** Asset handling */
  assets?: {
    copyAssets: boolean;
    assetDir: string;
    minify: boolean;
  };
}

export interface GeneratedDocumentation {
  /** Generated content */
  content: string;
  
  /** Output format */
  format: 'markdown' | 'html' | 'json';
  
  /** Generated files */
  files: GeneratedFile[];
  
  /** Generation metadata */
  metadata: DocumentationMetadata;
  
  /** Assets generated */
  assets?: GeneratedAsset[];
}

export interface GeneratedFile {
  /** File path relative to output directory */
  path: string;
  
  /** File content */
  content: string;
  
  /** File type */
  type: 'documentation' | 'asset' | 'index' | 'partial';
  
  /** File size in bytes */
  size: number;
}

export interface GeneratedAsset {
  /** Asset path */
  path: string;
  
  /** Asset type */
  type: 'css' | 'js' | 'image' | 'font' | 'other';
  
  /** Asset content or buffer */
  content: string | Buffer;
  
  /** Asset size in bytes */
  size: number;
}

export interface DocumentationMetadata {
  /** Generation timestamp */
  generatedAt: Date;
  
  /** Generator version */
  generatorVersion: string;
  
  /** Source specification info */
  sourceSpec: {
    title: string;
    version: string;
    format: 'openapi' | 'swagger';
    operationCount: number;
    schemaCount: number;
  };
  
  /** Generation statistics */
  stats: {
    totalFiles: number;
    totalSize: number;
    generationTime: number;
    templateEngine: string;
    codeExampleCount: number;
  };
  
  /** Configuration used */
  config: DocumentationConfig;
}

export interface TemplateData {
  /** API specification data */
  spec: any;
  
  /** Parsed operations */
  operations: OperationData[];
  
  /** Parsed schemas */
  schemas: SchemaData[];
  
  /** Generated code examples */
  codeExamples: Record<string, CodeExample[]>;
  
  /** Configuration */
  config: DocumentationConfig;
  
  /** Metadata */
  metadata: DocumentationMetadata;
  
  /** Helper functions */
  helpers: TemplateHelpers;
}

export interface OperationData {
  /** Operation ID */
  operationId: string;
  
  /** HTTP method */
  method: string;
  
  /** API path */
  path: string;
  
  /** Operation summary */
  summary?: string;
  
  /** Operation description */
  description?: string;
  
  /** Operation tags */
  tags: string[];
  
  /** Parameters */
  parameters: ParameterData[];
  
  /** Request body */
  requestBody?: RequestBodyData;
  
  /** Responses */
  responses: ResponseData[];
  
  /** Security requirements */
  security?: SecurityRequirement[];
  
  /** Code examples */
  examples: CodeExample[];
}

export interface ParameterData {
  /** Parameter name */
  name: string;
  
  /** Parameter location */
  in: 'query' | 'header' | 'path' | 'cookie';
  
  /** Parameter description */
  description?: string;
  
  /** Required flag */
  required: boolean;
  
  /** Parameter schema */
  schema: any;
  
  /** Example value */
  example?: any;
}

export interface RequestBodyData {
  /** Description */
  description?: string;
  
  /** Required flag */
  required: boolean;
  
  /** Content types */
  content: Record<string, MediaTypeData>;
}

export interface ResponseData {
  /** Status code */
  statusCode: string;
  
  /** Response description */
  description: string;
  
  /** Response content */
  content?: Record<string, MediaTypeData>;
  
  /** Response headers */
  headers?: Record<string, HeaderData>;
}

export interface MediaTypeData {
  /** Media type */
  mediaType: string;
  
  /** Schema */
  schema?: any;
  
  /** Examples */
  examples?: Record<string, any>;
}

export interface HeaderData {
  /** Header description */
  description?: string;
  
  /** Header schema */
  schema: any;
  
  /** Required flag */
  required: boolean;
}

export interface SchemaData {
  /** Schema name */
  name: string;
  
  /** Schema definition */
  schema: any;
  
  /** Schema description */
  description?: string;
  
  /** Schema type */
  type: string;
  
  /** Properties (for object schemas) */
  properties?: Record<string, any>;
  
  /** Required properties */
  required?: string[];
  
  /** Example value */
  example?: any;
}

export interface CodeExample {
  /** Programming language */
  language: string;
  
  /** Example code */
  code: string;
  
  /** Example description */
  description?: string;
  
  /** Example type */
  type: 'request' | 'response' | 'error' | 'complete';
  
  /** Example metadata */
  metadata?: {
    framework?: string;
    library?: string;
    version?: string;
  };
}

export interface SecurityRequirement {
  /** Security scheme name */
  name: string;
  
  /** Required scopes */
  scopes: string[];
}

export interface TemplateHelpers {
  /** Format JSON with syntax highlighting */
  formatJson: (obj: any) => string;
  
  /** Generate anchor link */
  anchor: (text: string) => string;
  
  /** Format HTTP method */
  httpMethod: (method: string) => string;
  
  /** Format status code */
  statusCode: (code: string) => string;
  
  /** Check if array is not empty */
  hasItems: (arr: any[]) => boolean;
  
  /** Get first item from array */
  first: (arr: any[]) => any;
  
  /** Join array with separator */
  join: (arr: any[], separator: string) => string;
  
  /** Convert to lowercase */
  lowercase: (str: string) => string;
  
  /** Convert to uppercase */
  uppercase: (str: string) => string;
  
  /** Capitalize first letter */
  capitalize: (str: string) => string;
  
  /** Format date */
  formatDate: (date: Date) => string;
  
  /** Generate unique ID */
  uniqueId: (prefix?: string) => string;
}

export interface DocumentationError extends Error {
  /** Error code */
  code: string;
  
  /** Error context */
  context?: any;
  
  /** Suggestions for fixing */
  suggestions?: string[];
}
