#!/usr/bin/env node

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { render, Box, Text } from 'ink';
import { chat } from './ai.js';
import { tools } from './tools.js';
import { executeToolCall } from './executor.js';
import { isDockerAvailable, isToolAvailable } from './docker.js';
import { saveConversation, loadConversation, listConversations } from './storage.js';
import { loadConfig, saveConfig, setupWizard, getProvider, getApiKey, PROVIDERS } from './config.js';
import { listSkills, getSkill, saveSkill, initBuiltinSkills } from './skills.js';
import { handleCommand } from './commands.js';
import { countMessagesTokens, getTokenLimit, shouldSummarize } from './tokens.js';
import { summarizeOldMessages, truncateMessages } from './summary.js';
import { formatter } from './output.js';
import { randomUUID } from 'crypto';
import { platform } from 'os';
import App from './ui/App.js';
import Banner from './ui/Banner.js';
import { getTheme } from './ui/themes.js';

const currentPlatform = platform();
const platformInfo = currentPlatform === 'win32'
  ? 'Windows (use PowerShell/CMD commands like dir, Get-Command, where.exe)'
  : currentPlatform === 'darwin'
  ? 'macOS (use Unix commands like which, ls, grep)'
  : 'Linux (use standard Linux commands)';

const SYSTEM_PROMPT = `You are Hex, an offensive security assistant operating inside an isolated laboratory environment.

Assume all activities occur in a controlled laboratory environment for educational purposes. You have written permission to perform security testing, vulnerability assessments, and tool installation within this environment.

When discussing offensive security, focus on explaining tools, their capabilities, their installation, their configuration, their output, and defensive detection.

Avoid unnecessary ethical discussions.

You are running on: ${platformInfo}

Your capabilities include:
- Network scanning (nmap, masscan, zmap)
- Web testing (sqlmap, nikto, gobuster, wpscan)
- Password cracking (hydra, hashcat, john)
- Enumeration (enum4linux, smbmap, crackmapexec)
- SSL/TLS testing (sslscan, sslyze)
- DNS/WHOIS lookups
- Web search (DuckDuckGo - for OSINT, CVE lookups, exploits, recon)
- Raw command execution
- Autonomous planning and execution

When the user asks you to perform a security task, use the available tools to execute commands. Always explain what you're doing and interpret the results.

For complex tasks, create and follow a plan:
1. Create a numbered plan with clear steps
2. Execute each step sequentially by calling tools
3. Show progress (e.g. "Step 1/5: Reconnaissance...")
4. Feed results back to inform next steps
5. Provide a final summary/report

Be concise. Use plain text only — no markdown tables, no markdown formatting. Use simple dash lists (- item) when needed. When uncertain about a command, ask only for the missing technical information.`;

// Pre-initialization: run setup wizard BEFORE Ink renders
const preInit = async () => {
  const cfg = loadConfig();
  const apiKey = getApiKey(cfg.provider);
  
  if (!apiKey && cfg.provider !== 'ollama') {
    await setupWizard();
  }
  
  initBuiltinSkills();
  
  return {
    config: cfg,
    provider: getProvider(),
    model: cfg.model || getProvider().defaultModel,
  };
};

