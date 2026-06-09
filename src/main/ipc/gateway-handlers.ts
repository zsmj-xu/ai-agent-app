/**
 * 网关配置 IPC Handlers
 */

import { ipcMain } from 'electron';
import { gatewayManager } from '../gateway/manager';

export function registerGatewayHandlers() {
  // 获取配置
  ipcMain.handle('gateway:getConfig', async () => {
    return gatewayManager.getConfig();
  });

  // 解锁
  ipcMain.handle('gateway:unlock', async (_event, { password }: { password: string }) => {
    const success = gatewayManager.unlock(password);
    return { success };
  });

  // 锁定
  ipcMain.handle('gateway:lock', async () => {
    gatewayManager.lock();
    return { success: true };
  });

  // 更新配置
  ipcMain.handle('gateway:updateConfig', async (_event, config: any) => {
    const success = gatewayManager.updateConfig(config);
    return { success };
  });

  // 重置配置
  ipcMain.handle('gateway:reset', async () => {
    gatewayManager.reset();
    return { success: true };
  });
}
