/**
 * MCP Tool Server for Hex AI
 * Exposes pentesting tools via Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { mcpTools, toolCommandMap } from './tools.js';
import { executeToolCommand } from './executor.js';

class HexMCPToolServer {
  constructor() {
    this.server = new Server(
      {
        name: 'hex-pentesting-tools',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error('[MCP] Listing tools...');
      return {
        tools: mcpTools,
      };
    });

    // Execute tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      console.error(`[MCP] Tool call: ${name}`, args);

      try {
        // Validate tool exists
        if (!toolCommandMap[name]) {
          throw new Error(`Unknown tool: ${name}`);
        }

        // Execute the tool
        const result = await executeToolCommand(name, args);

        return {
          content: [
            {
              type: 'text',
              text: result.output,
            },
          ],
          isError: result.isError,
        };
      } catch (error) {
        console.error(`[MCP] Tool execution error:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP] Server error:', error);
    };

    process.on('SIGINT', async () => {
      console.error('[MCP] Shutting down...');
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[MCP] Hex Pentesting Tool Server running on stdio');
  }
}

// Start the server
const server = new HexMCPToolServer();
server.run().catch((error) => {
  console.error('[MCP] Failed to start server:', error);
  process.exit(1);
});


