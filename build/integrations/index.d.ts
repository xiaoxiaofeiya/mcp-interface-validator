/**
 * Integration Manager for AI Tools
 *
 * Manages integrations with various AI development tools
 */
import { Logger } from '../utils/logger/index.js';
import { ConfigManager } from '../utils/config/index.js';
export interface Integration {
    name: string;
    isEnabled: boolean;
    initialize(): Promise<void>;
    sendValidationResult(result: any): Promise<void>;
    getStatus(): IntegrationStatus;
}
export interface IntegrationStatus {
    name: string;
    enabled: boolean;
    connected: boolean;
    lastActivity?: string | undefined;
    errorCount: number;
}
export declare class IntegrationManager {
    private logger;
    private config;
    private integrations;
    private isInitialized;
    constructor(configManager: ConfigManager, logger: Logger);
    /**
     * Initialize all enabled integrations
     */
    initialize(): Promise<void>;
    /**
     * Send validation results to all enabled integrations
     */
    broadcastValidationResult(result: any): Promise<void>;
    /**
     * Get status of all integrations
     */
    getIntegrationsStatus(): IntegrationStatus[];
    /**
     * Get specific integration by name
     */
    getIntegration(name: string): Integration | undefined;
    /**
     * Enable/disable specific integration
     */
    toggleIntegration(name: string, enabled: boolean): Promise<void>;
    /**
     * Get manager status
     */
    getStatus(): {
        initialized: boolean;
        integrationCount: number;
    };
}
//# sourceMappingURL=index.d.ts.map