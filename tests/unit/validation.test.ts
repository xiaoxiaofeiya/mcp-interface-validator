/**
 * Unit tests for ValidationEngine
 */

import { ValidationEngine } from '../../src/core/validation/index';
import { ConfigManager } from '../../src/utils/config/index';
import { Logger } from '../../src/utils/logger/index';
import { resolve } from 'path';

describe('ValidationEngine', () => {
  let validationEngine: ValidationEngine;
  let configManager: ConfigManager;
  let logger: Logger;

  beforeEach(() => {
    configManager = new ConfigManager();
    logger = new Logger('ValidationEngine');
    validationEngine = new ValidationEngine(configManager, logger);
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(validationEngine.initialize()).resolves.not.toThrow();
      
      const status = validationEngine.getStatus();
      expect(status.initialized).toBe(true);
    });
  });

  describe('interface validation', () => {
    beforeEach(async () => {
      await validationEngine.initialize();
    });

    it('should validate valid API code', async () => {
      const validCode = `
        app.get('/api/users', (req, res) => {
          res.json({ users: [] });
        });
        
        app.post('/api/users', (req, res) => {
          res.status(201).json({ id: '123', name: 'Test User' });
        });
      `;

      const specPath = resolve('./config/schemas/sample-api.yaml');
      
      const result = await validationEngine.validateInterface({
        code: validCode,
        specPath,
        type: 'backend'
      });

      expect(result).toBeDefined();
      expect(result.metadata.validationType).toBe('backend');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should detect invalid API paths', async () => {
      const invalidCode = `
        app.get('/api/invalid-endpoint', (req, res) => {
          res.json({ data: 'test' });
        });
      `;

      const specPath = resolve('./config/schemas/sample-api.yaml');
      
      const result = await validationEngine.validateInterface({
        code: invalidCode,
        specPath,
        type: 'backend'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const pathError = result.errors.find(error => error.code === 'PATH_NOT_IN_SPEC');
      expect(pathError).toBeDefined();
      expect(pathError?.message).toContain('/api/invalid-endpoint');
    });

    it('should detect invalid HTTP methods', async () => {
      const invalidCode = `
        app.patch('/api/users', (req, res) => {
          res.json({ message: 'Invalid method' });
        });
      `;

      const specPath = resolve('./config/schemas/sample-api.yaml');
      
      const result = await validationEngine.validateInterface({
        code: invalidCode,
        specPath,
        type: 'backend'
      });

      // Note: PATCH is actually a valid HTTP method, so this test might need adjustment
      // Let's test with a truly invalid method
      const reallyInvalidCode = `
        app.invalid('/api/users', (req, res) => {
          res.json({ message: 'Invalid method' });
        });
      `;

      const result2 = await validationEngine.validateInterface({
        code: reallyInvalidCode,
        specPath,
        type: 'backend'
      });

      expect(result2.errors.some(error => error.code === 'INVALID_HTTP_METHOD')).toBe(true);
    });

    it('should provide suggestions for similar paths', async () => {
      const typoCode = `
        app.get('/api/user', (req, res) => {
          res.json({ users: [] });
        });
      `;

      const specPath = resolve('./config/schemas/sample-api.yaml');

      const result = await validationEngine.validateInterface({
        code: typoCode,
        specPath,
        type: 'backend'
      });



      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0].message).toContain('/users');
    });

    it('should handle TypeScript interface definitions', async () => {
      const tsCode = `
        interface User {
          id: string;
          name: string;
          email: string;
        }
        
        interface CreateUserRequest {
          name: string;
          email: string;
        }
      `;

      const specPath = resolve('./config/schemas/sample-api.yaml');
      
      const result = await validationEngine.validateInterface({
        code: tsCode,
        specPath,
        type: 'frontend'
      });

      expect(result).toBeDefined();
      expect(result.metadata.validationType).toBe('frontend');
    });
  });

  describe('file monitoring', () => {
    beforeEach(async () => {
      await validationEngine.initialize();
    });

    it('should start and stop monitoring', async () => {
      const paths = ['./src/**/*.ts'];
      const specPath = resolve('./config/schemas/sample-api.yaml');

      await expect(validationEngine.startMonitoring({
        paths,
        specPath
      })).resolves.not.toThrow();

      const status = validationEngine.getStatus();
      expect(status.monitoring).toBe(true);

      await expect(validationEngine.stopMonitoring()).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle invalid OpenAPI specification', async () => {
      await validationEngine.initialize();

      const code = `app.get('/api/test', (req, res) => res.json({}));`;
      const invalidSpecPath = './non-existent-spec.yaml';

      await expect(validationEngine.validateInterface({
        code,
        specPath: invalidSpecPath,
        type: 'backend'
      })).rejects.toThrow();
    });

    it('should handle validation before initialization', async () => {
      const code = `app.get('/api/test', (req, res) => res.json({}));`;
      const specPath = resolve('./config/schemas/sample-api.yaml');

      await expect(validationEngine.validateInterface({
        code,
        specPath,
        type: 'backend'
      })).rejects.toThrow('Validation Engine not initialized');
    });
  });
});
