/**
 * Agent 会话管理器
 * 负责启动 Agent 进程、ACP 协议通信、消息收发
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { gatewayManager } from '../gateway/manager';
import { getInstallPath } from '@shared/config/agent-install-config';
import type { Message } from '@shared/types/conversation';

export interface AgentSession {
  id: string;
  agentType: string;
  process: ChildProcess;
  createdAt: number;
}

export class SessionManager extends EventEmitter {
  private sessions = new Map<string, AgentSession>();
  private messageBuffer = new Map<string, string>();

  /**
   * 创建新会话
   */
  async createSession(conversationId: string, agentType: string): Promise<string> {
    // 如果已经存在会话，先关闭
    if (this.sessions.has(conversationId)) {
      await this.closeSession(conversationId);
    }

    const gateway = gatewayManager.getFullConfig();
    const agentPath = getInstallPath(agentType);

    // 构建环境变量
    const env = {
      ...process.env,
      OPENAI_API_KEY: gateway.apiKey || '',
      OPENAI_BASE_URL: gateway.baseUrl,
      OPENAI_MODEL: gateway.models[agentType] || 'gpt-4',
    };

    // 启动 Agent 进程
    const agentProcess = spawn(agentPath, ['code'], {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // 监听输出
    agentProcess.stdout?.on('data', (data) => {
      this.handleAgentOutput(conversationId, data.toString());
    });

    agentProcess.stderr?.on('data', (data) => {
      console.error(`[${agentType}] Error:`, data.toString());
      this.emit('error', { conversationId, error: data.toString() });
    });

    agentProcess.on('exit', (code) => {
      console.log(`[${agentType}] Process exited with code ${code}`);
      this.sessions.delete(conversationId);
      this.emit('session-closed', { conversationId });
    });

    // 保存会话
    const session: AgentSession = {
      id: conversationId,
      agentType,
      process: agentProcess,
      createdAt: Date.now(),
    };

    this.sessions.set(conversationId, session);

    return conversationId;
  }

  /**
   * 发送消息
   */
  async sendMessage(conversationId: string, content: string): Promise<void> {
    const session = this.sessions.get(conversationId);
    if (!session) {
      throw new Error('Session not found');
    }

    // 构建 ACP 请求（简化版）
    const request = {
      jsonrpc: '2.0',
      method: 'session/send',
      params: {
        message: content,
      },
    };

    // 发送到 Agent 的 stdin
    session.process.stdin?.write(JSON.stringify(request) + '\n');
  }

  /**
   * 处理 Agent 输出
   */
  private handleAgentOutput(conversationId: string, data: string) {
    const lines = data.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        // 尝试解析 JSON-RPC 响应
        const response = JSON.parse(line);

        if (response.method === 'session/update') {
          // 会话更新通知
          this.emit('message', {
            conversationId,
            content: response.params?.content || '',
            role: 'assistant',
          });
        }
      } catch {
        // 不是 JSON，可能是普通文本输出
        const buffered = this.messageBuffer.get(conversationId) || '';
        this.messageBuffer.set(conversationId, buffered + data);

        // 发送文本块
        this.emit('message-chunk', {
          conversationId,
          chunk: data,
        });
      }
    }
  }

  /**
   * 关闭会话
   */
  async closeSession(conversationId: string): Promise<void> {
    const session = this.sessions.get(conversationId);
    if (!session) return;

    // 发送关闭请求
    const request = {
      jsonrpc: '2.0',
      method: 'session/close',
      params: {},
    };

    session.process.stdin?.write(JSON.stringify(request) + '\n');

    // 等待进程退出（最多 5 秒）
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        session.process.kill();
        resolve();
      }, 5000);

      session.process.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    this.sessions.delete(conversationId);
    this.messageBuffer.delete(conversationId);
  }

  /**
   * 获取所有活跃会话
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * 清理所有会话
   */
  async cleanup(): Promise<void> {
    const sessions = Array.from(this.sessions.keys());
    await Promise.all(sessions.map((id) => this.closeSession(id)));
  }
}

// 单例
export const sessionManager = new SessionManager();
