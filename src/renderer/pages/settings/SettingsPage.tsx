/**
 * 设置页面
 */

import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Message, Modal, Switch, Tabs } from '@arco-design/web-react';
import { AGENT_INSTALL_CONFIG } from '@shared/config/agent-install-config';
import type { AgentDetectionResult } from '@shared/types/agent';
import './SettingsPage.css';

const { TabPane } = Tabs;

export default function SettingsPage() {
  const [agents, setAgents] = useState<AgentDetectionResult[]>([]);
  const [gatewayConfig, setGatewayConfig] = useState<any>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [debugClicks, setDebugClicks] = useState(0);

  useEffect(() => {
    loadAgents();
    loadGatewayConfig();
  }, []);

  async function loadAgents() {
    try {
      const results = await window.api.setup.detectAgents();
      setAgents(results);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  }

  async function loadGatewayConfig() {
    try {
      const config = await window.api.gateway.getConfig();
      setGatewayConfig(config);
    } catch (error) {
      console.error('Failed to load gateway config:', error);
    }
  }

  async function handleUnlock() {
    setUnlocking(true);
    try {
      const result = await window.api.gateway.unlock(unlockPassword);
      if (result.success) {
        Message.success('解锁成功！现在可以修改网关配置');
        await loadGatewayConfig();
        setUnlockPassword('');
      } else {
        Message.error('密码错误');
      }
    } catch (error) {
      Message.error('解锁失败');
    } finally {
      setUnlocking(false);
    }
  }

  async function handleLock() {
    try {
      await window.api.gateway.lock();
      Message.success('已锁定网关配置');
      await loadGatewayConfig();
    } catch (error) {
      Message.error('锁定失败');
    }
  }

  function handleVersionClick() {
    setDebugClicks((prev) => prev + 1);

    if (debugClicks + 1 >= 5) {
      Modal.confirm({
        title: '进入高级模式',
        content: (
          <div>
            <p>你发现了隐藏的高级模式！</p>
            <p>在这里可以解锁网关配置。</p>
            <p style={{ marginTop: 16 }}>
              <strong>调试密码：</strong>debug-20240609
            </p>
          </div>
        ),
        onOk: () => {
          setDebugClicks(0);
        },
      });
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>设置</h1>
        <Button onClick={() => (window.location.href = '/chat')}>返回对话</Button>
      </div>

      <div className="settings-content">
        <Tabs defaultActiveTab="agents">
          <TabPane key="agents" title="Agent 管理">
            <div className="settings-section">
              <h2>已安装的 Agent</h2>
              <div className="agents-list">
                {agents.map((agent) => (
                  <Card key={agent.agentType} className="agent-item">
                    <div className="agent-item-header">
                      <div>
                        <h3>{agent.name}</h3>
                        <p>{AGENT_INSTALL_CONFIG[agent.agentType]?.description}</p>
                      </div>
                      <div className="agent-item-status">
                        {agent.installed ? (
                          <span className="status-badge installed">
                            ✅ 已安装 {agent.version}
                          </span>
                        ) : (
                          <span className="status-badge not-installed">❌ 未安装</span>
                        )}
                      </div>
                    </div>
                    {agent.installed && agent.path && (
                      <div className="agent-item-path">路径: {agent.path}</div>
                    )}
                    {!agent.installed && (
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => (window.location.href = '/setup')}
                      >
                        前往安装
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </TabPane>

          <TabPane key="gateway" title="网关配置">
            <div className="settings-section">
              <h2>API 网关配置</h2>

              {gatewayConfig && (
                <Card className="gateway-config">
                  <div className="config-item">
                    <label>网关名称：</label>
                    <span>{gatewayConfig.name}</span>
                  </div>
                  <div className="config-item">
                    <label>Base URL：</label>
                    <span>{gatewayConfig.baseUrl}</span>
                  </div>
                  <div className="config-item">
                    <label>API Key：</label>
                    <span>{gatewayConfig.apiKey}</span>
                  </div>
                  <div className="config-item">
                    <label>状态：</label>
                    <span className={gatewayConfig.locked ? 'locked' : 'unlocked'}>
                      {gatewayConfig.locked ? '🔒 已锁定' : '🔓 已解锁'}
                    </span>
                  </div>

                  {gatewayConfig.locked ? (
                    <div className="unlock-section">
                      <p className="unlock-hint">
                        配置已锁定。输入调试密码以解锁编辑功能。
                      </p>
                      <div className="unlock-form">
                        <Input.Password
                          placeholder="输入调试密码"
                          value={unlockPassword}
                          onChange={setUnlockPassword}
                          onPressEnter={handleUnlock}
                        />
                        <Button
                          type="primary"
                          onClick={handleUnlock}
                          loading={unlocking}
                          disabled={!unlockPassword}
                        >
                          解锁
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="unlock-section">
                      <p className="unlock-hint success">
                        ✅ 配置已解锁，现在可以修改（重启应用后生效）
                      </p>
                      <Button onClick={handleLock}>锁定配置</Button>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </TabPane>

          <TabPane key="about" title="关于">
            <div className="settings-section">
              <h2>关于应用</h2>
              <Card className="about-card">
                <div className="about-content">
                  <h3>AI Agent 助手</h3>
                  <p
                    className="version"
                    onClick={handleVersionClick}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    版本 0.1.0
                  </p>
                  <p className="description">
                    一个支持多 AI Agent 对话的桌面应用
                  </p>

                  <div className="features">
                    <h4>支持的 Agent：</h4>
                    <ul>
                      <li>Claude Code - 最强代码助手</li>
                      <li>Codex - GitHub 出品</li>
                      <li>OpenClaw - 开源 AI 助手</li>
                      <li>Hermes - 轻量级助手</li>
                    </ul>
                  </div>

                  <div className="tech-stack">
                    <h4>技术栈：</h4>
                    <p>Electron + React + TypeScript + Arco Design</p>
                  </div>

                  {debugClicks > 0 && debugClicks < 5 && (
                    <p className="debug-hint">
                      再点击 {5 - debugClicks} 次版本号解锁高级模式
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
}
