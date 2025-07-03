/**
 * Trae Integration
 *
 * Integration adapter for Trae AI development tool
 */
import { Logger } from '../../utils/logger/index.js';
import type { Integration, IntegrationStatus } from '../index.js';
export interface TraeConfig {
    enabled: boolean;
    configPath?: string;
}
export declare class TraeIntegration implements Integration {
    readonly name = "trae";
    isEnabled: boolean;
    private logger;
    private _config;
    private connected;
    private errorCount;
    private lastActivity?;
    constructor(config: TraeConfig, logger: Logger);
    /**
     * Initialize Trae integration
     */
    initialize(): Promise<void>;
    /**
     * Send validation result to Trae
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