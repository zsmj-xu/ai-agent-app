/**
 * 共享类型定义
 */

export interface AgentDetectionResult {
  agentType: string;
  name: string;
  installed: boolean;
  version?: string;
  path?: string;
}

export interface InstallProgress {
  agentType: string;
  stage: 'downloading' | 'extracting' | 'installing' | 'verifying' | 'completed';
  progress: number; // 0-100
  message: string;
  bytesDownloaded?: number;
  totalBytes?: number;
  speed?: number; // bytes/sec
}

export interface InstallResult {
  success: boolean;
  agentType: string;
  version?: string;
  path?: string;
  error?: string;
}

export interface DownloadProgress {
  percent: number; // 0-100
  transferred: number; // bytes
  total: number; // bytes
  speed: number; // bytes/sec
}

export type AgentStatus =
  | 'idle'
  | 'downloading'
  | 'installing'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface AgentInstallState {
  name: string;
  agentType: string;
  description: string;
  size: string;
  selected: boolean;
  status: AgentStatus;
  progress: number;
  message: string;
  version?: string;
  error?: string;
}
