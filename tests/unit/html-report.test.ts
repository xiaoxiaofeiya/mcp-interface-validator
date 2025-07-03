import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs/promises';
import * as path from 'path';
import { HtmlReportGenerator } from '../../src/core/html-report';
import { TemplateManager } from '../../src/core/html-report/template-manager';
import { ChartManager } from '../../src/core/html-report/chart-manager';
import type {
  HtmlReportConfig,
  ReportData,
  ValidationSummary,
  PerformanceMetrics,
  ExportOptions
} from '../../src/core/html-report/types';
import { createMockLogger } from '../helpers/mock-logger';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('HtmlReportGenerator', () => {
  let generator: HtmlReportGenerator;
  let config: HtmlReportConfig;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let tempDir: string;

  beforeEach(async () => {
    mockLogger = createMockLogger();
    tempDir = path.join(__dirname, 'temp-reports');
    
    config = {
      outputDirectory: tempDir,
      templateDirectory: path.join(tempDir, 'templates'),
      defaultTheme: 'default',
      chartConfig: {
        colors: ['#FF6384', '#36A2EB', '#FFCE56'],
        globalOptions: {},
        responsive: true
      },
      exportConfig: {
        formats: ['html', 'pdf', 'json'],
        pdfOptions: {
          format: 'A4',
          orientation: 'portrait',
          margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
          printBackground: true,
          displayHeaderFooter: false
        }
      },
      performance: {
        maxReportSize: 50,
        enableCaching: true,
        cacheTtl: 3600
      }
    };

    generator = new HtmlReportGenerator(config, mockLogger);

    // Mock fs operations
    mockFs.access.mockImplementation((path: any) => {
      // Simulate template directory not existing to trigger default template loading
      if (path.includes('templates')) {
        return Promise.reject(new Error('Directory not found'));
      }
      return Promise.resolve(undefined);
    });
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue([]);
    mockFs.readFile.mockResolvedValue('');
    mockFs.writeFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await generator.initialize();

      // Should log successful initialization
      expect(mockLogger.info).toHaveBeenCalledWith('HTML Report Generator initialized successfully');
      // Should log default templates loading
      expect(mockLogger.info).toHaveBeenCalledWith('Loaded default templates');
    });

    it('should create output directory if it does not exist', async () => {
      mockFs.access.mockRejectedValueOnce(new Error('Directory not found'));
      
      await generator.initialize();
      
      expect(mockFs.mkdir).toHaveBeenCalledWith(tempDir, { recursive: true });
    });

    it('should emit initialized event', async () => {
      const initSpy = jest.fn();
      generator.on('initialized', initSpy);
      
      await generator.initialize();
      
      expect(initSpy).toHaveBeenCalled();
    });
  });

  describe('report generation', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('should generate basic HTML report', async () => {
      const reportData: ReportData = {
        metadata: {
          title: 'Test Report',
          description: 'Test report description',
          generatedAt: new Date('2024-01-01T00:00:00Z'),
          version: '1.0.0',
          author: 'Test Author'
        },
        sections: [
          {
            id: 'test-section',
            title: 'Test Section',
            content: '<p>Test content</p>',
            charts: []
          }
        ]
      };

      const result = await generator.generateReport(reportData);
      
      expect(result).toContain('Test Report');
      expect(result).toContain('Test report description');
      expect(result).toContain('Test Section');
      expect(result).toContain('<p>Test content</p>');
    });

    it('should generate validation summary report', async () => {
      const validationResults: ValidationSummary[] = [
        {
          specId: 'spec1',
          specName: 'API Spec 1',
          status: 'passed',
          totalValidations: 10,
          passedValidations: 10,
          failedValidations: 0,
          warnings: 0,
          timestamp: new Date(),
          duration: 100,
          errors: [],
          coverage: {
            endpointCoverage: 100,
            schemaCoverage: 95,
            parameterCoverage: 90,
            responseCoverage: 85,
            overallCoverage: 92.5
          }
        },
        {
          specId: 'spec2',
          specName: 'API Spec 2',
          status: 'failed',
          totalValidations: 8,
          passedValidations: 6,
          failedValidations: 2,
          warnings: 1,
          timestamp: new Date(),
          duration: 150,
          errors: [
            {
              code: 'E001',
              message: 'Invalid schema',
              severity: 'error',
              location: { path: '/paths/users', line: 10 },
              rule: 'schema-validation'
            }
          ],
          coverage: {
            endpointCoverage: 80,
            schemaCoverage: 75,
            parameterCoverage: 70,
            responseCoverage: 65,
            overallCoverage: 72.5
          }
        }
      ];

      const result = await generator.generateValidationSummary(validationResults);
      
      expect(result).toContain('API Validation Summary');
      expect(result).toContain('API Spec 1');
      expect(result).toContain('API Spec 2');
      expect(result).toContain('passed');
      expect(result).toContain('failed');
    });

    it('should generate performance report', async () => {
      const performanceMetrics: PerformanceMetrics[] = [
        {
          id: 'metric1',
          name: 'Response Time',
          value: 150,
          unit: 'ms',
          timestamp: new Date(),
          category: 'response_time'
        },
        {
          id: 'metric2',
          name: 'Throughput',
          value: 1000,
          unit: 'req/s',
          timestamp: new Date(),
          category: 'throughput'
        }
      ];

      const result = await generator.generatePerformanceReport(performanceMetrics);
      
      expect(result).toContain('Performance Metrics Report');
      expect(result).toContain('Response Time');
      expect(result).toContain('Throughput');
    });

    it('should include charts when enabled', async () => {
      const reportData: ReportData = {
        metadata: {
          title: 'Chart Test Report',
          description: 'Report with charts',
          generatedAt: new Date(),
          version: '1.0.0',
          author: 'Test'
        },
        charts: [
          {
            id: 'test-chart',
            type: 'pie',
            title: 'Test Chart',
            containerId: 'test-chart',
            data: {
              labels: ['A', 'B', 'C'],
              datasets: [{
                label: 'Test Data',
                data: [10, 20, 30],
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: true, position: 'bottom' }
              }
            }
          }
        ],
        sections: []
      };

      const result = await generator.generateReport(reportData, { includeCharts: true });
      
      expect(result).toContain('chart.js');
      expect(result).toContain('test-chart');
      expect(result).toContain('new Chart');
    });

    it('should save report to file when output path is provided', async () => {
      const reportData: ReportData = {
        metadata: {
          title: 'Save Test',
          description: 'Test saving',
          generatedAt: new Date(),
          version: '1.0.0',
          author: 'Test'
        },
        sections: []
      };

      const outputPath = 'test-report.html';
      await generator.generateReport(reportData, { outputPath });
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.resolve(tempDir, outputPath),
        expect.any(String),
        'utf-8'
      );
    });

    it('should emit reportGenerated event', async () => {
      const reportSpy = jest.fn();
      generator.on('reportGenerated', reportSpy);
      
      const reportData: ReportData = {
        metadata: {
          title: 'Event Test',
          description: 'Test events',
          generatedAt: new Date(),
          version: '1.0.0',
          author: 'Test'
        },
        sections: []
      };

      await generator.generateReport(reportData);
      
      expect(reportSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: reportData,
          content: expect.any(String)
        })
      );
    });
  });

  describe('export functionality', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('should export as HTML', async () => {
      const htmlContent = '<html><body>Test</body></html>';
      const outputPath = 'test.html';
      
      await generator.exportReport(htmlContent, 'html', outputPath);
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(outputPath, htmlContent, 'utf-8');
    });

    it('should export as JSON', async () => {
      const htmlContent = '<html><body>Test</body></html>';
      const outputPath = 'test.json';
      
      await generator.exportReport(htmlContent, 'json', outputPath);
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.stringContaining('"exportType": "html-report"'),
        'utf-8'
      );
    });

    it('should export as PDF (placeholder)', async () => {
      const htmlContent = '<html><body>Test</body></html>';
      const outputPath = 'test.pdf';
      
      await generator.exportReport(htmlContent, 'pdf', outputPath);
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        outputPath,
        expect.stringContaining('PDF Export Placeholder'),
        'utf-8'
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('PDF export is a placeholder')
      );
    });

    it('should emit reportExported event', async () => {
      const exportSpy = jest.fn();
      generator.on('reportExported', exportSpy);
      
      const htmlContent = '<html><body>Test</body></html>';
      await generator.exportReport(htmlContent, 'html', 'test.html');
      
      expect(exportSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'html',
          outputPath: 'test.html'
        })
      );
    });

    it('should throw error for unsupported format', async () => {
      const htmlContent = '<html><body>Test</body></html>';
      
      await expect(
        generator.exportReport(htmlContent, 'xml' as any, 'test.xml')
      ).rejects.toThrow('Unsupported export format: xml');
    });
  });

  describe('template management', () => {
    beforeEach(async () => {
      await generator.initialize();
    });

    it('should get available templates', () => {
      const templates = generator.getAvailableTemplates();
      expect(Array.isArray(templates)).toBe(true);
    });

    it('should add custom template', async () => {
      const templateContent = '<div>{{title}}</div>';
      
      await generator.addCustomTemplate('custom', templateContent);
      
      const templates = generator.getAvailableTemplates();
      expect(templates).toContain('custom');
    });

    it('should get report statistics', () => {
      const stats = generator.getReportStatistics();
      
      expect(stats).toHaveProperty('templatesLoaded');
      expect(stats).toHaveProperty('reportsGenerated');
      expect(typeof stats.templatesLoaded).toBe('number');
    });
  });

  describe('error handling', () => {
    it('should throw error when not initialized', async () => {
      const uninitializedGenerator = new HtmlReportGenerator(config, mockLogger);
      
      const reportData: ReportData = {
        metadata: {
          title: 'Test',
          description: 'Test',
          generatedAt: new Date(),
          version: '1.0.0',
          author: 'Test'
        },
        sections: []
      };

      await expect(
        uninitializedGenerator.generateReport(reportData)
      ).rejects.toThrow('HTML Report Generator not initialized');
    });

    it('should handle template compilation errors', async () => {
      await generator.initialize();

      // Mock Handlebars.compile to throw an error
      const originalCompile = require('handlebars').compile;
      require('handlebars').compile = jest.fn().mockImplementation(() => {
        throw new Error('Template compilation failed');
      });

      const invalidTemplate = '<div>{{test}}</div>';

      await expect(
        generator.addCustomTemplate('invalid', invalidTemplate)
      ).rejects.toThrow('Template compilation failed');

      // Restore original compile function
      require('handlebars').compile = originalCompile;
    });

    it('should handle file system errors gracefully', async () => {
      // Create a new generator to test initialization failure
      const failingGenerator = new HtmlReportGenerator(config, mockLogger);

      // Mock access to succeed for output directory but mkdir to fail
      mockFs.access.mockImplementation((path: any) => {
        if (path.includes('temp-reports') && !path.includes('templates')) {
          return Promise.reject(new Error('Directory not found'));
        }
        if (path.includes('templates')) {
          return Promise.reject(new Error('Directory not found'));
        }
        return Promise.resolve(undefined);
      });

      // Mock mkdir to fail for the output directory
      mockFs.mkdir.mockRejectedValueOnce(new Error('Permission denied'));

      await expect(failingGenerator.initialize()).rejects.toThrow('Permission denied');
    });
  });
});
