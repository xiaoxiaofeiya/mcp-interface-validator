/**
 * Tests for Multi-Language Code Parser Module
 */

import { CodeParser } from './index';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

describe('CodeParser', () => {
  let parser: CodeParser;
  const testDir = join(__dirname, 'test-files');

  beforeEach(() => {
    parser = new CodeParser();
  });

  describe('Language Detection', () => {
    it('should detect TypeScript files', async () => {
      const testFile = join(testDir, 'test.ts');
      const content = `
        interface User {
          id: number;
          name: string;
        }
        
        class UserService {
          async getUser(id: number): Promise<User> {
            return { id, name: 'Test' };
          }
        }
      `;
      
      writeFileSync(testFile, content);
      
      try {
        const result = await parser.parseFile(testFile);
        expect(result.language).toBe('typescript');
        expect(result.interfaces).toHaveLength(1);
        expect(result.classes).toHaveLength(1);
        expect(result.interfaces[0].name).toBe('User');
        expect(result.classes[0].name).toBe('UserService');
      } finally {
        unlinkSync(testFile);
      }
    });

    it('should detect JavaScript files', async () => {
      const testFile = join(testDir, 'test.js');
      const content = `
        class Calculator {
          add(a, b) {
            return a + b;
          }
          
          multiply(a, b) {
            return a * b;
          }
        }
        
        function createCalculator() {
          return new Calculator();
        }
        
        module.exports = { Calculator, createCalculator };
      `;
      
      writeFileSync(testFile, content);
      
      try {
        const result = await parser.parseFile(testFile);
        expect(result.language).toBe('javascript');
        expect(result.classes).toHaveLength(1);
        expect(result.functions).toHaveLength(1);
        expect(result.classes[0].name).toBe('Calculator');
        expect(result.classes[0].methods).toHaveLength(2);
        expect(result.functions[0].name).toBe('createCalculator');
      } finally {
        unlinkSync(testFile);
      }
    });

    it('should detect Python files', async () => {
      const testFile = join(testDir, 'test.py');
      const content = `
class Calculator:
    def __init__(self):
        self.history = []
    
    def add(self, a, b):
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result
    
    def get_history(self):
        return self.history

def create_calculator():
    return Calculator()
      `;
      
      writeFileSync(testFile, content);
      
      try {
        const result = await parser.parseFile(testFile);
        expect(result.language).toBe('python');
        expect(result.metadata.totalLines).toBeGreaterThan(0);
      } finally {
        unlinkSync(testFile);
      }
    });

    it('should detect Java files', async () => {
      const testFile = join(testDir, 'test.java');
      const content = `
public class Calculator {
    private List<String> history;
    
    public Calculator() {
        this.history = new ArrayList<>();
    }
    
    public int add(int a, int b) {
        int result = a + b;
        history.add(a + " + " + b + " = " + result);
        return result;
    }
    
    public List<String> getHistory() {
        return new ArrayList<>(history);
    }
}
      `;
      
      writeFileSync(testFile, content);
      
      try {
        const result = await parser.parseFile(testFile);
        expect(result.language).toBe('java');
        expect(result.metadata.totalLines).toBeGreaterThan(0);
      } finally {
        unlinkSync(testFile);
      }
    });
  });

  describe('TypeScript/JavaScript Parsing', () => {
    it('should parse simple class', async () => {
      const content = `
        class TestClass {
          getValue() {
            return 42;
          }
        }
      `;

      const result = await parser.parseCode(content, 'javascript');

      console.log('Parse result classes:', result.classes.length);
      console.log('Full result:', JSON.stringify(result, null, 2));
      expect(result.classes).toHaveLength(1);
      expect(result.classes[0].name).toBe('TestClass');
    });

    it('should parse class with methods and properties', async () => {
      const content = `
        /**
         * User management service
         */
        @Injectable()
        export class UserService {
          private readonly apiUrl: string = '/api/users';

          constructor(private http: HttpClient) {}

          /**
           * Get user by ID
           */
          async getUser(id: number): Promise<User> {
            return this.http.get<User>(\`\${this.apiUrl}/\${id}\`);
          }

          async createUser(userData: CreateUserDto): Promise<User> {
            return this.http.post<User>(this.apiUrl, userData);
          }
        }
      `;

      const result = await parser.parseCode(content, 'typescript', {
        includeComments: true,
        includeLocations: true
      });

      expect(result.classes).toHaveLength(1);

      const userService = result.classes[0];
      expect(userService.name).toBe('UserService');
      expect(userService.decorators).toContain('Injectable');
      expect(userService.methods).toHaveLength(2);
      expect(userService.properties).toHaveLength(1);

      const getUserMethod = userService.methods.find(m => m.name === 'getUser');
      expect(getUserMethod).toBeDefined();
      expect(getUserMethod!.isAsync).toBe(true);
      expect(getUserMethod!.parameters).toHaveLength(1);
      expect(getUserMethod!.parameters[0].name).toBe('id');
      expect(getUserMethod!.parameters[0].type).toBe('number');
      expect(getUserMethod!.returnType).toBe('Promise');
    });

    it('should parse interfaces', async () => {
      const content = `
        interface User {
          readonly id: number;
          name: string;
          email?: string;
          getDisplayName(): string;
          updateProfile(data: Partial<User>): Promise<void>;
        }
        
        interface AdminUser extends User {
          permissions: string[];
          isActive: boolean;
        }
      `;
      
      const result = await parser.parseCode(content, 'typescript');
      
      expect(result.interfaces).toHaveLength(2);
      
      const userInterface = result.interfaces.find(i => i.name === 'User');
      expect(userInterface).toBeDefined();
      expect(userInterface!.properties).toHaveLength(3);
      expect(userInterface!.methods).toHaveLength(2);
      
      const adminInterface = result.interfaces.find(i => i.name === 'AdminUser');
      expect(adminInterface).toBeDefined();
      expect(adminInterface!.extends).toContain('User');
    });

    it('should parse imports and exports', async () => {
      const content = `
        import { Component, OnInit } from '@angular/core';
        import { UserService } from './user.service';
        import * as utils from '../utils';
        import defaultExport from './default';
        
        export class MyComponent implements OnInit {
          constructor(private userService: UserService) {}
          
          ngOnInit() {
            // Implementation
          }
        }
        
        export const CONSTANTS = {
          API_URL: '/api'
        };
        
        export default MyComponent;
      `;
      
      const result = await parser.parseCode(content, 'typescript');
      
      expect(result.imports).toHaveLength(4);
      expect(result.exports).toHaveLength(2);
      
      const angularImport = result.imports.find(i => i.source === '@angular/core');
      expect(angularImport).toBeDefined();
      expect(angularImport!.imports).toContain('Component');
      expect(angularImport!.imports).toContain('OnInit');
      
      const namespaceImport = result.imports.find(i => i.isNamespace);
      expect(namespaceImport).toBeDefined();
      expect(namespaceImport!.source).toBe('../utils');
    });
  });

  describe('API Endpoint Extraction', () => {
    it('should extract Express.js API endpoints', async () => {
      const content = `
        const express = require('express');
        const app = express();
        
        app.get('/api/users', async (req, res) => {
          const users = await userService.getAllUsers();
          res.json(users);
        });
        
        app.post('/api/users', async (req, res) => {
          const user = await userService.createUser(req.body);
          res.status(201).json(user);
        });
        
        app.put('/api/users/:id', async (req, res) => {
          const user = await userService.updateUser(req.params.id, req.body);
          res.json(user);
        });
        
        app.delete('/api/users/:id', async (req, res) => {
          await userService.deleteUser(req.params.id);
          res.status(204).send();
        });
      `;
      
      const result = await parser.parseCode(content, 'javascript', {
        extractApiEndpoints: true
      });
      
      expect(result.apiEndpoints).toHaveLength(4);
      
      const getEndpoint = result.apiEndpoints.find(e => e.method === 'GET');
      expect(getEndpoint).toBeDefined();
      expect(getEndpoint!.path).toBe('/api/users');
      
      const postEndpoint = result.apiEndpoints.find(e => e.method === 'POST');
      expect(postEndpoint).toBeDefined();
      expect(postEndpoint!.path).toBe('/api/users');
      
      const putEndpoint = result.apiEndpoints.find(e => e.method === 'PUT');
      expect(putEndpoint).toBeDefined();
      expect(putEndpoint!.path).toBe('/api/users/:id');
      
      const deleteEndpoint = result.apiEndpoints.find(e => e.method === 'DELETE');
      expect(deleteEndpoint).toBeDefined();
      expect(deleteEndpoint!.path).toBe('/api/users/:id');
    });
  });

  describe('Code Metadata', () => {
    it('should calculate code metadata correctly', async () => {
      const content = `
        // This is a comment
        /* Multi-line
           comment */
        
        class TestClass {
          // Property comment
          private value: number = 0;
          
          /**
           * Method comment
           */
          public getValue(): number {
            return this.value;
          }
        }
        
        // Another comment
      `;
      
      const result = await parser.parseCode(content, 'typescript');
      
      expect(result.metadata.totalLines).toBeGreaterThan(0);
      expect(result.metadata.codeLines).toBeGreaterThan(0);
      expect(result.metadata.commentLines).toBeGreaterThan(0);
      expect(result.metadata.complexity).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid syntax gracefully', async () => {
      const content = `
        class InvalidClass {
          method() {
            // Missing closing brace
      `;
      
      await expect(parser.parseCode(content, 'typescript')).rejects.toThrow();
    });

    it('should handle unsupported file extensions', async () => {
      const testFile = join(testDir, 'test.unsupported');
      writeFileSync(testFile, 'content');
      
      try {
        await expect(parser.parseFile(testFile)).rejects.toThrow('Unsupported file extension');
      } finally {
        unlinkSync(testFile);
      }
    });
  });
});
