/**
 * 网关管理器
 * 负责加密存储、锁定机制
 */

import CryptoJS from 'crypto-js';
import type { GatewayConfig } from '@shared/config/gateway-config';
import { DEFAULT_GATEWAY_CONFIG } from '@shared/config/gateway-config';
import { app } from 'electron';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const SECRET_KEY = 'ai-agent-app-secret-key-2024'; // 实际应用中应该在构建时注入

interface StoredGatewayData {
  config: string; // 加密的配置
  locked: boolean;
  initialized: boolean;
}

// 使用 JSON 文件存储替代 electron-store
class SimpleStore {
  private storePath: string;
  private data: any = {};

  constructor() {
    const userDataPath = app.getPath('userData');
    if (!existsSync(userDataPath)) {
      mkdirSync(userDataPath, { recursive: true });
    }
    this.storePath = join(userDataPath, 'config.json');
    this.load();
  }

  private load() {
    try {
      if (existsSync(this.storePath)) {
        const content = readFileSync(this.storePath, 'utf-8');
        this.data = JSON.parse(content);
      }
    } catch (error) {
      console.error('Failed to load store:', error);
      this.data = {};
    }
  }

  private save() {
    try {
      writeFileSync(this.storePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save store:', error);
    }
  }

  has(key: string): boolean {
    return key in this.data;
  }

  get(key: string, defaultValue?: any): any {
    return this.data[key] !== undefined ? this.data[key] : defaultValue;
  }

  set(key: string, value: any): void {
    this.data[key] = value;
    this.save();
  }
}

const store = new SimpleStore();

export class GatewayManager {
  private config: GatewayConfig;
  private locked: boolean;

  constructor() {
    this.locked = true;
    this.config = DEFAULT_GATEWAY_CONFIG;
    this.initialize();
  }

  /**
   * 初始化网关配置
   */
  private initialize() {
    if (!store.has('gateway.initialized')) {
      // 首次启动，加密并保存默认配置
      const encrypted = this.encrypt(JSON.stringify(DEFAULT_GATEWAY_CONFIG));
      store.set('gateway.config', encrypted);
      store.set('gateway.locked', true);
      store.set('gateway.initialized', true);
    }

    // 加载配置
    this.locked = store.get('gateway.locked', true) as boolean;
    const encrypted = store.get('gateway.config') as string;
    if (encrypted) {
      try {
        const decrypted = this.decrypt(encrypted);
        this.config = JSON.parse(decrypted);
      } catch (error) {
        console.error('Failed to decrypt gateway config:', error);
        this.config = DEFAULT_GATEWAY_CONFIG;
      }
    }
  }

  /**
   * 加密配置
   */
  private encrypt(data: string): string {
    return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
  }

  /**
   * 解密配置
   */
  private decrypt(encrypted: string): string {
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * 获取配置（锁定时返回脱敏版本）
   */
  getConfig(): Partial<GatewayConfig> & { locked: boolean; editable: boolean } {
    if (this.locked) {
      return {
        name: this.config.name,
        baseUrl: '*** (预配置)',
        apiKey: '*** (预配置)',
        models: Object.fromEntries(
          Object.entries(this.config.models).map(([key]) => [key, '*** (预配置)'])
        ),
        locked: true,
        editable: false,
      };
    }

    return {
      ...this.config,
      locked: false,
      editable: true,
    };
  }

  /**
   * 获取完整配置（用于 Agent 使用，内部方法）
   */
  getFullConfig(): GatewayConfig {
    return this.config;
  }

  /**
   * 检查是否锁定
   */
  isLocked(): boolean {
    return this.locked;
  }

  /**
   * 解锁（需要密码）
   */
  unlock(password: string): boolean {
    if (password === 'debug-20240609') {
      this.locked = false;
      store.set('gateway.locked', false);
      return true;
    }
    return false;
  }

  /**
   * 锁定
   */
  lock(): void {
    this.locked = true;
    store.set('gateway.locked', true);
  }

  /**
   * 更新配置（仅在解锁时可用）
   */
  updateConfig(newConfig: Partial<GatewayConfig>): boolean {
    if (this.locked) {
      return false;
    }

    this.config = {
      ...this.config,
      ...newConfig,
    };

    // 加密保存
    const encrypted = this.encrypt(JSON.stringify(this.config));
    store.set('gateway.config', encrypted);

    return true;
  }

  /**
   * 重置为默认配置
   */
  reset(): void {
    this.config = DEFAULT_GATEWAY_CONFIG;
    const encrypted = this.encrypt(JSON.stringify(DEFAULT_GATEWAY_CONFIG));
    store.set('gateway.config', encrypted);
    store.set('gateway.locked', true);
    this.locked = true;
  }
}

// 单例
export const gatewayManager = new GatewayManager();
