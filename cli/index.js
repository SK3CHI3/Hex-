#!/usr/bin/env node

import readline from 'readline';
import chalk from 'chalk';
import { chat } from './ai.js';
import { tools } from './tools.js';
import { executeToolCall } from './executor.js';
import { isDockerAvailable, isToolAvailable } from './docker.js';
import { saveConversation, loadConversation, listConversations } from './storage.js';
import { loadConfig, saveConfig, setupWizard, getProvider, getApiKey, PROVIDERS } from './config.js';
import { randomUUID } from 'crypto';
import { platform } from 'os';

const currentPlatform = platform();
const platformInfo = currentPlatform === 'win32' 
  ? 'Windows (use PowerShell/CMD commands like dir, Get-Command, where.exe)'
  : currentPlatform === 'darwin'
  ? 'macOS (use Unix commands like which, ls, grep)'
  : 'Linux (use standard Linux commands)';

const SYSTEM_PROMPT = `You are Hex, an AI-powered penetration testing assistant. You have access to 42+ security tools and can execute commands to help with security assessments.

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

OUTPUT FORMAT:
- Keep responses concise and to the point
- Use plain text only - no markdown, no headers, no bold, no emojis
- Use simple lists with dashes (-) when needed
- Keep thinking/reasoning brief and focused

AUTONOMOUS PLANNING MODE:
When the user gives you a complex goal (e.g. "pentest example.com", "full security assessment", "reconnaissance on target"), you should:

1. Create a numbered plan with clear steps
2. Execute each step sequentially
3. Show progress (e.g. "Step 1/5: Reconnaissance...")
4. Feed results back to inform next steps
5. Provide a final summary/report

WEB SEARCH:
Use web_search for:
- Finding CVEs and exploits
- OSINT gathering
- Looking up documentation
- Finding subdomains or tech stacks
- Researching vulnerabilities

When the user asks you to perform a security task, use the available tools to execute commands. Always explain what you're doing and interpret the results.

IMPORTANT:
- Only test targets the user explicitly authorizes
- Explain your findings clearly
- Suggest next steps after each scan
- Be ethical — remind users to only test systems they own or have permission to test
- Use commands appropriate for the current operating system
- For complex tasks, create and follow a plan
- NO EMOJIS in responses
- Keep it concise`;

const C = {
  prompt: chalk.cyan,
  ai: chalk.green,
  tool: chalk.yellow,
  error: chalk.red,
  dim: chalk.gray,
  bold: chalk.bold,
};

let conversationId = randomUUID();
let messages = [{ role: 'system', content: SYSTEM_PROMPT }];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

rl.on('close', () => {
  console.log(C.dim('\nGoodbye.'));
  process.exit(0);
});

function prompt() {
  return new Promise((resolve) => {
    rl.question(C.prompt('\n❯ '), resolve);
  });
}

