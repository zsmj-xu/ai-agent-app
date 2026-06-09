/**
 * 对话 IPC Handlers
 */

import { ipcMain } from 'electron';
import { sessionManager } from '../agent/session-manager';
import type { SendMessageRequest } from '@shared/types/conversation';

export function registerConversationHandlers() {
  // 创建会话
  ipcMain.handle(
    'conversation:create',
    async (_event, { agentType }: { agentType: string }) => {
      const conversationId = `conv-${Date.now()}`;
      await sessionManager.createSession(conversationId, agentType);
      return {
        conversationId,
        agentType,
        createdAt: Date.now(),
      };
    }
  );

  // 发送消息
  ipcMain.handle('conversation:sendMessage', async (_event, data: SendMessageRequest) => {
    await sessionManager.sendMessage(data.conversationId, data.content);
    return { success: true };
  });

  // 关闭会话
  ipcMain.handle(
    'conversation:close',
    async (_event, { conversationId }: { conversationId: string }) => {
      await sessionManager.closeSession(conversationId);
      return { success: true };
    }
  );

  // 监听消息事件并转发到渲染进程
  sessionManager.on('message', (data) => {
    // 广播到所有窗口
    const windows = require('electron').BrowserWindow.getAllWindows();
    windows.forEach((win) => {
      win.webContents.send('conversation:message', data);
    });
  });

  sessionManager.on('message-chunk', (data) => {
    const windows = require('electron').BrowserWindow.getAllWindows();
    windows.forEach((win) => {
      win.webContents.send('conversation:message-chunk', data);
    });
  });
}
