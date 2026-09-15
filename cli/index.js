#!/usr/bin/env node

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { render, Box, Text, useInput } from 'ink';
import { chat } from './ai/ai.js';
import { tools } from './tools/tools.js';
import { executeToolCall } from './tools/executor.js';
import { saveConversation } from './storage/storage.js';
import { loadConfig, setupWizard, getProvider, getApiKey, isLocalProvider } from './core/config.js';
import { initBuiltinSkills } from './storage/skills.js';
import { handleCommand } from './core/commands.js';
import { countMessagesTokens, getTokenLimit, shouldSummarize } from './ai/tokens.js';
import { summarizeOldMessages } from './ai/summary.js';
import { randomUUID } from 'crypto';
import { platform } from 'os';
import App from './ui/App.js';
import Banner from './ui/Banner.js';

const currentPlatform = platform();
const platformInfo = currentPlatform === 'win32'
  ? 'Windows (use PowerShell/CMD commands like dir, Get-Command, where.exe)'
  : currentPlatform === 'darwin'
  ? 'macOS (use Unix commands like which, ls, grep)'
  : 'Linux (use standard Linux commands)';

const SYSTEM_PROMPT = `You are Hex, an autonomous penetration testing assistant. You operate in an isolated lab environment with full permission to perform security testing, vulnerability assessments, and tool installation.

=== EXECUTION ENVIRONMENT ===
${platformInfo}

You can execute commands in two modes:
- Direct: Commands run on the host system
- Docker: Commands run inside a Kali Linux container with 42+ pre-installed tools

=== AVAILABLE TOOLS ===
You have direct access to these tools via function calling. Use them by name with proper arguments:

**Reconnaissance:**
- nmap_scan(target, scan_type) — Network scanning (ping, quick, port, service, full, stealth, vuln)
- whois_lookup(domain) — Domain registration info
- dns_lookup(domain, record_type) — DNS records (A, AAAA, MX, NS, TXT, CNAME, SOA, ANY)
- sslscan(target, port) — SSL/TLS configuration testing

**Web Application Testing:**
- sqlmap_test(url, level, risk, technique, dump_db) — SQL injection testing and exploitation
- nikto_scan(target, port, ssl) — Web vulnerability scanner
- gobuster_scan(url, wordlist, extensions, threads) — Directory/file brute-forcing
- wpscan(url, enumerate, detection_mode) — WordPress scanning
- curl_request(url, method, headers, data) — HTTP requests

**Password Attacks:**
- hydra_attack(target, service, username, password_list, threads) — Online brute-force (ssh, ftp, http-get, mysql, postgres, rdp, vnc)
- hashcat_crack(hash, hash_type, attack_mode, wordlist) — Offline hash cracking (md5, sha1, sha256, sha512, ntlm, bcrypt)

**Enumeration:**
- enum4linux(target, enumerate) — Windows/SMB enumeration (users, shares, groups, all)
- smbmap(target, username, password, domain) — SMB enumeration

**Utilities:**
- web_search(query, max_results) — Search DuckDuckGo for exploits, CVEs, PoCs, documentation
- install_tool(tool_name, install_method) — Install missing tools (apt, pip, npm, go, git)
- raw_command(command) — Execute any shell command directly
- skill_manage(action, name, description, steps) — Create/delete/list reusable attack workflows

=== AGENTIC BEHAVIOR ===
You operate in an autonomous loop. When given a task:
1. Plan the approach (briefly state what you'll do)
2. Execute tools sequentially, using results from each step to inform the next
3. Chain multiple tools without asking for permission
4. If a tool fails, diagnose and retry with different parameters
5. Continue until the objective is complete

Example autonomous workflow:
User: "Scan 192.168.1.0/24 for web servers and test them for SQL injection"
You: 
- nmap_scan("192.168.1.0/24",) → find hosts with port 80/443
- For each web server found: sqlmap_test(target, url, parameter)
- Report findings

=== SKILLS SYSTEM ===
Skills are reusable multi-step workflows. Create them when users ask to "save this as a skill" or "make this reusable".

To create a skill:
skill_manage({
  action: "create",
  name: "skill-name",
  description: "What it does",
  steps: [
    { tool: "nmap_scan", args: { target: "{{target}}", scan_type: "quick" } },
    { tool: "sqlmap_test", args: { target: "{{target}}", url: "{{url}}" } }
  ]
})

Use {{variable}} placeholders for user-provided values. Users run skills with: /skill skill-name target=10.0.0.1

Other operations:
- List: skill_manage({ action: "list" })
- Delete: skill_manage({ action: "delete", name: "skill-name" })

=== RESPONSE FORMAT ===
- Plain text only, no markdown
- Use dash lists for multi-item steps
- Be concise in explanations, exhaustive in commands
- When executing tools, briefly state what you're doing and why
- Show tool output interpretation after execution
- If suggesting commands without executing, provide full command with explanation

=== TOOL CALLING ===
When you need to use a tool, output the tool call in the format the system expects. The system will execute it and provide the result. You can chain multiple tool calls in sequence.

Example:
"I'll scan the target network first."
[tool call: nmap_scan with target="10.0.0.0/24", scan_type="quick"]
[system provides result]
"Found 3 hosts with web servers. Testing each for SQL injection."
[tool call: sqlmap_test for each host]

=== AUTONOMOUS EXECUTION ===
- Do not ask for permission between steps
- Do not say "I can help with that" — just do it
- If you need more information, use tools to gather it
- If a command fails, try alternatives
- Chain tools logically: recon → enumeration → exploitation → post-exploitation

=== SEARCH CAPABILITY ===
Use web_search to find:
- CVE details and PoC code
- Exploit-DB entries
- GitHub repositories with tools
- Technical documentation
- Vulnerability write-ups

=== RAW COMMANDS ===
When built-in tools don't cover your needs, use raw_command for:
- Custom Python/Bash/PowerShell scripts
- Piping commands together
- One-liners for specific tasks
- Any shell operation

Example: raw_command("curl -s http://target.com/robots.txt | grep -i admin")

=== TOOL INSTALLATION ===
If a required tool is not installed, use install_tool to install it automatically:
- install_tool({ tool_name: "nmap" }) — installs via apt (Docker) or system package manager (Direct)
- install_tool({ tool_name: "requests", install_method: "pip" }) — installs Python package
- install_tool({ tool_name: "lodash", install_method: "npm" }) — installs Node package
- install_tool({ tool_name: "github.com/user/tool", install_method: "go" }) — installs Go tool

Supported methods: apt, pip, npm, go, git. Use "auto" to detect automatically.

When a tool call fails with "command not found", install it first then retry.
`;

