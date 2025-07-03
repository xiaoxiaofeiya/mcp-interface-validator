/**
 * Multi-Language Code Parser Module
 *
 * Provides comprehensive code parsing capabilities for multiple programming languages
 * including TypeScript, JavaScript, Python, and Java. Extracts API definitions,
 * method signatures, and interface information from source code.
 */
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
    start: {
        line: number;
        column: number;
    };
    end: {
        line: number;
        column: number;
    };
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
export declare class CodeParser {
    private logger;
    constructor();
    /**
     * Parse code from file path
     */
    parseFile(filePath: string, options?: ParserOptions): Promise<ParsedCode>;
    /**
     * Parse code from string content
     */
    parseCode(content: string, language: 'typescript' | 'javascript' | 'python' | 'java', options?: ParserOptions & {
        filePath?: string;
    }): Promise<ParsedCode>;
    /**
     * Detect programming language from file extension
     */
    private detectLanguage;
    /**
     * Parse JavaScript/TypeScript code using Babel and TypeScript compiler
     */
    private parseJavaScriptTypeScript;
    /**
     * Parse Python code using dt-python-parser
     */
    private parsePython;
    /**
     * Parse Java code using java-parser
     */
    private parseJava;
    /**
     * Calculate basic code metadata
     */
    private calculateMetadata;
    /**
     * Extract class information from AST node
     */
    private extractClassInfo;
    /**
     * Extract interface information from TypeScript AST node
     */
    private extractInterfaceInfo;
    /**
     * Extract function information from AST node
     */
    private extractFunctionInfo;
    /**
     * Extract method information from class method node
     */
    private extractMethodInfo;
    /**
     * Extract property information from class property node
     */
    private extractPropertyInfo;
    /**
     * Extract method signature from interface
     */
    private extractMethodSignature;
    /**
     * Extract property signature from interface
     */
    private extractPropertySignature;
    /**
     * Extract import information from AST node
     */
    private extractImportInfo;
    /**
     * Extract export information from AST node
     */
    private extractExportInfo;
    /**
     * Extract parameters from function/method
     */
    private extractParameters;
    /**
     * Extract API endpoints from Express.js style code
     */
    private extractApiEndpoints;
    /**
     * Get node name from various AST node types
     */
    private getNodeName;
    /**
     * Get node value as string
     */
    private getNodeValue;
    /**
     * Get type annotation as string
     */
    private getTypeAnnotation;
    /**
     * Get return type from function/method
     */
    private getReturnType;
    /**
     * Get visibility modifier
     */
    private getVisibility;
    /**
     * Get decorator name
     */
    private getDecoratorName;
    /**
     * Extract comments from node
     */
    private extractComments;
    /**
     * Get source location from node
     */
    private getLocation;
}
//# sourceMappingURL=index.d.ts.map