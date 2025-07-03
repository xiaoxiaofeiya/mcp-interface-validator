import type { Logger } from '../../utils/logger/index.js';
import type {
  ChartConfig,
  ChartData,
  ChartDataset,
  ChartOptions,
  ValidationSummary,
  PerformanceMetrics
} from './types.js';

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
export class ChartManager {
  private _logger: Logger; // Used for logging chart operations

  // Getter to avoid unused variable warning
  get logger() { return this._logger; }
  private defaultColors: string[];
  private chartCounter = 0;

  constructor(logger: Logger) {
    this._logger = logger;
    this.defaultColors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
      '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
      '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
    ];
  }

  /**
   * Generate validation status pie chart
   */
  generateValidationStatusChart(validationResults: ValidationSummary[]): ChartConfig {
    const statusCounts = this.aggregateValidationStatus(validationResults);
    
    return {
      id: `validation-status-${++this.chartCounter}`,
      type: 'pie',
      title: 'Validation Status Distribution',
      containerId: `validation-status-${this.chartCounter}`,
      data: {
        labels: Object.keys(statusCounts),
        datasets: [{
          label: 'Validation Status',
          data: Object.values(statusCounts),
          backgroundColor: this.getStatusColors(Object.keys(statusCounts)),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: this.getDefaultPieOptions('Validation Status Distribution')
    };
  }

  /**
   * Generate error distribution bar chart
   */
  generateErrorDistributionChart(validationResults: ValidationSummary[]): ChartConfig {
    const errorData = validationResults.map(result => ({
      name: this.truncateLabel(result.specName, 20),
      errors: result.failedValidations,
      warnings: result.warnings
    }));

    return {
      id: `error-distribution-${++this.chartCounter}`,
      type: 'bar',
      title: 'Error Distribution by Specification',
      containerId: `error-distribution-${this.chartCounter}`,
      data: {
        labels: errorData.map(item => item.name),
        datasets: [
          {
            label: 'Errors',
            data: errorData.map(item => item.errors),
            backgroundColor: '#dc3545',
            borderColor: '#c82333',
            borderWidth: 1
          },
          {
            label: 'Warnings',
            data: errorData.map(item => item.warnings),
            backgroundColor: '#ffc107',
            borderColor: '#e0a800',
            borderWidth: 1
          }
        ]
      },
      options: this.getDefaultBarOptions('Error Distribution by Specification', 'Number of Issues')
    };
  }

  /**
   * Generate coverage metrics radar chart
   */
  generateCoverageChart(validationResults: ValidationSummary[]): ChartConfig {
    const avgCoverage = this.calculateAverageCoverage(validationResults);
    
    return {
      id: `coverage-radar-${++this.chartCounter}`,
      type: 'radar',
      title: 'Average Coverage Metrics',
      containerId: `coverage-radar-${this.chartCounter}`,
      data: {
        labels: ['Endpoints', 'Schemas', 'Parameters', 'Responses', 'Overall'],
        datasets: [{
          label: 'Coverage %',
          data: [
            avgCoverage.endpointCoverage,
            avgCoverage.schemaCoverage,
            avgCoverage.parameterCoverage,
            avgCoverage.responseCoverage,
            avgCoverage.overallCoverage
          ],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          // pointHoverBackgroundColor: '#fff', // Not supported in this chart type
          // pointHoverBorderColor: 'rgba(54, 162, 235, 1)' // Not supported in this Chart.js version
        }]
      },
      options: this.getDefaultRadarOptions('Average Coverage Metrics')
    };
  }

  /**
   * Generate performance timeline chart
   */
  generatePerformanceTimelineChart(metrics: PerformanceMetrics[]): ChartConfig {
    const timelineData = this.prepareTimelineData(metrics);
    
    return {
      id: `performance-timeline-${++this.chartCounter}`,
      type: 'line',
      title: 'Performance Metrics Over Time',
      containerId: `performance-timeline-${this.chartCounter}`,
      data: {
        labels: timelineData.labels,
        datasets: timelineData.datasets
      },
      options: this.getDefaultLineOptions('Performance Metrics Over Time', 'Time', 'Value')
    };
  }

  /**
   * Generate response time distribution histogram
   */
  generateResponseTimeHistogram(metrics: PerformanceMetrics[]): ChartConfig {
    const responseTimeMetrics = metrics.filter(m => m.category === 'response_time');
    const histogram = this.createHistogram(responseTimeMetrics.map(m => m.value), 10);
    
    return {
      id: `response-time-histogram-${++this.chartCounter}`,
      type: 'bar',
      title: 'Response Time Distribution',
      containerId: `response-time-histogram-${this.chartCounter}`,
      data: {
        labels: histogram.labels,
        datasets: [{
          label: 'Frequency',
          data: histogram.data,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: this.getDefaultBarOptions('Response Time Distribution', 'Frequency')
    };
  }

  /**
   * Generate throughput comparison chart
   */
  generateThroughputChart(metrics: PerformanceMetrics[]): ChartConfig {
    const throughputMetrics = metrics.filter(m => m.category === 'throughput');
    const groupedData = this.groupMetricsByName(throughputMetrics);
    
    return {
      id: `throughput-comparison-${++this.chartCounter}`,
      type: 'bar',
      title: 'Throughput Comparison',
      containerId: `throughput-comparison-${this.chartCounter}`,
      data: {
        labels: Object.keys(groupedData),
        datasets: [{
          label: 'Requests/sec',
          data: Object.values(groupedData).map(values => 
            values.reduce((sum, val) => sum + val, 0) / values.length
          ),
          backgroundColor: this.defaultColors.slice(0, Object.keys(groupedData).length),
          borderWidth: 1
        }]
      },
      options: this.getDefaultBarOptions('Throughput Comparison', 'Requests per Second')
    };
  }

  /**
   * Generate custom chart with provided configuration
   */
  generateCustomChart(
    type: ChartConfig['type'],
    title: string,
    data: ChartData,
    customOptions?: Partial<ChartOptions>
  ): ChartConfig {
    const baseOptions = this.getBaseOptions(title);
    const mergedOptions = this.mergeOptions(baseOptions, customOptions);
    
    return {
      id: `custom-chart-${++this.chartCounter}`,
      type,
      title,
      containerId: `custom-chart-${this.chartCounter}`,
      data,
      options: mergedOptions
    };
  }

  // Private helper methods
  private aggregateValidationStatus(validationResults: ValidationSummary[]): Record<string, number> {
    return validationResults.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getStatusColors(statuses: string[]): string[] {
    const colorMap: Record<string, string> = {
      passed: '#28a745',
      failed: '#dc3545',
      warning: '#ffc107',
      skipped: '#6c757d',
      success: '#28a745',
      error: '#dc3545'
    };
    
    return statuses.map(status => colorMap[status] || '#6c757d');
  }

  private calculateAverageCoverage(validationResults: ValidationSummary[]): {
    endpointCoverage: number;
    schemaCoverage: number;
    parameterCoverage: number;
    responseCoverage: number;
    overallCoverage: number;
  } {
    if (validationResults.length === 0) {
      return {
        endpointCoverage: 0,
        schemaCoverage: 0,
        parameterCoverage: 0,
        responseCoverage: 0,
        overallCoverage: 0
      };
    }

    const totals = validationResults.reduce((acc, result) => {
      if (result.coverage) {
        acc.endpointCoverage += result.coverage.endpointCoverage;
        acc.schemaCoverage += result.coverage.schemaCoverage;
        acc.parameterCoverage += result.coverage.parameterCoverage;
        acc.responseCoverage += result.coverage.responseCoverage;
        acc.overallCoverage += result.coverage.overallCoverage;
      }
      return acc;
    }, {
      endpointCoverage: 0,
      schemaCoverage: 0,
      parameterCoverage: 0,
      responseCoverage: 0,
      overallCoverage: 0
    });

    const count = validationResults.length;
    return {
      endpointCoverage: totals.endpointCoverage / count,
      schemaCoverage: totals.schemaCoverage / count,
      parameterCoverage: totals.parameterCoverage / count,
      responseCoverage: totals.responseCoverage / count,
      overallCoverage: totals.overallCoverage / count
    };
  }

  private prepareTimelineData(metrics: PerformanceMetrics[]): {
    labels: string[];
    datasets: ChartDataset[];
  } {
    // Group metrics by category
    const categories = [...new Set(metrics.map(m => m.category))];
    const sortedMetrics = metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Create time labels
    const labels = [...new Set(sortedMetrics.map(m => 
      m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    ))];

    // Create datasets for each category
    const datasets: ChartDataset[] = categories.map((category, index) => {
      const categoryMetrics = sortedMetrics.filter(m => m.category === category);
      const data = labels.map(label => {
        const metric = categoryMetrics.find(m => 
          m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) === label
        );
        return metric ? metric.value : null;
      }).filter(val => val !== null) as number[];

      const color = this.defaultColors[index % this.defaultColors.length] || '#000000';
      return {
        label: category.replace('_', ' ').toUpperCase(),
        data,
        borderColor: color,
        backgroundColor: color + '20',
        fill: false,
        tension: 0.1
      };
    });

    return { labels, datasets };
  }

  private createHistogram(values: number[], bins: number): { labels: string[]; data: number[] } {
    if (values.length === 0) {
      return { labels: [], data: [] };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / bins;

    const histogram = new Array(bins).fill(0);
    const labels: string[] = [];

    // Create bin labels
    for (let i = 0; i < bins; i++) {
      const start = min + i * binSize;
      const end = min + (i + 1) * binSize;
      labels.push(`${start.toFixed(1)}-${end.toFixed(1)}`);
    }

    // Count values in each bin
    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
      histogram[binIndex]++;
    });

    return { labels, data: histogram };
  }

  private groupMetricsByName(metrics: PerformanceMetrics[]): Record<string, number[]> {
    return metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name]!.push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);
  }

  private truncateLabel(label: string, maxLength: number): string {
    return label.length > maxLength ? label.substring(0, maxLength) + '...' : label;
  }

  private getDefaultPieOptions(title: string): ChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          position: 'top' as const,
          font: { size: 16, family: 'Arial', weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'bottom',
          labels: { padding: 20, usePointStyle: true }
        },
        tooltip: {
          enabled: true,
          mode: 'point',
          intersect: true,
          callbacks: {
            label: function(context: any) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    };
  }

  private getDefaultBarOptions(title: string, yAxisLabel: string): ChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          position: 'top' as const,
          font: { size: 16, family: 'Arial', weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          type: 'category' as const,
          position: 'bottom' as const,
          display: true,
          title: {
            display: true,
            text: 'Specifications'
          }
        },
        y: {
          type: 'linear' as const,
          position: 'left' as const,
          display: true,
          title: {
            display: true,
            text: yAxisLabel
          }
        }
      }
    };
  }

  private getDefaultLineOptions(title: string, xAxisLabel: string, yAxisLabel: string): ChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          position: 'top' as const,
          font: { size: 16, family: 'Arial', weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          type: 'category' as const,
          position: 'bottom' as const,
          display: true,
          title: {
            display: true,
            text: xAxisLabel
          }
        },
        y: {
          type: 'linear' as const,
          position: 'left' as const,
          display: true,
          title: {
            display: true,
            text: yAxisLabel
          }
        }
      },
      interaction: {
        mode: 'nearest',
        intersect: false,
        includeInvisible: false
      }
    };
  }

  private getDefaultRadarOptions(title: string): ChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          position: 'top' as const,
          font: { size: 16, family: 'Arial', weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        r: {
          type: 'linear' as const,
          display: true,
          position: 'top' as const,
          ticks: {
            stepSize: 20,
            callback: function(value: any) {
              return value + '%';
            }
          }
        }
      }
    };
  }

  private getBaseOptions(title: string): ChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          position: 'top' as const,
          font: { size: 16, family: 'Arial', weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'top'
        }
      }
    };
  }

  private mergeOptions(base: ChartOptions, custom?: Partial<ChartOptions>): ChartOptions {
    if (!custom) return base;

    return {
      ...base,
      ...custom,
      plugins: {
        ...base.plugins,
        ...custom.plugins
      },
      scales: {
        ...base.scales,
        ...custom.scales
      }
    };
  }
}
