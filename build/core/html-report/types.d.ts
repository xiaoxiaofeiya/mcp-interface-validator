/**
 * HTML Report Generator Type Definitions
 *
 * Comprehensive type definitions for the HTML report generation system,
 * including templates, charts, export options, and data structures.
 */
export interface HtmlReportConfig {
    /** Output directory for generated reports */
    outputDirectory: string;
    /** Template directory path (optional, uses defaults if not specified) */
    templateDirectory?: string;
    /** Default theme for reports */
    defaultTheme: 'default' | 'dark' | 'light' | 'professional';
    /** Chart.js configuration */
    chartConfig: {
        /** Default chart colors */
        colors: string[];
        /** Chart.js global options */
        globalOptions: Record<string, any>;
        /** Enable responsive charts */
        responsive: boolean;
    };
    /** Export configuration */
    exportConfig: {
        /** Supported export formats */
        formats: Array<'html' | 'pdf' | 'json'>;
        /** PDF generation options */
        pdfOptions?: PdfOptions;
        /** Image export options */
        imageOptions?: ImageOptions;
    };
    /** Performance settings */
    performance: {
        /** Maximum report size in MB */
        maxReportSize: number;
        /** Enable caching */
        enableCaching: boolean;
        /** Cache TTL in seconds */
        cacheTtl: number;
    };
}
export interface ReportData {
    /** Report metadata */
    metadata: ReportMetadata;
    /** Validation summary data */
    validationSummary?: ValidationSummary[];
    /** Performance metrics */
    performanceMetrics?: PerformanceMetrics[];
    /** Error details */
    errorDetails?: ErrorDetails[];
    /** Chart configurations */
    charts?: ChartConfig[];
    /** Report sections */
    sections: ReportSection[];
    /** Raw data (optional) */
    rawData?: Record<string, any>;
}
export interface ReportMetadata {
    /** Report title */
    title: string;
    /** Report description */
    description: string;
    /** Generation timestamp */
    generatedAt: Date;
    /** Report version */
    version: string;
    /** Report author */
    author: string;
    /** Tags for categorization */
    tags?: string[];
    /** Custom metadata */
    custom?: Record<string, any>;
}
export interface ReportSection {
    /** Unique section identifier */
    id: string;
    /** Section title */
    title: string;
    /** Section content (HTML) */
    content: string;
    /** Associated charts */
    charts: string[];
    /** Section order */
    order?: number;
    /** Section visibility */
    visible?: boolean;
    /** Custom CSS classes */
    cssClasses?: string[];
}
export interface ValidationSummary {
    /** Specification identifier */
    specId: string;
    /** Specification name */
    specName: string;
    /** Validation status */
    status: 'passed' | 'failed' | 'warning' | 'skipped';
    /** Total number of validations */
    totalValidations: number;
    /** Number of passed validations */
    passedValidations: number;
    /** Number of failed validations */
    failedValidations: number;
    /** Number of warnings */
    warnings: number;
    /** Validation timestamp */
    timestamp: Date;
    /** Validation duration in milliseconds */
    duration: number;
    /** Error details */
    errors: ValidationError[];
    /** Coverage metrics */
    coverage: CoverageMetrics;
}
export interface ValidationError {
    /** Error code */
    code: string;
    /** Error message */
    message: string;
    /** Error severity */
    severity: 'error' | 'warning' | 'info';
    /** Location in specification */
    location: {
        path: string;
        line?: number;
        column?: number;
    };
    /** Suggested fix */
    suggestion?: string;
    /** Rule that triggered the error */
    rule: string;
}
export interface CoverageMetrics {
    /** Percentage of endpoints covered */
    endpointCoverage: number;
    /** Percentage of schemas covered */
    schemaCoverage: number;
    /** Percentage of parameters covered */
    parameterCoverage: number;
    /** Percentage of responses covered */
    responseCoverage: number;
    /** Overall coverage percentage */
    overallCoverage: number;
}
export interface PerformanceMetrics {
    /** Metric identifier */
    id: string;
    /** Metric name */
    name: string;
    /** Metric value */
    value: number;
    /** Metric unit */
    unit: string;
    /** Timestamp */
    timestamp: Date;
    /** Metric category */
    category: 'response_time' | 'throughput' | 'error_rate' | 'resource_usage';
    /** Additional metadata */
    metadata?: Record<string, any>;
}
export interface ErrorDetails {
    /** Error identifier */
    id: string;
    /** Error type */
    type: string;
    /** Error message */
    message: string;
    /** Stack trace */
    stackTrace?: string;
    /** Occurrence timestamp */
    timestamp: Date;
    /** Error context */
    context: Record<string, any>;
    /** Resolution status */
    resolved: boolean;
    /** Resolution notes */
    resolutionNotes?: string;
}
export interface ChartConfig {
    /** Chart identifier */
    id: string;
    /** Chart type */
    type: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'scatter' | 'bubble';
    /** Chart title */
    title: string;
    /** Chart data */
    data: ChartData;
    /** Chart options */
    options: ChartOptions;
    /** Container element ID */
    containerId: string;
    /** Chart dimensions */
    dimensions?: {
        width: number;
        height: number;
    };
}
export interface ChartData {
    /** Data labels */
    labels: string[];
    /** Data datasets */
    datasets: ChartDataset[];
}
export interface ChartDataset {
    /** Dataset label */
    label: string;
    /** Data values */
    data: number[];
    /** Background colors */
    backgroundColor?: string | string[];
    /** Border colors */
    borderColor?: string | string[];
    /** Border width */
    borderWidth?: number;
    /** Fill configuration */
    fill?: boolean;
    /** Additional dataset options */
    options?: Record<string, any>;
}
export interface ChartOptions {
    /** Chart responsiveness */
    responsive: boolean;
    /** Maintain aspect ratio */
    maintainAspectRatio: boolean;
    /** Chart plugins */
    plugins?: {
        legend?: LegendOptions;
        tooltip?: TooltipOptions;
        title?: TitleOptions;
    };
    /** Chart scales */
    scales?: Record<string, ScaleOptions>;
    /** Animation options */
    animation?: AnimationOptions;
    /** Interaction options */
    interaction?: InteractionOptions;
}
export interface LegendOptions {
    /** Display legend */
    display: boolean;
    /** Legend position */
    position: 'top' | 'bottom' | 'left' | 'right';
    /** Legend alignment */
    align?: 'start' | 'center' | 'end';
    /** Custom labels */
    labels?: Record<string, any>;
}
export interface TooltipOptions {
    /** Enable tooltips */
    enabled: boolean;
    /** Tooltip mode */
    mode: 'point' | 'nearest' | 'index' | 'dataset';
    /** Tooltip intersect */
    intersect: boolean;
    /** Custom tooltip callbacks */
    callbacks?: Record<string, Function>;
}
export interface TitleOptions {
    /** Display title */
    display: boolean;
    /** Title text */
    text: string;
    /** Title position */
    position: 'top' | 'bottom';
    /** Title font */
    font?: {
        size: number;
        family: string;
        weight: string;
    };
}
export interface ScaleOptions {
    /** Scale type */
    type: 'linear' | 'logarithmic' | 'category' | 'time';
    /** Scale display */
    display: boolean;
    /** Scale position */
    position: 'top' | 'bottom' | 'left' | 'right';
    /** Scale title */
    title?: {
        display: boolean;
        text: string;
    };
    /** Scale ticks */
    ticks?: Record<string, any>;
    /** Scale grid */
    grid?: Record<string, any>;
}
export interface AnimationOptions {
    /** Animation duration */
    duration: number;
    /** Animation easing */
    easing: string;
    /** Animation delay */
    delay?: number;
    /** Animation loop */
    loop?: boolean;
}
export interface InteractionOptions {
    /** Interaction mode */
    mode: 'point' | 'nearest' | 'index' | 'dataset';
    /** Interaction intersect */
    intersect: boolean;
    /** Include invisible elements */
    includeInvisible: boolean;
}
export interface ExportOptions {
    /** Export format */
    format: 'html' | 'pdf' | 'json';
    /** Output file path */
    outputPath?: string;
    /** Include charts in export */
    includeCharts: boolean;
    /** Include raw data */
    includeRawData: boolean;
    /** Enable responsive design */
    responsive: boolean;
    /** Report theme */
    theme: 'default' | 'dark' | 'light' | 'professional';
    /** Custom CSS */
    customCss?: string;
    /** Custom JavaScript */
    customJs?: string;
    /** Compression options */
    compression?: CompressionOptions;
}
export interface CompressionOptions {
    /** Enable compression */
    enabled: boolean;
    /** Compression level (1-9) */
    level: number;
    /** Compression format */
    format: 'gzip' | 'deflate' | 'brotli';
}
export interface PdfOptions {
    /** Page format */
    format: 'A4' | 'A3' | 'Letter' | 'Legal';
    /** Page orientation */
    orientation: 'portrait' | 'landscape';
    /** Page margins */
    margin: {
        top: string;
        right: string;
        bottom: string;
        left: string;
    };
    /** Print background */
    printBackground: boolean;
    /** Display header/footer */
    displayHeaderFooter: boolean;
    /** Header template */
    headerTemplate?: string;
    /** Footer template */
    footerTemplate?: string;
}
export interface ImageOptions {
    /** Image format */
    format: 'png' | 'jpeg' | 'webp';
    /** Image quality (0-100) */
    quality: number;
    /** Image width */
    width?: number;
    /** Image height */
    height?: number;
    /** Device scale factor */
    deviceScaleFactor: number;
}
export interface ReportTemplate {
    /** Template name */
    name: string;
    /** Template content */
    content: string;
    /** Template type */
    type: 'main' | 'section' | 'chart' | 'partial';
    /** Template variables */
    variables: string[];
    /** Template description */
    description?: string;
    /** Template author */
    author?: string;
    /** Template version */
    version?: string;
}
export interface ReportGeneratedEvent {
    /** Report data */
    data: ReportData;
    /** Export options used */
    options: ExportOptions;
    /** Generated content */
    content: string;
    /** Generation timestamp */
    timestamp: Date;
}
export interface ReportExportedEvent {
    /** Export format */
    format: string;
    /** Output path */
    outputPath: string;
    /** File size in bytes */
    fileSize: number;
    /** Export timestamp */
    timestamp: Date;
}
//# sourceMappingURL=types.d.ts.map