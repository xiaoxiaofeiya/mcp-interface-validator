/**
 * Augment Integration
 *
 * Integration adapter for Augment AI development platform
 */
import { Logger } from '../../utils/logger/index.js';
import type { Integration, IntegrationStatus } from '../index.js';
export interface AugmentConfig {
    enabled: boolean;
    configPath?: string;
}
export declare class AugmentIntegration implements Integration {
    readonly name = "augment";
    isEnabled: boolean;
    private logger;
    private _config;
    private connected;
    private errorCount;
    private lastActivity?;
    constructor(config: AugmentConfig, logger: Logger);
    /**
     * Initialize Augment integration
     */
    initialize(): Promise<void>;
    /**
     * Send validation result to Augment
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