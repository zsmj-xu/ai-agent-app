/**
 * 会话管理相关类型
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  agentType?: string;
}

export interface Conversation {
  id: string;
  agentType: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
}

export interface SendMessageResponse {
  messageId: string;
  content: string;
}
