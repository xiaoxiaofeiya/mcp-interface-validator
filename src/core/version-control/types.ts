/**
 * Type definitions for Version Control System
 */

/**
 * API Specification interface
 */
export interface ApiSpecification {
  openapi?: string;
  info?: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths?: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, Schema>;
    responses?: Record<string, Response>;
    parameters?: Record<string, Parameter>;
    examples?: Record<string, Example>;
    requestBodies?: Record<string, RequestBody>;
    headers?: Record<string, Header>;
    securitySchemes?: Record<string, SecurityScheme>;
    links?: Record<string, Link>;
    callbacks?: Record<string, Callback>;
  };
  security?: SecurityRequirement[];
  tags?: Tag[];
  externalDocs?: ExternalDocumentation;
}

/**
 * OpenAPI Path Item
 */
export interface PathItem {
  $ref?: string;
  summary?: string;
  description?: string;
  get?: Operation;
  put?: Operation;
  post?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
  patch?: Operation;
  trace?: Operation;
  servers?: Server[];
  parameters?: (Parameter | Reference)[];
}

/**
 * OpenAPI Operation
 */
export interface Operation {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
  operationId?: string;
  parameters?: (Parameter | Reference)[];
  requestBody?: RequestBody | Reference;
  responses: Responses;
  callbacks?: Record<string, Callback | Reference>;
  deprecated?: boolean;
  security?: SecurityRequirement[];
  servers?: Server[];
}

/**
 * Version Control Configuration
 */
export interface VersionControlConfig {
  provider: {
    type: 'git' | 'filesystem';
    config: GitProviderConfig | FileSystemProviderConfig;
  };
  storage: {
    path: string;
    compression?: boolean;
    encryption?: boolean;
  };
  versioning: {
    autoVersion?: boolean;
    versionFormat?: 'semantic' | 'timestamp' | 'incremental';
    maxVersions?: number;
  };
  branching: {
    enabled?: boolean;
    defaultBranch?: string;
    autoMerge?: boolean;
  };
  conflict: {
    resolution?: 'manual' | 'auto' | 'latest-wins' | 'oldest-wins';
    strategy?: 'merge' | 'rebase' | 'squash';
  };
}

/**
 * Git Provider Configuration
 */
export interface GitProviderConfig {
  repository: string;
  branch?: string;
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
    sshKey?: string;
  };
  remote?: string;
  workingDirectory?: string;
}

/**
 * File System Provider Configuration
 */
export interface FileSystemProviderConfig {
  basePath: string;
  structure?: 'flat' | 'hierarchical';
  naming?: {
    pattern?: string;
    includeTimestamp?: boolean;
    includeHash?: boolean;
  };
}

/**
 * Version Entry
 */
export interface VersionEntry {
  id: string;
  specId: string;
  version: string;
  specification: ApiSpecification;
  hash: string;
  timestamp: Date;
  metadata: VersionMetadata;
  parent?: string | undefined;
  children?: string[] | undefined;
  branch?: string | undefined;
}

/**
 * Version Metadata
 */
export interface VersionMetadata {
  author: string;
  message: string;
  tags: string[];
  source?: string;
  environment?: string;
  buildNumber?: string;
  commitHash?: string;
  pullRequestId?: string;
  reviewers?: string[];
  approvedBy?: string[];
  custom?: Record<string, any>;
}

/**
 * Change Set
 */
