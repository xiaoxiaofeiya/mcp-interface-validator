/**
 * Intelligent Context Analyzer
 * 
 * Handles ambiguous user instructions and provides intelligent suggestions
 * for API interface generation and validation.
 */

import { Logger } from '../../utils/logger/index.js';
import type { UserIntent } from './types.js';

// Re-export UserIntent from types.ts to maintain consistency
export type { UserIntent } from './types.js';

export interface ContextSuggestion {
  suggestedEndpoints: string[];
  suggestedSchemas: any;
  suggestedSecurity: string[];
  reasoning: string;
  confidence: number;
}

export interface MissingSpecHandling {
  shouldCreateSpec: boolean;
  suggestedStructure: any;
  reasoning: string;
}

export class IntelligentContextAnalyzer {
  private logger: Logger;
  private commonPatterns: Map<string, UserIntent> = new Map();

  constructor() {
    this.logger = new Logger('IntelligentContextAnalyzer');
    this.initializeCommonPatterns();
  }

  /**
   * Analyze user instruction to understand intent
   */
  async analyzeUserInstruction(instruction: string): Promise<UserIntent> {
    this.logger.info('Analyzing user instruction', { instruction });

    const normalizedInstruction = instruction.toLowerCase();
    
    // Check for common patterns
    for (const [pattern, intent] of this.commonPatterns) {
      if (normalizedInstruction.includes(pattern)) {
        this.logger.info('Matched common pattern', { pattern, intent });
        return { ...intent, confidence: 0.8 };
      }
    }

    // Advanced NLP analysis (simplified for now)
    const intent = await this.performAdvancedAnalysis(normalizedInstruction);
    
    this.logger.info('Analysis complete', { intent });
    return intent;
  }

  /**
   * Handle missing OpenAPI specification
   */
  async handleMissingSpec(
    userIntent: UserIntent,
    projectContext: any
  ): Promise<MissingSpecHandling> {
    this.logger.info('Handling missing OpenAPI specification', { userIntent });

    if (userIntent.confidence < 0.6) {
      return {
        shouldCreateSpec: false,
        suggestedStructure: null,
        reasoning: 'User intent unclear, cannot suggest API structure'
      };
    }

    const suggestedStructure = this.generateSpecStructure(userIntent, projectContext);

    return {
      shouldCreateSpec: true,
      suggestedStructure,
      reasoning: `Based on "${userIntent.domain}" domain, suggesting ${userIntent.operations?.length || 0} operations for ${userIntent.entities?.join(', ') || 'unknown'} entities`
    };
  }

  /**
   * Generate context suggestions for AI
   */
  async generateContextSuggestions(
    userIntent: UserIntent,
    existingSpec?: any
  ): Promise<ContextSuggestion> {
    this.logger.info('Generating context suggestions', { userIntent });

    const suggestions: ContextSuggestion = {
      suggestedEndpoints: [],
      suggestedSchemas: {},
      suggestedSecurity: [],
      reasoning: '',
      confidence: userIntent.confidence
    };

    // Generate endpoints based on intent
    if (userIntent.type === 'api_creation') {
      suggestions.suggestedEndpoints = this.generateEndpoints(userIntent);
      suggestions.suggestedSchemas = this.generateSchemas(userIntent);
      suggestions.suggestedSecurity = this.generateSecurity(userIntent);
    }

    // Check against existing spec
    if (existingSpec) {
      suggestions.suggestedEndpoints = this.filterExistingEndpoints(
        suggestions.suggestedEndpoints,
        existingSpec
      );
    }

    suggestions.reasoning = this.generateReasoning(userIntent, suggestions);

    return suggestions;
  }

