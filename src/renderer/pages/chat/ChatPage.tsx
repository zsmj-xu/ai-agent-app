/**
 * 对话页面
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button, Select, Input, Message, Spin } from '@arco-design/web-react';
import { AGENT_INSTALL_CONFIG } from '@shared/config/agent-install-config';
import type { Message as MessageType } from '@shared/types/conversation';
import './ChatPage.css';

const { TextArea } = Input;
const { Option } = Select;

export default function ChatPage() {
  const [availableAgents, setAvailableAgents] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [conversationId, setConversationId] = useState<string>('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 检测已安装的 Agent
  useEffect(() => {
    detectInstalledAgents();
  }, []);

  // 监听消息
  useEffect(() => {
    const unsubscribeMessage = window.api.conversation.onMessage((data) => {
      if (data.conversationId === conversationId) {
        const newMessage: MessageType = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: data.content,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, newMessage]);
        setSending(false);
      }
    });

    const unsubscribeChunk = window.api.conversation.onMessageChunk((data) => {
      if (data.conversationId === conversationId) {
        // 流式输出：更新最后一条消息
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant') {
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + data.chunk },
            ];
          } else {
            // 创建新消息
            return [
              ...prev,
              {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: data.chunk,
                timestamp: Date.now(),
              },
            ];
          }
        });
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeChunk();
    };
  }, [conversationId]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function detectInstalledAgents() {
    try {
      const results = await window.api.setup.detectAgents();
      const installed = results.filter((r) => r.installed).map((r) => r.agentType);
      setAvailableAgents(installed);

      if (installed.length > 0) {
        setSelectedAgent(installed[0]);
      }
    } catch (error) {
      console.error('Failed to detect agents:', error);
      Message.error('检测 Agent 失败');
    }
  }

  async function handleAgentChange(agentType: string) {
    if (conversationId) {
      // 关闭当前会话
      await window.api.conversation.close(conversationId);
    }

    setSelectedAgent(agentType);
    setConversationId('');
    setMessages([]);
  }

  async function handleSend() {
    if (!inputValue.trim()) {
      return;
    }

    if (!selectedAgent) {
      Message.warning('请先选择一个 Agent');
      return;
    }

    setSending(true);

    try {
      // 创建会话（如果还没有）
      let currentConvId = conversationId;
      if (!currentConvId) {
        setConnecting(true);
        const result = await window.api.conversation.create(selectedAgent);
        currentConvId = result.conversationId;
        setConversationId(currentConvId);
        setConnecting(false);
      }

      // 添加用户消息
      const userMessage: MessageType = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: inputValue,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // 发送消息
      await window.api.conversation.sendMessage({
        conversationId: currentConvId,
        content: inputValue,
      });

      setInputValue('');
    } catch (error) {
      console.error('Failed to send message:', error);
      Message.error('发送消息失败');
      setSending(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (availableAgents.length === 0) {
    return (
      <div className="chat-page empty">
        <div className="empty-state">
          <h2>暂无可用的 AI Agent</h2>
          <p>请先安装至少一个 Agent</p>
          <Button type="primary" onClick={() => (window.location.href = '/setup')}>
            前往安装
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h1>AI Agent 对话</h1>
        <div className="agent-selector">
          <span>选择 Agent：</span>
          <Select
            value={selectedAgent}
            onChange={handleAgentChange}
            style={{ width: 200 }}
            disabled={sending}
          >
            {availableAgents.map((agentType) => (
              <Option key={agentType} value={agentType}>
                {AGENT_INSTALL_CONFIG[agentType]?.name || agentType}
              </Option>
            ))}
          </Select>
          <Button size="small" onClick={() => (window.location.href = '/settings')}>
            设置
          </Button>
        </div>
      </div>

      <div className="chat-messages">
        {connecting && (
          <div className="connecting-indicator">
            <Spin />
            <span>正在连接 {AGENT_INSTALL_CONFIG[selectedAgent]?.name}...</span>
          </div>
        )}

        {messages.length === 0 && !connecting && (
          <div className="welcome-message">
            <h2>👋 你好！</h2>
            <p>开始与 {AGENT_INSTALL_CONFIG[selectedAgent]?.name} 对话吧</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              <div className="message-text">{msg.content}</div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {sending && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="message-text typing">
                <Spin size={14} />
                <span>正在思考...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <TextArea
          value={inputValue}
          onChange={setInputValue}
          onKeyPress={handleKeyPress}
          placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
          autoSize={{ minRows: 2, maxRows: 6 }}
          disabled={sending || connecting}
        />
        <Button
          type="primary"
          size="large"
          onClick={handleSend}
          disabled={!inputValue.trim() || sending || connecting}
          loading={sending}
        >
          发送
        </Button>
      </div>
    </div>
  );
}
