import type { Logger } from '../../utils/logger/index.js';
import type { ChartConfig, ChartData, ChartOptions, ValidationSummary, PerformanceMetrics } from './types.js';
/**
 * Chart Manager for HTML Report Generator
 *
 * Manages Chart.js chart generation and configuration including:
 * - Chart data preparation
 * - Chart configuration generation
 * - Chart type optimization
 * - Responsive chart settings
 * - Color scheme management
 */
export declare class ChartManager {
    private _logger;
    get logger(): Logger;
    private defaultColors;
    private chartCounter;
    constructor(logger: Logger);
    /**
     * Generate validation status pie chart
     */
    generateValidationStatusChart(validationResults: ValidationSummary[]): ChartConfig;
    /**
     * Generate error distribution bar chart
     */
    generateErrorDistributionChart(validationResults: ValidationSummary[]): ChartConfig;
    /**
     * Generate coverage metrics radar chart
     */
    generateCoverageChart(validationResults: ValidationSummary[]): ChartConfig;
    /**
     * Generate performance timeline chart
     */
    generatePerformanceTimelineChart(metrics: PerformanceMetrics[]): ChartConfig;
    /**
     * Generate response time distribution histogram
     */
    generateResponseTimeHistogram(metrics: PerformanceMetrics[]): ChartConfig;
    /**
     * Generate throughput comparison chart
     */
    generateThroughputChart(metrics: PerformanceMetrics[]): ChartConfig;
    /**
     * Generate custom chart with provided configuration
     */
    generateCustomChart(type: ChartConfig['type'], title: string, data: ChartData, customOptions?: Partial<ChartOptions>): ChartConfig;
    private aggregateValidationStatus;
    private getStatusColors;
    private calculateAverageCoverage;
    private prepareTimelineData;
    private createHistogram;
    private groupMetricsByName;
    private truncateLabel;
    private getDefaultPieOptions;
    private getDefaultBarOptions;
    private getDefaultLineOptions;
    private getDefaultRadarOptions;
    private getBaseOptions;
    private mergeOptions;
}
//# sourceMappingURL=chart-manager.d.ts.map