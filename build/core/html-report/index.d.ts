import { EventEmitter } from 'events';
import type { Logger } from '../../utils/logger/index.js';
import type { HtmlReportConfig, ReportData, ExportOptions, ValidationSummary, PerformanceMetrics } from './types.js';
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
export declare class HtmlReportGenerator extends EventEmitter {
    private config;
    private logger;
    private templates;
    private initialized;
    constructor(config: HtmlReportConfig, logger: Logger);
    /**
     * Initialize the report generator
     */
    initialize(): Promise<void>;
    /**
     * Generate a complete HTML report
     */
    generateReport(data: ReportData, options?: Partial<ExportOptions>): Promise<string>;
    /**
     * Generate validation summary report
     */
    generateValidationSummary(validationResults: ValidationSummary[], options?: Partial<ExportOptions>): Promise<string>;
    /**
     * Generate performance metrics report
     */
    generatePerformanceReport(metrics: PerformanceMetrics[], options?: Partial<ExportOptions>): Promise<string>;
    /**
     * Export report in different formats
     */
    exportReport(htmlContent: string, format: 'html' | 'pdf' | 'json', outputPath: string): Promise<void>;
    /**
     * Get available templates
     */
    getAvailableTemplates(): string[];
    /**
     * Add custom template
     */
    addCustomTemplate(name: string, templateContent: string): Promise<void>;
    /**
     * Get report statistics
     */
    getReportStatistics(): {
        templatesLoaded: number;
        reportsGenerated: number;
        lastGenerated?: Date;
    };
    private ensureInitialized;
    private ensureOutputDirectory;
    private loadTemplates;
    private loadDefaultTemplates;
    private registerHelpers;
    private prepareTemplateContext;
    private renderTemplate;
    private saveReport;
    private generateValidationCharts;
    private generatePerformanceCharts;
    private generateOverviewContent;
    private generateDetailsContent;
    private generatePerformanceOverview;
    private generateTrendsContent;
    private exportAsHtml;
    private exportAsPdf;
    private exportAsJson;
}
//# sourceMappingURL=index.d.ts.map