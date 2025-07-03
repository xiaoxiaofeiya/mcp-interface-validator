/**
 * Cursor Integration
 *
 * Integration adapter for Cursor AI IDE
 */
import { Logger } from '../../utils/logger/index';
import type { Integration, IntegrationStatus } from '../index';
export interface CursorConfig {
    enabled: boolean;
    configPath?: string;
}
export declare class CursorIntegration implements Integration {
    readonly name = "cursor";
    isEnabled: boolean;
    private logger;
    private _config;
    private connected;
    private errorCount;
    private lastActivity?;
    constructor(config: CursorConfig, logger: Logger);
    /**
     * Initialize Cursor integration
     */
    initialize(): Promise<void>;
    /**
     * Send validation result to Cursor
     */
    sendValidationResult(result: any): Promise<void>;
    /**
     * Get integration status
     */
    getStatus(): IntegrationStatus;
    /**
     * Enable the integration
     */
    enable(): void;
    /**
     * Disable the integration
     */
    disable(): void;
    /**
     * Reset error count
     */
    resetErrorCount(): void;
}
//# sourceMappingURL=index.d.ts.map