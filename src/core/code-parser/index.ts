/**
 * Multi-Language Code Parser Module
 * 
 * Provides comprehensive code parsing capabilities for multiple programming languages
 * including TypeScript, JavaScript, Python, and Java. Extracts API definitions,
 * method signatures, and interface information from source code.
 */

import { readFileSync } from 'fs';
import { extname } from 'path';
import { parse as babelParse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

import { Logger } from '../../utils/logger/index.js';

export interface ParsedMethod {
  name: string;
  parameters: ParameterInfo[];
  returnType: string;
  visibility: 'public' | 'private' | 'protected';
  isAsync: boolean;
  decorators: string[];
  comments: string[];
  location: SourceLocation;
}

export interface ParameterInfo {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
}

export interface ParsedClass {
  name: string;
  extends?: string;
  implements: string[];
  methods: ParsedMethod[];
  properties: PropertyInfo[];
  decorators: string[];
  comments: string[];
  location: SourceLocation;
}

export interface PropertyInfo {
  name: string;
  type: string;
  visibility: 'public' | 'private' | 'protected';
  readonly: boolean;
  static: boolean;
  decorators: string[];
  location: SourceLocation;
}

export interface ParsedInterface {
  name: string;
  extends: string[];
  methods: MethodSignature[];
  properties: PropertySignature[];
  location: SourceLocation;
}

export interface MethodSignature {
  name: string;
  parameters: ParameterInfo[];
  returnType: string;
  optional: boolean;
}

export interface PropertySignature {
  name: string;
  type: string;
  optional: boolean;
  readonly: boolean;
}

export interface SourceLocation {
  start: { line: number; column: number };
  end: { line: number; column: number };
  file?: string;
}

export interface ParsedCode {
  language: 'typescript' | 'javascript' | 'python' | 'java';
  classes: ParsedClass[];
  interfaces: ParsedInterface[];
  functions: ParsedMethod[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  apiEndpoints: ApiEndpoint[];
  metadata: CodeMetadata;
}

export interface ImportInfo {
  source: string;
  imports: string[];
  isDefault: boolean;
  isNamespace: boolean;
  location: SourceLocation;
}

export interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'interface' | 'variable';
  isDefault: boolean;
  location: SourceLocation;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: string;
  parameters: ParameterInfo[];
  responseType: string;
  location: SourceLocation;
}

export interface CodeMetadata {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  complexity: number;
  dependencies: string[];
}

export interface ParserOptions {
  includeComments?: boolean;
  includeLocations?: boolean;
  extractApiEndpoints?: boolean;
  calculateComplexity?: boolean;
}

/**
 * Multi-language code parser
 */
export class CodeParser {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('CodeParser');
    this.logger.setLogLevel(0); // Set to DEBUG level
  }

  /**
   * Parse code from file path
   */
  async parseFile(filePath: string, options: ParserOptions = {}): Promise<ParsedCode> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const language = this.detectLanguage(filePath);
      
      return await this.parseCode(content, language, {
        ...options,
        filePath
      });
    } catch (error) {
      this.logger.error(`Failed to parse file ${filePath}:`, error);
      throw new Error(`Failed to parse file: ${error}`);
    }
  }

  /**
   * Parse code from string content
   */
  async parseCode(
    content: string, 
    language: 'typescript' | 'javascript' | 'python' | 'java',
    options: ParserOptions & { filePath?: string } = {}
  ): Promise<ParsedCode> {
    try {
      this.logger.debug(`Parsing ${language} code`, {
        contentLength: content.length,
        filePath: options.filePath
      });

      switch (language) {
        case 'typescript':
        case 'javascript':
          return await this.parseJavaScriptTypeScript(content, language, options);
        case 'python':
          return await this.parsePython(content, options);
        case 'java':
          return await this.parseJava(content, options);
        default:
          throw new Error(`Unsupported language: ${language}`);
      }
    } catch (error) {
      this.logger.error(`Failed to parse ${language} code:`, error);
      throw new Error(`Failed to parse ${language} code: ${error}`);
    }
  }

  /**
   * Detect programming language from file extension
   */
  private detectLanguage(filePath: string): 'typescript' | 'javascript' | 'python' | 'java' {
    const ext = extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.ts':
      case '.tsx':
        return 'typescript';
      case '.js':
      case '.jsx':
      case '.mjs':
        return 'javascript';
      case '.py':
      case '.pyw':
        return 'python';
      case '.java':
        return 'java';
      default:
        throw new Error(`Unsupported file extension: ${ext}`);
    }
  }

  /**
   * Parse JavaScript/TypeScript code using Babel and TypeScript compiler
   */
  private async parseJavaScriptTypeScript(
    content: string,
    language: 'typescript' | 'javascript',
    options: ParserOptions & { filePath?: string }
  ): Promise<ParsedCode> {
    const result: ParsedCode = {
      language,
      classes: [],
      interfaces: [],
      functions: [],
      imports: [],
      exports: [],
      apiEndpoints: [],
      metadata: this.calculateMetadata(content)
    };

    try {
      // Use Babel parser for AST generation
      console.log('Parsing content with Babel...');
      const ast = babelParse(content, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: [
          'typescript',
          'jsx',
          ['decorators', { decoratorsBeforeExport: true }],
          'classProperties',
          'asyncGenerators',
          'functionBind',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'dynamicImport',
          'nullishCoalescingOperator',
          'optionalChaining'
        ]
      });
      console.log('AST parsed successfully');

      // Traverse AST and extract information
      const self = this;
      const processedClasses = new Set<string>();

      traverse(ast, {
        ClassDeclaration(path: any) {
          // Skip if this class is part of an export declaration
          if (path.parent && path.parent.type === 'ExportNamedDeclaration') {
            return;
          }

          const classInfo = self.extractClassInfo(path.node, options);
          if (classInfo && !processedClasses.has(classInfo.name)) {
            result.classes.push(classInfo);
            processedClasses.add(classInfo.name);
          }
        },

        ExportNamedDeclaration(path: any) {
          // Handle exported classes with decorators
          if (path.node.declaration && path.node.declaration.type === 'ClassDeclaration') {
            const classInfo = self.extractClassInfo(path.node.declaration, options);
            if (classInfo && !processedClasses.has(classInfo.name)) {
              result.classes.push(classInfo);
              processedClasses.add(classInfo.name);
            }
          }

          // Handle other exports
          const exportInfo = self.extractExportInfo(path.node, options);
          if (exportInfo) {
            result.exports.push(exportInfo);
          }
        },

        TSInterfaceDeclaration(path: any) {
          if (language === 'typescript') {
            const interfaceInfo = self.extractInterfaceInfo(path.node, options);
            if (interfaceInfo) {
              result.interfaces.push(interfaceInfo);
            }
          }
        },

        FunctionDeclaration(path: any) {
          const functionInfo = self.extractFunctionInfo(path.node, options);
          if (functionInfo) {
            result.functions.push(functionInfo);
          }
        },

        ImportDeclaration(path: any) {
          const importInfo = self.extractImportInfo(path.node, options);
          if (importInfo) {
            result.imports.push(importInfo);
          }
        }
      });

      // Extract API endpoints if requested
      if (options.extractApiEndpoints) {
        result.apiEndpoints = this.extractApiEndpoints(ast, options);
      }

      this.logger.debug('JavaScript/TypeScript parsing completed', {
        classes: result.classes.length,
        interfaces: result.interfaces.length,
        functions: result.functions.length,
        imports: result.imports.length,
        exports: result.exports.length,
        apiEndpoints: result.apiEndpoints.length
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to parse JavaScript/TypeScript:', error);
      throw error;
    }
  }

  /**
   * Parse Python code using dt-python-parser
   */
  private async parsePython(
    content: string,
    _options: ParserOptions & { filePath?: string }
  ): Promise<ParsedCode> {
    const result: ParsedCode = {
      language: 'python',
      classes: [],
      interfaces: [], // Python doesn't have interfaces, but we can extract protocols
      functions: [],
      imports: [],
      exports: [],
      apiEndpoints: [],
      metadata: this.calculateMetadata(content)
    };

    // TODO: Implement Python parsing
    this.logger.warn('Python parsing not implemented yet');
    return result;
  }

  /**
   * Parse Java code using java-parser
   */
  private async parseJava(
    content: string,
    _options: ParserOptions & { filePath?: string }
  ): Promise<ParsedCode> {
    const result: ParsedCode = {
      language: 'java',
      classes: [],
      interfaces: [],
      functions: [],
      imports: [],
      exports: [],
      apiEndpoints: [],
      metadata: this.calculateMetadata(content)
    };

    // TODO: Implement Java parsing
    this.logger.warn('Java parsing not implemented yet');
    return result;
  }

  /**
   * Calculate basic code metadata
   */
  private calculateMetadata(content: string): CodeMetadata {
    const lines = content.split('\n');
    const totalLines = lines.length;

    let codeLines = 0;
    let commentLines = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') continue;

      if (trimmed.startsWith('//') || trimmed.startsWith('#') ||
          trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        commentLines++;
      } else {
        codeLines++;
      }
    }

    return {
      totalLines,
      codeLines,
      commentLines,
      complexity: 1, // Simplified complexity calculation
      dependencies: []
    };
  }

  /**
   * Extract class information from AST node
   */
  private extractClassInfo(node: any, _options: ParserOptions): ParsedClass | null {
    try {
      console.log('extractClassInfo called with node type:', node.type, 'id:', node.id?.name);
      if (!t.isClassDeclaration(node) || !node.id) {
        console.log('Not a class declaration or no id');
        return null;
      }

      const classInfo: ParsedClass = {
        name: node.id.name,
        extends: node.superClass ? this.getNodeName(node.superClass) : '',
        implements: node.implements?.map((impl: any) => this.getNodeName(impl.id)) || [],
        methods: [],
        properties: [],
        decorators: node.decorators?.map((dec: any) => this.getDecoratorName(dec)) || [],
        comments: _options.includeComments ? this.extractComments(node) : [],
        location: _options.includeLocations ? this.getLocation(node) : { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
      };

      // Extract methods and properties
      for (const member of node.body.body) {
        if (t.isClassMethod(member)) {
          const method = this.extractMethodInfo(member, _options);
          if (method) {
            classInfo.methods.push(method);
          }
        } else if (t.isClassProperty(member)) {
          const property = this.extractPropertyInfo(member, _options);
          if (property) {
            classInfo.properties.push(property);
          }
        }
      }

      return classInfo;
    } catch (error) {
      this.logger.warn('Failed to extract class info:', error);
      return null;
    }
  }

  /**
   * Extract interface information from TypeScript AST node
   */
  private extractInterfaceInfo(node: any, options: ParserOptions): ParsedInterface | null {
    try {
      if (!node.id) {
        return null;
      }

      const interfaceInfo: ParsedInterface = {
        name: node.id.name,
        extends: node.extends?.map((ext: any) => this.getNodeName(ext.expression)) || [],
        methods: [],
        properties: [],
        location: options.includeLocations ? this.getLocation(node) : { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
      };

      // Extract interface members
      for (const member of node.body.body) {
        if (member.type === 'TSMethodSignature') {
          const method = this.extractMethodSignature(member, options);
          if (method) {
            interfaceInfo.methods.push(method);
          }
        } else if (member.type === 'TSPropertySignature') {
          const property = this.extractPropertySignature(member, options);
          if (property) {
            interfaceInfo.properties.push(property);
          }
        }
      }

      return interfaceInfo;
    } catch (error) {
      this.logger.warn('Failed to extract interface info:', error);
      return null;
    }
  }

  /**
   * Extract function information from AST node
   */
  private extractFunctionInfo(node: any, options: ParserOptions): ParsedMethod | null {
    try {
      if (!node.id) {
        return null;
      }

      return {
        name: node.id.name,
        parameters: this.extractParameters(node.params, options),
        returnType: this.getReturnType(node),
        visibility: 'public', // Functions are typically public
        isAsync: node.async || false,
        decorators: node.decorators?.map((dec: any) => this.getDecoratorName(dec)) || [],
        comments: options.includeComments ? this.extractComments(node) : [],
        location: options.includeLocations ? this.getLocation(node) : { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
      };
    } catch (error) {
      this.logger.warn('Failed to extract function info:', error);
      return null;
    }
  }

  /**
   * Extract method information from class method node
   */
  private extractMethodInfo(node: any, options: ParserOptions): ParsedMethod | null {
    try {
      const key = node.key;
      if (!key) {
        return null;
      }

      const methodName = this.getNodeName(key);

      // Skip constructors - they're not regular methods
      if (methodName === 'constructor') {
        return null;
      }

      return {
        name: methodName,
        parameters: this.extractParameters(node.params || node.value?.params, options),
        returnType: this.getReturnType(node.value || node),
        visibility: this.getVisibility(node),
        isAsync: (node.value?.async || node.async) || false,
        decorators: node.decorators?.map((dec: any) => this.getDecoratorName(dec)) || [],
        comments: options.includeComments ? this.extractComments(node) : [],
        location: options.includeLocations ? this.getLocation(node) : { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
      };
    } catch (error) {
      this.logger.warn('Failed to extract method info:', error);
      return null;
    }
  }

  /**
   * Extract property information from class property node
   */
  private extractPropertyInfo(node: any, options: ParserOptions): PropertyInfo | null {
    try {
      const key = node.key;
      if (!key) {
        return null;
      }

      return {
        name: this.getNodeName(key),
        type: this.getTypeAnnotation(node.typeAnnotation),
        visibility: this.getVisibility(node),
        readonly: node.readonly || false,
        static: node.static || false,
        decorators: node.decorators?.map((dec: any) => this.getDecoratorName(dec)) || [],
        location: options.includeLocations ? this.getLocation(node) : { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
      };
    } catch (error) {
      this.logger.warn('Failed to extract property info:', error);
      return null;
    }
  }

  /**
   * Extract method signature from interface
   */
  private extractMethodSignature(node: any, options: ParserOptions): MethodSignature | null {
    try {
      const key = node.key;
      if (!key) {
        return null;
      }

      return {
        name: this.getNodeName(key),
        parameters: this.extractParameters(node.parameters, options),
        returnType: this.getTypeAnnotation(node.typeAnnotation),
        optional: node.optional || false
      };
    } catch (error) {
      this.logger.warn('Failed to extract method signature:', error);
      return null;
    }
  }

  /**
   * Extract property signature from interface
   */
  private extractPropertySignature(node: any, _options: ParserOptions): PropertySignature | null {
    try {
      const key = node.key;
      if (!key) {
        return null;
      }

      return {
        name: this.getNodeName(key),
        type: this.getTypeAnnotation(node.typeAnnotation),
        optional: node.optional || false,
        readonly: node.readonly || false
      };
    } catch (error) {
      this.logger.warn('Failed to extract property signature:', error);
      return null;
    }
  }

  /**
   * Extract import information from AST node
   */
  private extractImportInfo(node: any, options: ParserOptions): ImportInfo | null {
    try {
      if (!node.source) {
        return null;
      }

      const imports: string[] = [];
      let isDefault = false;
      let isNamespace = false;

      for (const specifier of node.specifiers) {
        if (t.isImportDefaultSpecifier(specifier)) {
          imports.push(specifier.local.name);
          isDefault = true;
        } else if (t.isImportNamespaceSpecifier(specifier)) {
          imports.push(specifier.local.name);
          isNamespace = true;
        } else if (t.isImportSpecifier(specifier)) {
          imports.push(t.isIdentifier(specifier.imported) ? specifier.imported.name : specifier.imported.value);
        }
      }

      return {
        source: node.source.value,
        imports,
        isDefault,
        isNamespace,
        location: options.includeLocations ? this.getLocation(node) : { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
      };
    } catch (error) {
      this.logger.warn('Failed to extract import info:', error);
      return null;
    }
  }

  /**
   * Extract export information from AST node
   */
  private extractExportInfo(node: any, options: ParserOptions): ExportInfo | null {
    try {
      if (node.declaration) {
        const declaration = node.declaration;
        let name = '';
        let type: 'function' | 'class' | 'interface' | 'variable' = 'variable';

        if (t.isFunctionDeclaration(declaration)) {
          name = declaration.id?.name || '';
          type = 'function';
        } else if (t.isClassDeclaration(declaration)) {
          name = declaration.id?.name || '';
          type = 'class';
        } else if (declaration.type === 'TSInterfaceDeclaration') {
          name = declaration.id?.name || '';
          type = 'interface';
        } else if (t.isVariableDeclaration(declaration)) {
          const id = declaration.declarations[0]?.id;
          name = t.isIdentifier(id) ? id.name : '';
          type = 'variable';
        }

        if (name) {
          return {
            name,
            type,
            isDefault: false,
            location: options.includeLocations ? this.getLocation(node) : { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
          };
        }
      }

      return null;
    } catch (error) {
      this.logger.warn('Failed to extract export info:', error);
      return null;
    }
  }

  /**
   * Extract parameters from function/method
   */
  private extractParameters(params: any[], _options: ParserOptions): ParameterInfo[] {
    if (!params) return [];

    return params.map(param => {
      try {
        let name = '';
        let type = 'any';
        let optional = false;
        let defaultValue: string | undefined;

        if (t.isIdentifier(param)) {
          name = param.name;
          type = this.getTypeAnnotation(param.typeAnnotation);
        } else if (t.isAssignmentPattern(param)) {
          name = this.getNodeName(param.left);
          type = this.getTypeAnnotation((param.left as any).typeAnnotation);
          optional = true;
          defaultValue = this.getNodeValue(param.right);
        } else if (param.type === 'RestElement') {
          name = this.getNodeName(param.argument);
          type = this.getTypeAnnotation(param.typeAnnotation);
        }

        return {
          name,
          type,
          optional,
          defaultValue: defaultValue || ''
        };
      } catch (error) {
        this.logger.warn('Failed to extract parameter:', error);
        return {
          name: 'unknown',
          type: 'any',
          optional: false,
          defaultValue: ''
        };
      }
    });
  }

  /**
   * Extract API endpoints from Express.js style code
   */
  private extractApiEndpoints(ast: any, options: ParserOptions): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];

    const self = this;
    traverse(ast, {
      CallExpression(path: any) {
        const node = path.node;

        // Look for app.get(), app.post(), etc.
        if (t.isMemberExpression(node.callee) &&
            t.isIdentifier(node.callee.property)) {

          const method = node.callee.property.name.toUpperCase();
          const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

          if (httpMethods.includes(method) && node.arguments.length >= 2) {
            const pathArg = node.arguments[0];
            const handlerArg = node.arguments[1];

            if (t.isStringLiteral(pathArg)) {
              const endpoint: ApiEndpoint = {
                method: method as any,
                path: pathArg.value,
                handler: self.getNodeName(handlerArg),
                parameters: [],
                responseType: 'any',
                location: options.includeLocations ? self.getLocation(node) : { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } }
              };

              endpoints.push(endpoint);
            }
          }
        }
      }
    });

    return endpoints;
  }

  /**
   * Get node name from various AST node types
   */
  private getNodeName(node: any): string {
    if (!node) return '';

    if (t.isIdentifier(node)) {
      return node.name;
    } else if (t.isStringLiteral(node)) {
      return node.value;
    } else if (t.isMemberExpression(node)) {
      return `${this.getNodeName(node.object)}.${this.getNodeName(node.property)}`;
    } else if (node.name) {
      return node.name;
    }

    return '';
  }

  /**
   * Get node value as string
   */
  private getNodeValue(node: any): string {
    if (!node) return '';

    if (t.isStringLiteral(node) || t.isNumericLiteral(node) || t.isBooleanLiteral(node)) {
      return String(node.value);
    } else if (t.isNullLiteral(node)) {
      return 'null';
    } else if (t.isIdentifier(node)) {
      return node.name;
    }

    return '';
  }

  /**
   * Get type annotation as string
   */
  private getTypeAnnotation(typeAnnotation: any): string {
    if (!typeAnnotation) return 'any';

    const annotation = typeAnnotation.typeAnnotation || typeAnnotation;

    if (!annotation) return 'any';

    switch (annotation.type) {
      case 'TSStringKeyword':
        return 'string';
      case 'TSNumberKeyword':
        return 'number';
      case 'TSBooleanKeyword':
        return 'boolean';
      case 'TSVoidKeyword':
        return 'void';
      case 'TSAnyKeyword':
        return 'any';
      case 'TSUnknownKeyword':
        return 'unknown';
      case 'TSNeverKeyword':
        return 'never';
      case 'TSTypeReference':
        return this.getNodeName(annotation.typeName);
      case 'TSArrayType':
        return `${this.getTypeAnnotation(annotation.elementType)}[]`;
      case 'TSUnionType':
        return annotation.types.map((type: any) => this.getTypeAnnotation(type)).join(' | ');
      default:
        return 'any';
    }
  }

  /**
   * Get return type from function/method
   */
  private getReturnType(node: any): string {
    if (node.returnType) {
      return this.getTypeAnnotation(node.returnType);
    }
    return 'any';
  }

  /**
   * Get visibility modifier
   */
  private getVisibility(node: any): 'public' | 'private' | 'protected' {
    if (node.accessibility) {
      return node.accessibility;
    }

    // Check for private/protected keywords in decorators or modifiers
    if (node.modifiers) {
      for (const modifier of node.modifiers) {
        if (modifier.type === 'private') return 'private';
        if (modifier.type === 'protected') return 'protected';
      }
    }

    return 'public';
  }

  /**
   * Get decorator name
   */
  private getDecoratorName(decorator: any): string {
    if (decorator.expression) {
      // Handle CallExpression decorators like @Injectable()
      if (t.isCallExpression(decorator.expression)) {
        return this.getNodeName(decorator.expression.callee);
      }
      // Handle simple identifier decorators like @Injectable
      return this.getNodeName(decorator.expression);
    }
    return '';
  }

  /**
   * Extract comments from node
   */
  private extractComments(node: any): string[] {
    const comments: string[] = [];

    if (node.leadingComments) {
      comments.push(...node.leadingComments.map((comment: any) => comment.value.trim()));
    }

    if (node.trailingComments) {
      comments.push(...node.trailingComments.map((comment: any) => comment.value.trim()));
    }

    return comments;
  }

  /**
   * Get source location from node
   */
  private getLocation(node: any): SourceLocation {
    if (node.loc) {
      return {
        start: {
          line: node.loc.start.line,
          column: node.loc.start.column
        },
        end: {
          line: node.loc.end.line,
          column: node.loc.end.column
        }
      };
    }

    return {
      start: { line: 0, column: 0 },
      end: { line: 0, column: 0 }
    };
  }
}
