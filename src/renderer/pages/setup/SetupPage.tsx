/**
 * 安装页面 - 支持选择安装
 */

import React, { useState, useEffect } from 'react';
import { Button, Card, Checkbox, Progress, Message, Space } from '@arco-design/web-react';
import { AGENT_INSTALL_CONFIG } from '@shared/config/agent-install-config';
import type { AgentInstallState } from '@shared/types/agent';
import './SetupPage.css';

type UIPhase = 'select' | 'installing' | 'complete';

export default function SetupPage() {
  const [agents, setAgents] = useState<AgentInstallState[]>([
    {
      name: 'Claude Code',
      agentType: 'claude-code',
      description: AGENT_INSTALL_CONFIG['claude-code'].description,
      size: AGENT_INSTALL_CONFIG['claude-code'].size,
      selected: AGENT_INSTALL_CONFIG['claude-code'].recommended,
      status: 'idle',
      progress: 0,
      message: '',
    },
    {
      name: 'Codex',
      agentType: 'codex',
      description: AGENT_INSTALL_CONFIG['codex'].description,
      size: AGENT_INSTALL_CONFIG['codex'].size,
      selected: AGENT_INSTALL_CONFIG['codex'].recommended,
      status: 'idle',
      progress: 0,
      message: '',
    },
    {
      name: 'OpenClaw',
      agentType: 'openclaw',
      description: AGENT_INSTALL_CONFIG['openclaw'].description,
      size: AGENT_INSTALL_CONFIG['openclaw'].size,
      selected: AGENT_INSTALL_CONFIG['openclaw'].recommended,
      status: 'idle',
      progress: 0,
      message: '',
    },
    {
      name: 'Hermes',
      agentType: 'hermes',
      description: AGENT_INSTALL_CONFIG['hermes'].description,
      size: AGENT_INSTALL_CONFIG['hermes'].size,
      selected: AGENT_INSTALL_CONFIG['hermes'].recommended,
      status: 'idle',
      progress: 0,
      message: '',
    },
  ]);

  const [installing, setInstalling] = useState(false);
  const [phase, setPhase] = useState<UIPhase>('select');

  useEffect(() => {
    // 检测已安装的 Agent
    detectInstalledAgents();
  }, []);

  async function detectInstalledAgents() {
    try {
      const results = await window.api.setup.detectAgents();
      setAgents((prev) =>
        prev.map((agent) => {
          const detected = results.find((r) => r.agentType === agent.agentType);
          if (detected?.installed) {
            return {
              ...agent,
              status: 'completed',
              progress: 100,
              message: '已安装',
              version: detected.version,
              selected: false, // 已安装的不需要再勾选
            };
          }
          return agent;
        })
      );
    } catch (error) {
      console.error('Failed to detect agents:', error);
    }
  }

  // 切换勾选状态
  function toggleSelection(agentType: string) {
    setAgents((prev) =>
      prev.map((a) => (a.agentType === agentType && a.status === 'idle' ? { ...a, selected: !a.selected } : a))
    );
  }

  // 全选
  function selectAll() {
    setAgents((prev) => prev.map((a) => (a.status === 'idle' ? { ...a, selected: true } : a)));
  }

  // 全不选
  function deselectAll() {
    setAgents((prev) => prev.map((a) => (a.status === 'idle' ? { ...a, selected: false } : a)));
  }

  // 安装单个 Agent
  async function installAgent(agentType: string) {
    setAgents((prev) =>
      prev.map((a) => (a.agentType === agentType ? { ...a, status: 'downloading', progress: 0, message: '准备中...' } : a))
    );

    // 监听进度更新
    const unsubscribe = window.api.setup.onInstallProgress((progress) => {
      if (progress.agentType === agentType) {
        setAgents((prev) =>
          prev.map((a) =>
            a.agentType === agentType
              ? {
                  ...a,
                  status: progress.stage === 'completed' ? 'completed' : 'installing',
                  progress: progress.progress,
                  message: progress.message,
                }
              : a
          )
        );
      }
    });

    try {
      const result = await window.api.setup.installAgent(agentType);

      if (result.success) {
        setAgents((prev) =>
          prev.map((a) => (a.agentType === agentType ? { ...a, status: 'completed', progress: 100, version: result.version } : a))
        );
        Message.success(`${agentType} 安装成功`);
      } else {
        setAgents((prev) => prev.map((a) => (a.agentType === agentType ? { ...a, status: 'failed', error: result.error } : a)));
        Message.error(`安装失败: ${result.error}`);
      }
    } finally {
      unsubscribe();
    }
  }

  // 批量安装已勾选的
  async function installSelected() {
    const toInstall = agents.filter((a) => a.selected && a.status === 'idle');

    if (toInstall.length === 0) {
      Message.warning('请至少选择一个工具');
      return;
    }

    setInstalling(true);
    setPhase('installing');

    // 标记未选择的为跳过
    setAgents((prev) => prev.map((a) => (!a.selected && a.status === 'idle' ? { ...a, status: 'skipped' } : a)));

    // 依次安装
    for (const agent of toInstall) {
      await installAgent(agent.agentType);
    }

    setInstalling(false);
    setPhase('complete');
  }

  // 统计信息
  const selectedAgents = agents.filter((a) => a.selected && a.status === 'idle');
  const totalSize = selectedAgents.reduce((sum, a) => sum + parseInt(a.size), 0);
  const completedCount = agents.filter((a) => a.status === 'completed').length;
  const failedCount = agents.filter((a) => a.status === 'failed').length;
  const skippedCount = agents.filter((a) => a.status === 'skipped').length;
  const canProceed = completedCount >= 1;

  // 渲染选择阶段
  if (phase === 'select') {
    return (
      <div className="setup-page">
        <h1>🎉 欢迎使用 AI Agent 助手</h1>
        <p className="subtitle">请选择要安装的 AI 工具：</p>

        <div className="agents-list">
          {agents.map((agent) => (
            <Card
              key={agent.agentType}
              className={`agent-card ${agent.selected ? 'selected' : ''} ${agent.status !== 'idle' ? 'disabled' : ''}`}
              hoverable={agent.status === 'idle'}
            >
              <div className="agent-content">
                <Checkbox
                  checked={agent.selected}
                  disabled={agent.status !== 'idle'}
                  onChange={() => toggleSelection(agent.agentType)}
                >
                  <div className="agent-info">
                    <div className="agent-header">
                      <span className="agent-name">{agent.name}</span>
                      {agent.status === 'completed' && <span className="status-badge completed">✅ 已安装 {agent.version}</span>}
                      {agent.status === 'idle' && <span className="status-badge idle">[未安装]</span>}
                      {AGENT_INSTALL_CONFIG[agent.agentType].recommended && agent.status === 'idle' && (
                        <span className="recommended-badge">✅ 推荐</span>
                      )}
                    </div>
                    <div className="agent-description">{agent.description}</div>
                    <div className="agent-size">大小: {agent.size}</div>
                  </div>
                </Checkbox>

                {agent.status === 'idle' && (
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      installAgent(agent.agentType);
                    }}
                  >
                    安装
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="selection-summary">已选择: {selectedAgents.length} 个工具，总大小约 {totalSize}MB</div>

        <div className="actions">
          <Space>
            <Button onClick={selectAll}>全选</Button>
            <Button onClick={deselectAll}>全不选</Button>
          </Space>

          <Space>
            <Button onClick={() => (window.location.href = '/chat')}>跳过此步</Button>
            <Button type="primary" size="large" onClick={installSelected} disabled={selectedAgents.length === 0}>
              安装已选 ({selectedAgents.length}个)
            </Button>
          </Space>
        </div>
      </div>
    );
  }

  // 渲染安装中阶段
  if (phase === 'installing') {
    const installedCount = agents.filter((a) => a.status === 'completed').length;
    const totalToInstall = agents.filter((a) => a.selected || a.status === 'completed' || a.status === 'downloading' || a.status === 'installing')
      .length;

    return (
      <div className="setup-page">
        <h1>
          正在安装 AI 工具... ({installedCount}/{totalToInstall})
        </h1>

        <div className="agents-list">
          {agents
            .filter((a) => a.status !== 'skipped')
            .map((agent) => (
              <Card key={agent.agentType} className="agent-card">
                <div className="agent-header">
                  <span className="agent-name">{agent.name}</span>
                  <span className={`status-badge ${agent.status}`}>
                    {agent.status === 'completed' && `✅ 已完成 ${agent.version}`}
                    {agent.status === 'downloading' && '⬇️ 下载中'}
                    {agent.status === 'installing' && '⏳ 安装中'}
                    {agent.status === 'failed' && '❌ 失败'}
                    {agent.status === 'idle' && '⏳ 等待中...'}
                  </span>
                </div>

                {(agent.status === 'downloading' || agent.status === 'installing') && (
                  <div className="progress-section">
                    <Progress percent={agent.progress} status={agent.status === 'failed' ? 'error' : undefined} />
                    <span className="progress-message">{agent.message}</span>
                  </div>
                )}
              </Card>
            ))}
        </div>
      </div>
    );
  }

  // 渲染完成阶段
  return (
    <div className="setup-page">
      <h1>✅ 安装完成！</h1>

      {completedCount > 0 && (
        <div className="success-section">
          <h3>已成功安装 {completedCount} 个 AI 工具：</h3>
          {agents
            .filter((a) => a.status === 'completed')
            .map((agent) => (
              <div key={agent.agentType} className="agent-summary">
                ✅ {agent.name} {agent.version}
              </div>
            ))}
        </div>
      )}

      {failedCount > 0 && (
        <div className="failed-section">
          <h3>⚠️ {failedCount} 个工具安装失败：</h3>
          {agents
            .filter((a) => a.status === 'failed')
            .map((agent) => (
              <div key={agent.agentType} className="agent-summary error">
                ❌ {agent.name} {agent.error}
                <Space>
                  <Button size="small" onClick={() => installAgent(agent.agentType)}>
                    重试
                  </Button>
                </Space>
              </div>
            ))}
        </div>
      )}

      {skippedCount > 0 && (
        <div className="skipped-section">
          <h3>跳过的工具：</h3>
          {agents
            .filter((a) => a.status === 'skipped')
            .map((agent) => (
              <div key={agent.agentType} className="agent-summary">
                ⊘ {agent.name} 可在设置中稍后安装
              </div>
            ))}
        </div>
      )}

      <div className="actions">
        <Button onClick={() => setPhase('select')}>返回选择</Button>
        <Button type="primary" size="large" disabled={!canProceed} onClick={() => (window.location.href = '/chat')}>
          开始使用
        </Button>
      </div>
    </div>
  );
}
