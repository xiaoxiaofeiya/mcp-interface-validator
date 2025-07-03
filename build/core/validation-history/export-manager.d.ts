/**
 * Export Manager for Validation History
 *
 * Handles exporting validation history data in various formats
 */
import { Logger } from '../../utils/logger/index.js';
import type { ValidationHistoryEntry, ExportOptions, ExportResult } from './types.js';
import type { IHistoryDatabase } from './database/interface.js';
/**
 * Export manager for validation history
 */
export declare class ExportManager {
    private readonly logger;
    private readonly database;
    constructor(database: IHistoryDatabase, _config?: any, logger?: Logger);
    /**
     * Export validation history data
     */
    export(options: ExportOptions): Promise<ExportResult>;
    /**
     * Export to JSON format
     */
    exportToJSON(entries: ValidationHistoryEntry[], options: ExportOptions): Promise<string>;
    /**
     * Export to CSV format
     */
    exportToCSV(entries: ValidationHistoryEntry[], options: ExportOptions): Promise<string>;
    /**
     * Export to Excel format (XLSX)
     */
    exportToXLSX(entries: ValidationHistoryEntry[], options: ExportOptions): Promise<string>;
    /**
     * Export to PDF format
     */
    exportToPDF(entries: ValidationHistoryEntry[], options: ExportOptions): Promise<string>;
    private buildQueryFromOptions;
    private generateExportFile;
    private prepareDataForExport;
    private generateFileName;
    private getExportDirectory;
    private ensureExportDirectory;
    private escapeCsvValue;
}
//# sourceMappingURL=export-manager.d.ts.map