  /**
   * Initialize common instruction patterns
   */
  private initializeCommonPatterns(): void {
    this.commonPatterns = new Map([
      // Authentication patterns
      ['登录系统', {
        type: 'api_creation',
        target: 'authentication_system',
        domain: 'authentication',
        operations: ['login', 'logout', 'register', 'refresh'],
        entities: ['user', 'token'],
        confidence: 0.9,
        timestamp: new Date()
      }],
      ['用户认证', {
        type: 'api_creation',
        target: 'user_authentication',
        domain: 'authentication',
        operations: ['authenticate', 'authorize'],
        entities: ['user', 'session'],
        confidence: 0.9,
        timestamp: new Date()
      }],
      
      // User management patterns
      ['用户管理', {
        type: 'api_creation',
        target: 'user_management',
        domain: 'user_management',
        operations: ['create', 'read', 'update', 'delete'],
        entities: ['user'],
        confidence: 0.9,
        timestamp: new Date()
      }],
      ['用户系统', {
        type: 'api_creation',
        target: 'user_system',
        domain: 'user_management',
        operations: ['create', 'read', 'update', 'delete', 'list'],
        entities: ['user', 'profile'],
        confidence: 0.8,
        timestamp: new Date()
      }],

      // Product management patterns
      ['商品管理', {
        type: 'api_creation',
        target: 'product_management',
        domain: 'product_management',
        operations: ['create', 'read', 'update', 'delete', 'list', 'search'],
        entities: ['product', 'category'],
        confidence: 0.9,
        timestamp: new Date()
      }],
      ['产品系统', {
        type: 'api_creation',
        target: 'product_system',
        domain: 'product_management',
        operations: ['create', 'read', 'update', 'delete'],
        entities: ['product'],
        confidence: 0.8,
        timestamp: new Date()
      }],

      // Order management patterns
      ['订单系统', {
        type: 'api_creation',
        target: 'order_system',
        domain: 'order_management',
        operations: ['create', 'read', 'update', 'cancel', 'list'],
        entities: ['order', 'order_item'],
        confidence: 0.9,
        timestamp: new Date()
      }],

      // Generic CRUD patterns
      ['增删改查', {
        type: 'api_creation',
        target: 'generic_crud',
        domain: 'generic_crud',
        operations: ['create', 'read', 'update', 'delete'],
        entities: ['resource'],
        confidence: 0.7,
        timestamp: new Date()
      }],
      ['crud', {
        type: 'api_creation',
        target: 'crud_system',
        domain: 'generic_crud',
        operations: ['create', 'read', 'update', 'delete'],
        entities: ['resource'],
        confidence: 0.7,
        timestamp: new Date()
      }]
    ]);
  }

  /**
   * Perform advanced NLP analysis (simplified implementation)
   */
  private async performAdvancedAnalysis(instruction: string): Promise<UserIntent> {
    // Extract entities (simplified)
    const entities = this.extractEntities(instruction);
    
    // Extract operations (simplified)
    const operations = this.extractOperations(instruction);
    
    // Determine domain
    const domain = this.determineDomain(instruction, entities);
    
    // Determine type
    const type = this.determineType(instruction);

    return {
      type,
      target: domain.replace(/[^a-zA-Z0-9]/g, '_'),
      domain,
      operations,
      entities,
      confidence: 0.6, // Default confidence for advanced analysis
      timestamp: new Date()
    };
  }

  /**
   * Extract entities from instruction
   */
  private extractEntities(instruction: string): string[] {
    const entityPatterns = [
      /用户|user/gi,
      /产品|商品|product/gi,
      /订单|order/gi,
      /文章|article/gi,
      /评论|comment/gi,
      /分类|category/gi
    ];

    const entities: string[] = [];
    entityPatterns.forEach(pattern => {
      const matches = instruction.match(pattern);
      if (matches) {
        entities.push(matches[0].toLowerCase());
      }
    });

    return [...new Set(entities)]; // Remove duplicates
  }

  /**
   * Extract operations from instruction
   */
  private extractOperations(instruction: string): string[] {
    const operationPatterns = [
      { pattern: /创建|新增|添加|create|add/gi, operation: 'create' },
      { pattern: /查询|获取|读取|read|get|list/gi, operation: 'read' },
      { pattern: /更新|修改|编辑|update|edit/gi, operation: 'update' },
      { pattern: /删除|移除|delete|remove/gi, operation: 'delete' },
      { pattern: /登录|login/gi, operation: 'login' },
      { pattern: /注册|register/gi, operation: 'register' },
      { pattern: /搜索|search/gi, operation: 'search' }
    ];

    const operations: string[] = [];
    operationPatterns.forEach(({ pattern, operation }) => {
      if (pattern.test(instruction)) {
        operations.push(operation);
      }
    });

    return operations.length > 0 ? operations : ['create', 'read', 'update', 'delete'];
  }

  /**
   * Determine domain from instruction and entities
   */
  private determineDomain(instruction: string, entities: string[]): string {
    if (instruction.includes('登录') || instruction.includes('认证') || instruction.includes('auth')) {
      return 'authentication';
    }
    
    if (entities.includes('user') || entities.includes('用户')) {
      return 'user_management';
    }
    
    if (entities.includes('product') || entities.includes('商品') || entities.includes('产品')) {
      return 'product_management';
    }
    
    if (entities.includes('order') || entities.includes('订单')) {
      return 'order_management';
    }

    return 'generic_api';
  }

  /**
   * Determine API operation type
   */
  private determineType(instruction: string): UserIntent['type'] {
    if (instruction.includes('创建') || instruction.includes('开发') || instruction.includes('新建')) {
      return 'api_creation';
    }
    
    if (instruction.includes('修改') || instruction.includes('更新')) {
      return 'api_modification';
    }
    
    if (instruction.includes('验证') || instruction.includes('检查')) {
      return 'api_validation';
    }

    return 'api_creation'; // Default to creation
  }

