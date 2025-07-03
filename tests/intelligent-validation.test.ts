/**
 * Intelligent Validation Tests
 * 
 * Tests for handling ambiguous user instructions and missing specifications
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { IntelligentContextAnalyzer } from '../src/core/intelligent-context/index';
import { ValidationEngine } from '../src/core/validation/index';
import { ConfigManager } from '../src/utils/config/index';
import { Logger } from '../src/utils/logger/index';

describe('IntelligentContextAnalyzer', () => {
  let analyzer: IntelligentContextAnalyzer;

  beforeEach(() => {
    analyzer = new IntelligentContextAnalyzer();
  });

  describe('analyzeUserInstruction', () => {
    test('should analyze login system instruction', async () => {
      const instruction = '开发一个用户登录系统';
      const result = await analyzer.analyzeUserInstruction(instruction);

      expect(result.type).toBe('api_creation');
      expect(result.domain).toBe('authentication');
      expect(result.operations).toContain('login');
      expect(result.operations).toContain('register');
      expect(result.entities).toContain('user');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    test('should analyze product management instruction', async () => {
      const instruction = '创建商品管理的CRUD接口';
      const result = await analyzer.analyzeUserInstruction(instruction);

      expect(result.type).toBe('api_creation');
      expect(result.domain).toBe('product_management');
      expect(result.operations).toContain('create');
      expect(result.operations).toContain('read');
      expect(result.operations).toContain('update');
      expect(result.operations).toContain('delete');
      expect(result.entities).toContain('product');
    });

    test('should analyze order system instruction', async () => {
      const instruction = '开发订单管理功能';
      const result = await analyzer.analyzeUserInstruction(instruction);

      expect(result.type).toBe('api_creation');
      expect(result.domain).toBe('order_management');
      expect(result.operations).toContain('create');
      expect(result.entities.some(e => e.includes('order') || e.includes('订单'))).toBe(true);
    });

    test('should handle unknown instruction with low confidence', async () => {
      const instruction = '随机的不相关指令xyz123';
      const result = await analyzer.analyzeUserInstruction(instruction);

      // 可能返回 unknown 或者 api_creation 但置信度较低
      expect(result.confidence).toBeLessThanOrEqual(0.6);
    });
  });

  describe('handleMissingSpec', () => {
    test('should suggest spec creation for authentication domain', async () => {
      const intent = {
        type: 'api_creation' as const,
        domain: 'authentication',
        operations: ['login', 'register'],
        entities: ['user'],
        confidence: 0.9
      };

      const result = await analyzer.handleMissingSpec(intent, {});

      expect(result.shouldCreateSpec).toBe(true);
      expect(result.reasoning).toContain('authentication');
      expect(result.suggestedStructure.paths).toHaveProperty('/auth/login');
      expect(result.suggestedStructure.paths).toHaveProperty('/auth/register');
    });

    test('should suggest spec creation for product catalog', async () => {
      const intent = {
        type: 'api_creation' as const,
        domain: 'product_management',
        operations: ['create', 'read', 'update', 'delete'],
        entities: ['product'],
        confidence: 0.9
      };

      const result = await analyzer.handleMissingSpec(intent, {});

      expect(result.shouldCreateSpec).toBe(true);
      expect(result.suggestedStructure.paths).toHaveProperty('/api/products');
      expect(result.suggestedStructure.paths).toHaveProperty('/api/products/{id}');
    });
  });

  describe('generateContextSuggestions', () => {
    test('should generate suggestions for authentication domain', async () => {
      const intent = {
        type: 'api_creation' as const,
        domain: 'authentication',
        operations: ['login', 'logout'],
        entities: ['user'],
        confidence: 0.9
      };

      const result = await analyzer.generateContextSuggestions(intent);

      expect(result.suggestedEndpoints).toContain('POST /auth/login');
      expect(result.suggestedEndpoints).toContain('POST /auth/logout');
      expect(result.reasoning).toContain('authentication');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should generate suggestions with existing spec', async () => {
      const intent = {
        type: 'api_creation' as const,
        domain: 'user_management',
        operations: ['create', 'read'],
        entities: ['user'],
        confidence: 0.9
      };

      const existingSpec = {
        paths: {
          '/users': {
            get: { summary: 'Get users' }
          }
        }
      };

      const result = await analyzer.generateContextSuggestions(intent, existingSpec);

      expect(result.suggestedEndpoints).toContain('POST /api/users');
      expect(result.reasoning).toContain('user_management');
    });
  });
});

describe('ValidationEngine - Intelligent Validation', () => {
  let validationEngine: ValidationEngine;
  let configManager: ConfigManager;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger('TestValidationEngine');
    configManager = new ConfigManager();
    validationEngine = new ValidationEngine(configManager, logger);
  });

  describe('validateWithIntelligentContext', () => {
    test('should handle login system instruction without spec', async () => {
      const userInstruction = '开发用户登录系统';
      const code = `
        async function login(email, password) {
          const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          return response.json();
        }
      `;

      const result = await validationEngine.validateWithIntelligentContext(
        userInstruction,
        code
      );

      expect(result.isValid).toBe(false); // No spec available
      expect(result.missingSpecHandling?.shouldCreateSpec).toBe(true);
      expect(result.missingSpecHandling?.suggestedStructure.paths).toHaveProperty('/auth/login');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('MISSING_SPEC');
    });

    test('should handle product management instruction', async () => {
      const userInstruction = '创建商品管理CRUD接口';
      const code = `
        const productAPI = {
          create: (product) => fetch('/api/products', { method: 'POST', body: JSON.stringify(product) }),
          getAll: () => fetch('/api/products'),
          getById: (id) => fetch(\`/api/products/\${id}\`),
          update: (id, product) => fetch(\`/api/products/\${id}\`, { method: 'PUT', body: JSON.stringify(product) }),
          delete: (id) => fetch(\`/api/products/\${id}\`, { method: 'DELETE' })
        };
      `;

      const result = await validationEngine.validateWithIntelligentContext(
        userInstruction,
        code
      );

      expect(result.missingSpecHandling?.shouldCreateSpec).toBe(true);
      expect(result.contextSuggestions?.suggestedEndpoints).toContain('POST /api/products');
      expect(result.contextSuggestions?.suggestedEndpoints).toContain('GET /api/products');
      expect(result.contextSuggestions?.suggestedEndpoints).toContain('PUT /api/products/{id}');
      expect(result.contextSuggestions?.suggestedEndpoints).toContain('DELETE /api/products/{id}');
    });

    test('should handle order management instruction', async () => {
      const userInstruction = '开发订单管理功能';
      const code = `
        class OrderService {
          async createOrder(orderData) {
            return fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(orderData)
            });
          }
          
          async getOrders() {
            return fetch('/api/orders');
          }
        }
      `;

      const result = await validationEngine.validateWithIntelligentContext(
        userInstruction,
        code
      );

      expect(result.missingSpecHandling?.shouldCreateSpec).toBe(true);
      expect(result.missingSpecHandling?.suggestedStructure.paths).toHaveProperty('/api/orders');
      expect(result.contextSuggestions?.suggestedEndpoints).toContain('POST /api/orders');
      expect(result.contextSuggestions?.suggestedEndpoints).toContain('GET /api/orders');
    });

    test('should handle validation with existing spec path', async () => {
      const userInstruction = '用户认证';
      const code = 'fetch("/auth/login", { method: "POST" })';
      const specPath = './openapi.yaml';

      // This will fail to load the spec file, but should handle gracefully
      const result = await validationEngine.validateWithIntelligentContext(
        userInstruction,
        code,
        specPath
      );

      expect(result.missingSpecHandling?.shouldCreateSpec).toBe(true);
      expect(result.contextSuggestions?.suggestedEndpoints).toContain('POST /auth/login');
    });

    test('should provide intelligent suggestions for incomplete implementations', async () => {
      const userInstruction = '完善用户管理系统';
      const code = `
        // 只实现了获取用户
        function getUsers() {
          return fetch('/api/users');
        }
      `;

      const result = await validationEngine.validateWithIntelligentContext(
        userInstruction,
        code
      );

      expect(result.contextSuggestions?.suggestedEndpoints).toContain('POST /api/users');
      expect(result.contextSuggestions?.suggestedEndpoints).toContain('PUT /api/users/{id}');
      expect(result.contextSuggestions?.suggestedEndpoints).toContain('DELETE /api/users/{id}');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });
});

describe('Integration Tests - Real World Scenarios', () => {
  let validationEngine: ValidationEngine;

  beforeEach(() => {
    const logger = new Logger('IntegrationTest');
    const configManager = new ConfigManager();
    validationEngine = new ValidationEngine(configManager, logger);
  });

  test('Scenario: User says "开发登录系统" and AI generates code', async () => {
    const userInstruction = '开发登录系统';
    const aiGeneratedCode = `
      // AI生成的登录系统代码
      class AuthService {
        async login(credentials) {
          const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
          });
          
          if (!response.ok) {
            throw new Error('Login failed');
          }
          
          const data = await response.json();
          localStorage.setItem('token', data.token);
          return data;
        }
        
        async logout() {
          localStorage.removeItem('token');
          return fetch('/auth/logout', { method: 'POST' });
        }
        
        async register(userData) {
          return fetch('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          });
        }
      }
    `;

    const result = await validationEngine.validateWithIntelligentContext(
      userInstruction,
      aiGeneratedCode
    );

    // 验证系统能够理解意图并提供有用的反馈
    expect(result.missingSpecHandling?.shouldCreateSpec).toBe(true);
    expect(result.missingSpecHandling?.suggestedStructure.paths).toHaveProperty('/auth/login');
    expect(result.missingSpecHandling?.suggestedStructure.paths).toHaveProperty('/auth/logout');
    expect(result.missingSpecHandling?.suggestedStructure.paths).toHaveProperty('/auth/register');
    
    // 验证建议的端点包含所有必要的认证操作
    expect(result.contextSuggestions?.suggestedEndpoints).toContain('POST /auth/login');
    expect(result.contextSuggestions?.suggestedEndpoints).toContain('POST /auth/logout');
    expect(result.contextSuggestions?.suggestedEndpoints).toContain('POST /auth/register');
    
    // 验证提供了有意义的建议
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0].message).toContain('Create OpenAPI spec for authentication');
  });

  test('Scenario: User says "创建商品管理" and AI generates incomplete CRUD', async () => {
    const userInstruction = '创建商品管理';
    const incompleteCode = `
      // AI生成的不完整商品管理代码
      function getProducts() {
        return fetch('/api/products').then(r => r.json());
      }
      
      function createProduct(product) {
        return fetch('/api/products', {
          method: 'POST',
          body: JSON.stringify(product)
        });
      }
      // 缺少更新和删除功能
    `;

    const result = await validationEngine.validateWithIntelligentContext(
      userInstruction,
      incompleteCode
    );

    // 验证系统识别出缺失的CRUD操作
    expect(result.contextSuggestions?.suggestedEndpoints).toContain('PUT /api/products/{id}');
    expect(result.contextSuggestions?.suggestedEndpoints).toContain('DELETE /api/products/{id}');
    expect(result.contextSuggestions?.suggestedEndpoints).toContain('GET /api/products/{id}');
    
    // 验证提供了完整的CRUD建议
    expect(result.suggestions[0].message).toContain('Create OpenAPI spec for product_management');
  });
});
