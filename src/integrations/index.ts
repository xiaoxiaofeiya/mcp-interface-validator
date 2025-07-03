/**
 * Integration Manager for AI Tools
 * 
 * Manages integrations with various AI development tools
 */

import { Logger } from '../utils/logger/index.js';
import { ConfigManager, type IntegrationConfig } from '../utils/config/index.js';
import { CursorIntegration } from './cursor/index.js';
import { WindsurfIntegration } from './windsurf/index.js';
import { AugmentIntegration } from './augment/index.js';
import { TraeIntegration } from './trae/index.js';

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

export class IntegrationManager {
  private logger: Logger;
  private config: IntegrationConfig;
  private integrations: Map<string, Integration> = new Map();
  private isInitialized: boolean = false;

  constructor(configManager: ConfigManager, logger: Logger) {
    this.logger = logger;
    this.config = configManager.getIntegrationConfig();
  }

  /**
   * Initialize all enabled integrations
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Integration Manager...');

      // Initialize Cursor integration
      if (this.config.cursor.enabled) {
        const cursorIntegration = new CursorIntegration(this.config.cursor, this.logger);
        this.integrations.set('cursor', cursorIntegration);
        await cursorIntegration.initialize();
      }

      // Initialize Windsurf integration
      if (this.config.windsurf.enabled) {
        const windsurfIntegration = new WindsurfIntegration(this.config.windsurf, this.logger);
        this.integrations.set('windsurf', windsurfIntegration);
        await windsurfIntegration.initialize();
      }

      // Initialize Augment integration
      if (this.config.augment.enabled) {
        const augmentIntegration = new AugmentIntegration(this.config.augment, this.logger);
        this.integrations.set('augment', augmentIntegration);
        await augmentIntegration.initialize();
      }

      // Initialize Trae integration
      if (this.config.trae.enabled) {
        const traeIntegration = new TraeIntegration(this.config.trae, this.logger);
        this.integrations.set('trae', traeIntegration);
        await traeIntegration.initialize();
      }

      this.isInitialized = true;
      this.logger.info('Integration Manager initialized successfully', {
        enabledIntegrations: Array.from(this.integrations.keys())
      });
    } catch (error) {
      this.logger.error('Failed to initialize Integration Manager:', error);
      throw error;
    }
  }

  /**
   * Send validation results to all enabled integrations
   */
  async broadcastValidationResult(result: any): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn('Integration Manager not initialized, skipping broadcast');
      return;
    }

    const promises = Array.from(this.integrations.values()).map(async (integration) => {
      try {
        if (integration.isEnabled) {
          await integration.sendValidationResult(result);
        }
      } catch (error) {
        this.logger.error(`Failed to send validation result to ${integration.name}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get status of all integrations
   */
  getIntegrationsStatus(): IntegrationStatus[] {
    return Array.from(this.integrations.values()).map(integration => 
      integration.getStatus()
    );
  }

  /**
   * Get specific integration by name
   */
  getIntegration(name: string): Integration | undefined {
    return this.integrations.get(name);
  }

  /**
   * Enable/disable specific integration
   */
  async toggleIntegration(name: string, enabled: boolean): Promise<void> {
    const integration = this.integrations.get(name);
    if (!integration) {
      throw new Error(`Integration not found: ${name}`);
    }

    if (enabled && !integration.isEnabled) {
      await integration.initialize();
      this.logger.info(`Integration enabled: ${name}`);
    } else if (!enabled && integration.isEnabled) {
      // Note: We don't have a shutdown method in the interface yet
      this.logger.info(`Integration disabled: ${name}`);
    }
  }

  /**
   * Get manager status
   */
  getStatus(): { initialized: boolean; integrationCount: number } {
    return {
      initialized: this.isInitialized,
      integrationCount: this.integrations.size
    };
  }
}
