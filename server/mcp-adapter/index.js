/**
 * DeepSeek MCP Adapter
 * Bridges MCP protocol with DeepSeek API
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DeepSeekAdapter } from './deepseek-adapter.js';

dotenv.config();

const app = express();
const PORT = process.env.MCP_ADAPTER_PORT || 8083;

// Middleware
app.use(cors());
// Increase payload limit to handle large conversation histories and tool schemas
// Note: With optimizations, payloads should be <100KB, but allow 1MB for safety
app.use(express.json({ limit: '1mb' }));

// Create adapter instance
const adapter = new DeepSeekAdapter({
  apiKey: process.env.DEEPSEEK_API_KEY,
  mcpToolServerUrl: process.env.MCP_TOOL_SERVER_URL || 'stdio://mcp-server'
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'deepseek-mcp-adapter',
    timestamp: new Date().toISOString() 
  });
});

// Send message endpoint (with streaming)
app.post('/chat', async (req, res) => {
  try {
    const { messages, systemPrompt, tools } = req.body;
    
    // Log request info
    const payloadSize = JSON.stringify(req.body).length;
    console.log('[Adapter] Received chat request:', {
      messageCount: messages?.length || 0,
      toolCount: tools?.length || 0,
      payloadSizeKB: (payloadSize / 1024).toFixed(2),
      hasSystemPrompt: !!systemPrompt
    });

    if (!messages || !Array.isArray(messages)) {
      console.error('[Adapter] Invalid request: messages not array');
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Set headers for SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx

    // Send initial connection
    res.write('data: {"type":"connected"}\n\n');

    // Stream DeepSeek response
    await adapter.streamChat({
      messages,
      systemPrompt,
      tools,
      onChunk: (chunk) => {
        try {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        } catch (writeError) {
          console.error('[Adapter] Error writing chunk:', writeError);
        }
      },
      onError: (error) => {
        console.error('[Adapter] Stream error:', error);
        try {
          res.write(`data: ${JSON.stringify({
            type: 'error',
            error: error.message || 'Unknown error'
          })}\n\n`);
        } catch (writeError) {
          console.error('[Adapter] Error writing error chunk:', writeError);
        }
      },
      onComplete: () => {
        try {
          res.write('data: {"type":"done"}\n\n');
          res.end();
        } catch (endError) {
          console.error('[Adapter] Error ending stream:', endError);
        }
      }
    });

  } catch (error) {
    console.error('[Adapter] Fatal error:', error);
    console.error('[Adapter] Error stack:', error.stack);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: error.message || 'Internal server error',
        type: error.name || 'Error'
      });
    } else {
      // Try to send error via SSE if headers already sent
      try {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: error.message || 'Internal server error'
        })}\n\n`);
        res.end();
      } catch (e) {
        console.error('[Adapter] Could not send error response:', e);
      }
    }
  }
});

// List available tools
app.get('/tools', async (req, res) => {
  try {
    const tools = await adapter.listTools();
    res.json({ tools });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DeepSeek MCP Adapter running on port ${PORT}`);
  console.log(`📡 Ready to bridge MCP ↔ DeepSeek`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down...');
  process.exit(0);
});


