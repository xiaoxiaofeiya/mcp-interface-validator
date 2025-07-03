/**
 * Simplified MCP Server for Testing
 *
 * A minimal implementation of MCP protocol server for testing purposes
 * without dependencies on complex validation engine
 */
import express, {} from 'express';
import { createServer, Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import cors from 'cors';
import { EventEmitter } from 'events';
/**
 * Simple MCP Server Implementation
 */
export class SimpleMCPServer extends EventEmitter {
    config;
    app;
    httpServer;
    wsServer;
    sessions = new Map();
    isRunning = false;
    constructor(config) {
        super();
        this.config = {
            enableCors: true,
            enableWebSocket: true,
            ...config
        };
        this.app = express();
        this.httpServer = createServer(this.app);
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }
    setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        if (this.config.enableCors) {
            this.app.use(cors({
                origin: '*',
                credentials: true,
                exposedHeaders: ['mcp-session-id']
            }));
        }
        this.app.use((req, _res, next) => {
            console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
            next();
        });
    }
    setupRoutes() {
        this.app.post('/mcp', this.handleMCPRequest.bind(this));
        this.app.get('/mcp', this.handleMCPGet.bind(this));
        this.app.delete('/mcp', this.handleMCPDelete.bind(this));
        this.app.get('/health', (_req, res) => {
            res.json({
                status: 'healthy',
                server: this.config.name,
                version: this.config.version,
                sessions: this.sessions.size
            });
        });
        this.app.get('/info', (_req, res) => {
            res.json({
                name: this.config.name,
                version: this.config.version,
                protocolVersion: '2024-11-05'
            });
        });
    }
    setupWebSocket() {
        if (!this.config.enableWebSocket)
            return;
        this.wsServer = new WebSocketServer({
            server: this.httpServer,
            path: '/ws'
        });
        this.wsServer.on('connection', (ws) => {
            const sessionId = randomUUID();
            console.log(`WebSocket connection established: ${sessionId}`);
            const session = {
                id: sessionId,
                createdAt: new Date(),
                lastActivity: new Date(),
                capabilities: {}
            };
            this.sessions.set(sessionId, session);
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    const response = await this.processMessage(message, session);
                    if (response) {
                        ws.send(JSON.stringify(response));
                    }
                }
                catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            ws.on('close', () => {
                console.log(`WebSocket connection closed: ${sessionId}`);
                this.sessions.delete(sessionId);
            });
        });
    }
    async handleMCPRequest(req, res) {
        try {
            const sessionId = req.headers['mcp-session-id'];
            let session;
            if (sessionId) {
                session = this.sessions.get(sessionId);
                if (session) {
                    session.lastActivity = new Date();
                }
            }
            if (!session && this.isInitializeRequest(req.body)) {
                session = this.createSession();
                res.setHeader('mcp-session-id', session.id);
            }
            if (!session) {
                res.status(400).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32000,
                        message: 'Bad Request: No valid session ID provided'
                    },
                    id: null
                });
                return;
            }
            const response = await this.processMessage(req.body, session);
            if (response) {
                res.json(response);
            }
            else {
                res.status(202).send();
            }
        }
        catch (error) {
            console.error('MCP request error:', error);
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error'
                },
                id: null
            });
        }
    }
    async handleMCPGet(req, res) {
        const sessionId = req.headers['mcp-session-id'];
        if (!sessionId || !this.sessions.has(sessionId)) {
            res.status(400).send('Invalid or missing session ID');
            return;
        }
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        const keepAlive = setInterval(() => {
            res.write('data: {"type":"ping"}\n\n');
        }, 30000);
        req.on('close', () => {
            clearInterval(keepAlive);
        });
    }
    async handleMCPDelete(req, res) {
        const sessionId = req.headers['mcp-session-id'];
        if (!sessionId || !this.sessions.has(sessionId)) {
            res.status(400).send('Invalid or missing session ID');
            return;
        }
        const session = this.sessions.get(sessionId);
        if (session?.websocket) {
            session.websocket.close();
        }
        this.sessions.delete(sessionId);
        res.status(200).json({
            jsonrpc: '2.0',
            result: {
                message: 'Session terminated successfully'
            }
        });
    }
    isInitializeRequest(message) {
        return message &&
            message.jsonrpc === '2.0' &&
            message.method === 'initialize' &&
            message.id !== undefined;
    }
    createSession() {
        const session = {
            id: randomUUID(),
            createdAt: new Date(),
            lastActivity: new Date(),
            capabilities: {}
        };
        this.sessions.set(session.id, session);
        return session;
    }
    async processMessage(message, session) {
        try {
            switch (message.method) {
                case 'initialize':
                    return this.handleInitialize(message, session);
                case 'tools/list':
                    return this.handleListTools(message);
                case 'tools/call':
                    return this.handleCallTool(message);
                default:
                    return {
                        jsonrpc: '2.0',
                        id: message.id,
                        error: {
                            code: -32601,
                            message: `Method not found: ${message.method}`
                        }
                    };
            }
        }
        catch (error) {
            return {
                jsonrpc: '2.0',
                id: message.id,
                error: {
                    code: -32603,
                    message: 'Internal error'
                }
            };
        }
    }
    handleInitialize(request, session) {
        const params = request.params || {};
        if (params['clientInfo']) {
            session.clientInfo = params['clientInfo'];
        }
        if (params['capabilities']) {
            session.capabilities = params['capabilities'];
        }
        return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
                protocolVersion: '2024-11-05',
                capabilities: {
                    tools: { listChanged: true }
                },
                serverInfo: {
                    name: this.config.name,
                    version: this.config.version
                }
            }
        };
    }
    handleListTools(request) {
        return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
                tools: [
                    {
                        name: 'validate-interface',
                        description: 'Validate interface compatibility',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                frontendCode: { type: 'string' },
                                backendCode: { type: 'string' }
                            },
                            required: ['frontendCode', 'backendCode']
                        }
                    }
                ]
            }
        };
    }
    handleCallTool(request) {
        const params = request.params || {};
        const toolName = params['name'];
        if (toolName === 'validate-interface') {
            return {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                isValid: true,
                                score: 95,
                                issues: [],
                                suggestions: []
                            }, null, 2)
                        }
                    ]
                }
            };
        }
        return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
                code: -32602,
                message: `Tool not found: ${toolName}`
            }
        };
    }
    async start() {
        if (this.isRunning) {
            throw new Error('Server is already running');
        }
        return new Promise((resolve, reject) => {
            this.httpServer.listen(this.config.port, () => {
                this.isRunning = true;
                console.log(`Simple MCP Server listening on port ${this.config.port}`);
                this.emit('started');
                resolve();
            });
            this.httpServer.on('error', (error) => {
                reject(error);
            });
        });
    }
    async stop() {
        if (!this.isRunning) {
            return;
        }
        if (this.wsServer) {
            this.wsServer.close();
        }
        for (const session of this.sessions.values()) {
            if (session.websocket) {
                session.websocket.close();
            }
        }
        this.sessions.clear();
        return new Promise((resolve) => {
            this.httpServer.close(() => {
                this.isRunning = false;
                console.log('Simple MCP Server stopped');
                this.emit('stopped');
                resolve();
            });
        });
    }
    getStatus() {
        return {
            name: this.config.name,
            version: this.config.version,
            isRunning: this.isRunning,
            port: this.config.port,
            sessions: this.sessions.size
        };
    }
    getSessions() {
        return Array.from(this.sessions.values());
    }
}
//# sourceMappingURL=simple-server.js.map