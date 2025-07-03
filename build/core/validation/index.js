/**
 * Validation Engine for MCP Interface Validator
 *
 * Core validation logic for API interfaces against OpenAPI specifications
 */
import { Logger } from '../../utils/logger/index.js';
import { ConfigManager } from '../../utils/config/index.js';
import { SchemaValidator } from '../schema/index.js';
import { FileMonitor } from '../monitoring/index.js';
import { IntelligentContextAnalyzer } from '../intelligent-context/index.js';
export class ValidationEngine {
    logger;
    config;
    schemaValidator;
    fileMonitor;
    intelligentAnalyzer;
    isInitialized = false;
    constructor(configManager, logger) {
        this.logger = logger.constructor === Logger ? logger : new Logger('ValidationEngine');
        this.config = configManager.getValidationConfig();
        this.schemaValidator = new SchemaValidator(this.config, this.logger);
        this.fileMonitor = new FileMonitor(configManager.getMonitoringConfig(), this.logger);
        this.intelligentAnalyzer = new IntelligentContextAnalyzer();
    }
    /**
     * Initialize the validation engine
     */
    async initialize() {
        try {
            this.logger.info('Initializing Validation Engine...');
            // Initialize schema validator
            await this.schemaValidator.initialize();
            // Initialize file monitor
            await this.fileMonitor.initialize();
            this.isInitialized = true;
            this.logger.info('Validation Engine initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize Validation Engine:', error);
            throw error;
        }
    }
    /**
     * Validate OpenAPI specification
     */
    async validateSpec(spec) {
        if (!this.isInitialized) {
            throw new Error('Validation Engine not initialized');
        }
        const startTime = Date.now();
        this.logger.info('Starting specification validation');
        try {
            // Basic spec validation
            const errors = [];
            const warnings = [];
            const suggestions = [];
            // Check required fields
            if (!spec.openapi && !spec.swagger) {
                errors.push({
                    code: 'MISSING_VERSION',
                    message: 'Missing OpenAPI or Swagger version',
                    severity: 'error',
                    location: {
                        line: 1,
                        column: 1,
                        path: 'root'
                    },
                    rule: 'openapi-version'
                });
            }
            if (!spec.info) {
                errors.push({
                    code: 'MISSING_INFO',
                    message: 'Missing info section',
                    severity: 'error',
                    location: {
                        line: 1,
                        column: 1,
                        path: 'info'
                    },
                    rule: 'openapi-info'
                });
            }
            if (!spec.paths) {
                errors.push({
                    code: 'MISSING_PATHS',
                    message: 'Missing paths section',
                    severity: 'error',
                    location: {
                        line: 1,
                        column: 1,
                        path: 'paths'
                    },
                    rule: 'openapi-paths'
                });
            }
            const isValid = errors.length === 0;
            // const _score = Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5));
            const processingTime = Date.now() - startTime;
            return {
                isValid,
                errors,
                warnings,
                suggestions,
                metadata: {
                    timestamp: new Date().toISOString(),
                    duration: processingTime,
                    specVersion: '1.0.0',
                    validationType: 'spec',
                    rulesApplied: ['openapi-version', 'openapi-info', 'openapi-paths']
                }
            };
        }
        catch (error) {
            this.logger.error('Specification validation failed:', error);
            throw error;
        }
    }
    /**
     * Validate interface code against OpenAPI specification
     */
    async validateInterface(request) {
        if (!this.isInitialized) {
            throw new Error('Validation Engine not initialized');
        }
        const startTime = Date.now();
        this.logger.info('Starting interface validation', {
            type: request.type,
            specPath: request.specPath
        });
        try {
            // Load and parse OpenAPI specification
            const spec = await this.schemaValidator.loadSpecification(request.specPath);
            // Validate the interface code
            const validationResult = await this.performValidation(request, spec);
            const duration = Date.now() - startTime;
            validationResult.metadata.duration = duration;
            this.logger.info('Interface validation completed', {
                isValid: validationResult.isValid,
                errorCount: validationResult.errors.length,
                warningCount: validationResult.warnings.length,
                duration
            });
            return validationResult;
        }
        catch (error) {
            this.logger.error('Interface validation failed:', error);
            throw error;
        }
    }
    /**
     * Start monitoring files for changes
     */
    async startMonitoring(request) {
        if (!this.isInitialized) {
            throw new Error('Validation Engine not initialized');
        }
        this.logger.info('Starting file monitoring', {
            paths: request.paths,
            specPath: request.specPath
        });
        try {
            // Set up file change handlers
            this.fileMonitor.onFileChange(async (filePath, content) => {
                await this.handleFileChange(filePath, content, request.specPath);
            });
            // Start monitoring
            await this.fileMonitor.startWatching(request.paths);
            this.logger.info('File monitoring started successfully');
        }
        catch (error) {
            this.logger.error('Failed to start file monitoring:', error);
            throw error;
        }
    }
    /**
     * Stop monitoring files
     */
    async stopMonitoring() {
        try {
            await this.fileMonitor.stopWatching();
            this.logger.info('File monitoring stopped');
        }
        catch (error) {
            this.logger.error('Failed to stop file monitoring:', error);
            throw error;
        }
    }
    /**
     * Perform the actual validation logic
     */
    async performValidation(request, spec) {
        const errors = [];
        const warnings = [];
        const suggestions = [];
        const rulesApplied = [];
        try {
            // Parse the code to extract API definitions
            const codeAnalysis = await this.analyzeCode(request.code, request.type);
            // Validate API paths
            if (codeAnalysis.paths && codeAnalysis.paths.length > 0) {
                rulesApplied.push('path-validation');
                const pathValidation = await this.validatePaths(codeAnalysis.paths, spec);
                errors.push(...pathValidation.errors);
                warnings.push(...pathValidation.warnings);
                suggestions.push(...pathValidation.suggestions);
            }
            // Validate HTTP methods
            if (codeAnalysis.methods && codeAnalysis.methods.length > 0) {
                rulesApplied.push('method-validation');
                const methodValidation = await this.validateMethods(codeAnalysis.methods, spec);
                errors.push(...methodValidation.errors);
                warnings.push(...methodValidation.warnings);
                suggestions.push(...methodValidation.suggestions);
            }
            // Validate request/response schemas
            if (codeAnalysis.schemas && codeAnalysis.schemas.length > 0) {
                rulesApplied.push('schema-validation');
                const schemaValidation = await this.validateSchemas(codeAnalysis.schemas, spec);
                errors.push(...schemaValidation.errors);
                warnings.push(...schemaValidation.warnings);
                suggestions.push(...schemaValidation.suggestions);
            }
            // Validate parameters
            if (codeAnalysis.parameters && codeAnalysis.parameters.length > 0) {
                rulesApplied.push('parameter-validation');
                const paramValidation = await this.validateParameters(codeAnalysis.parameters, spec);
                errors.push(...paramValidation.errors);
                warnings.push(...paramValidation.warnings);
                suggestions.push(...paramValidation.suggestions);
            }
            // Apply custom validation rules
            if (this.config.customRules && this.config.customRules.length > 0) {
                for (const rule of this.config.customRules) {
                    rulesApplied.push(rule);
                    const customValidation = await this.applyCustomRule(rule, codeAnalysis, spec);
                    errors.push(...customValidation.errors);
                    warnings.push(...customValidation.warnings);
                    suggestions.push(...customValidation.suggestions);
                }
            }
        }
        catch (error) {
            this.logger.error('Validation failed:', error);
            errors.push({
                code: 'VALIDATION_ERROR',
                message: `Validation failed: ${error}`,
                severity: 'error',
                rule: 'core-validation'
            });
        }
        const result = {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions,
            metadata: {
                timestamp: new Date().toISOString(),
                duration: 0, // Will be set by caller
                specVersion: spec.openapi || spec.swagger || 'unknown',
                validationType: request.type,
                rulesApplied
            }
        };
        return result;
    }
    /**
     * Handle file change events
     */
    async handleFileChange(filePath, content, specPath) {
        try {
            this.logger.debug('File changed, triggering validation', { filePath });
            // Determine validation type based on file path/content
            const validationType = this.determineValidationType(filePath, content);
            // Perform validation
            const result = await this.validateInterface({
                code: content,
                specPath,
                type: validationType
            });
            // Log results
            if (!result.isValid) {
                this.logger.warn('Validation failed for changed file', {
                    filePath,
                    errorCount: result.errors.length
                });
            }
            else {
                this.logger.info('Validation passed for changed file', { filePath });
            }
            // TODO: Emit validation results to integrations
        }
        catch (error) {
            this.logger.error('Failed to validate changed file:', error);
        }
    }
    /**
     * Determine validation type based on file characteristics
     */
    determineValidationType(filePath, _content) {
        // Simple heuristic - can be improved
        if (filePath.includes('frontend') || filePath.includes('client')) {
            return 'frontend';
        }
        if (filePath.includes('backend') || filePath.includes('server') || filePath.includes('api')) {
            return 'backend';
        }
        return 'both';
    }
    /**
     * Get validation engine status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            monitoring: this.fileMonitor.isWatching()
        };
    }
    /**
     * Analyze code to extract API definitions
     */
    async analyzeCode(code, _type) {
        const analysis = {
            paths: [],
            methods: [],
            schemas: [],
            parameters: []
        };
        try {
            // Basic regex patterns for API extraction
            // This is a simplified implementation - can be enhanced with AST parsing
            // Extract API paths (common patterns)
            const pathPatterns = [
                /['"`]\/api\/[^'"`\s]+['"`]/g, // "/api/..." strings
                /\.\w+\s*\(\s*['"`]([^'"`]+)['"`]/g, // Express-style: app.get("/path", ...)
                /route\s*\(\s*['"`]([^'"`]+)['"`]/g, // route("...") calls
                /path\s*:\s*['"`]([^'"`]+)['"`]/g, // path: "..." definitions
                /@RequestMapping\s*\(\s*['"`]([^'"`]+)['"`]/g // Spring @RequestMapping
            ];
            for (const pattern of pathPatterns) {
                const matches = code.matchAll(pattern);
                for (const match of matches) {
                    const path = match[1] || match[0].replace(/['"`]/g, '');
                    if (path.startsWith('/')) {
                        analysis.paths.push({
                            path,
                            line: this.getLineNumber(code, match.index || 0),
                            source: match[0]
                        });
                    }
                }
            }
            // Extract HTTP methods
            const methodPatterns = [
                /\.(get|post|put|delete|patch|head|options)\s*\(/gi, // Express-style standard methods
                /\.(\w+)\s*\(/g, // Express-style any method (including invalid ones)
                /@(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)/gi, // Annotation-style
                /method\s*:\s*['"`](GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)['"`]/gi // Config-style
            ];
            const foundMethods = new Set(); // Avoid duplicates
            for (const pattern of methodPatterns) {
                const matches = code.matchAll(pattern);
                for (const match of matches) {
                    let method = match[1] || match[0];
                    // Clean up the method name
                    if (method.startsWith('.')) {
                        method = method.substring(1);
                    }
                    if (method.startsWith('@')) {
                        method = method.substring(1);
                    }
                    method = method.toUpperCase();
                    const methodKey = `${method}-${match.index}`;
                    if (!foundMethods.has(methodKey)) {
                        foundMethods.add(methodKey);
                        analysis.methods.push({
                            method,
                            line: this.getLineNumber(code, match.index || 0),
                            source: match[0]
                        });
                    }
                }
            }
            // Extract schema definitions (simplified)
            const schemaPatterns = [
                /interface\s+(\w+)/g, // TypeScript interfaces
                /type\s+(\w+)\s*=/g, // TypeScript types
                /class\s+(\w+)/g // Class definitions
            ];
            for (const pattern of schemaPatterns) {
                const matches = code.matchAll(pattern);
                for (const match of matches) {
                    if (match[1]) {
                        analysis.schemas.push({
                            name: match[1],
                            line: this.getLineNumber(code, match.index || 0),
                            source: match[0]
                        });
                    }
                }
            }
            this.logger.debug('Code analysis completed', {
                pathsFound: analysis.paths.length,
                methodsFound: analysis.methods.length,
                schemasFound: analysis.schemas.length
            });
        }
        catch (error) {
            this.logger.error('Code analysis failed:', error);
        }
        return analysis;
    }
    /**
     * Get line number from string index
     */
    getLineNumber(text, index) {
        return text.substring(0, index).split('\n').length;
    }
    /**
     * Validate API paths against OpenAPI specification
     */
    async validatePaths(paths, spec) {
        const errors = [];
        const warnings = [];
        const suggestions = [];
        const specPaths = Object.keys(spec.paths || {});
        for (const pathDef of paths) {
            // Check if path exists in specification
            const pathExists = specPaths.some(specPath => {
                // Handle path parameters like /users/{id}
                const normalizedSpecPath = specPath.replace(/\{[^}]+\}/g, '[^/]+');
                const regex = new RegExp(`^${normalizedSpecPath}$`);
                return regex.test(pathDef.path);
            });
            if (!pathExists) {
                errors.push({
                    code: 'PATH_NOT_IN_SPEC',
                    message: `API path '${pathDef.path}' not found in OpenAPI specification`,
                    severity: 'error',
                    location: { line: pathDef.line, column: 0 },
                    rule: 'path-validation'
                });
                // Suggest similar paths
                const similarPaths = this.findSimilarPaths(pathDef.path, specPaths);
                if (similarPaths.length > 0) {
                    suggestions.push({
                        message: `Did you mean: ${similarPaths.join(', ')}?`,
                        ...(similarPaths[0] && { fix: similarPaths[0] }),
                        location: {
                            line: pathDef.line,
                            column: 0
                        }
                    });
                }
            }
        }
        return { errors, warnings, suggestions };
    }
    /**
     * Validate HTTP methods against OpenAPI specification
     */
    async validateMethods(methods, _spec) {
        const errors = [];
        const warnings = [];
        const suggestions = [];
        const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
        for (const methodDef of methods) {
            if (!validMethods.includes(methodDef.method.toUpperCase())) {
                errors.push({
                    code: 'INVALID_HTTP_METHOD',
                    message: `Invalid HTTP method '${methodDef.method}'`,
                    severity: 'error',
                    location: { line: methodDef.line, column: 0 },
                    rule: 'method-validation'
                });
            }
        }
        return { errors, warnings, suggestions };
    }
    /**
     * Validate schemas against OpenAPI specification
     */
    async validateSchemas(schemas, spec) {
        const errors = [];
        const warnings = [];
        const suggestions = [];
        const specSchemas = Object.keys(spec.components?.schemas || {});
        for (const schemaDef of schemas) {
            if (!specSchemas.includes(schemaDef.name)) {
                warnings.push({
                    code: 'SCHEMA_NOT_IN_SPEC',
                    message: `Schema '${schemaDef.name}' not found in OpenAPI specification`,
                    location: { line: schemaDef.line, column: 0 },
                    rule: 'schema-validation'
                });
            }
        }
        return { errors, warnings, suggestions };
    }
    /**
     * Validate parameters against OpenAPI specification
     */
    async validateParameters(parameters, _spec) {
        const errors = [];
        const warnings = [];
        const suggestions = [];
        // Basic parameter validation - can be enhanced
        for (const paramDef of parameters) {
            if (!paramDef.type) {
                warnings.push({
                    code: 'PARAMETER_NO_TYPE',
                    message: `Parameter '${paramDef.name}' has no type definition`,
                    location: { line: paramDef.line, column: 0 },
                    rule: 'parameter-validation'
                });
            }
        }
        return { errors, warnings, suggestions };
    }
    /**
     * Apply custom validation rule
     */
    async applyCustomRule(rule, analysis, spec) {
        const errors = [];
        const warnings = [];
        const suggestions = [];
        switch (rule) {
            case 'require-response-schemas':
                // Check if all endpoints have response schemas defined
                for (const path of analysis.paths) {
                    // This is a simplified check - would need more sophisticated implementation
                    warnings.push({
                        code: 'MISSING_RESPONSE_SCHEMA',
                        message: `Consider defining response schema for path '${path.path}'`,
                        location: { line: path.line, column: 0 },
                        rule
                    });
                }
                break;
            case 'validate-parameter-types':
                // Validate parameter types are consistent
                for (const param of analysis.parameters) {
                    if (!param.type || param.type === 'any') {
                        warnings.push({
                            code: 'WEAK_PARAMETER_TYPE',
                            message: `Parameter '${param.name}' should have a specific type instead of '${param.type || 'undefined'}'`,
                            location: { line: param.line, column: 0 },
                            rule
                        });
                    }
                }
                break;
            case 'check-security-definitions':
                // Check for security definitions
                if (!spec.components?.securitySchemes) {
                    warnings.push({
                        code: 'NO_SECURITY_SCHEMES',
                        message: 'No security schemes defined in OpenAPI specification',
                        rule
                    });
                }
                break;
            default:
                this.logger.warn(`Unknown custom rule: ${rule}`);
        }
        return { errors, warnings, suggestions };
    }
    /**
     * Find similar paths using simple string similarity
     */
    findSimilarPaths(targetPath, availablePaths) {
        return availablePaths
            .map(path => ({
            path,
            similarity: this.calculateSimilarity(targetPath, path)
        }))
            .filter(item => item.similarity > 0.3) // Lower threshold for better suggestions
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 3)
            .map(item => item.path);
    }
    /**
     * Calculate API path similarity with enhanced logic
     */
    calculateSimilarity(str1, str2) {
        // Normalize paths by removing leading/trailing slashes and converting to lowercase
        const normalize = (path) => path.replace(/^\/+|\/+$/g, '').toLowerCase();
        const norm1 = normalize(str1);
        const norm2 = normalize(str2);
        // Check for exact substring matches (high similarity)
        if (norm1.includes(norm2) || norm2.includes(norm1)) {
            return 0.8;
        }
        // Check for word-level similarity (e.g., "user" vs "users")
        const words1 = norm1.split(/[\/\-_]/);
        const words2 = norm2.split(/[\/\-_]/);
        let wordMatches = 0;
        for (const word1 of words1) {
            for (const word2 of words2) {
                if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
                    wordMatches++;
                    break;
                }
            }
        }
        if (wordMatches > 0) {
            const wordSimilarity = wordMatches / Math.max(words1.length, words2.length);
            if (wordSimilarity > 0.3) {
                return 0.5 + wordSimilarity * 0.3;
            }
        }
        // Fall back to Levenshtein distance
        const longer = norm1.length > norm2.length ? norm1 : norm2;
        const shorter = norm1.length > norm2.length ? norm2 : norm1;
        if (longer.length === 0)
            return 1.0;
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }
    /**
     * Calculate Levenshtein distance
     */
    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(0));
        for (let i = 0; i <= str1.length; i++)
            matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++)
            matrix[j][0] = j;
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(matrix[j][i - 1] + 1, // deletion
                matrix[j - 1][i] + 1, // insertion
                matrix[j - 1][i - 1] + indicator // substitution
                );
            }
        }
        return matrix[str2.length][str1.length];
    }
    /**
     * Intelligent validation with context analysis
     * Handles ambiguous user instructions and missing specifications
     */
    async validateWithIntelligentContext(userInstruction, code, specPath, projectContext) {
        this.logger.info('Starting intelligent validation', { userInstruction, specPath });
        try {
            // Analyze user instruction to understand intent
            const userIntent = await this.intelligentAnalyzer.analyzeUserInstruction(userInstruction);
            this.logger.info('User intent analyzed', { userIntent });
            // Check if OpenAPI spec exists
            let spec = null;
            let missingSpecHandling = null;
            if (specPath) {
                try {
                    spec = await this.loadOpenAPISpec(specPath);
                }
                catch (error) {
                    this.logger.warn('Failed to load OpenAPI spec', { specPath, error });
                }
            }
            // Handle missing specification
            if (!spec) {
                missingSpecHandling = await this.intelligentAnalyzer.handleMissingSpec(userIntent, projectContext);
                if (missingSpecHandling.shouldCreateSpec) {
                    this.logger.info('Suggesting OpenAPI spec creation', { missingSpecHandling });
                    // Generate context suggestions even when spec is missing
                    const contextSuggestions = await this.intelligentAnalyzer.generateContextSuggestions(userIntent, null);
                    // Return with spec creation suggestion and context suggestions
                    return {
                        isValid: false,
                        errors: [{
                                code: 'MISSING_SPEC',
                                message: 'OpenAPI specification not found',
                                severity: 'warning',
                                location: { line: 1, column: 1, path: 'spec' },
                                rule: 'spec-required'
                            }],
                        warnings: [],
                        suggestions: [{
                                message: `Create OpenAPI spec for ${userIntent.domain}`,
                                fix: JSON.stringify(missingSpecHandling.suggestedStructure, null, 2),
                                location: { line: 1, column: 1 }
                            }],
                        metadata: {
                            timestamp: new Date().toISOString(),
                            duration: 0,
                            specVersion: '1.0.0',
                            validationType: 'intelligent',
                            rulesApplied: ['intelligent-analysis']
                        },
                        contextSuggestions,
                        missingSpecHandling
                    };
                }
            }
            // Generate context suggestions
            const contextSuggestions = await this.intelligentAnalyzer.generateContextSuggestions(userIntent, spec);
            // Perform standard validation if spec exists
            let validationResult;
            if (spec) {
                validationResult = await this.validateInterface({
                    code,
                    specPath: specPath,
                    type: 'both'
                });
            }
            else {
                // Create a basic validation result for missing spec
                validationResult = {
                    isValid: false,
                    errors: [],
                    warnings: [{
                            code: 'NO_SPEC',
                            message: 'No OpenAPI specification available for validation',
                            location: { line: 1, column: 1, path: 'spec' },
                            rule: 'spec-availability'
                        }],
                    suggestions: [],
                    metadata: {
                        timestamp: new Date().toISOString(),
                        duration: 0,
                        specVersion: '1.0.0',
                        validationType: 'intelligent',
                        rulesApplied: ['intelligent-analysis']
                    }
                };
            }
            // Enhance validation result with intelligent suggestions
            if (contextSuggestions.suggestedEndpoints.length > 0) {
                validationResult.suggestions.push({
                    message: `Consider implementing these endpoints: ${contextSuggestions.suggestedEndpoints.join(', ')}`,
                    fix: contextSuggestions.reasoning,
                    location: { line: 1, column: 1 }
                });
            }
            return {
                ...validationResult,
                contextSuggestions,
                missingSpecHandling
            };
        }
        catch (error) {
            this.logger.error('Intelligent validation failed', error);
            throw error;
        }
    }
    /**
     * Load OpenAPI specification from file
     */
    async loadOpenAPISpec(specPath) {
        // This would be implemented to load YAML/JSON spec files
        // For now, return null to simulate missing spec
        this.logger.debug('Attempting to load OpenAPI spec', { specPath });
        throw new Error(`Spec file not found: ${specPath}`);
    }
}
//# sourceMappingURL=index.js.map