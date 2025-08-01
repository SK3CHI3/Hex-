import { useState, useEffect, useCallback } from 'react';
import { ConversationManager, type Conversation, type Message } from '@/lib/supabase';
import { useAuth } from './use-auth';

export interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

export function useConversation() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ConversationMessage[]>([]); // Keep for UI display only
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load conversations (threads) when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations();
    } else {
      setConversations([]);
      setMessages([]);
      setCurrentConversationId(null);
    }
  }, [isAuthenticated, user?.id]);

  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      const manager = new ConversationManager(user.id);
      const convs = await manager.getConversations();
      setConversations(convs);

      // If no current conversation and we have conversations, select the most recent
      if (!currentConversationId && convs.length > 0) {
        setCurrentConversationId(convs[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [user?.id, currentConversationId]);



  const createNewConversation = useCallback(async (title?: string) => {
    if (!user) return null;

    try {
      const manager = new ConversationManager(user.id);
      const newConv = await manager.createConversation(title);
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
      setMessages([]);
      return newConv.id;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      return null;
    }
  }, [user?.id]);

  const addMessage = useCallback(async (
    type: 'user' | 'assistant',
    content: string,
    isError: boolean = false
  ) => {
    if (!user) return null;

    let conversationId = currentConversationId;

    if (!conversationId) {
      // Create a new conversation if none exists
      const newConvId = await createNewConversation();
      if (!newConvId) return null;
      conversationId = newConvId;
    }

    // Add message to UI state only (no database storage for individual messages)
    const newMessage: ConversationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: new Date(),
      isError
    };

    setMessages(prev => [...prev, newMessage]);

    // Update conversation thread's last activity
    try {
      const manager = new ConversationManager(user.id);
      // Just update the conversation's updated_at timestamp
      await manager.updateConversationTimestamp(conversationId);
      await loadConversations(); // Refresh thread list
    } catch (error) {
      console.error('Error updating conversation activity:', error);
    }

    return newMessage;
  }, [user?.id, currentConversationId, createNewConversation]);

  const switchConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
    setMessages([]); // Clear messages when switching threads
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      const manager = new ConversationManager(user.id);
      await manager.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));

      // If we deleted the current conversation, switch to another or create new
      if (conversationId === currentConversationId) {
        const remaining = conversations.filter(c => c.id !== conversationId);
        if (remaining.length > 0) {
          setCurrentConversationId(remaining[0].id);
        } else {
          setCurrentConversationId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  }, [user?.id, currentConversationId, conversations]);

  const clearAllConversations = useCallback(async () => {
    if (!user) return;

    try {
      const manager = new ConversationManager(user.id);
      await manager.clearAllConversations();
      setConversations([]);
      setCurrentConversationId(null);
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear conversations:', err);
    }
  }, [user?.id]);

  const getConversationHistory = useCallback((limit: number = 10): Array<{role: 'user' | 'assistant', content: string}> => {
    return messages
      .slice(-limit)
      .map(msg => ({
        role: msg.type,
        content: msg.content
      }));
  }, [messages]);

  const estimateTokens = useCallback((text: string): number => {
    return Math.ceil(text.length / 4);
  }, []);

  const getTotalTokens = useCallback((): number => {
    return messages.reduce((total, msg) => total + estimateTokens(msg.content), 0);
  }, [messages, estimateTokens]);

  const checkContextLimit = useCallback((newMessageContent: string): boolean => {
    const SYSTEM_PROMPT_TOKENS = 500; // Approximate system prompt size
    const CONTEXT_LIMIT = 30000; // Leave 2K buffer from 32K limit
    const RESPONSE_BUFFER = 8192; // Reserve space for AI response

    const currentTokens = getTotalTokens();
    const newMessageTokens = estimateTokens(newMessageContent);
    const totalTokens = SYSTEM_PROMPT_TOKENS + currentTokens + newMessageTokens + RESPONSE_BUFFER;

    return totalTokens >= CONTEXT_LIMIT;
  }, [getTotalTokens, estimateTokens]);

  const createNewChatWithNotification = useCallback(async (reason: string) => {
    if (!user) return null;

    try {
      // Create new conversation with descriptive title
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const title = `Continued Chat ${timestamp}`;

      const manager = new ConversationManager(user.id);
      const newConv = await manager.createConversation(title);
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
      setMessages([]);

      // Add notification message to new chat
      const notificationMessage: ConversationMessage = {
        id: `msg_${Date.now()}_notification`,
        type: 'assistant',
        content: `🔄 **New conversation started**\n\n${reason}\n\nYour previous conversation has been saved and you can access it from the sidebar. Please continue with your question.`,
        timestamp: new Date(),
        isError: false
      };

      setMessages([notificationMessage]);

      return newConv.id;
    } catch (err) {
      console.error('Failed to create new conversation with notification:', err);
      return null;
    }
  }, [user?.id]);

  return {
    // State
    messages,
    conversations,
    currentConversationId,
    isLoading,

    // Actions
    createNewConversation,
    addMessage,
    switchConversation,
    deleteConversation,
    clearAllConversations,
    loadConversations,

    // Utilities
    getConversationHistory,
    estimateTokens,
    getTotalTokens,
    checkContextLimit,
    createNewChatWithNotification,
  };
}
