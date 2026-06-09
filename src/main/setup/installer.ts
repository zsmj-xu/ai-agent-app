/**
 * Agent 自动安装器
 * 核心功能：下载、解压、安装、验证
 */

import { BinaryDownloader } from './downloader';
import { AgentDetector } from './detector';
import { AGENT_INSTALL_CONFIG, getPlatformKey, getInstallPath } from '@shared/config/agent-install-config';
import { chmod, mkdir, rename, rm } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { dirname } from 'path';
import type { InstallProgress, InstallResult } from '@shared/types/agent';

const execAsync = promisify(exec);

export class AgentInstaller {
  private downloader: BinaryDownloader;
  private detector: AgentDetector;
  private activeInstalls = new Map<string, AbortController>();

  constructor() {
    this.downloader = new BinaryDownloader();
    this.detector = new AgentDetector();
  }

  /**
   * 安装单个 Agent
   */
  async install(
    agentType: string,
    onProgress: (progress: InstallProgress) => void
  ): Promise<InstallResult> {
    const config = AGENT_INSTALL_CONFIG[agentType];
    if (!config) {
      return {
        success: false,
        agentType,
        error: `Unknown agent type: ${agentType}`,
      };
    }

    const abortController = new AbortController();
    this.activeInstalls.set(agentType, abortController);

    try {
      // Step 1: 获取下载 URL
      const platformKey = getPlatformKey();
      const downloadUrl = config.releases[platformKey];

      if (!downloadUrl) {
        throw new Error(`No release available for platform: ${platformKey}`);
      }

      // Step 2: 下载
      onProgress({
        agentType,
        stage: 'downloading',
        progress: 0,
        message: '正在下载...',
      });

      const tempFile = `/tmp/ai-agent-${agentType}-${Date.now()}`;
      await this.downloader.download(
        downloadUrl,
        tempFile,
        (downloadProgress) => {
          onProgress({
            agentType,
            stage: 'downloading',
            progress: Math.round(downloadProgress.percent * 0.7), // 下载占70%
            message: `下载中 ${Math.round(downloadProgress.percent)}%`,
            bytesDownloaded: downloadProgress.transferred,
            totalBytes: downloadProgress.total,
            speed: downloadProgress.speed,
          });
        },
        abortController.signal
      );

      // Step 3: 解压（如果是压缩包）
      let binaryFile = tempFile;
      if (downloadUrl.endsWith('.tar.gz') || downloadUrl.endsWith('.zip')) {
        onProgress({
          agentType,
          stage: 'extracting',
          progress: 75,
          message: '正在解压...',
        });

        const extractDir = `${tempFile}-extracted`;
        await this.extract(tempFile, extractDir);
        // 假设解压后的二进制文件就在根目录
        binaryFile = `${extractDir}/${agentType}`;
      }

      // Step 4: 安装到目标位置
      onProgress({
        agentType,
        stage: 'installing',
        progress: 85,
        message: '正在安装...',
      });

      const installPath = getInstallPath(agentType);
      await mkdir(dirname(installPath), { recursive: true });

      // 移动文件
      await rename(binaryFile, installPath);

      // Step 5: 设置权限（Unix）
      if (process.platform !== 'win32') {
        await chmod(installPath, 0o755);
      }

      // Step 6: Windows 下添加到 PATH（如果需要）
      if (process.platform === 'win32') {
        await this.addToWindowsPath(dirname(installPath));
      }

      // Step 7: 验证安装
      onProgress({
        agentType,
        stage: 'verifying',
        progress: 95,
        message: '正在验证...',
      });

      const detection = await this.detector.detectAgent(agentType);
      if (!detection.installed) {
        throw new Error('Installation verification failed');
      }

      // Step 8: 清理临时文件
      try {
        await rm(tempFile, { force: true, recursive: true });
        await rm(`${tempFile}-extracted`, { force: true, recursive: true });
      } catch {
        // 清理失败不影响安装结果
      }

      // Step 9: 完成
      onProgress({
        agentType,
        stage: 'completed',
        progress: 100,
        message: '安装完成',
      });

      return {
        success: true,
        agentType,
        version: detection.version,
        path: installPath,
      };
    } catch (error) {
      return {
        success: false,
        agentType,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      this.activeInstalls.delete(agentType);
    }
  }

  /**
   * 解压文件
   */
  private async extract(archivePath: string, destination: string): Promise<void> {
    await mkdir(destination, { recursive: true });

    if (archivePath.endsWith('.tar.gz')) {
      await execAsync(`tar -xzf "${archivePath}" -C "${destination}"`);
    } else if (archivePath.endsWith('.zip')) {
      if (process.platform === 'win32') {
        await execAsync(`powershell -command "Expand-Archive -Path '${archivePath}' -DestinationPath '${destination}'"`);
      } else {
        await execAsync(`unzip -q "${archivePath}" -d "${destination}"`);
      }
    }
  }

  /**
   * Windows 下添加目录到 PATH
   */
  private async addToWindowsPath(directory: string): Promise<void> {
    if (process.platform !== 'win32') return;

    try {
      // 读取当前用户 PATH
      const { stdout } = await execAsync(
        'powershell -command "[Environment]::GetEnvironmentVariable(\'Path\', \'User\')"'
      );

      const currentPath = stdout.trim();

      // 检查是否已经包含
      if (currentPath.includes(directory)) {
        return;
      }

      // 添加到 PATH
      const newPath = currentPath ? `${currentPath};${directory}` : directory;
      await execAsync(
        `powershell -command "[Environment]::SetEnvironmentVariable('Path', '${newPath}', 'User')"`
      );
    } catch (error) {
      console.error('Failed to add to Windows PATH:', error);
      // 不抛出错误，因为这不是致命问题
    }
  }

  /**
   * 取消安装
   */
  async cancel(agentType: string): Promise<void> {
    const controller = this.activeInstalls.get(agentType);
    if (controller) {
      controller.abort();
      this.activeInstalls.delete(agentType);
    }
  }

  /**
   * 批量安装
   */
  async installBatch(
    agentTypes: string[],
    onProgress: (progress: InstallProgress) => void
  ): Promise<InstallResult[]> {
    const results: InstallResult[] = [];

    for (const agentType of agentTypes) {
      const result = await this.install(agentType, onProgress);
      results.push(result);
    }

    return results;
  }
}
