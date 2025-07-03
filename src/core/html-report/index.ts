import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import type { Logger } from '../../utils/logger/index.js';
import type {
  HtmlReportConfig,
  ReportData,
  ChartConfig,
  ExportOptions,
  ValidationSummary,
  PerformanceMetrics
} from './types.js';

/**
 * HTML Report Generator
 * 
 * Generates comprehensive HTML reports with:
 * - Template system using Handlebars
 * - Chart integration with Chart.js
 * - Multiple export options (HTML, PDF, JSON)
 * - Responsive design
 * - Interactive features
 */
export class HtmlReportGenerator extends EventEmitter {
  private config: HtmlReportConfig;
  private logger: Logger;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private initialized = false;

  constructor(config: HtmlReportConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
  }

  /**
   * Initialize the report generator
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing HTML Report Generator...');

      // Create output directory if it doesn't exist
      await this.ensureOutputDirectory();

      // Load and compile templates
      await this.loadTemplates();

      // Register Handlebars helpers
      this.registerHelpers();

      this.initialized = true;
      this.logger.info('HTML Report Generator initialized successfully');
      this.emit('initialized');
    } catch (error) {
      this.logger.error('Failed to initialize HTML Report Generator:', error);
      throw error;
    }
  }

  /**
   * Generate a complete HTML report
   */
  async generateReport(data: ReportData, options: Partial<ExportOptions> = {}): Promise<string> {
    this.ensureInitialized();

    try {
      this.logger.info(`Generating HTML report: ${data.metadata.title}`);

      const reportOptions: ExportOptions = {
        format: 'html',
        includeCharts: true,
        includeRawData: false,
        responsive: true,
        theme: 'default',
        ...options
      };

      // Prepare template context
      const context = this.prepareTemplateContext(data, reportOptions);

      // Generate HTML content
      const htmlContent = await this.renderTemplate('main', context);

      // Save report if output path is specified
      if (reportOptions.outputPath) {
        await this.saveReport(htmlContent, reportOptions.outputPath, reportOptions.format);
      }

      this.logger.info('HTML report generated successfully');
      this.emit('reportGenerated', { data, options: reportOptions, content: htmlContent });

      return htmlContent;
    } catch (error) {
      this.logger.error('Failed to generate HTML report:', error);
      throw error;
    }
  }

  /**
   * Generate validation summary report
   */
  async generateValidationSummary(
    validationResults: ValidationSummary[],
    options: Partial<ExportOptions> = {}
  ): Promise<string> {
    this.ensureInitialized();

    const reportData: ReportData = {
      metadata: {
        title: 'API Validation Summary',
        description: 'Summary of API specification validation results',
        generatedAt: new Date(),
        version: '1.0.0',
        author: 'MCP Interface Validator'
      },
      validationSummary: validationResults,
      charts: this.generateValidationCharts(validationResults),
      sections: [
        {
          id: 'overview',
          title: 'Validation Overview',
          content: this.generateOverviewContent(validationResults),
          charts: ['validation-status', 'error-distribution']
        },
        {
          id: 'details',
          title: 'Detailed Results',
          content: this.generateDetailsContent(validationResults),
          charts: []
        }
      ]
    };

    return this.generateReport(reportData, options);
  }

  /**
   * Generate performance metrics report
   */
  async generatePerformanceReport(
    metrics: PerformanceMetrics[],
    options: Partial<ExportOptions> = {}
  ): Promise<string> {
    this.ensureInitialized();

    const reportData: ReportData = {
      metadata: {
        title: 'Performance Metrics Report',
        description: 'Analysis of API validation performance metrics',
        generatedAt: new Date(),
        version: '1.0.0',
        author: 'MCP Interface Validator'
      },
      performanceMetrics: metrics,
      charts: this.generatePerformanceCharts(metrics),
      sections: [
        {
          id: 'performance-overview',
          title: 'Performance Overview',
          content: this.generatePerformanceOverview(metrics),
          charts: ['response-times', 'throughput']
        },
        {
          id: 'trends',
          title: 'Performance Trends',
          content: this.generateTrendsContent(metrics),
          charts: ['performance-trends']
        }
      ]
    };

    return this.generateReport(reportData, options);
  }