function printBanner() {
  console.log('');
  console.log(C.bold.green('  ██╗  ██╗███████╗██╗  ██╗'));
  console.log(C.bold.green('  ██║  ██║██╔════╝╚██╗██╔╝'));
  console.log(C.bold.green('  ███████║███████╗ ╚███╔╝ '));
  console.log(C.bold.green('  ██╔══██║██╔════╝ ██╔██╗ '));
  console.log(C.bold.green('  ██║  ██║███████╗██╔╝ ██╗'));
  console.log(C.bold.green('  ╚═╝  ╚═╝╚══════╝ ╚═╝  ╚═╝'));
  console.log('');
  console.log(C.dim('  The AI-Powered Pentesting Assistant'));
  console.log(C.dim('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

  const config = loadConfig();
  const provider = getProvider();
  const model = config.model || provider.defaultModel;
  console.log(C.dim(`  Provider: ${provider.name} | Model: ${model}`));
  console.log(C.dim(`  Mode: ${config.executionMode === 'docker' ? 'Docker' : 'Direct'} | Type /help for commands`));
  console.log('');
}

async function handleCommand(input) {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();

  switch (cmd) {
    case '/help':
      console.log(`
${C.bold('Commands:')}
  /help        Show this help
  /clear       Clear conversation and start fresh
  /history     List saved conversations
  /resume <id> Resume a previous conversation
  /tools       List available pentesting tools
  /config      Show current configuration
  /provider    Switch AI provider
  /setup       Run setup wizard to change provider/model
  /status      Check execution environment status
  /quit        Exit Hex
`);
      return true;

    case '/clear':
      conversationId = randomUUID();
      messages = [{ role: 'system', content: SYSTEM_PROMPT }];
      console.log(C.dim('Conversation cleared.'));
      return true;

    case '/history': {
      const convos = listConversations();
      if (convos.length === 0) {
        console.log(C.dim('No saved conversations.'));
      } else {
        console.log(C.bold('\n  Saved conversations:'));
        for (const c of convos.slice(0, 10)) {
          console.log(C.dim(`  ${c.id.slice(0, 8)}  ${c.messageCount} msgs  ${c.updatedAt}`));
        }
        console.log('');
      }
      return true;
    }

    case '/resume': {
      const id = parts[1];
      if (!id) {
        console.log(C.error('Usage: /resume <conversation-id>'));
        return true;
      }
      const convos = listConversations();
      const match = convos.find(c => c.id === id || c.id.startsWith(id));
      if (!match) {
        console.log(C.error('Conversation not found.'));
        return true;
      }
      const convo = loadConversation(match.id);
      if (convo) {
        conversationId = convo.id;
        messages = convo.messages;
        console.log(C.dim(`Resumed conversation ${convo.id.slice(0, 8)} (${convo.messages.length} messages).`));
      }
      return true;
    }

    case '/tools':
      console.log(C.bold('\n  Available tools:'));
      for (const t of tools) {
        console.log(C.tool(`  ${t.function.name}`) + C.dim(` — ${t.function.description}`));
      }
      console.log('');
      return true;

    case '/config': {
      const config = loadConfig();
      const provider = getProvider();
      const apiKey = getApiKey(config.provider);
      const hasKey = apiKey || config.provider === 'ollama';
      console.log(C.bold('\n  Current Configuration:'));
      console.log(`  Provider: ${C.tool(provider.name)}`);
      console.log(`  Model: ${C.tool(config.model || provider.defaultModel)}`);
      console.log(`  Base URL: ${C.dim(provider.baseUrl)}`);
      console.log(`  API Key: ${C.dim(hasKey ? '***' + (apiKey || 'local').slice(-4) : 'Not set')}`);
      console.log(`  Execution: ${C.tool(config.executionMode)}`);
      if (provider.envKey && process.env[provider.envKey]) {
        console.log(`  ${C.green('✓')} ${provider.envKey} set via environment`);
      }
      console.log('');
      return true;
    }

    case '/provider': {
      const providerKeys = Object.keys(PROVIDERS);
      console.log(C.bold('\n  Available providers:'));
      providerKeys.forEach((key, i) => {
        const envKey = PROVIDERS[key].envKey;
        const hasEnvKey = envKey && process.env[envKey];
        const marker = hasEnvKey ? C.green(' (env set)') : '';
        console.log(`  ${i + 1}. ${PROVIDERS[key].name}${marker}`);
      });
      const choice = await prompt();
      const idx = parseInt(choice.trim()) - 1;
      const newProvider = providerKeys[idx];
      
      if (newProvider && PROVIDERS[newProvider]) {
        const config = loadConfig();
        config.provider = newProvider;
        config.model = PROVIDERS[newProvider].defaultModel;
        saveConfig(config);
        console.log(C.green(`\n  ✓ Switched to ${PROVIDERS[newProvider].name}`));
        console.log(C.dim('  Restart Hex or run /setup to configure API key.\n'));
      } else {
        console.log(C.error('  Invalid selection.'));
      }
      return true;
    }

    case '/setup':
      await setupWizard();
      console.log(C.dim('Restart Hex to apply changes.'));
      return true;

    case '/status':
      await checkStatus();
      return true;

    case '/quit':
    case '/exit':
      console.log(C.dim('\nGoodbye.'));
      process.exit(0);

    default:
      console.log(C.error(`Unknown command: ${cmd}. Type /help for commands.`));
      return true;
  }
}

async function checkStatus() {
  const config = loadConfig();
  
  if (config.executionMode === 'docker') {
    const running = await isDockerAvailable();
    if (running) {
      console.log(C.ai('  ✓ Docker container is running'));
    } else {
      console.log(C.error('  ✗ Docker container is NOT running'));
      console.log(C.dim('  Start it with: npm run docker:up'));
    }
  } else {
    console.log(C.ai('  ✓ Direct execution mode (tools run on your machine)'));
    
    // Check a few common tools
    const testTools = ['nmap', 'curl', 'whois'];
    for (const tool of testTools) {
      const available = await isToolAvailable(tool);
      if (available) {
        console.log(C.ai(`  ✓ ${tool} is available`));
      } else {
        console.log(C.error(`  ✗ ${tool} not found`));
      }
    }
  }
}

async function sendAndReceive(userMessage) {
  messages.push({ role: 'user', content: userMessage });

  const MAX_ROUNDS = 10; // Prevent infinite loops
  let round = 0;

  while (round < MAX_ROUNDS) {
    round++;
    let assistantContent = '';
    let thinkingContent = '';
    const toolCalls = [];
    let error = null;

    await chat({
      messages,
      tools,
      onThinking: (chunk) => {
        if (!thinkingContent) {
          process.stdout.write(C.dim('\n  💭 Thinking: '));
        }
        process.stdout.write(C.dim(chunk));
        thinkingContent += chunk;
      },
      onContent: (chunk) => {
        if (thinkingContent && !assistantContent) {
          console.log('\n');
        }
        if (!assistantContent) {
          process.stdout.write(C.ai('\n  '));
        }
        process.stdout.write(C.ai(chunk));
        assistantContent += chunk;
      },
      onToolCall: (tc) => {
        toolCalls.push(tc);
      },
      onError: (err) => {
        error = err;
      },
    });

    if (assistantContent) console.log('\n');

    if (error) {
      console.log(C.error(`  Error: ${error.message}`));
      return;
    }

    // If no tool calls, we're done
    if (toolCalls.length === 0) {
      break;
    }

    // Execute tool calls and add results to messages
    messages.push({
      role: 'assistant',
      content: assistantContent || null,
      tool_calls: toolCalls.map(tc => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
      })),
    });

    for (const tc of toolCalls) {
      console.log(C.tool(`\n  ⚡ Running ${C.bold(tc.name)}...`));
      const result = await executeToolCall(tc);
      console.log('');

      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: result.error || result.output,
      });
    }

    // Loop continues - AI will see tool results and can call more tools
  }

  if (round >= MAX_ROUNDS) {
    console.log(C.dim('\n  [Max rounds reached]'));
  }

  saveConversation(conversationId, messages);
}

async function main() {
  const config = loadConfig();
  const apiKey = getApiKey(config.provider);

  if (!apiKey && config.provider !== 'ollama') {
    await setupWizard();
  }

  printBanner();

  while (true) {
    const input = await prompt();
    const trimmed = input.trim();

    if (!trimmed) continue;

    if (trimmed.startsWith('/')) {
      await handleCommand(trimmed);
      continue;
    }

    await sendAndReceive(trimmed);
  }
}

main().catch((err) => {
  console.error(C.error(`Fatal: ${err.message}`));
  process.exit(1);
});
