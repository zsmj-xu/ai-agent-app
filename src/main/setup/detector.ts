/**
 * Agent CLI 工具检测器
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { AGENT_INSTALL_CONFIG, getInstallPath } from '@shared/config/agent-install-config';
import type { AgentDetectionResult } from '@shared/types/agent';

const execAsync = promisify(exec);

export class AgentDetector {
  /**
   * 检测单个 Agent 是否已安装
   */
  async detectAgent(agentType: string): Promise<AgentDetectionResult> {
    const config = AGENT_INSTALL_CONFIG[agentType];
    if (!config) {
      return {
        agentType,
        name: agentType,
        installed: false,
      };
    }

    const commandName = agentType; // claude, codex, openclaw, hermes
    const installPath = getInstallPath(agentType);

    try {
      // 方法1: 尝试执行 --version
      const { stdout } = await execAsync(`${commandName} --version`, {
        timeout: 5000,
      });

      const version = stdout.trim().split('\n')[0];

      return {
        agentType,
        name: config.name,
        installed: true,
        version,
        path: installPath,
      };
    } catch (error) {
      // 方法2: 检查安装路径是否存在
      if (existsSync(installPath)) {
        try {
          const { stdout } = await execAsync(`"${installPath}" --version`, {
            timeout: 5000,
          });

          const version = stdout.trim().split('\n')[0];

          return {
            agentType,
            name: config.name,
            installed: true,
            version,
            path: installPath,
          };
        } catch {
          // 文件存在但无法执行
          return {
            agentType,
            name: config.name,
            installed: false,
          };
        }
      }

      // 未安装
      return {
        agentType,
        name: config.name,
        installed: false,
      };
    }
  }

  /**
   * 检测所有 Agent
   */
  async detectAllAgents(): Promise<AgentDetectionResult[]> {
    const agentTypes = Object.keys(AGENT_INSTALL_CONFIG);
    const results = await Promise.all(agentTypes.map((type) => this.detectAgent(type)));
    return results;
  }
}