  /**
   * Export report in different formats
   */
  async exportReport(
    htmlContent: string,
    format: 'html' | 'pdf' | 'json',
    outputPath: string
  ): Promise<void> {
    this.ensureInitialized();

    try {
      switch (format) {
        case 'html':
          await this.exportAsHtml(htmlContent, outputPath);
          break;
        case 'pdf':
          await this.exportAsPdf(htmlContent, outputPath);
          break;
        case 'json':
          await this.exportAsJson(htmlContent, outputPath);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      this.logger.info(`Report exported as ${format} to: ${outputPath}`);
      this.emit('reportExported', { format, outputPath });
    } catch (error) {
      this.logger.error(`Failed to export report as ${format}:`, error);
      throw error;
    }
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Add custom template
   */
  async addCustomTemplate(name: string, templateContent: string): Promise<void> {
    try {
      const compiled = Handlebars.compile(templateContent);
      this.templates.set(name, compiled);
      this.logger.info(`Custom template '${name}' added successfully`);
    } catch (error) {
      this.logger.error(`Failed to add custom template '${name}':`, error);
      throw error;
    }
  }

  /**
   * Get report statistics
   */
  getReportStatistics(): {
    templatesLoaded: number;
    reportsGenerated: number;
    lastGenerated?: Date;
  } {
    return {
      templatesLoaded: this.templates.size,
      reportsGenerated: this.listenerCount('reportGenerated'),
      lastGenerated: new Date() // This would be tracked in a real implementation
    };
  }

  // Private helper methods
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('HTML Report Generator not initialized. Call initialize() first.');
    }
  }

  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.access(this.config.outputDirectory);
    } catch {
      await fs.mkdir(this.config.outputDirectory, { recursive: true });
      this.logger.info(`Created output directory: ${this.config.outputDirectory}`);
    }
  }

  private async loadTemplates(): Promise<void> {
    const templateDir = this.config.templateDirectory || path.join(__dirname, 'templates');

    try {
      // Try to access template directory
      await fs.access(templateDir);
      const templateFiles = await fs.readdir(templateDir);

      let templatesLoaded = 0;
      for (const file of templateFiles) {
        if (file.endsWith('.hbs') || file.endsWith('.handlebars')) {
          const templateName = path.basename(file, path.extname(file));
          const templatePath = path.join(templateDir, file);
          const templateContent = await fs.readFile(templatePath, 'utf-8');

          const compiled = Handlebars.compile(templateContent);
          this.templates.set(templateName, compiled);
          templatesLoaded++;

          this.logger.debug(`Loaded template: ${templateName}`);
        }
      }

      // If no templates were loaded from files, load defaults
      if (templatesLoaded === 0) {
        await this.loadDefaultTemplates();
      } else {
        this.logger.info(`Loaded ${templatesLoaded} templates from files`);
      }
    } catch (error) {
      this.logger.warn(`Failed to load templates from ${templateDir}:`, error);
      // Load default templates
      await this.loadDefaultTemplates();
    }
  }

  private async loadDefaultTemplates(): Promise<void> {
    // Default main template
    const mainTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{metadata.title}}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 40px; }
        .chart-container { position: relative; height: 400px; margin: 20px 0; }
        .responsive { width: 100%; }
        @media (max-width: 768px) { .container { padding: 10px; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{metadata.title}}</h1>
            <p>{{metadata.description}}</p>
            <small>Generated on {{formatDate metadata.generatedAt}}</small>
        </div>
        
        {{#each sections}}
        <div class="section">
            <h2>{{title}}</h2>
            <div>{{{content}}}</div>
            {{#each charts}}
            <div class="chart-container">
                <canvas id="{{this}}"></canvas>
            </div>
            {{/each}}
        </div>
        {{/each}}
    </div>
    
    <script>
        // Chart initialization will be injected here
        {{#if charts}}
        {{{renderCharts charts}}}
        {{/if}}
    </script>
</body>
</html>`;

    this.templates.set('main', Handlebars.compile(mainTemplate));
    this.logger.info('Loaded default templates');
  }

  private registerHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: Date) => {
      return date.toLocaleString();
    });

    // Number formatting helper
    Handlebars.registerHelper('formatNumber', (num: number, decimals = 2) => {
      return num.toFixed(decimals);
    });

    // Percentage helper
    Handlebars.registerHelper('percentage', (value: number, total: number) => {
      return ((value / total) * 100).toFixed(1) + '%';
    });

    // Status badge helper
    Handlebars.registerHelper('statusBadge', (status: string) => {
      const colors = {
        passed: 'green',
        failed: 'red',
        warning: 'orange',
        skipped: 'gray'
      };
      const color = colors[status as keyof typeof colors] || 'gray';
      return new Handlebars.SafeString(
        `<span class="badge badge-${status}" style="background-color: ${color}; color: white; padding: 2px 8px; border-radius: 4px;">${status}</span>`
      );
    });

    // Chart rendering helper
    Handlebars.registerHelper('renderCharts', (charts: ChartConfig[]) => {
      if (!charts || charts.length === 0) return '';

      const chartScripts = charts.map(chart => `
        const ctx${chart.id} = document.getElementById('${chart.containerId}').getContext('2d');
        new Chart(ctx${chart.id}, ${JSON.stringify({
          type: chart.type,
          data: chart.data,
          options: chart.options
        })});
      `).join('\n');

      return new Handlebars.SafeString(chartScripts);
    });

    // JSON stringify helper
    Handlebars.registerHelper('json', (obj: any) => {
      return JSON.stringify(obj, null, 2);
    });

    // Conditional helper
    Handlebars.registerHelper('ifEquals', function(this: any, arg1: any, arg2: any, options: any) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    this.logger.debug('Handlebars helpers registered');
  }

  private prepareTemplateContext(data: ReportData, options: ExportOptions): any {
    return {
      ...data,
      options,
      timestamp: new Date(),
      theme: options.theme,
      responsive: options.responsive,
      includeCharts: options.includeCharts,
      includeRawData: options.includeRawData
    };
  }

  private async renderTemplate(templateName: string, context: any): Promise<string> {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    try {
      return template(context);
    } catch (error) {
      this.logger.error(`Failed to render template '${templateName}':`, error);
      throw error;
    }
  }

  private async saveReport(content: string, outputPath: string, _format: string): Promise<void> {
    const fullPath = path.resolve(this.config.outputDirectory, outputPath);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, content, 'utf-8');

    this.logger.info(`Report saved to: ${fullPath}`);
  }

  private generateValidationCharts(validationResults: ValidationSummary[]): ChartConfig[] {
    const charts: ChartConfig[] = [];

    // Validation status chart
    const statusCounts = validationResults.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    charts.push({
      id: 'validation-status',
      type: 'pie',
      title: 'Validation Status Distribution',
      containerId: 'validation-status',
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{
          label: 'Validation Status',
          data: Object.values(statusCounts),
          backgroundColor: ['#28a745', '#dc3545', '#ffc107', '#6c757d']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom' },
          title: { display: true, text: 'Validation Status Distribution', position: 'top' as const }
        }
      }
    });

    // Error distribution chart
    const errorCounts = validationResults.map(result => ({
      name: result.specName,
      errors: result.failedValidations
    }));

    charts.push({
      id: 'error-distribution',
      type: 'bar',
      title: 'Error Distribution by Specification',
      containerId: 'error-distribution',
      data: {
        labels: errorCounts.map(item => item.name),
        datasets: [{
          label: 'Number of Errors',
          data: errorCounts.map(item => item.errors),
          backgroundColor: '#dc3545'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false, position: 'top' as const },
          title: { display: true, text: 'Error Distribution by Specification', position: 'top' as const }
        },
        scales: {
          y: {
            type: 'linear' as const,
            display: true,
            position: 'left' as const,
            title: { display: true, text: 'Number of Errors' }
          }
        }
      }
    });

    return charts;
  }

  private generatePerformanceCharts(metrics: PerformanceMetrics[]): ChartConfig[] {
    const charts: ChartConfig[] = [];

    // Response times chart
    const responseTimes = metrics.filter(m => m.category === 'response_time');
    if (responseTimes.length > 0) {
      charts.push({
        id: 'response-times',
        type: 'line',
        title: 'Response Times Over Time',
        containerId: 'response-times',
        data: {
          labels: responseTimes.map(m => m.timestamp.toLocaleTimeString()),
          datasets: [{
            label: 'Response Time (ms)',
            data: responseTimes.map(m => m.value),
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: 'Response Times Over Time', position: 'top' as const }
          },
          scales: {
            y: {
              type: 'linear' as const,
              display: true,
              position: 'left' as const,
              title: { display: true, text: 'Response Time (ms)' }
            }
          }
        }
      });
    }

    // Throughput chart
    const throughputMetrics = metrics.filter(m => m.category === 'throughput');
    if (throughputMetrics.length > 0) {
      charts.push({
        id: 'throughput',
        type: 'bar',
        title: 'Throughput Metrics',
        containerId: 'throughput',
        data: {
          labels: throughputMetrics.map(m => m.name),
          datasets: [{
            label: 'Requests/sec',
            data: throughputMetrics.map(m => m.value),
            backgroundColor: '#28a745'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: 'Throughput Metrics', position: 'top' as const }
          },
          scales: {
            y: {
              type: 'linear' as const,
              display: true,
              position: 'left' as const,
              title: { display: true, text: 'Requests per Second' }
            }
          }
        }
      });
    }

    return charts;
  }

  private generateOverviewContent(validationResults: ValidationSummary[]): string {
    const totalSpecs = validationResults.length;
    const passedSpecs = validationResults.filter(r => r.status === 'passed').length;
    const failedSpecs = validationResults.filter(r => r.status === 'failed').length;
    const warningSpecs = validationResults.filter(r => r.status === 'warning').length;

    const totalValidations = validationResults.reduce((sum, r) => sum + r.totalValidations, 0);
    const totalErrors = validationResults.reduce((sum, r) => sum + r.failedValidations, 0);


    return `
      <div class="overview-stats">
        <div class="stat-card">
          <h3>Total Specifications</h3>
          <div class="stat-value">${totalSpecs}</div>
        </div>
        <div class="stat-card">
          <h3>Passed</h3>
          <div class="stat-value text-success">${passedSpecs}</div>
        </div>
        <div class="stat-card">
          <h3>Failed</h3>
          <div class="stat-value text-danger">${failedSpecs}</div>
        </div>
        <div class="stat-card">
          <h3>Warnings</h3>
          <div class="stat-value text-warning">${warningSpecs}</div>
        </div>
        <div class="stat-card">
          <h3>Total Validations</h3>
          <div class="stat-value">${totalValidations}</div>
        </div>
        <div class="stat-card">
          <h3>Total Errors</h3>
          <div class="stat-value text-danger">${totalErrors}</div>
        </div>
      </div>
    `;
  }

  private generateDetailsContent(validationResults: ValidationSummary[]): string {
    const rows = validationResults.map(result => `
      <tr class="result-row ${result.status}">
        <td>${result.specName}</td>
        <td><span class="badge badge-${result.status}">${result.status}</span></td>
        <td>${result.totalValidations}</td>
        <td class="text-success">${result.passedValidations}</td>
        <td class="text-danger">${result.failedValidations}</td>
        <td class="text-warning">${result.warnings}</td>
        <td>${result.duration}ms</td>
        <td>${((result.passedValidations / result.totalValidations) * 100).toFixed(1)}%</td>
      </tr>
    `).join('');

    return `
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Specification</th>
              <th>Status</th>
              <th>Total</th>
              <th>Passed</th>
              <th>Failed</th>
              <th>Warnings</th>
              <th>Duration</th>
              <th>Success Rate</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  private generatePerformanceOverview(metrics: PerformanceMetrics[]): string {
    const responseTimeMetrics = metrics.filter(m => m.category === 'response_time');
    const avgResponseTime = responseTimeMetrics.length > 0
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
      : 0;

    const throughputMetrics = metrics.filter(m => m.category === 'throughput');
    const avgThroughput = throughputMetrics.length > 0
      ? throughputMetrics.reduce((sum, m) => sum + m.value, 0) / throughputMetrics.length
      : 0;

    const errorRateMetrics = metrics.filter(m => m.category === 'error_rate');
    const avgErrorRate = errorRateMetrics.length > 0
      ? errorRateMetrics.reduce((sum, m) => sum + m.value, 0) / errorRateMetrics.length
      : 0;

    return `
      <div class="performance-overview">
        <div class="metric-card">
          <h4>Average Response Time</h4>
          <div class="metric-value">${avgResponseTime.toFixed(2)} ms</div>
        </div>
        <div class="metric-card">
          <h4>Average Throughput</h4>
          <div class="metric-value">${avgThroughput.toFixed(2)} req/s</div>
        </div>
        <div class="metric-card">
          <h4>Average Error Rate</h4>
          <div class="metric-value">${(avgErrorRate * 100).toFixed(2)}%</div>
        </div>
      </div>
    `;
  }

  private generateTrendsContent(metrics: PerformanceMetrics[]): string {
    const recentMetrics = metrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    const rows = recentMetrics.map(metric => `
      <tr>
        <td>${metric.name}</td>
        <td>${metric.category}</td>
        <td>${metric.value} ${metric.unit}</td>
        <td>${metric.timestamp.toLocaleString()}</td>
      </tr>
    `).join('');

    return `
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Category</th>
              <th>Value</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  private async exportAsHtml(content: string, outputPath: string): Promise<void> {
    await fs.writeFile(outputPath, content, 'utf-8');
  }

  private async exportAsPdf(htmlContent: string, outputPath: string): Promise<void> {
    // This would require a PDF generation library like puppeteer
    // For now, we'll create a placeholder implementation
    const pdfContent = `PDF Export Placeholder
Generated from HTML content at: ${new Date().toISOString()}
Content length: ${htmlContent.length} characters
Output path: ${outputPath}

Note: Full PDF generation requires additional dependencies like puppeteer or similar.`;

    await fs.writeFile(outputPath, pdfContent, 'utf-8');
    this.logger.warn('PDF export is a placeholder implementation. Consider integrating puppeteer for full PDF generation.');
  }

  private async exportAsJson(htmlContent: string, outputPath: string): Promise<void> {
    const jsonData = {
      exportType: 'html-report',
      timestamp: new Date().toISOString(),
      htmlContent,
      metadata: {
        contentLength: htmlContent.length,
        exportedAt: new Date(),
        format: 'json'
      }
    };

    await fs.writeFile(outputPath, JSON.stringify(jsonData, null, 2), 'utf-8');
  }
}