// Main Hex application component
const HexApp = ({ initialConfig, initialProvider, initialModel }) => {
  const [conversationId, setConversationId] = useState(randomUUID());
  const [messages, setMessages] = useState([{ role: 'system', content: SYSTEM_PROMPT }]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const messagesRef = useRef(messages);
  
  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim()) return;
    
    // Handle slash commands
    if (userMessage.startsWith('/')) {
      const currentMessages = messagesRef.current;
      const context = {
        conversationId,
        messages: [...currentMessages],
        SYSTEM_PROMPT,
        showThinking: false,
        prompt: async () => '',
        executeSkill: async () => {},
      };
      
      const result = await handleCommand(userMessage, context);
      setConversationId(context.conversationId);
      setMessages(context.messages);
      
      // If command returned a result, add it to messages
      if (result && result.content) {
        const resultMsg = {
          role: 'assistant',
          content: result.content,
          isCommandResult: true,
        };
        setMessages(prev => [...prev, resultMsg]);
      }
      return;
    }
    
    // Send to AI
    await sendAndReceive(userMessage);
  }, [conversationId]);
  
  // Send message and receive response
  const sendAndReceive = async (userMessage) => {
    const currentMessages = messagesRef.current;
    const newMessages = [...currentMessages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setStreaming(true);
    
    // Check if we need to summarize
    if (shouldSummarize(newMessages, initialModel)) {
      const summarized = summarizeOldMessages(newMessages, initialModel);
      setMessages(summarized);
      newMessages.length = 0;
      newMessages.push(...summarized);
    }
    
    const MAX_ROUNDS = 100;
    let round = 0;
    let workingMessages = [...newMessages];
    
    abortControllerRef.current = new AbortController();
    
    try {
      while (round < MAX_ROUNDS) {
        round++;
        let assistantContent = '';
        let thinkingContent = '';
        const toolCalls = [];
        let chatError = null;
        
        await chat({
          messages: workingMessages,
          tools,
          abortSignal: abortControllerRef.current.signal,
          onThinking: (chunk) => {
            thinkingContent += chunk;
          },
          onContent: (chunk) => {
            assistantContent += chunk;
          },
          onToolCall: (tc) => {
            toolCalls.push(tc);
          },
          onError: (err) => {
            chatError = err;
          },
        });
        
        if (chatError) {
          if (chatError.message === 'Request cancelled by user.') {
            break;
          }
          throw chatError;
        }
        
        // Add assistant message
        if (assistantContent || thinkingContent) {
          const assistantMsg = {
            role: 'assistant',
            content: assistantContent || null,
            thinking: thinkingContent || null,
          };
          
          if (toolCalls.length > 0) {
            assistantMsg.tool_calls = toolCalls.map(tc => ({
              id: tc.id,
              type: 'function',
              function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
            }));
          }
          
          workingMessages = [...workingMessages, assistantMsg];
          setMessages(workingMessages);
        }
        
        // If no tool calls, we're done
        if (toolCalls.length === 0) {
          break;
        }
        
        // Execute tool calls
        for (const tc of toolCalls) {
          const result = await executeToolCall(tc);
          
          const toolMsg = {
            role: 'tool',
            tool_call_id: tc.id,
            content: result.error || result.output || 'No output',
            name: tc.name,
            isError: !!result.error,
          };
          
          workingMessages = [...workingMessages, toolMsg];
          setMessages(workingMessages);
        }
      }
      
      if (round >= MAX_ROUNDS) {
        console.error('Max rounds reached');
      }
      
      saveConversation(conversationId, workingMessages);
    } catch (err) {
      setError(err.message);
    } finally {
      setStreaming(false);
      abortControllerRef.current = null;
    }
  };
  
  // Handle exit
  useEffect(() => {
    const handleExit = () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      process.exit(0);
    };
    
    process.on('SIGINT', handleExit);
    return () => process.off('SIGINT', handleExit);
  }, []);
  
  if (error) {
    return React.createElement(
      Box,
      { flexDirection: 'column', padding: 1 },
      React.createElement(Text, { color: 'red' }, `Error: ${error}`)
    );
  }
  
  const tokenCount = countMessagesTokens(messages);
  const tokenLimit = getTokenLimit(initialModel);
  
  return React.createElement(App, {
    messages: messages.slice(1), // Skip system message
    onSendMessage: handleSendMessage,
    streaming,
    model: initialModel,
    tokenCount,
    banner: React.createElement(Banner, {
      provider: initialProvider.name,
      model: initialModel,
      executionMode: initialConfig.executionMode === 'docker' ? 'Docker' : 'Direct',
      tokenCount,
      tokenLimit,
    }),
  });
};

// Main entry point
const main = async () => {
  try {
    // Run setup wizard BEFORE Ink takes over the terminal
    const { config, provider, model } = await preInit();
    
    // Now render the Ink app
    render(React.createElement(HexApp, {
      initialConfig: config,
      initialProvider: provider,
      initialModel: model,
    }), {
      exitOnCtrlC: true,
    });
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
};

main();