// Pre-initialization: run setup wizard BEFORE Ink renders
const preInit = async () => {
  const cfg = loadConfig();
  const apiKey = getApiKey(cfg.provider);
  
  if (!apiKey && !isLocalProvider(cfg.provider)) {
    await setupWizard();
  }

  // setupWizard persists its selection. Reload so the initial header, token
  // limits, and provider state match the selection made during first run.
  const activeConfig = loadConfig();
  
  initBuiltinSkills();
  
  return {
    config: activeConfig,
    provider: getProvider(),
    model: activeConfig.model || getProvider().defaultModel,
  };
};

// Error screen component with dismiss capability
const ErrorScreen = ({ error, onDismiss }) => {
  useInput(() => {
    onDismiss();
  });

  return React.createElement(
    Box,
    { flexDirection: 'column', padding: 1 },
    React.createElement(Text, { color: 'red' }, `Error: ${error}`),
    React.createElement(Text, { color: 'yellow' }, 'Press any key to dismiss or Ctrl+C to exit')
  );
};

// Main Hex application component
const HexApp = ({ initialConfig, initialProvider, initialModel }) => {
  const [conversationId, setConversationId] = useState(randomUUID());
  const [messages, setMessages] = useState([{ role: 'system', content: SYSTEM_PROMPT }]);
  const [streaming, setStreaming] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showThinking, setShowThinking] = useState(false);
  const [agentStatus, setAgentStatus] = useState({ phase: 'idle', toolName: null });
  const abortControllerRef = useRef(null);
  const requestInFlightRef = useRef(false);
  const messagesRef = useRef(messages);
  const showThinkingRef = useRef(false);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const toggleThinking = useCallback(() => {
    const next = !showThinkingRef.current;
    showThinkingRef.current = next;
    setShowThinking(next);
    return next;
  }, []);
  
  // Execute a skill with variable substitution
  const executeSkill = useCallback(async (skill, vars) => {
    if (!skill || !skill.steps) return;

    // Substitute variables in steps
    const substituteVars = (obj) => {
      const str = JSON.stringify(obj);
      const substituted = str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return vars[key] || match;
      });
      return JSON.parse(substituted);
    };

    // Execute each step
    for (let i = 0; i < skill.steps.length; i++) {
      const step = substituteVars(skill.steps[i]);
      const toolCall = {
        id: `skill_${skill.name}_step_${i}`,
        type: 'function',
        function: {
          name: step.tool,
          arguments: JSON.stringify(step.args),
        },
      };

      // Add tool call to messages
      const assistantMsg = {
        role: 'assistant',
        content: null,
        tool_calls: [toolCall],
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Execute the tool
      const result = await executeToolCall(toolCall);

      // Add result to messages
      const toolMsg = {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result.error || result.output || 'No output',
        name: step.tool,
        isError: !!result.error,
      };
      setMessages(prev => [...prev, toolMsg]);
    }
  }, []);

  // Handle sending a message
  const handleSendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim()) return;

    // Handle slash commands
    if (userMessage.startsWith('/')) {
      setProcessing(true);
      setMessages(currentMessages => {
        const context = {
          conversationId,
          messages: [...currentMessages],
          SYSTEM_PROMPT,
          showThinking: showThinkingRef.current,
          toggleThinking,
          prompt: async () => '',
          executeSkill,
        };

        handleCommand(userMessage, context).then(result => {
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
          setProcessing(false);
        }).catch(() => {
          setProcessing(false);
        });

        return currentMessages;
      });
      return;
    }
    
    // Send to AI
    await sendAndReceive(userMessage);
  }, [conversationId, executeSkill, toggleThinking]);
  
  // Send message and receive response
  const sendAndReceive = async (userMessage) => {
    // State-driven disabling reaches InputBox on the next render. Keep a
    // synchronous guard here so repeated Enter events cannot create duplicate
    // user messages or concurrent AI requests in that gap.
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;

    const currentMessages = messagesRef.current;
    const newMessages = [...currentMessages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setStreaming(true);
    setAgentStatus({ phase: 'planning', toolName: null });
    
    // Check if we need to summarize
    if (shouldSummarize(newMessages, initialModel)) {
      try {
        const summarized = summarizeOldMessages(newMessages, initialModel);
        setMessages(summarized);
        newMessages.length = 0;
        newMessages.push(...summarized);
      } catch (summaryErr) {
        // If summarization fails, continue with original messages
        console.error('Summarization failed:', summaryErr.message);
      }
    }
    
    const MAX_ROUNDS = 100;
    let round = 0;
    let completed = false;
    let workingMessages = [...newMessages];
    
    abortControllerRef.current = new AbortController();
    
    try {
      while (round < MAX_ROUNDS) {
        round++;
        setAgentStatus({ phase: 'planning', toolName: null });
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
            setAgentStatus({ phase: 'thinking', toolName: null });
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
            setAgentStatus({ phase: 'cancelled', toolName: null });
            break;
          }
          throw chatError;
        }
        
        // Add assistant message
        // Tool-result messages must always follow the assistant tool-call
        // message. Providers reject a dangling tool result, which is what
        // happened when a model emitted function calls without text.
        if (assistantContent || thinkingContent || toolCalls.length > 0) {
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
          completed = true;
          setAgentStatus({ phase: 'complete', toolName: null });
          break;
        }
        
        // Execute tool calls
        for (const tc of toolCalls) {
          setAgentStatus({ phase: 'running', toolName: tc.name });
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
          setAgentStatus({ phase: 'continuing', toolName: tc.name });
        }
      }
      
      if (round >= MAX_ROUNDS && !completed) {
        console.error('Max rounds reached');
        setAgentStatus({ phase: 'limit', toolName: null });
      }

      saveConversation(conversationId, workingMessages);
    } catch (err) {
      // Save any progress made before the error
      if (workingMessages && workingMessages.length > 1) {
        try {
          saveConversation(conversationId, workingMessages);
        } catch (saveErr) {
          console.error('Failed to save conversation:', saveErr.message);
        }
      }
      setError(err.message);
      setAgentStatus({ phase: 'error', toolName: null });
    } finally {
      setStreaming(false);
      abortControllerRef.current = null;
      requestInFlightRef.current = false;
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

  // Dismiss error and continue
  const dismissError = () => {
    setError(null);
  };
  
  if (error) {
    return React.createElement(ErrorScreen, { error, onDismiss: dismissError });
  }
  
  const tokenCount = countMessagesTokens(messages);
  const tokenLimit = getTokenLimit(initialModel);
  
  return React.createElement(App, {
    messages: messages.slice(1), // Skip system message
    onSendMessage: handleSendMessage,
    streaming,
    processing,
    showThinking,
    onToggleThinking: toggleThinking,
    agentStatus,
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
