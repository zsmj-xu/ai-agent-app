/**
 * 主进程入口
 */

import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { registerSetupHandlers } from './ipc/setup-handlers';
import { registerConversationHandlers } from './ipc/conversation-handlers';
import { registerGatewayHandlers } from './ipc/gateway-handlers';
import { sessionManager } from './agent/session-manager';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  // 加载应用
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 应用启动
app.whenReady().then(() => {
  // 注册 IPC handlers
  registerSetupHandlers();
  registerConversationHandlers();
  registerGatewayHandlers();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出
app.on('window-all-closed', () => {
  // 清理所有会话
  sessionManager.cleanup().then(() => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});