export interface ChangeSet {
  type: 'addition' | 'deletion' | 'modification' | 'conflict';
  path: string;
  oldValue?: any;
  newValue?: any;
  description?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Version Diff
 */
export interface VersionDiff {
  specId: string;
  fromVersion: string;
  toVersion: string;
  changes: ChangeSet[];
  timestamp: Date;
  summary?: {
    additions: number;
    deletions: number;
    modifications: number;
    conflicts: number;
  };
}

/**
 * Conflict Resolution
 */
export interface ConflictResolution {
  strategy: 'manual' | 'auto' | 'latest-wins' | 'oldest-wins' | 'custom';
  resolutions?: Record<string, {
    action: 'keep-current' | 'use-incoming' | 'merge' | 'custom';
    value?: any;
  }>;
  reviewer?: string;
  timestamp?: Date;
}

/**
 * Branch Information
 */
export interface BranchInfo {
  name: string;
  specId: string;
  baseVersion: string;
  headVersion: string;
  created: Date;
  lastModified: Date;
  author: string;
  status: 'active' | 'merged' | 'abandoned';
}

/**
 * Merge Result
 */
export interface MergeResult {
  success: boolean;
  version?: VersionEntry;
  conflicts?: ChangeSet[];
  message: string;
  timestamp: Date;
}

/**
 * Version Control Provider Interface
 */
export interface VersionControlProvider {
  initialize(): Promise<void>;
  storeVersion(version: VersionEntry): Promise<void>;
  getVersion(specId: string, versionId: string): Promise<VersionEntry | null>;
  loadHistory(): Promise<Map<string, VersionEntry[]>>;
  createBranch(specId: string, branchName: string, fromVersionId: string): Promise<void>;
  mergeBranch(
    specId: string,
    sourceBranch: string,
    targetBranch: string,
    conflictResolution?: ConflictResolution
  ): Promise<VersionEntry>;
  listBranches(specId: string): Promise<BranchInfo[]>;
  deleteBranch(specId: string, branchName: string): Promise<void>;
  cleanup(): Promise<void>;
}

/**
 * Git Provider Interface
 */
export interface GitProvider extends VersionControlProvider {
  clone(): Promise<void>;
  pull(): Promise<void>;
  push(): Promise<void>;
  commit(message: string, files: string[]): Promise<string>;
  checkout(branch: string): Promise<void>;
  createTag(name: string, message?: string): Promise<void>;
  getCommitHistory(limit?: number): Promise<GitCommit[]>;
}

/**
 * File System Provider Interface
 */
export interface FileSystemProvider extends VersionControlProvider {
  ensureDirectory(path: string): Promise<void>;
  writeFile(path: string, content: string): Promise<void>;
  readFile(path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
  listFiles(directory: string): Promise<string[]>;
}

/**
 * Git Commit Information
 */
export interface GitCommit {
  hash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
  files: string[];
}

// Additional OpenAPI types for completeness
export interface Schema {
  type?: string;
  format?: string;
  title?: string;
  description?: string;
  default?: any;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  enum?: any[];
  properties?: Record<string, Schema | Reference>;
  additionalProperties?: boolean | Schema | Reference;
  items?: Schema | Reference;
  allOf?: (Schema | Reference)[];
  oneOf?: (Schema | Reference)[];
  anyOf?: (Schema | Reference)[];
  not?: Schema | Reference;
  discriminator?: Discriminator;
  readOnly?: boolean;
  writeOnly?: boolean;
  xml?: XML;
  externalDocs?: ExternalDocumentation;
  example?: any;
  deprecated?: boolean;
}

export interface Reference {
  $ref: string;
}

export interface Response {
  description: string;
  headers?: Record<string, Header | Reference>;
  content?: Record<string, MediaType>;
  links?: Record<string, Link | Reference>;
}

export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: Schema | Reference;
  example?: any;
  examples?: Record<string, Example | Reference>;
  content?: Record<string, MediaType>;
}

export interface Example {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

export interface RequestBody {
  description?: string;
  content: Record<string, MediaType>;
  required?: boolean;
}

export interface Header {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  schema?: Schema | Reference;
  example?: any;
  examples?: Record<string, Example | Reference>;
  content?: Record<string, MediaType>;
}

export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlows;
  openIdConnectUrl?: string;
}

export interface Link {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, any>;
  requestBody?: any;
  description?: string;
  server?: Server;
}

export interface Callback {
  [expression: string]: PathItem;
}

export interface SecurityRequirement {
  [name: string]: string[];
}

export interface Tag {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentation;
}

export interface ExternalDocumentation {
  description?: string;
  url: string;
}

export interface Server {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariable>;
}

export interface ServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

export interface Responses {
  [statusCode: string]: Response | Reference;
}

export interface MediaType {
  schema?: Schema | Reference;
  example?: any;
  examples?: Record<string, Example | Reference>;
  encoding?: Record<string, Encoding>;
}

export interface Encoding {
  contentType?: string;
  headers?: Record<string, Header | Reference>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

export interface OAuthFlows {
  implicit?: OAuthFlow;
  password?: OAuthFlow;
  clientCredentials?: OAuthFlow;
  authorizationCode?: OAuthFlow;
}

export interface OAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface Discriminator {
  propertyName: string;
  mapping?: Record<string, string>;
}

export interface XML {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}
