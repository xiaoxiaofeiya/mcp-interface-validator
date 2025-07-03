/**
 * 智能上下文类型定义
 */

/**
 * 用户意图类型
 */
export interface UserIntent {
  /** 意图类型 */
  type: 'create' | 'update' | 'delete' | 'query' | 'validate' | 'analyze' | 'api_creation' | 'api_modification' | 'api_validation' | 'unknown';

  /** 目标对象 */
  target: string;

  /** 置信度 (0-1) */
  confidence: number;

  /** 领域 */
  domain?: string;

  /** 操作列表 */
  operations?: string[];

  /** 实体列表 */
  entities?: string[];

  /** 相关参数 */
  parameters?: Record<string, any>;

  /** 上下文信息 */
  context?: {
    /** 当前文件路径 */
    filePath?: string;

    /** 选中的代码 */
    selectedCode?: string;

    /** 光标位置 */
    cursorPosition?: {
      line: number;
      column: number;
    };

    /** 项目信息 */
    projectInfo?: {
      name: string;
      type: string;
      framework?: string;
    };
  };

  /** 时间戳 */
  timestamp: Date;
}

/**
 * 上下文分析结果
 */
export interface ContextAnalysis {
  /** 用户意图 */
  userIntent: UserIntent;
  
  /** 相关文件 */
  relatedFiles: string[];
  
  /** 建议的操作 */
  suggestedActions: string[];
  
  /** 风险评估 */
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    reasons: string[];
  };
}

/**
 * 智能上下文配置
 */
export interface IntelligentContextConfig {
  /** 是否启用意图检测 */
  enableIntentDetection: boolean;
  
  /** 是否启用上下文分析 */
  enableContextAnalysis: boolean;
  
  /** 分析深度 */
  analysisDepth: 'shallow' | 'medium' | 'deep';
  
  /** 缓存配置 */
  cache: {
    enabled: boolean;
    ttl: number; // 缓存时间（秒）
    maxSize: number; // 最大缓存条目数
  };
}
