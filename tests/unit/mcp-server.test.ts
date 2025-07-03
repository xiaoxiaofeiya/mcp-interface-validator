/**
 * MCP Server Tests
 * 
 * Comprehensive test suite for the MCP Protocol Server implementation
 * Tests cover HTTP endpoints, WebSocket connections, JSON-RPC message handling,
 * session management, tool execution, and error handling
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import WebSocket from 'ws';
import { MCPServer, MCPServerConfig } from '../../src/core/mcp-server/index';

describe('MCP Server', () => {
  let server: MCPServer;
  let config: MCPServerConfig;

  beforeEach(() => {
    config = {
      name: 'test-mcp-server',
      version: '1.0.0',
      port: 3001,
      enableCors: true,
      enableWebSocket: true,
      sessionTimeout: 60000,
      maxSessions: 10
    };
    server = new MCPServer(config);
  });

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
  });

  describe('Server Lifecycle', () => {
    test('should start and stop server successfully', async () => {
      await server.start();
      expect(server.getStatus().isRunning).toBe(true);
      
      await server.stop();
      expect(server.getStatus().isRunning).toBe(false);
    });

    test('should not start server twice', async () => {
      await server.start();
      await expect(server.start()).rejects.toThrow('Server is already running');
    });

    test('should handle stop when not running', async () => {
      await expect(server.stop()).resolves.not.toThrow();
    });
  });

  describe('HTTP Endpoints', () => {
    beforeEach(async () => {
      await server.start();
    });

    test('should respond to health check', async () => {
      const response = await request(`http://localhost:${config.port}`)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        server: config.name,
        version: config.version
      });
    });

    test('should respond to server info', async () => {
      const response = await request(`http://localhost:${config.port}`)
        .get('/info')
        .expect(200);

      expect(response.body).toMatchObject({
        name: config.name,
        version: config.version,
        protocolVersion: '2024-11-05'
      });
    });

    test('should handle initialize request', async () => {
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          clientInfo: {
            name: 'test-client',
            version: '1.0.0'
          }
        }
      };

      const response = await request(`http://localhost:${config.port}`)
        .post('/mcp')
        .send(initRequest)
        .expect(200);

      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: config.name,
            version: config.version
          }
        }
      });

      expect(response.headers['mcp-session-id']).toBeDefined();
    });

    test('should reject request without session ID', async () => {
      const request_data = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
      };

      const response = await request(`http://localhost:${config.port}`)
        .post('/mcp')
        .send(request_data)
        .expect(400);

      expect(response.body.error.message).toContain('No valid session ID provided');
    });

    test('should handle tools/list request', async () => {
      // First initialize
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {}
      };

      const initResponse = await request(`http://localhost:${config.port}`)
        .post('/mcp')
        .send(initRequest);

      const sessionId = initResponse.headers['mcp-session-id'];

      // Then list tools
      const toolsRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list'
      };

      const response = await request(`http://localhost:${config.port}`)
        .post('/mcp')
        .set('mcp-session-id', sessionId)
        .send(toolsRequest)
        .expect(200);

      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: 2,
        result: {
          tools: expect.any(Array)
        }
      });

      expect(response.body.result.tools.length).toBeGreaterThan(0);
    });

    test('should handle tools/call request', async () => {
      // Initialize session
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {}
      };

      const initResponse = await request(`http://localhost:${config.port}`)
        .post('/mcp')
        .send(initRequest);

      const sessionId = initResponse.headers['mcp-session-id'];

      // Call validation tool
      const callRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'validate-interface',
          arguments: {
            frontendCode: 'const api = { getData: () => Promise<string> }',
            backendCode: 'app.get("/data", (req, res) => res.json("test"))',
            language: 'typescript'
          }
        }
      };

      const response = await request(`http://localhost:${config.port}`)
        .post('/mcp')
        .set('mcp-session-id', sessionId)
        .send(callRequest)
        .expect(200);

      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: 2,
        result: {
          content: expect.any(Array)
        }
      });
    });

    test('should handle resources/list request', async () => {
      // Initialize session
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {}
      };

      const initResponse = await request(`http://localhost:${config.port}`)
        .post('/mcp')
        .send(initRequest);

      const sessionId = initResponse.headers['mcp-session-id'];

      // List resources
      const resourcesRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'resources/list'
      };

      const response = await request(`http://localhost:${config.port}`)
        .post('/mcp')
        .set('mcp-session-id', sessionId)
        .send(resourcesRequest)
        .expect(200);

      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: 2,
        result: {
          resources: expect.any(Array)
        }
      });
    });

    test('should handle unknown method', async () => {
      // Initialize session
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {}
      };

      const initResponse = await request(`http://localhost:${config.port}`)
        .post('/mcp')
        .send(initRequest);

      const sessionId = initResponse.headers['mcp-session-id'];

      // Call unknown method
      const unknownRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'unknown/method'
      };

      const response = await request(`http://localhost:${config.port}`)
        .post('/mcp')
        .set('mcp-session-id', sessionId)
        .send(unknownRequest)
        .expect(200);

      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        id: 2,
        error: {
          code: -32601,
          message: 'Method not found: unknown/method'
        }
      });
    });

    test('should handle session termination', async () => {
      // Initialize session
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {}
      };

      const initResponse = await request(`http://localhost:${config.port}`)
        .post('/mcp')
        .send(initRequest);

      const sessionId = initResponse.headers['mcp-session-id'];

      // Terminate session
      const response = await request(`http://localhost:${config.port}`)
        .delete('/mcp')
        .set('mcp-session-id', sessionId)
        .expect(200);

      expect(response.body).toMatchObject({
        jsonrpc: '2.0',
        result: {
          message: 'Session terminated successfully'
        }
      });
    });
  });

  describe('WebSocket Support', () => {
    beforeEach(async () => {
      await server.start();
    });

    test('should accept WebSocket connections', (done) => {
      const ws = new WebSocket(`ws://localhost:${config.port}/ws`);
      
      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    test('should handle WebSocket JSON-RPC messages', (done) => {
      const ws = new WebSocket(`ws://localhost:${config.port}/ws`);
      
      ws.on('open', () => {
        const initRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            clientInfo: {
              name: 'websocket-client',
              version: '1.0.0'
            }
          }
        };

        ws.send(JSON.stringify(initRequest));
      });

      ws.on('message', (data) => {
        const response = JSON.parse(data.toString());
        
        expect(response).toMatchObject({
          jsonrpc: '2.0',
          id: 1,
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: {
              name: config.name,
              version: config.version
            }
          }
        });

        ws.close();
        done();
      });

      ws.on('error', (error) => {
        done(error);
      });
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      await server.start();
    });

    test('should track active sessions', async () => {
      const initialSessions = server.getSessions().length;

      // Create a session
      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {}
      };

      await request(`http://localhost:${config.port}`)
        .post('/mcp')
        .send(initRequest);

      expect(server.getSessions().length).toBe(initialSessions + 1);
    });

    test('should provide server status', () => {
      const status = server.getStatus();
      
      expect(status).toMatchObject({
        name: config.name,
        version: config.version,
        isRunning: true,
        port: config.port,
        sessions: expect.any(Number),
        tools: expect.any(Number),
        resources: expect.any(Number)
      });
    });
  });

  describe('Tool and Resource Registration', () => {
    test('should register custom tools', async () => {
      const customTool = {
        name: 'custom-tool',
        description: 'A custom test tool',
        inputSchema: {
          type: 'object' as const,
          properties: {
            input: { type: 'string' }
          },
          required: ['input']
        }
      };

      // Start server to register default tools
      await server.start();
      server.registerTool(customTool);
      const status = server.getStatus();
      expect(status.tools).toBeGreaterThan(2); // Default tools + custom tool
    });

    test('should register custom resources', async () => {
      const customResource = {
        uri: 'test://custom-resource',
        name: 'Custom Resource',
        description: 'A custom test resource',
        mimeType: 'text/plain'
      };

      // Start server to register default resources
      await server.start();
      server.registerResource(customResource);
      const status = server.getStatus();
      expect(status.resources).toBeGreaterThan(2); // Default resources + custom resource
    });
  });
});
