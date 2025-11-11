/**
 * DeepSeek Adapter
 * Translates between MCP and DeepSeek API formats
 */

import { spawn } from 'child_process';

export class DeepSeekAdapter {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.mcpToolServerUrl = config.mcpToolServerUrl;
    this.mcpTools = null;
  }

  /**
   * List tools from MCP server
   */
  async listTools() {
    // For now, return hardcoded tools
    // In full implementation, this would query the MCP server
    return [];
  }

  /**
   * Convert MCP tool format to DeepSeek format
   */
  mcpToolToDeepSeek(mcpTool) {
    return {
      type: 'function',
      function: {
        name: mcpTool.name,
        description: mcpTool.description,
        parameters: mcpTool.inputSchema
      }
    };
  }

  /**
   * Stream chat with DeepSeek
   */
  async streamChat({ messages, systemPrompt, tools, onChunk, onError, onComplete }) {
    try {
      // Build conversation messages
      const conversationMessages = [];
      
      if (systemPrompt) {
        conversationMessages.push({
          role: 'system',
          content: systemPrompt
        });
      }

      conversationMessages.push(...messages);

      // Convert tools to DeepSeek format if provided
      const deepseekTools = tools ? tools : undefined;

      // Build request payload
      const requestPayload = {
        model: 'deepseek-chat',
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 8192,
        stream: true
      };

      if (deepseekTools && deepseekTools.length > 0) {
        requestPayload.tools = deepseekTools;
        requestPayload.tool_choice = 'auto';
      }

      console.log('[DeepSeek] Sending request:', {
        messageCount: conversationMessages.length,
        toolCount: deepseekTools?.length || 0,
        hasSystemPrompt: !!systemPrompt,
        tools: deepseekTools ? deepseekTools.map(t => t.function?.name || t.name).slice(0, 5) : 'none',
        hasToolChoice: requestPayload.tool_choice !== undefined
      });

      // Call DeepSeek API with timeout
      console.log('[DeepSeek] Calling API with payload size:', JSON.stringify(requestPayload).length, 'bytes');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      let response = null;
      try {
        response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestPayload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response || !response.ok) {
          const status = response ? response.status : 'unknown';
          const errorText = response ? await response.text().catch(() => 'Unable to read error response') : 'No response received';
          // Redact API key from error messages for security
          const sanitizedError = errorText.replace(/sk-[a-zA-Z0-9]{32}/g, 'sk-***REDACTED***');
          console.error('[DeepSeek] API Error:', status, sanitizedError);
          throw new Error(`DeepSeek API error: ${status} - Check your API key and credits`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('[DeepSeek] Request timeout after 2 minutes');
          throw new Error('DeepSeek API request timed out. The request may be too large or the service is slow.');
        }
        // If response is still null, it means fetch failed completely
        if (!response) {
          const errorMsg = fetchError.message || 'Unknown fetch error';
          console.error('[DeepSeek] Fetch failed:', errorMsg);
          throw new Error(`Failed to connect to DeepSeek API: ${errorMsg}`);
        }
        throw fetchError;
      }

      // Stream response - at this point response should be defined
      if (!response || !response.body) {
        throw new Error('No response received from DeepSeek API');
      }
      
      const reader = response.body.getReader();
      if (!reader) {
        throw new Error('No response body reader available from DeepSeek API');
      }
      
      const decoder = new TextDecoder();
      let fullContent = '';
      const toolCallsMap = new Map();
      let bytesReceived = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              
              // Debug logging for tool calls detection
              if (parsed.choices?.[0]) {
                const choice = parsed.choices[0];
                if (choice.delta?.tool_calls || choice.message?.tool_calls) {
                  console.log('[DeepSeek] 🔧 TOOL CALL CHUNK DETECTED:', {
                    inDelta: !!choice.delta?.tool_calls,
                    inMessage: !!choice.message?.tool_calls,
                    finishReason: choice.finish_reason,
                    deltaToolCalls: choice.delta?.tool_calls,
                    messageToolCalls: choice.message?.tool_calls
                  });
                }
              }

              // Handle content chunks
              if (parsed.choices?.[0]?.delta?.content) {
                const content = parsed.choices[0].delta.content;
                fullContent += content;
                
                onChunk({
                  type: 'content',
                  content: content
                });
              }
              
              // Check for tool calls in finish message (some APIs return tool_calls in final message)
              if (parsed.choices?.[0]?.message?.tool_calls) {
                console.log('[DeepSeek] ✅ Tool calls in finish message:', parsed.choices[0].message.tool_calls);
                const toolCalls = parsed.choices[0].message.tool_calls;
                
                for (const toolCall of toolCalls) {
                  const index = toolCall.index ?? 0;
                  
                  if (!toolCallsMap.has(index)) {
                    toolCallsMap.set(index, {
                      id: toolCall.id || '',
                      name: '',
                      arguments: ''
                    });
                  }
                  
                  const accumulated = toolCallsMap.get(index);
                  
                  if (toolCall.id) accumulated.id = toolCall.id;
                  if (toolCall.function?.name) accumulated.name = toolCall.function.name;
                  if (toolCall.function?.arguments) {
                    // Arguments are complete in finish message
                    accumulated.arguments = toolCall.function.arguments;
                  }
                }
              }

              // Handle tool calls in delta (streaming format)
              if (parsed.choices?.[0]?.delta?.tool_calls) {
                const toolCalls = parsed.choices[0].delta.tool_calls;
                console.log('[DeepSeek] ✅ Tool calls in delta (streaming):', toolCalls);
                
                for (const toolCall of toolCalls) {
                  const index = toolCall.index ?? 0;
                  
                  if (!toolCallsMap.has(index)) {
                    toolCallsMap.set(index, {
                      id: toolCall.id || '',
                      name: '',
                      arguments: ''
                    });
                  }
                  
                  const accumulated = toolCallsMap.get(index);
                  
                  if (toolCall.id) accumulated.id = toolCall.id;
                  if (toolCall.function?.name) accumulated.name = toolCall.function.name;
                  if (toolCall.function?.arguments) accumulated.arguments += toolCall.function.arguments;
                }
              }
              
              // Check finish_reason
              if (parsed.choices?.[0]?.finish_reason === 'tool_calls') {
                console.log('[DeepSeek] ✅ Finish reason: tool_calls - expecting tool calls in next message');
              }
            } catch (parseError) {
              console.warn('[DeepSeek] Failed to parse chunk:', parseError);
              if (data.length < 500) {
                console.warn('[DeepSeek] Raw data:', data);
              }
            }
          }
        }
      }

      // Process accumulated tool calls
      if (toolCallsMap.size > 0) {
        console.log('[DeepSeek] Tool calls detected:', toolCallsMap.size);
        console.log('[DeepSeek] Tool calls details:', Array.from(toolCallsMap.entries()));
        
        for (const [index, toolCall] of toolCallsMap) {
          console.log(`[DeepSeek] Processing tool call ${index}:`, {
            id: toolCall.id,
            name: toolCall.name,
            hasArguments: !!toolCall.arguments,
            argumentsLength: toolCall.arguments?.length || 0
          });
          
          if (toolCall.name && toolCall.arguments) {
            try {
              const args = JSON.parse(toolCall.arguments);
              console.log('[DeepSeek] Parsed tool arguments:', args);
              
              onChunk({
                type: 'tool_call',
                tool: {
                  name: toolCall.name,
                  arguments: args
                }
              });
              
              console.log('[DeepSeek] ✅ Tool call sent to frontend:', toolCall.name);

              // Execute tool via existing infrastructure
              // The frontend will handle this via the WebSocket connection
              
            } catch (error) {
              console.error('[DeepSeek] Failed to parse tool arguments:', error);
              console.error('[DeepSeek] Raw arguments string:', toolCall.arguments);
            }
          } else {
            console.warn('[DeepSeek] ⚠️ Tool call missing name or arguments:', {
              hasName: !!toolCall.name,
              hasArguments: !!toolCall.arguments,
              name: toolCall.name,
              argumentsPreview: toolCall.arguments?.substring(0, 100)
            });
          }
        }
      } else {
        console.log('[DeepSeek] No tool calls detected in response');
      }

      onComplete();

    } catch (error) {
      console.error('[DeepSeek] Stream error:', error);
      onError(error);
      onComplete();
    }
  }

  /**
   * Execute tool via MCP
   */
  async executeTool(toolName, args) {
    // This will be handled by the existing WebSocket infrastructure
    // The adapter just needs to translate and forward
    return {
      success: true,
      message: 'Tool execution delegated to WebSocket server'
    };
  }
}


