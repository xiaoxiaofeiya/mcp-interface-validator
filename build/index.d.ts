#!/usr/bin/env node
/**
 * MCP Interface Validator - Main Entry Point
 *
 * This is the main entry point for the MCP Interface Validation Component.
 * It initializes the MCP server and sets up the validation services.
 *
 * Usage:
 * - As MCP Server: npx mcp-interface-validator
 * - Direct execution: node build/index.js
 */
/**
 * Main MCP Interface Validator Server
 */
declare class MCPInterfaceValidator {
    private server;
    private logger;
    private configManager;
    private validationEngine;
    private constraintSystem;
    private _contextAnalyzer;
    constructor();
    /**
     * Initialize the MCP server and register handlers
     */
    initialize(): Promise<void>;
    /**
     * Register MCP tool handlers
     */
    private registerToolHandlers;
    /**
     * Handle interface validation tool call
     */
    private handleValidateInterface;
    /**
     * Format intelligent validation result for display
     */
    private formatIntelligentValidationResult;
    /**
     * Format standard validation result for display
     */
    private formatValidationResult;
    /**
     * Handle monitoring changes tool call
     */
    private handleMonitorChanges;
    /**
     * Handle activate interface constraints tool call
     */
    private handleActivateConstraints;
    /**
     * Handle apply interface constraints tool call
     */
    private handleApplyConstraints;
    /**
     * Start the MCP server
     */
    start(): Promise<void>;
}
export { MCPInterfaceValidator };
//# sourceMappingURL=index.d.ts.map