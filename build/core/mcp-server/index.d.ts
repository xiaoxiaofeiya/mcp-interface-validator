/**
 * MCP Protocol Server Implementation
 *
 * This module implements a Model Context Protocol (MCP) server that provides:
 * - RESTful API endpoints for HTTP communication
 * - WebSocket support for real-time bidirectional communication
 * - JSON-RPC 2.0 message handling
 * - Session management and client connection tracking
 * - Integration with validation engine and tool adapters
 *
 * Based on MCP specification and TypeScript SDK patterns
 */
import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
    /** Server name for identification */
    name: string;
    /** Server version */
    version: string;
    /** HTTP port to listen on */
    port: number;
    /** Enable CORS for cross-origin requests */
    enableCors?: boolean;
    /** Allowed origins for CORS */
    allowedOrigins?: string[];
    /** Enable WebSocket support */
    enableWebSocket?: boolean;
    /** Session timeout in milliseconds */
    sessionTimeout?: number;
    /** Maximum number of concurrent sessions */
    maxSessions?: number;
}
/**
 * MCP Session represents a client connection
 */
export interface MCPSession {
    /** Unique session identifier */
    id: string;
    /** Session creation timestamp */
    createdAt: Date;
    /** Last activity timestamp */
    lastActivity: Date;
    /** Client information */
    clientInfo?: {
        name: string;
        version: string;
    };
    /** Session capabilities */
    capabilities: {
        tools?: boolean;
        resources?: boolean;
        prompts?: boolean;
        logging?: boolean;
    };
    /** WebSocket connection if available */
    websocket?: WebSocket;
}
/**
 * JSON-RPC 2.0 Message Types
 */
export interface JSONRPCRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: string;
    params?: Record<string, any>;
}
export interface JSONRPCResponse {
    jsonrpc: '2.0';
    id: string | number;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}
export interface JSONRPCNotification {
    jsonrpc: '2.0';
    method: string;
    params?: Record<string, any>;
}
/**
 * MCP Server Capabilities
 */
export interface MCPServerCapabilities {
    /** Tool execution support */
    tools?: {
        listChanged?: boolean;
    };
    /** Resource access support */
    resources?: {
        subscribe?: boolean;
        listChanged?: boolean;
    };
    /** Prompt template support */
    prompts?: {
        listChanged?: boolean;
    };
    /** Logging support */
    logging?: {};
    /** Completion support */
    completions?: {};
}
/**
 * MCP Tool Definition
 */
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
}
/**
 * MCP Resource Definition
 */
export interface MCPResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}
/**
 * Main MCP Server Class
 */
export declare class MCPServer extends EventEmitter {
    private config;
    private app;
    private httpServer;
    private wsServer?;
    private sessions;
    private sessionCleanupInterval?;
    private validationEngine;
    private intelligentConstraintSystem;
    private logger;
    private isRunning;
    private capabilities;
    private tools;
    private resources;
    constructor(config: MCPServerConfig);
    /**
     * Setup Express middleware
     */
    private setupMiddleware;
    /**
     * Setup HTTP routes
     */
    private setupRoutes;
    /**
     * Setup WebSocket server
     */
    private setupWebSocket;
    /**
     * Setup session cleanup timer
     */
    private setupSessionCleanup;
    /**
     * Handle HTTP POST requests to /mcp endpoint
     */
    private handleMCPRequest;
    /**
     * Handle HTTP GET requests to /mcp endpoint (SSE support)
     */
    private handleMCPGet;
    /**
     * Handle HTTP DELETE requests to /mcp endpoint (session termination)
     */
    private handleMCPDelete;
    /**
     * Check if a message is an initialize request
     */
    private isInitializeRequest;
    /**
     * Create a new session
     */
    private createSession;
    /**
     * Process JSON-RPC messages
     */
    private processJSONRPCMessage;
    /**
     * Handle initialize request
     */
    private handleInitialize;
    /**
     * Handle list tools request
     */
    private handleListTools;
    /**
     * Handle call tool request
     */
    private handleCallTool;
    /**
     * Handle list resources request
     */
    private handleListResources;
    /**
     * Handle read resource request
     */
    private handleReadResource;
    /**
     * Handle list prompts request
     */
    private handleListPrompts;
    /**
     * Handle get prompt request
     */
    private handleGetPrompt;
    /**
     * Handle validation request (custom method)
     */
    private handleValidation;
    /**
     * Handle notifications
     */
    private handleNotification;
    /**
     * Execute validation tool
     */
    private executeValidationTool;
    /**
     * Execute compatibility analysis tool
     */
    private executeCompatibilityTool;
    /**
     * Register a tool with the server
     */
    registerTool(tool: MCPTool): void;
    /**
     * Register a resource with the server
     */
    registerResource(resource: MCPResource): void;
    /**
     * Start the MCP server
     */
    start(): Promise<void>;
    /**
     * Stop the MCP server
     */
    stop(): Promise<void>;
    /**
     * Register default tools
     */
    private registerDefaultTools;
    /**
     * Register default resources
     */
    private registerDefaultResources;
    /**
     * Get server status
     */
    getStatus(): any;
    /**
     * Get active sessions
     */
    getSessions(): MCPSession[];
    /**
     * 智能约束系统工具执行方法
     */
    /**
     * 执行激活约束工具
     */
    private executeActivateConstraints;
    /**
     * 执行应用约束模板工具
     */
    private executeApplyConstraintTemplate;
    /**
     * 执行加载约束配置工具
     */
    private executeLoadConstraintConfig;
    /**
     * 执行列出约束模板工具
     */
    private executeListConstraintTemplates;
    /**
     * 执行获取约束状态工具
     */
    private executeGetConstraintStatus;
}
//# sourceMappingURL=index.d.ts.map