  /**
   * Generate API endpoints based on intent
   */
  private generateEndpoints(intent: UserIntent): string[] {
    const endpoints: string[] = [];
    const basePath = this.getBasePath(intent.domain || 'api');

    (intent.operations || []).forEach(operation => {
      switch (operation) {
        case 'create':
          endpoints.push(`POST ${basePath}`);
          break;
        case 'read':
          endpoints.push(`GET ${basePath}`);
          endpoints.push(`GET ${basePath}/{id}`);
          break;
        case 'update':
          endpoints.push(`PUT ${basePath}/{id}`);
          break;
        case 'delete':
          endpoints.push(`DELETE ${basePath}/{id}`);
          break;
        case 'list':
          endpoints.push(`GET ${basePath}`);
          break;
        case 'search':
          endpoints.push(`GET ${basePath}/search`);
          break;
        case 'login':
          endpoints.push(`POST /auth/login`);
          break;
        case 'register':
          endpoints.push(`POST /auth/register`);
          break;
        case 'logout':
          endpoints.push(`POST /auth/logout`);
          break;
        case 'authenticate':
          endpoints.push(`POST /auth/login`);
          break;
        case 'authorize':
          endpoints.push(`POST /auth/verify`);
          break;
      }
    });

    return [...new Set(endpoints)]; // Remove duplicates
  }

  /**
   * Generate schemas based on intent
   */
  private generateSchemas(intent: UserIntent): any {
    const schemas: any = {};

    (intent.entities || []).forEach(entity => {
      schemas[this.capitalize(entity)] = this.getEntitySchema(entity);
    });

    return schemas;
  }

  /**
   * Generate security requirements
   */
  private generateSecurity(intent: UserIntent): string[] {
    if (intent.domain === 'authentication') {
      return ['none']; // Auth endpoints typically don't require auth
    }
    
    return ['bearerAuth']; // Most APIs require authentication
  }

  /**
   * Get base path for domain
   */
  private getBasePath(domain: string): string {
    const pathMap: { [key: string]: string } = {
      'user_management': '/api/users',
      'product_management': '/api/products',
      'order_management': '/api/orders',
      'authentication': '/auth',
      'generic_api': '/api/resources'
    };

    return pathMap[domain] || '/api/resources';
  }

  /**
   * Get entity schema template
   */
  private getEntitySchema(entity: string): any {
    const schemaMap: { [key: string]: any } = {
      'user': {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      'product': {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          price: { type: 'number' },
          description: { type: 'string' },
          categoryId: { type: 'integer' }
        }
      },
      'order': {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          userId: { type: 'integer' },
          total: { type: 'number' },
          status: { type: 'string', enum: ['pending', 'completed', 'cancelled'] },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    };

    return schemaMap[entity] || {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' }
      }
    };
  }

  /**
   * Filter out existing endpoints
   */
  private filterExistingEndpoints(suggested: string[], existingSpec: any): string[] {
    if (!existingSpec.paths) return suggested;

    const existingPaths = Object.keys(existingSpec.paths);
    return suggested.filter(endpoint => {
      const [method, path] = endpoint.split(' ');
      if (!method || !path) return true;
      return !existingPaths.some(existingPath =>
        existingSpec.paths[existingPath]?.[method.toLowerCase()]
      );
    });
  }

  /**
   * Generate reasoning for suggestions
   */
  private generateReasoning(intent: UserIntent, suggestions: ContextSuggestion): string {
    return `Based on "${intent.domain}" domain analysis, suggested ${suggestions.suggestedEndpoints.length} endpoints for ${(intent.operations || []).join(', ')} operations on ${(intent.entities || []).join(', ')} entities. Confidence: ${Math.round(intent.confidence * 100)}%`;
  }

  /**
   * Generate OpenAPI spec structure
   */
  private generateSpecStructure(intent: UserIntent, _projectContext: any): any {
    return {
      openapi: '3.0.0',
      info: {
        title: `${this.capitalize(intent.domain || 'API')} API`,
        version: '1.0.0',
        description: `Auto-generated API specification for ${intent.domain || 'API'}`
      },
      paths: this.generatePathsStructure(intent),
      components: {
        schemas: this.generateSchemas(intent),
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer'
          }
        }
      }
    };
  }

  /**
   * Generate paths structure for OpenAPI spec
   */
  private generatePathsStructure(intent: UserIntent): any {
    const paths: any = {};
    const endpoints = this.generateEndpoints(intent);

    endpoints.forEach(endpoint => {
      const [method, path] = endpoint.split(' ');
      if (!method || !path) return;

      if (!paths[path]) {
        paths[path] = {};
      }

      paths[path][method.toLowerCase()] = {
        summary: `${method} ${path}`,
        responses: {
          '200': {
            description: 'Success'
          }
        }
      };
    });

    return paths;
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
