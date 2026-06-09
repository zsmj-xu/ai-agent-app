import { contextBridge, ipcRenderer } from 'electron';
import type { AgentDetectionResult, InstallProgress, InstallResult } from '@shared/types/agent';
import type { Conversation, SendMessageRequest } from '@shared/types/conversation';

// 暴露 API
contextBridge.exposeInMainWorld('api', {
  setup: {
    // 检测所有 Agent
    detectAgents: (): Promise<AgentDetectionResult[]> => {
      return ipcRenderer.invoke('setup:detectAgents');
    },

    // 检测单个 Agent
    detectAgent: (agentType: string): Promise<AgentDetectionResult> => {
      return ipcRenderer.invoke('setup:detectAgent', { agentType });
    },

    // 安装 Agent
    installAgent: (agentType: string): Promise<InstallResult> => {
      return ipcRenderer.invoke('setup:installAgent', { agentType });
    },

    // 取消安装
    cancelInstall: (agentType: string): Promise<{ success: boolean }> => {
      return ipcRenderer.invoke('setup:cancelInstall', { agentType });
    },

    // 批量安装
    installBatch: (agentTypes: string[]): Promise<InstallResult[]> => {
      return ipcRenderer.invoke('setup:installBatch', { agentTypes });
    },

    // 监听安装进度
    onInstallProgress: (callback: (progress: InstallProgress) => void) => {
      const subscription = (_event: any, progress: InstallProgress) => callback(progress);
      ipcRenderer.on('setup:installProgress', subscription);

      // 返回取消订阅函数
      return () => {
        ipcRenderer.removeListener('setup:installProgress', subscription);
      };
    },
  },

  conversation: {
    // 创建会话
    create: (agentType: string): Promise<{ conversationId: string; agentType: string }> => {
      return ipcRenderer.invoke('conversation:create', { agentType });
    },

    // 发送消息
    sendMessage: (data: SendMessageRequest): Promise<{ success: boolean }> => {
      return ipcRenderer.invoke('conversation:sendMessage', data);
    },

    // 关闭会话
    close: (conversationId: string): Promise<{ success: boolean }> => {
      return ipcRenderer.invoke('conversation:close', { conversationId });
    },

    // 监听消息
    onMessage: (callback: (data: any) => void) => {
      const subscription = (_event: any, data: any) => callback(data);
      ipcRenderer.on('conversation:message', subscription);
      return () => ipcRenderer.removeListener('conversation:message', subscription);
    },

    // 监听消息块（流式输出）
    onMessageChunk: (callback: (data: any) => void) => {
      const subscription = (_event: any, data: any) => callback(data);
      ipcRenderer.on('conversation:message-chunk', subscription);
      return () => ipcRenderer.removeListener('conversation:message-chunk', subscription);
    },
  },

  gateway: {
    // 获取网关配置
    getConfig: (): Promise<any> => {
      return ipcRenderer.invoke('gateway:getConfig');
    },

    // 解锁网关配置
    unlock: (password: string): Promise<{ success: boolean }> => {
      return ipcRenderer.invoke('gateway:unlock', { password });
    },

    // 锁定网关配置
    lock: (): Promise<{ success: boolean }> => {
      return ipcRenderer.invoke('gateway:lock');
    },

    // 更新网关配置
    updateConfig: (config: any): Promise<{ success: boolean }> => {
      return ipcRenderer.invoke('gateway:updateConfig', config);
    },
  },
});

// 类型声明
declare global {
  interface Window {
    api: {
      setup: {
        detectAgents: () => Promise<AgentDetectionResult[]>;
        detectAgent: (agentType: string) => Promise<AgentDetectionResult>;
        installAgent: (agentType: string) => Promise<InstallResult>;
        cancelInstall: (agentType: string) => Promise<{ success: boolean }>;
        installBatch: (agentTypes: string[]) => Promise<InstallResult[]>;
        onInstallProgress: (callback: (progress: InstallProgress) => void) => () => void;
      };
      conversation: {
        create: (agentType: string) => Promise<{ conversationId: string; agentType: string }>;
        sendMessage: (data: SendMessageRequest) => Promise<{ success: boolean }>;
        close: (conversationId: string) => Promise<{ success: boolean }>;
        onMessage: (callback: (data: any) => void) => () => void;
        onMessageChunk: (callback: (data: any) => void) => () => void;
      };
      gateway: {
        getConfig: () => Promise<any>;
        unlock: (password: string) => Promise<{ success: boolean }>;
        lock: () => Promise<{ success: boolean }>;
        updateConfig: (config: any) => Promise<{ success: boolean }>;
      };
    };
  }
}

