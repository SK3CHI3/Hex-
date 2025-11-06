/**
 * React Hook for MCP Client
 * Provides a simple interface for using MCP in React components
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { MCPClient, MCPMessage, MCPChunk } from '@/lib/mcp-client';

interface UseMCPOptions {
  adapterUrl: string;
  onChunk?: (chunk: MCPChunk) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export function useMCP(options: UseMCPOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const clientRef = useRef<MCPClient | null>(null);

  // Initialize client
  useEffect(() => {
    clientRef.current = new MCPClient({
      adapterUrl: options.adapterUrl,
      onChunk: options.onChunk,
      onError: (error) => {
        setIsStreaming(false);
        options.onError?.(error);
      },
      onComplete: () => {
        setIsStreaming(false);
        options.onComplete?.();
      }
    });

    // Health check
    const checkHealth = async () => {
      if (clientRef.current) {
        const healthy = await clientRef.current.healthCheck();
        setIsConnected(healthy);
      }
    };

    checkHealth();

    // Periodic health check
    const interval = setInterval(checkHealth, 30000);

    return () => {
      clearInterval(interval);
      if (clientRef.current) {
        clientRef.current.abort();
      }
    };
  }, [options.adapterUrl]);

  const sendMessage = useCallback(async (
    messages: MCPMessage[],
    systemPrompt?: string,
    tools?: any[]
  ) => {
    if (!clientRef.current) {
      throw new Error('MCP Client not initialized');
    }

    setIsStreaming(true);

    try {
      await clientRef.current.sendMessage(messages, systemPrompt, tools);
    } catch (error) {
      setIsStreaming(false);
      throw error;
    }
  }, []);

  const abort = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  const listTools = useCallback(async () => {
    if (!clientRef.current) {
      throw new Error('MCP Client not initialized');
    }
    return await clientRef.current.listTools();
  }, []);

  return {
    isConnected,
    isStreaming,
    sendMessage,
    abort,
    listTools
  };
}


