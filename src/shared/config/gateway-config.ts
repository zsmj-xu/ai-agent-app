/**
 * API 网关配置
 * 预配置的 NewAPI 网关，默认锁定
 */

export interface GatewayConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  models: {
    [agentType: string]: string; // agentType -> modelId
  };
}

// 预设的网关配置（生产环境）
export const DEFAULT_GATEWAY_CONFIG: GatewayConfig = {
  name: 'Default Gateway',
  baseUrl: 'https://api.openai.com/v1', // 示例：可替换为你的 NewAPI 网关
  apiKey: '', // 需要用户配置或内置
  models: {
    'claude-code': 'claude-3-5-sonnet-20241022',
    'codex': 'gpt-4-turbo',
    'openclaw': 'gpt-4o',
    'hermes': 'mistral-large',
  },
};

// 调试密码（用于解锁高级模式）
export const DEBUG_PASSWORD = 'debug-20240609';
