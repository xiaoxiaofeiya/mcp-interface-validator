/**
 * Simplified MCP Server for Testing
 *
 * A minimal implementation of MCP protocol server for testing purposes
 * without dependencies on complex validation engine
 */
import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
/**
 * Simple MCP Server Configuration
 */
export interface SimpleMCPServerConfig {
    name: string;
    version: string;
    port: number;
    enableCors?: boolean;
    enableWebSocket?: boolean;
}
/**
 * Simple MCP Session
 */
export interface SimpleMCPSession {
    id: string;
    createdAt: Date;
    lastActivity: Date;
    clientInfo?: {
        name: string;
        version: string;
    };
    capabilities: Record<string, any>;
    websocket?: WebSocket;
}
/**
 * JSON-RPC Message Types
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
/**
 * Simple MCP Server Implementation
 */
export declare class SimpleMCPServer extends EventEmitter {
    private config;
    private app;
    private httpServer;
    private wsServer?;
    private sessions;
    private isRunning;
    constructor(config: SimpleMCPServerConfig);
    private setupMiddleware;
    private setupRoutes;
    private setupWebSocket;
    private handleMCPRequest;
    private handleMCPGet;
    private handleMCPDelete;
    private isInitializeRequest;
    private createSession;
    private processMessage;
    private handleInitialize;
    private handleListTools;
    private handleCallTool;
    start(): Promise<void>;
    stop(): Promise<void>;
    getStatus(): any;
    getSessions(): SimpleMCPSession[];
}
//# sourceMappingURL=simple-server.d.ts.map