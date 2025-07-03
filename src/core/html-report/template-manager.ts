import * as fs from 'fs/promises';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import type { Logger } from '../../utils/logger';
import type { ReportTemplate } from './types';

/**
 * Template Manager for HTML Report Generator
 * 
 * Manages Handlebars templates for report generation including:
 * - Template loading and compilation
 * - Template caching
 * - Custom helper registration
 * - Template validation
 * - Dynamic template creation
 */
export class TemplateManager {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private templateSources: Map<string, string> = new Map();
  private logger: Logger;
  private templateDirectory: string;
  private cacheEnabled: boolean;

  constructor(templateDirectory: string, logger: Logger, cacheEnabled = true) {
    this.templateDirectory = templateDirectory;
    this.logger = logger;
    this.cacheEnabled = cacheEnabled;
  }

  /**
   * Initialize the template manager
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Template Manager...');

      // Ensure template directory exists
      await this.ensureTemplateDirectory();

      // Load all templates
      await this.loadAllTemplates();

      // Register built-in helpers
      this.registerBuiltInHelpers();

      this.logger.info(`Template Manager initialized with ${this.templates.size} templates`);
    } catch (error) {
      this.logger.error('Failed to initialize Template Manager:', error);
      throw error;
    }
  }

  /**
   * Get a compiled template by name
   */
  getTemplate(name: string): HandlebarsTemplateDelegate | undefined {
    return this.templates.get(name);
  }

  /**
   * Add a new template
   */
  async addTemplate(template: ReportTemplate): Promise<void> {
    try {
      // Validate template
      this.validateTemplate(template);

      // Compile template
      const compiled = Handlebars.compile(template.content);

      // Store template
      this.templates.set(template.name, compiled);
      this.templateSources.set(template.name, template.content);

      // Save to file if it's a persistent template
      if (template.type !== 'partial') {
        await this.saveTemplateToFile(template);
      }

      this.logger.info(`Template '${template.name}' added successfully`);
    } catch (error) {
      this.logger.error(`Failed to add template '${template.name}':`, error);
      throw error;
    }
  }

  /**
   * Remove a template
   */
  removeTemplate(name: string): boolean {
    const removed = this.templates.delete(name);
    this.templateSources.delete(name);
    
    if (removed) {
      this.logger.info(`Template '${name}' removed`);
    }
    
    return removed;
  }

