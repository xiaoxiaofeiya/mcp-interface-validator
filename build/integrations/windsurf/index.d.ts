/**
 * Windsurf Integration
 *
 * Integration adapter for Windsurf AI IDE
 */
import { Logger } from '../../utils/logger/index';
import type { Integration, IntegrationStatus } from '../index';
export interface WindsurfConfig {
    enabled: boolean;
    configPath?: string;
}
export declare class WindsurfIntegration implements Integration {
    readonly name = "windsurf";
    isEnabled: boolean;
    private logger;
    private _config;
    private connected;
    private errorCount;
    private lastActivity?;
    constructor(config: WindsurfConfig, logger: Logger);
    /**
     * Initialize Windsurf integration
     */
    initialize(): Promise<void>;
    /**
     * Send validation result to Windsurf
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