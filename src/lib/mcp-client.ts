/**
 * MCP Client for Hex AI
 * Abstracts communication with MCP adapter (DeepSeek backend)
 */

export interface MCPMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface MCPClientConfig {
  adapterUrl: string;
  onChunk?: (chunk: MCPChunk) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export interface MCPChunk {
  type: 'connected' | 'content' | 'tool_call' | 'error' | 'done';
  content?: string;
  tool?: {
    name: string;
    arguments: any;
  };
  error?: string;
}

export class MCPClient {
  private config: MCPClientConfig;
  private abortController: AbortController | null = null;

  constructor(config: MCPClientConfig) {
    this.config = config;
  }

  /**
   * Send message to MCP adapter and stream response
   */
  async sendMessage(
    messages: MCPMessage[],
    systemPrompt?: string,
    tools?: any[],
    abortSignal?: AbortSignal
  ): Promise<void> {
    this.abortController = new AbortController();
    
    try {
      // Calculate payload size for debugging
      const payload = {
        messages,
        systemPrompt,
        tools
      };
      const payloadStr = JSON.stringify(payload);
      const payloadSizeKB = (new Blob([payloadStr]).size / 1024).toFixed(2);
      console.log('[MCP] Sending request to:', this.config.adapterUrl);
      console.log('[MCP] Payload size:', payloadSizeKB, 'KB');
      console.log('[MCP] Messages:', messages.length, 'Tools:', tools?.length || 0);
      
      const response = await fetch(`${this.config.adapterUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payloadStr,
        signal: abortSignal || this.abortController.signal
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error('[MCP] Adapter error response:', response.status, errorText);
        throw new Error(`MCP Adapter error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (!data) continue;

            try {
              const parsed: MCPChunk = JSON.parse(data);
              
              // Handle different chunk types
              if (parsed.type === 'content' && parsed.content) {
                this.config.onChunk?.(parsed);
              } else if (parsed.type === 'tool_call' && parsed.tool) {
                this.config.onChunk?.(parsed);
              } else if (parsed.type === 'error') {
                this.config.onError?.(new Error(parsed.error || 'Unknown error'));
              } else if (parsed.type === 'done') {
                this.config.onComplete?.();
              } else if (parsed.type === 'connected') {
                console.log('[MCP] Connected to adapter');
              }
            } catch (parseError) {
              console.warn('[MCP] Failed to parse chunk:', parseError);
            }
          }
        }
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[MCP] Request aborted');
      } else {
        console.error('[MCP] Fetch/Stream error:', error);
        console.error('[MCP] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack?.substring(0, 500),
          adapterUrl: this.config.adapterUrl
        });
        
        // Provide more helpful error messages
        let errorMessage = error.message || 'Unknown error';
        if (error.message?.includes('fetch failed')) {
          errorMessage = `Cannot connect to MCP adapter at ${this.config.adapterUrl}. Please check that the adapter server is running on port 8083.`;
        } else if (error.message?.includes('413') || error.message?.includes('Payload Too Large')) {
          errorMessage = 'Request payload too large. Try reducing the conversation history or number of tools.';
        }
        
        this.config.onError?.(new Error(errorMessage));
      }
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Abort ongoing request
   */
  abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * List available tools
   */
  async listTools(): Promise<any[]> {
    try {
      const response = await fetch(`${this.config.adapterUrl}/tools`);
      if (!response.ok) {
        throw new Error(`Failed to list tools: ${response.status}`);
      }
      const data = await response.json();
      return data.tools || [];
    } catch (error) {
      console.error('[MCP] Failed to list tools:', error);
      return [];
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.adapterUrl}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}


