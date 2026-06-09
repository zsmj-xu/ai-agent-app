/**
 * Agent 安装配置
 */

export interface AgentInstallConfig {
  name: string;
  description: string;
  homepage: string;
  size: string;
  recommended: boolean;
  releases: {
    [platformKey: string]: string; // 'darwin-arm64', 'win32-x64', etc.
  };
  installPath: {
    darwin: string;
    win32: string;
    linux: string;
  };
  postInstall?: {
    commands?: string[];
    env?: Record<string, string>;
  };
}

export const AGENT_INSTALL_CONFIG: Record<string, AgentInstallConfig> = {
  'claude-code': {
    name: 'Claude Code',
    description: '最强代码助手，支持多种编程语言',
    homepage: 'https://claude.ai/code',
    size: '50MB',
    recommended: true,
    releases: {
      // 从 Claude Code 官方 GitHub Releases 下载
      'darwin-arm64': 'https://github.com/anthropics/claude-code-cli/releases/latest/download/claude-darwin-arm64',
      'darwin-x64': 'https://github.com/anthropics/claude-code-cli/releases/latest/download/claude-darwin-x64',
      'win32-x64': 'https://github.com/anthropics/claude-code-cli/releases/latest/download/claude-windows-x64.exe',
      'linux-x64': 'https://github.com/anthropics/claude-code-cli/releases/latest/download/claude-linux-x64',
    },
    installPath: {
      darwin: '~/.local/bin/claude',
      win32: '%APPDATA%\\AIAgent\\bin\\claude.exe',
      linux: '~/.local/bin/claude',
    },
  },
  'codex': {
    name: 'Codex',
    description: 'GitHub 出品，专注代码生成和补全',
    homepage: 'https://github.com/codex-cli/codex',
    size: '45MB',
    recommended: true,
    releases: {
      // 从 Codex 官方 GitHub Releases 下载
      'darwin-arm64': 'https://github.com/codex-cli/codex/releases/latest/download/codex-darwin-arm64',
      'darwin-x64': 'https://github.com/codex-cli/codex/releases/latest/download/codex-darwin-x64',
      'win32-x64': 'https://github.com/codex-cli/codex/releases/latest/download/codex-windows-x64.exe',
      'linux-x64': 'https://github.com/codex-cli/codex/releases/latest/download/codex-linux-x64',
    },
    installPath: {
      darwin: '~/.local/bin/codex',
      win32: '%APPDATA%\\AIAgent\\bin\\codex.exe',
      linux: '~/.local/bin/codex',
    },
  },
  'openclaw': {
    name: 'OpenClaw',
    description: '开源 AI 助手，社区驱动',
    homepage: 'https://github.com/openclaw-ai/openclaw',
    size: '38MB',
    recommended: false,
    releases: {
      // 从 OpenClaw 官方 GitHub Releases 下载
      'darwin-arm64': 'https://github.com/openclaw-ai/openclaw/releases/latest/download/openclaw-darwin-arm64',
      'darwin-x64': 'https://github.com/openclaw-ai/openclaw/releases/latest/download/openclaw-darwin-x64',
      'win32-x64': 'https://github.com/openclaw-ai/openclaw/releases/latest/download/openclaw-windows-x64.exe',
      'linux-x64': 'https://github.com/openclaw-ai/openclaw/releases/latest/download/openclaw-linux-x64',
    },
    installPath: {
      darwin: '~/.local/bin/openclaw',
      win32: '%APPDATA%\\AIAgent\\bin\\openclaw.exe',
      linux: '~/.local/bin/openclaw',
    },
  },
  'hermes': {
    name: 'Hermes',
    description: '轻量级 AI 助手，响应速度快',
    homepage: 'https://github.com/hermes-agent/hermes',
    size: '32MB',
    recommended: true,
    releases: {
      // 从 Hermes 官方 GitHub Releases 下载
      'darwin-arm64': 'https://github.com/hermes-agent/hermes/releases/latest/download/hermes-darwin-arm64',
      'darwin-x64': 'https://github.com/hermes-agent/hermes/releases/latest/download/hermes-darwin-x64',
      'win32-x64': 'https://github.com/hermes-agent/hermes/releases/latest/download/hermes-windows-x64.exe',
      'linux-x64': 'https://github.com/hermes-agent/hermes/releases/latest/download/hermes-linux-x64',
    },
    installPath: {
      darwin: '~/.local/bin/hermes',
      win32: '%APPDATA%\\AIAgent\\bin\\hermes.exe',
      linux: '~/.local/bin/hermes',
    },
  },
};

/**
 * 获取平台标识
 */
export function getPlatformKey(): string {
  const platform = process.platform;
  const arch = process.arch;
  return `${platform}-${arch}`;
}

/**
 * 展开路径中的环境变量
 */
export function expandPath(path: string): string {
  if (process.platform === 'win32') {
    return path.replace(/%([^%]+)%/g, (_, key) => process.env[key] || '');
  } else {
    return path.replace(/~/, process.env.HOME || '').replace(/\$(\w+)/g, (_, key) => process.env[key] || '');
  }
}

/**
 * 获取 Agent 安装路径
 */
export function getInstallPath(agentType: string): string {
  const config = AGENT_INSTALL_CONFIG[agentType];
  if (!config) {
    throw new Error(`Unknown agent type: ${agentType}`);
  }

  const platform = process.platform as 'darwin' | 'win32' | 'linux';
  const path = config.installPath[platform];
  return expandPath(path);
}
