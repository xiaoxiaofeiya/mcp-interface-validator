/**
 * Difference Analyzer for API Interface Comparison
 *
 * Compares frontend and backend code to detect API interface mismatches,
 * including endpoints, parameters, response types, and other inconsistencies.
 */
import { Logger } from '../../utils/logger/index.js';
import { CodeParser } from '../code-parser/index.js';
export class DiffAnalyzer {
    logger;
    codeParser;
    // private _schemaValidator?: SchemaValidator;
    defaultRules;
    constructor(_config, logger) {
        this.logger = logger;
        this.codeParser = new CodeParser();
        this.defaultRules = this.createDefaultRules();
    }
    /**
     * Initialize the difference analyzer
     */
    async initialize() {
        try {
            this.logger.info('Initializing Difference Analyzer...');
            // CodeParser doesn't need initialization
            this.logger.info('Difference Analyzer initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize Difference Analyzer:', error);
            throw error;
        }
    }
    /**
     * Analyze differences between frontend and backend code
     */
    async analyzeDifferences(request) {
        const startTime = Date.now();
        try {
            this.logger.info('Starting difference analysis', {
                frontendLanguage: request.frontendLanguage,
                backendLanguage: request.backendLanguage
            });
            // Parse frontend and backend code with error handling
            let frontendParsed;
            let backendParsed;
            try {
                frontendParsed = await this.codeParser.parseCode(request.frontendCode, request.frontendLanguage, { extractApiEndpoints: true, includeLocations: true });
            }
            catch (error) {
                this.logger.warn('Failed to parse frontend code, using empty result:', error);
                frontendParsed = this.createEmptyParsedCode();
            }
            try {
                backendParsed = await this.codeParser.parseCode(request.backendCode, request.backendLanguage, { extractApiEndpoints: true, includeLocations: true });
            }
            catch (error) {
                this.logger.warn('Failed to parse backend code, using empty result:', error);
                backendParsed = this.createEmptyParsedCode();
            }
            // Apply analysis rules
            const issues = await this.applyAnalysisRules(frontendParsed, backendParsed, request.options || {});
            // Generate summary
            const summary = this.generateSummary(issues, frontendParsed, backendParsed);
            // Generate recommendations
            const recommendations = this.generateRecommendations(issues, summary);
            // Create metadata
            const metadata = {
                timestamp: new Date().toISOString(),
                duration: Date.now() - startTime,
                frontendAnalysis: {
                    endpointCount: frontendParsed.apiEndpoints.length,
                    classCount: frontendParsed.classes.length,
                    methodCount: frontendParsed.functions.length
                },
                backendAnalysis: {
                    endpointCount: backendParsed.apiEndpoints.length,
                    classCount: backendParsed.classes.length,
                    methodCount: backendParsed.functions.length
                },
                rulesApplied: this.defaultRules.map(rule => rule.name)
            };
            const result = {
                isCompatible: summary.errorCount === 0,
                issues,
                summary,
                recommendations,
                metadata
            };
            this.logger.info('Difference analysis completed', {
                duration: metadata.duration,
                issueCount: issues.length,
                isCompatible: result.isCompatible
            });
            return result;
        }
        catch (error) {
            this.logger.error('Difference analysis failed:', error);
            throw new Error(`Difference analysis failed: ${error}`);
        }
    }
    /**
     * Apply analysis rules to detect differences
     */
    async applyAnalysisRules(frontend, backend, options) {
        const issues = [];
        const rules = [...this.defaultRules, ...(options.customRules || [])];
        for (const rule of rules) {
            try {
                const ruleIssues = rule.check(frontend, backend);
                issues.push(...ruleIssues);
            }
            catch (error) {
                this.logger.warn(`Rule ${rule.name} failed:`, error);
            }
        }
        // Filter issues based on options
        let filteredIssues = issues;
        if (!options.includeWarnings) {
            filteredIssues = filteredIssues.filter(issue => issue.severity !== 'warning');
        }
        if (options.ignoreMinorDifferences) {
            filteredIssues = filteredIssues.filter(issue => issue.severity === 'error' ||
                (issue.severity === 'warning' && issue.type !== 'parameter_extra'));
        }
        return filteredIssues;
    }
    /**
     * Generate analysis summary
     */
    generateSummary(issues, frontend, backend) {
        const errorCount = issues.filter(i => i.severity === 'error').length;
        const warningCount = issues.filter(i => i.severity === 'warning').length;
        const infoCount = issues.filter(i => i.severity === 'info').length;
        // Calculate compatibility score (0-100)
        const totalPossibleIssues = Math.max(frontend.apiEndpoints.length + backend.apiEndpoints.length, 1);
        const compatibilityScore = Math.max(0, Math.round(100 - (errorCount * 10 + warningCount * 5) / totalPossibleIssues * 100));
        // Extract affected endpoints
        const affectedEndpoints = Array.from(new Set(issues
            .filter(issue => issue.frontendLocation || issue.backendLocation)
            .map(issue => this.extractEndpointFromIssue(issue, frontend, backend))
            .filter(Boolean)));
        // Find missing and extra endpoints
        const frontendPaths = new Set(frontend.apiEndpoints.map(ep => `${ep.method} ${ep.path}`));
        const backendPaths = new Set(backend.apiEndpoints.map(ep => `${ep.method} ${ep.path}`));
        const missingEndpoints = Array.from(backendPaths).filter(path => !frontendPaths.has(path));
        const extraEndpoints = Array.from(frontendPaths).filter(path => !backendPaths.has(path));
        return {
            totalIssues: issues.length,
            errorCount,
            warningCount,
            infoCount,
            compatibilityScore,
            affectedEndpoints,
            missingEndpoints,
            extraEndpoints
        };
    }
    /**
     * Generate recommendations based on analysis results
     */
    generateRecommendations(issues, summary) {
        const recommendations = [];
        // High priority recommendations for errors
        if (summary.errorCount > 0) {
            recommendations.push({
                priority: 'high',
                category: 'compatibility',
                message: `Found ${summary.errorCount} critical compatibility issues`,
                action: 'Fix endpoint mismatches and parameter type errors immediately',
                impact: 'Application may fail at runtime due to API incompatibilities'
            });
        }
        // Missing endpoints recommendation
        if (summary.missingEndpoints.length > 0) {
            recommendations.push({
                priority: 'high',
                category: 'compatibility',
                message: `${summary.missingEndpoints.length} backend endpoints not implemented in frontend`,
                action: 'Implement missing API calls in frontend code',
                impact: 'Features may not work as expected due to missing API integration'
            });
        }
        // Extra endpoints recommendation
        if (summary.extraEndpoints.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'maintainability',
                message: `${summary.extraEndpoints.length} frontend API calls not found in backend`,
                action: 'Remove unused API calls or implement corresponding backend endpoints',
                impact: 'Dead code and potential runtime errors'
            });
        }
        // Low compatibility score
        if (summary.compatibilityScore < 70) {
            recommendations.push({
                priority: 'high',
                category: 'compatibility',
                message: `Low compatibility score: ${summary.compatibilityScore}%`,
                action: 'Review and fix API interface mismatches systematically',
                impact: 'High risk of integration failures and runtime errors'
            });
        }
        // Security recommendations
        const authIssues = issues.filter(i => i.type === 'authentication_mismatch');
        if (authIssues.length > 0) {
            recommendations.push({
                priority: 'high',
                category: 'security',
                message: 'Authentication mismatches detected',
                action: 'Ensure consistent authentication implementation across frontend and backend',
                impact: 'Security vulnerabilities and access control issues'
            });
        }
        return recommendations;
    }
    /**
     * Extract endpoint information from issue
     */
    extractEndpointFromIssue(issue, frontend, backend) {
        // Try to find endpoint based on location
        if (issue.frontendLocation) {
            const endpoint = frontend.apiEndpoints.find(ep => ep.location.start.line === issue.frontendLocation.line);
            if (endpoint) {
                return `${endpoint.method} ${endpoint.path}`;
            }
        }
        if (issue.backendLocation) {
            const endpoint = backend.apiEndpoints.find(ep => ep.location.start.line === issue.backendLocation.line);
            if (endpoint) {
                return `${endpoint.method} ${endpoint.path}`;
            }
        }
        return null;
    }
    /**
     * Create default analysis rules
     */
    createDefaultRules() {
        return [
            {
                name: 'endpoint_consistency',
                description: 'Check for missing or extra endpoints between frontend and backend',
                severity: 'error',
                check: (frontend, backend) => this.checkEndpointConsistency(frontend, backend)
            },
            {
                name: 'method_consistency',
                description: 'Verify HTTP methods match between frontend and backend',
                severity: 'error',
                check: (frontend, backend) => this.checkMethodConsistency(frontend, backend)
            },
            {
                name: 'parameter_consistency',
                description: 'Check parameter types and requirements',
                severity: 'warning',
                check: (frontend, backend) => this.checkParameterConsistency(frontend, backend)
            },
            {
                name: 'response_type_consistency',
                description: 'Verify response types match expectations',
                severity: 'warning',
                check: (frontend, backend) => this.checkResponseTypeConsistency(frontend, backend)
            }
        ];
    }
    /**
     * Check endpoint consistency between frontend and backend
     */
    checkEndpointConsistency(frontend, backend) {
        const issues = [];
        const frontendEndpoints = new Map(frontend.apiEndpoints.map(ep => [`${ep.method}:${ep.path}`, ep]));
        const backendEndpoints = new Map(backend.apiEndpoints.map(ep => [`${ep.method}:${ep.path}`, ep]));
        // Check for missing endpoints in frontend
        for (const [key, backendEp] of backendEndpoints) {
            if (!frontendEndpoints.has(key)) {
                issues.push({
                    type: 'endpoint_missing',
                    severity: 'error',
                    message: `Missing frontend implementation for ${backendEp.method} ${backendEp.path}`,
                    description: 'Backend endpoint exists but no corresponding frontend API call found',
                    backendLocation: {
                        line: backendEp.location.start.line,
                        column: backendEp.location.start.column
                    },
                    expectedValue: `${backendEp.method} ${backendEp.path}`,
                    rule: 'endpoint_consistency'
                });
            }
        }
        // Check for extra endpoints in frontend
        for (const [key, frontendEp] of frontendEndpoints) {
            if (!backendEndpoints.has(key)) {
                issues.push({
                    type: 'endpoint_extra',
                    severity: 'warning',
                    message: `Extra frontend API call ${frontendEp.method} ${frontendEp.path}`,
                    description: 'Frontend API call exists but no corresponding backend endpoint found',
                    frontendLocation: {
                        line: frontendEp.location.start.line,
                        column: frontendEp.location.start.column
                    },
                    actualValue: `${frontendEp.method} ${frontendEp.path}`,
                    rule: 'endpoint_consistency'
                });
            }
        }
        return issues;
    }
    /**
     * Check HTTP method consistency
     */
    checkMethodConsistency(frontend, backend) {
        const issues = [];
        // Create maps for easier comparison
        const frontendByPath = new Map();
        const backendByPath = new Map();
        // Group endpoints by path
        frontend.apiEndpoints.forEach(ep => {
            const endpoints = frontendByPath.get(ep.path) || [];
            endpoints.push(ep);
            frontendByPath.set(ep.path, endpoints);
        });
        backend.apiEndpoints.forEach(ep => {
            const endpoints = backendByPath.get(ep.path) || [];
            endpoints.push(ep);
            backendByPath.set(ep.path, endpoints);
        });
        // Check for method mismatches on same paths
        for (const [path, frontendEps] of frontendByPath) {
            const backendEps = backendByPath.get(path);
            if (!backendEps)
                continue;
            // const _frontendMethods = new Set(frontendEps.map(ep => ep.method));
            const backendMethods = new Set(backendEps.map(ep => ep.method));
            // Check for method mismatches
            for (const frontendEp of frontendEps) {
                if (!backendMethods.has(frontendEp.method)) {
                    const suggestedMethod = this.findSimilarMethod(frontendEp.method, Array.from(backendMethods));
                    issues.push({
                        type: 'method_mismatch',
                        severity: 'error',
                        message: `Method mismatch for ${path}: frontend uses ${frontendEp.method}, backend doesn't support it`,
                        description: suggestedMethod
                            ? `Consider using ${suggestedMethod} instead of ${frontendEp.method}`
                            : `Backend doesn't support ${frontendEp.method} method for ${path}`,
                        frontendLocation: {
                            line: frontendEp.location.start.line,
                            column: frontendEp.location.start.column
                        },
                        expectedValue: Array.from(backendMethods),
                        actualValue: frontendEp.method,
                        rule: 'method_consistency'
                    });
                }
            }
        }
        return issues;
    }
    /**
     * Check parameter consistency
     */
    checkParameterConsistency(frontend, backend) {
        const issues = [];
        // Compare parameters for matching endpoints
        const frontendEndpoints = new Map(frontend.apiEndpoints.map(ep => [`${ep.method}:${ep.path}`, ep]));
        const backendEndpoints = new Map(backend.apiEndpoints.map(ep => [`${ep.method}:${ep.path}`, ep]));
        for (const [key, frontendEp] of frontendEndpoints) {
            const backendEp = backendEndpoints.get(key);
            if (!backendEp)
                continue;
            // Compare parameters
            const frontendParams = new Map(frontendEp.parameters.map(p => [p.name, p]));
            const backendParams = new Map(backendEp.parameters.map(p => [p.name, p]));
            // Check for missing parameters in frontend
            for (const [paramName, backendParam] of backendParams) {
                const frontendParam = frontendParams.get(paramName);
                if (!frontendParam) {
                    issues.push({
                        type: 'parameter_missing',
                        severity: 'warning',
                        message: `Missing parameter '${paramName}' in frontend call to ${frontendEp.method} ${frontendEp.path}`,
                        description: `Backend expects parameter '${paramName}' of type ${backendParam.type}`,
                        frontendLocation: {
                            line: frontendEp.location.start.line,
                            column: frontendEp.location.start.column
                        },
                        expectedValue: backendParam,
                        rule: 'parameter_consistency'
                    });
                }
                else if (frontendParam.type !== backendParam.type &&
                    frontendParam.type !== 'any' && backendParam.type !== 'any') {
                    // Type mismatch
                    issues.push({
                        type: 'parameter_type_mismatch',
                        severity: 'warning',
                        message: `Parameter type mismatch for '${paramName}' in ${frontendEp.method} ${frontendEp.path}`,
                        description: `Frontend expects ${frontendParam.type}, backend expects ${backendParam.type}`,
                        frontendLocation: {
                            line: frontendEp.location.start.line,
                            column: frontendEp.location.start.column
                        },
                        expectedValue: backendParam.type,
                        actualValue: frontendParam.type,
                        rule: 'parameter_consistency'
                    });
                }
            }
            // Check for extra parameters in frontend
            for (const [paramName, frontendParam] of frontendParams) {
                if (!backendParams.has(paramName)) {
                    issues.push({
                        type: 'parameter_extra',
                        severity: 'info',
                        message: `Extra parameter '${paramName}' in frontend call to ${frontendEp.method} ${frontendEp.path}`,
                        description: `Frontend sends parameter '${paramName}' but backend doesn't expect it`,
                        frontendLocation: {
                            line: frontendEp.location.start.line,
                            column: frontendEp.location.start.column
                        },
                        actualValue: frontendParam,
                        rule: 'parameter_consistency'
                    });
                }
            }
        }
        return issues;
    }
    /**
     * Check response type consistency
     */
    checkResponseTypeConsistency(frontend, backend) {
        const issues = [];
        // Compare response types for matching endpoints
        const frontendEndpoints = new Map(frontend.apiEndpoints.map(ep => [`${ep.method}:${ep.path}`, ep]));
        const backendEndpoints = new Map(backend.apiEndpoints.map(ep => [`${ep.method}:${ep.path}`, ep]));
        for (const [key, frontendEp] of frontendEndpoints) {
            const backendEp = backendEndpoints.get(key);
            if (!backendEp)
                continue;
            // Compare response types
            if (frontendEp.responseType && backendEp.responseType &&
                frontendEp.responseType !== backendEp.responseType &&
                frontendEp.responseType !== 'any' && backendEp.responseType !== 'any') {
                issues.push({
                    type: 'response_type_mismatch',
                    severity: 'warning',
                    message: `Response type mismatch for ${frontendEp.method} ${frontendEp.path}`,
                    description: `Frontend expects ${frontendEp.responseType}, backend returns ${backendEp.responseType}`,
                    frontendLocation: {
                        line: frontendEp.location.start.line,
                        column: frontendEp.location.start.column
                    },
                    backendLocation: {
                        line: backendEp.location.start.line,
                        column: backendEp.location.start.column
                    },
                    expectedValue: backendEp.responseType,
                    actualValue: frontendEp.responseType,
                    rule: 'response_type_consistency'
                });
            }
        }
        return issues;
    }
    /**
     * Find similar HTTP method for suggestions
     */
    findSimilarMethod(method, availableMethods) {
        const methodMap = {
            'GET': ['POST', 'PUT'],
            'POST': ['PUT', 'PATCH', 'GET'],
            'PUT': ['POST', 'PATCH'],
            'PATCH': ['PUT', 'POST'],
            'DELETE': ['POST', 'PUT']
        };
        const suggestions = methodMap[method] || [];
        return suggestions.find(suggestion => availableMethods.includes(suggestion)) || null;
    }
    /**
     * Create empty parsed code result for error cases
     */
    createEmptyParsedCode() {
        return {
            language: 'typescript',
            classes: [],
            interfaces: [],
            functions: [],
            imports: [],
            exports: [],
            apiEndpoints: [],
            metadata: {
                totalLines: 0,
                codeLines: 0,
                commentLines: 0,
                complexity: 0,
                dependencies: []
            }
        };
    }
    /**
     * Get analysis statistics
     */
    getStats() {
        return {
            rulesCount: this.defaultRules.length
        };
    }
}
//# sourceMappingURL=index.js.map