#!/usr/bin/env node

import readline from 'readline';
import chalk from 'chalk';
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
import { ProgressIndicator, StepProgress, startProgress, stopProgress, updateProgress } from './progress.js';
import { formatter } from './output.js';
import { randomUUID } from 'crypto';
import { platform } from 'os';

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

Be concise. When uncertain about a command, ask only for the missing technical information.`;

const C = {
  prompt: chalk.hex('#00FF41'),
  ai: chalk.hex('#98C379'),
  tool: chalk.hex('#E5C07B'),
  error: chalk.hex('#E06C75'),
  dim: chalk.hex('#5C6370'),
  bold: chalk.bold,
  green: chalk.green,
};

let conversationId = randomUUID();
let messages = [{ role: 'system', content: SYSTEM_PROMPT }];
let showThinking = false;
let currentAbortController = null;

// Track collapsed content for expand/collapse
let lastCollapsedToolOutput = null;
let lastCollapsedThinking = null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

rl.on('close', () => {
  console.log(C.dim('\nGoodbye.'));
  process.exit(0);
});

// Handle keyboard input for expand/collapse
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', (key) => {
  // Handle Ctrl+C
  if (key === '\u0003') {
    if (currentAbortController) {
      console.log(C.dim('\n\n  [Operation cancelled]'));
      currentAbortController.abort();
      currentAbortController = null;
      clearStatus();
    } else {
      console.log(C.dim('\nGoodbye.'));
      process.exit(0);
    }
    return;
  }

  // Handle 'e' key to expand tool output
  if (key === 'e' && lastCollapsedToolOutput) {
    console.log(formatter.formatFullOutput(lastCollapsedToolOutput.name, lastCollapsedToolOutput.output));
    lastCollapsedToolOutput = null;
    return;
  }

  // Handle 't' key to expand thinking content
  if (key === 't' && lastCollapsedThinking) {
    console.log(formatter.formatThinkingContent(lastCollapsedThinking, true));
    lastCollapsedThinking = null;
    return;
  }
});

function prompt() {
  return new Promise((resolve) => {
    rl.question(C.prompt('\n❯ '), resolve);
  });
}

function printBanner() {
  console.log('');
  console.log(chalk.hex('#00FF41').bold('  ██╗  ██╗███████╗██╗  ██╗'));
  console.log(chalk.hex('#00FF41').bold('  ██║  ██║██╔════╝╚██╗██╔╝'));
  console.log(chalk.hex('#00FF41').bold('  ███████║███████╗ ╚███╔╝ '));
  console.log(chalk.hex('#00FF41').bold('  ██╔══██║██╔════╝ ██╔██╗ '));
  console.log(chalk.hex('#00FF41').bold('  ██║  ██║███████╗██╔╝ ██╗'));
  console.log(chalk.hex('#00FF41').bold('  ╚═╝  ╚═╝╚══════╝ ╚═╝  ╚═╝'));
  console.log('');
  console.log(C.dim('  The AI-Powered Pentesting Assistant'));
  console.log(C.dim('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

  const config = loadConfig();
  const provider = getProvider();
  const model = config.model || provider.defaultModel;
  console.log(C.dim(`  Provider: ${provider.name} | Model: ${model}`));
  console.log(C.dim(`  Mode: ${config.executionMode === 'docker' ? 'Docker' : 'Direct'} | Type /help for commands`));
  
  // Show token usage
  const tokens = countMessagesTokens(messages);
  const limit = getTokenLimit(model);
  const percentage = Math.round((tokens / limit) * 100);
  console.log(C.dim(`  Tokens: ${tokens.toLocaleString()} / ${limit.toLocaleString()} (${percentage}%)\n`));
}

// Animation frames - braille spinner
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

let spinnerIndex = 0;
let spinnerInterval = null;
let currentStatus = '';

function startSpinner(status) {
  if (spinnerInterval) clearInterval(spinnerInterval);
  spinnerIndex = 0;
  spinnerInterval = setInterval(() => {
    const frame = SPINNER_FRAMES[spinnerIndex % SPINNER_FRAMES.length];
    process.stdout.write('\r\x1b[K' + C.dim(`  ${frame} ${status}`));
    spinnerIndex++;
  }, 80);
}

function stopSpinner() {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
  }
  process.stdout.write('\r\x1b[K');
}

function setStatus(status) {
  currentStatus = status;
  startSpinner(status);
}

function clearStatus() {
  stopSpinner();
}

// Handle Ctrl+C and Escape to abort current operation
process.on('SIGINT', () => {
  if (currentAbortController) {
    console.log(C.dim('\n\n  [Operation cancelled]'));
    currentAbortController.abort();
    currentAbortController = null;
    clearStatus();
  } else {
    console.log(C.dim('\nGoodbye.'));
    process.exit(0);
  }
});

async function executeSkill(skill, vars) {
  console.log(C.bold(`\n  Executing skill: ${skill.name}`));
  console.log(C.dim(`  ${skill.description}\n`));

  // Check for missing required variables
  const requiredVars = new Set();
  for (const step of skill.steps) {
    const argsStr = JSON.stringify(step.args);
    const matches = argsStr.match(/\{\{(\w+)\}\}/g);
    if (matches) {
      matches.forEach(m => requiredVars.add(m.replace(/[{}]/g, '')));
    }
  }

  const missingVars = [...requiredVars].filter(v => !vars[v]);
  if (missingVars.length > 0) {
    console.log(C.error(`  Missing required variables: ${missingVars.join(', ')}`));
    console.log(C.dim(`  Usage: /skill ${skill.name} ${missingVars.map(v => `${v}=<value>`).join(' ')}`));
    return;
  }

  const stepProgress = new StepProgress(skill.steps.map(s => s.tool), 'Skill steps');

  // Execute each step
  for (let i = 0; i < skill.steps.length; i++) {
    const step = skill.steps[i];
    stepProgress.start();

    // Replace variables in arguments
    const argsStr = JSON.stringify(step.args);
    const resolvedArgsStr = argsStr.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return vars[varName] || match;
    });
    const resolvedArgs = JSON.parse(resolvedArgsStr);

    // Execute the tool
    const toolCall = {
      id: `skill_${Date.now()}_${i}`,
      name: step.tool,
      arguments: resolvedArgs
    };

    setStatus(`Running ${step.tool}...`);
    const result = await executeToolCall(toolCall);
    clearStatus();

    if (result.error) {
      console.log(formatter.formatError(result.error));
    } else {
      console.log(formatter.formatToolOutput(step.tool, result.output, toolCall.id));
    }

    // Add to conversation context
    messages.push({
      role: 'assistant',
      content: `Executing skill step: ${step.tool}`,
      tool_calls: [{
        id: toolCall.id,
        type: 'function',
        function: { name: step.tool, arguments: JSON.stringify(resolvedArgs) }
      }]
    });

    messages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: result.error || result.output || 'No output'
    });

    stepProgress.next();
  }

  stepProgress.complete();
  console.log(C.ai(`\n  ✓ Skill '${skill.name}' completed\n`));
  saveConversation(conversationId, messages);
}

async function sendAndReceive(userMessage) {
  messages.push({ role: 'user', content: userMessage });

  // Check if we need to summarize
  const config = loadConfig();
  const model = config.model || getProvider().defaultModel;
  
  if (shouldSummarize(messages, model)) {
    console.log(C.dim('\n  [Auto-summarizing conversation to manage context...]'));
    messages = summarizeOldMessages(messages, model);
    console.log(C.green('  ✓ Conversation summarized'));
  }

  const MAX_ROUNDS = 100;
  let round = 0;
  let cancelled = false;

  while (round < MAX_ROUNDS) {
    round++;
    let assistantContent = '';
    let thinkingContent = '';
    const toolCalls = [];
    let error = null;

    // Create abort controller for this round
    currentAbortController = new AbortController();

    setStatus('AI is thinking...');

    await chat({
      messages,
      tools,
      abortSignal: currentAbortController.signal,
      onThinking: (chunk) => {
        thinkingContent += chunk;
        if (showThinking) {
          clearStatus();
          if (thinkingContent.length === chunk.length) {
            process.stdout.write(C.dim('\n  💭 Thinking: '));
          }
          process.stdout.write(C.dim(chunk));
        }
      },
      onContent: (chunk) => {
        clearStatus();
        if (thinkingContent && !assistantContent) {
          if (showThinking) {
            console.log('\n');
          } else {
            const formattedThinking = formatter.formatThinkingContent(thinkingContent, false);
            console.log(formattedThinking);
            // Track collapsed thinking for later expansion
            if (formattedThinking.includes('[Press \'t\' to expand]')) {
              lastCollapsedThinking = thinkingContent;
            }
          }
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
      onRetry: (attempt, delay) => {
        console.log(C.dim(`\n  [Retrying... attempt ${attempt}, waiting ${delay}ms]`));
      },
    });

    clearStatus();
    currentAbortController = null;

    // Check if operation was cancelled
    if (error && error.message === 'Request cancelled by user.') {
      cancelled = true;
      break;
    }

    if (assistantContent) {
      console.log('\n');
    }

    if (error) {
      console.log(formatter.formatError(error));
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
      setStatus(`Running ${tc.name}...`);
      const result = await executeToolCall(tc);
      clearStatus();
      
      console.log(C.tool(`  ⚡ Running ${C.bold(tc.name)}...`));
      
      if (result.error) {
        console.log(formatter.formatError(result.error));
      } else {
        const formattedOutput = formatter.formatToolOutput(tc.name, result.output, tc.id);
        console.log(formattedOutput);
        // Track collapsed tool output for later expansion
        if (formattedOutput.includes('[Press \'e\' to expand]')) {
          lastCollapsedToolOutput = { name: tc.name, output: result.output };
        }
      }

      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: result.error || result.output,
      });
    }
  }

  if (cancelled) {
    console.log(C.dim('  [Cancelled]'));
    return;
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

  // Initialize built-in skills
  initBuiltinSkills();

  printBanner();

  // Create context object for commands
  const context = {
    conversationId,
    messages,
    SYSTEM_PROMPT,
    showThinking,
    prompt,
    executeSkill,
  };

  while (true) {
    const input = await prompt();
    const trimmed = input.trim();

    if (!trimmed) continue;

    if (trimmed.startsWith('/')) {
      await handleCommand(trimmed, context);
      // Sync context back
      conversationId = context.conversationId;
      messages = context.messages;
      showThinking = context.showThinking;
      continue;
    }

    await sendAndReceive(trimmed);
  }
}

main().catch((err) => {
  console.error(formatter.formatError(err));
  process.exit(1);
});