  /**
   * Get all template names
   */
  getTemplateNames(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Get template source code
   */
  getTemplateSource(name: string): string | undefined {
    return this.templateSources.get(name);
  }

  /**
   * Render a template with context
   */
  render(templateName: string, context: any): string {
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

  /**
   * Register a custom helper
   */
  registerHelper(name: string, helper: Handlebars.HelperDelegate): void {
    Handlebars.registerHelper(name, helper);
    this.logger.debug(`Custom helper '${name}' registered`);
  }

  /**
   * Register multiple helpers
   */
  registerHelpers(helpers: Record<string, Handlebars.HelperDelegate>): void {
    Object.entries(helpers).forEach(([name, helper]) => {
      this.registerHelper(name, helper);
    });
  }

  /**
   * Reload all templates from disk
   */
  async reloadTemplates(): Promise<void> {
    this.templates.clear();
    this.templateSources.clear();
    await this.loadAllTemplates();
    this.logger.info('All templates reloaded');
  }

  /**
   * Get template statistics
   */
  getStatistics(): {
    totalTemplates: number;
    templatesByType: Record<string, number>;
    cacheEnabled: boolean;
    memoryUsage: number;
  } {

    
    // This would require storing template metadata
    // For now, we'll provide basic stats
    return {
      totalTemplates: this.templates.size,
      templatesByType: {
        main: 1,
        section: this.templates.size - 1,
        partial: 0,
        chart: 0
      },
      cacheEnabled: this.cacheEnabled,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // Private helper methods
  private async ensureTemplateDirectory(): Promise<void> {
    try {
      await fs.access(this.templateDirectory);
    } catch {
      await fs.mkdir(this.templateDirectory, { recursive: true });
      this.logger.info(`Created template directory: ${this.templateDirectory}`);
      
      // Create default templates
      await this.createDefaultTemplates();
    }
  }

  private async loadAllTemplates(): Promise<void> {
    try {
      const files = await fs.readdir(this.templateDirectory);
      
      for (const file of files) {
        if (file.endsWith('.hbs') || file.endsWith('.handlebars')) {
          await this.loadTemplateFile(file);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to load templates from ${this.templateDirectory}:`, error);
    }
  }

  private async loadTemplateFile(filename: string): Promise<void> {
    try {
      const templatePath = path.join(this.templateDirectory, filename);
      const content = await fs.readFile(templatePath, 'utf-8');
      const name = path.basename(filename, path.extname(filename));
      
      const compiled = Handlebars.compile(content);
      this.templates.set(name, compiled);
      this.templateSources.set(name, content);
      
      this.logger.debug(`Loaded template: ${name}`);
    } catch (error) {
      this.logger.error(`Failed to load template file ${filename}:`, error);
    }
  }

  private validateTemplate(template: ReportTemplate): void {
    if (!template.name || !template.content) {
      throw new Error('Template must have name and content');
    }

    if (!template.type) {
      throw new Error('Template must have a type');
    }

    // Try to compile to check for syntax errors
    try {
      Handlebars.compile(template.content);
    } catch (error) {
      throw new Error(`Template compilation failed: ${error}`);
    }
  }

  private async saveTemplateToFile(template: ReportTemplate): Promise<void> {
    const filename = `${template.name}.hbs`;
    const filepath = path.join(this.templateDirectory, filename);
    
    await fs.writeFile(filepath, template.content, 'utf-8');
    this.logger.debug(`Template saved to file: ${filepath}`);
  }

  private registerBuiltInHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: Date, format?: string) => {
      if (!date) return '';
      
      switch (format) {
        case 'short':
          return date.toLocaleDateString();
        case 'time':
          return date.toLocaleTimeString();
        case 'iso':
          return date.toISOString();
        default:
          return date.toLocaleString();
      }
    });

    // Number formatting helper
    Handlebars.registerHelper('formatNumber', (num: number, decimals = 2) => {
      if (typeof num !== 'number') return num;
      return num.toFixed(decimals);
    });

    // Percentage helper
    Handlebars.registerHelper('percentage', (value: number, total: number, decimals = 1) => {
      if (total === 0) return '0%';
      return ((value / total) * 100).toFixed(decimals) + '%';
    });

    // Status badge helper
    Handlebars.registerHelper('statusBadge', (status: string) => {
      const colors = {
        passed: '#28a745',
        failed: '#dc3545',
        warning: '#ffc107',
        skipped: '#6c757d',
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8'
      };
      
      const color = colors[status as keyof typeof colors] || '#6c757d';
      const textColor = ['#ffc107'].includes(color) ? '#000' : '#fff';
      
      return new Handlebars.SafeString(
        `<span class="badge" style="background-color: ${color}; color: ${textColor}; padding: 4px 8px; border-radius: 4px; font-size: 0.875em;">${status}</span>`
      );
    });

    // Conditional helpers
    Handlebars.registerHelper('ifEquals', function(this: any, arg1: any, arg2: any, options: any) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('ifGreater', function(this: any, arg1: number, arg2: number, options: any) {
      return (arg1 > arg2) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('ifLess', function(this: any, arg1: number, arg2: number, options: any) {
      return (arg1 < arg2) ? options.fn(this) : options.inverse(this);
    });

    // JSON helper
    Handlebars.registerHelper('json', (obj: any, pretty = false) => {
      return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
    });

    // Math helpers
    Handlebars.registerHelper('add', (a: number, b: number) => a + b);
    Handlebars.registerHelper('subtract', (a: number, b: number) => a - b);
    Handlebars.registerHelper('multiply', (a: number, b: number) => a * b);
    Handlebars.registerHelper('divide', (a: number, b: number) => b !== 0 ? a / b : 0);

    // Array helpers
    Handlebars.registerHelper('length', (array: any[]) => array ? array.length : 0);
    Handlebars.registerHelper('first', (array: any[]) => array && array.length > 0 ? array[0] : null);
    Handlebars.registerHelper('last', (array: any[]) => array && array.length > 0 ? array[array.length - 1] : null);

    this.logger.debug('Built-in Handlebars helpers registered');
  }

  private async createDefaultTemplates(): Promise<void> {
    // Main report template
    const mainTemplate: ReportTemplate = {
      name: 'main',
      type: 'main',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{metadata.title}}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; padding: 20px; background-color: #f8f9fa; line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; padding: 40px 20px; border-bottom: 1px solid #e9ecef; }
        .header h1 { margin: 0 0 10px 0; color: #343a40; font-size: 2.5rem; }
        .header p { margin: 0 0 10px 0; color: #6c757d; font-size: 1.1rem; }
        .header small { color: #868e96; }
        .section { padding: 30px; border-bottom: 1px solid #e9ecef; }
        .section:last-child { border-bottom: none; }
        .section h2 { margin: 0 0 20px 0; color: #495057; font-size: 1.8rem; }
        .chart-container { position: relative; height: 400px; margin: 20px 0; }
        .overview-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e9ecef; }
        .stat-card h3 { margin: 0 0 10px 0; font-size: 0.9rem; color: #6c757d; text-transform: uppercase; }
        .stat-value { font-size: 2rem; font-weight: bold; color: #495057; }
        .text-success { color: #28a745 !important; }
        .text-danger { color: #dc3545 !important; }
        .text-warning { color: #ffc107 !important; }
        .table-responsive { overflow-x: auto; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e9ecef; }
        .table th { background-color: #f8f9fa; font-weight: 600; color: #495057; }
        .table-striped tbody tr:nth-child(odd) { background-color: #f8f9fa; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.875em; font-weight: 500; }
        .performance-overview { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
        .metric-card h4 { margin: 0 0 10px 0; font-size: 0.9rem; opacity: 0.9; }
        .metric-value { font-size: 1.8rem; font-weight: bold; }
        @media (max-width: 768px) {
            .container { margin: 10px; border-radius: 0; }
            .header { padding: 20px; }
            .section { padding: 20px; }
            .overview-stats { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{metadata.title}}</h1>
            <p>{{metadata.description}}</p>
            <small>Generated on {{formatDate metadata.generatedAt}} by {{metadata.author}}</small>
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
        // Chart initialization
        {{#if charts}}
        document.addEventListener('DOMContentLoaded', function() {
            {{#each charts}}
            try {
                const ctx{{id}} = document.getElementById('{{containerId}}');
                if (ctx{{id}}) {
                    new Chart(ctx{{id}}, {
                        type: '{{type}}',
                        data: {{{json data}}},
                        options: {{{json options}}}
                    });
                }
            } catch (error) {
                console.error('Failed to create chart {{id}}:', error);
            }
            {{/each}}
        });
        {{/if}}
    </script>
</body>
</html>`,
      variables: ['metadata', 'sections', 'charts'],
      description: 'Main report template with responsive design and Chart.js integration'
    };

    await this.addTemplate(mainTemplate);

    // Section template
    const sectionTemplate: ReportTemplate = {
      name: 'section',
      type: 'section',
      content: `<div class="report-section">
    <h3>{{title}}</h3>
    <div class="section-content">
        {{{content}}}
    </div>
    {{#if charts}}
    <div class="section-charts">
        {{#each charts}}
        <div class="chart-wrapper">
            <canvas id="{{this}}"></canvas>
        </div>
        {{/each}}
    </div>
    {{/if}}
</div>`,
      variables: ['title', 'content', 'charts'],
      description: 'Reusable section template'
    };

    await this.addTemplate(sectionTemplate);

    this.logger.info('Default templates created');
  }

  private estimateMemoryUsage(): number {
    let totalSize = 0;

    // Estimate template source size
    for (const source of this.templateSources.values()) {
      totalSize += source.length * 2; // Rough estimate for UTF-16 encoding
    }

    // Add overhead for compiled templates (rough estimate)
    totalSize += this.templates.size * 1024; // 1KB overhead per template

    return totalSize;
  }
}
