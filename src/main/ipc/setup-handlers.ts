/**
 * Setup IPC Handlers
 * 处理安装相关的 IPC 请求
 */

import { ipcMain } from 'electron';
import { AgentInstaller } from '../setup/installer';
import { AgentDetector } from '../setup/detector';

const installer = new AgentInstaller();
const detector = new AgentDetector();

export function registerSetupHandlers() {
  // 检测所有 Agent
  ipcMain.handle('setup:detectAgents', async () => {
    return await detector.detectAllAgents();
  });

  // 检测单个 Agent
  ipcMain.handle('setup:detectAgent', async (_event, { agentType }: { agentType: string }) => {
    return await detector.detectAgent(agentType);
  });

  // 安装 Agent
  ipcMain.handle('setup:installAgent', async (event, { agentType }: { agentType: string }) => {
    return await installer.install(agentType, (progress) => {
      // 发送进度更新到渲染进程
      event.sender.send('setup:installProgress', progress);
    });
  });

  // 取消安装
  ipcMain.handle('setup:cancelInstall', async (_event, { agentType }: { agentType: string }) => {
    await installer.cancel(agentType);
    return { success: true };
  });

  // 批量安装
  ipcMain.handle(
    'setup:installBatch',
    async (event, { agentTypes }: { agentTypes: string[] }) => {
      return await installer.installBatch(agentTypes, (progress) => {
        event.sender.send('setup:installProgress', progress);
      });
    }
  );
}
