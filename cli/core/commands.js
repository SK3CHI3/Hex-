import chalk from 'chalk';
import { tools } from '../tools/tools.js';
import { isDockerAvailable, isToolAvailable } from '../tools/docker.js';
import { loadConversation, listConversations } from '../storage/storage.js';
import { loadConfig, saveConfig, setupWizard, getProvider, getApiKey, PROVIDERS, isLocalProvider } from './config.js';
import { listSkills, getSkill } from '../storage/skills.js';
import { loadToolOutput } from '../storage/toolOutput.js';
import { randomUUID } from 'crypto';
import { getTokenUsage } from '../ai/tokens.js';
import { themeManager } from '../ui/themes.js';

const C = {
  prompt: chalk.hex('#00FF41'),
  ai: chalk.hex('#98C379'),
  tool: chalk.hex('#E5C07B'),
  error: chalk.hex('#E06C75'),
  dim: chalk.hex('#5C6370'),
  bold: chalk.bold,
  green: chalk.green,
};

export async function handleCommand(input, context) {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();

  switch (cmd) {
    case '/help':
      return {
        type: 'info',
        content: `${C.bold('Commands:')}
  /help        Show this help
  /clear       Clear conversation and start fresh
  /clear-memory  Tell AI to forget previous context
  /history     List saved conversations
  /resume <id> Resume a previous conversation
  /tools       List available pentesting tools
  /skills      List available skills
  /skill <name> [vars]  Run a skill with optional variables
  /config      Show current configuration
  /provider    Switch AI provider
  /setup       Run setup wizard to change provider/model
  /status      Check execution environment status
  /thinking    Toggle thinking display (collapsed/expanded)
  /output <id> Show complete output saved for a truncated tool result
  /tokens      Show token usage
  /summarize   Manually summarize conversation
  /theme       Switch color theme (dark/light)
  /fullscreen  Toggle fullscreen mode
  /editor      Show external editor info
  /quit        Exit Hex

${C.bold('Keyboard Shortcuts:')}
  Tab          Autocomplete commands
  Ctrl+R       Search history
  Ctrl+T       Toggle thinking display
  Ctrl+O       Toggle all tool output
  Up/Down      Navigate history
  Shift+Enter  New line
  Ctrl+C       Cancel input
  Ctrl+A       Move to start
  Ctrl+E       Move to end
  Ctrl+W       Delete word
  Ctrl+U       Clear line
  Ctrl+K       Delete to end
  Ctrl+X Ctrl+E  Open external editor`
      };

    case '/clear':
      context.conversationId = randomUUID();
      context.messages = [{ role: 'system', content: context.SYSTEM_PROMPT }];
      return { type: 'info', content: C.dim('Conversation cleared.') };

    case '/clear-memory':
      context.conversationId = randomUUID();
      context.messages = [{ role: 'system', content: context.SYSTEM_PROMPT }];
      return { type: 'info', content: C.dim('Memory and conversation context cleared.') };

    case '/history': {
      const convos = listConversations();
      if (convos.length === 0) {
        return { type: 'info', content: C.dim('No saved conversations.') };
      }
      let output = C.bold('\n  Saved conversations:\n');
      for (const c of convos.slice(0, 10)) {
        output += C.dim(`  ${c.id.slice(0, 8)}  ${c.messageCount} msgs  ${c.updatedAt}\n`);
      }
      return { type: 'info', content: output };
    }

    case '/resume': {
      const id = parts[1];
      if (!id) {
        return { type: 'error', content: C.error('Usage: /resume <conversation-id>') };
      }
      const convos = listConversations();
      const match = convos.find(c => c.id === id || c.id.startsWith(id));
      if (!match) {
        return { type: 'error', content: C.error('Conversation not found.') };
      }
      const convo = loadConversation(match.id);
      if (convo) {
        context.conversationId = convo.id;
        context.messages = convo.messages;
        return { type: 'info', content: C.dim(`Resumed conversation ${convo.id.slice(0, 8)} (${convo.messages.length} messages).`) };
      }
      return { type: 'error', content: C.error('Failed to load conversation.') };
    }

    case '/tools': {
      let output = C.bold('\n  Available tools:\n');
      for (const t of tools) {
        output += C.tool(`  ${t.function.name}`) + C.dim(` — ${t.function.description}\n`);
      }
      return { type: 'info', content: output };
    }

    case '/config': {
      const config = loadConfig();
      const provider = getProvider();
      const apiKey = getApiKey(config.provider);
      const hasKey = apiKey || isLocalProvider(config.provider);
      
      let output = C.bold('\n  Current Configuration:\n');
      output += `  Provider: ${C.tool(provider.name)}\n`;
      output += `  Model: ${C.tool(config.model || provider.defaultModel)}\n`;
      output += `  Base URL: ${C.dim(provider.baseUrl)}\n`;
      output += `  API Key: ${C.dim(hasKey ? '***' + (apiKey || 'local').slice(-4) : 'Not set')}\n`;
      output += `  Execution: ${C.tool(config.executionMode)}`;
      
      if (provider.envKey && process.env[provider.envKey]) {
        output += `\n  ${C.green('✓')} ${provider.envKey} set via environment`;
      }
      
      return { type: 'info', content: output };
    }

    case '/provider': {
      const providerKeys = Object.keys(PROVIDERS);
      const requestedProvider = parts[1]?.toLowerCase();

      if (requestedProvider) {
        const numericIndex = Number.parseInt(requestedProvider, 10) - 1;
        const newProvider = providerKeys[numericIndex] || providerKeys.find(key => key === requestedProvider);
        if (!newProvider) {
          return { type: 'error', content: C.error(`Unknown provider '${requestedProvider}'. Use /provider to list choices.`) };
        }
        const config = loadConfig();
        config.provider = newProvider;
        config.model = PROVIDERS[newProvider].defaultModel;
        saveConfig(config);
        return { type: 'info', content: C.green(`  ✓ Switched to ${PROVIDERS[newProvider].name}. Restart Hex or run /setup to configure it.`) };
      }

      let output = C.bold('\n  Available providers:\n');
      providerKeys.forEach((key, i) => {
        const envKey = PROVIDERS[key].envKey;
        const hasEnvKey = envKey && process.env[envKey];
        const marker = hasEnvKey ? C.green(' (env set)') : '';
        output += `  ${i + 1}. ${PROVIDERS[key].name}${marker}\n`;
      });
      
      output += C.dim('\n  Usage: /provider <number|name>');
      return { type: 'info', content: output };
    }

    case '/setup':
      await setupWizard();
      return { type: 'info', content: C.dim('Restart Hex to apply changes.') };

    case '/status': {
      const config = loadConfig();
      let output = '';
      
      if (config.executionMode === 'docker') {
        const running = await isDockerAvailable();
        if (running) {
          output += C.ai('  ✓ Docker container is running');
        } else {
          output += C.error('  ✗ Docker container is NOT running');
          output += C.dim('\n  Start it with: npm run docker:up');
        }
      } else {
        output += C.ai('  ✓ Direct execution mode (tools run on your machine)');
        
        const testTools = ['nmap', 'curl', 'whois'];
        for (const tool of testTools) {
          const available = await isToolAvailable(tool);
          if (available) {
            output += C.ai(`\n  ✓ ${tool} is available`);
          } else {
            output += C.error(`\n  ✗ ${tool} not found`);
          }
        }
      }
      
      return { type: 'info', content: output };
    }

    case '/thinking':
      if (typeof context.toggleThinking !== 'function') {
        return { type: 'error', content: C.error('Thinking display is unavailable in this interface.') };
      }
      context.showThinking = context.toggleThinking();
      return { type: 'info', content: C.dim(`  Thinking display: ${context.showThinking ? 'expanded' : 'collapsed'}`) };

    case '/output': {
      const outputId = parts[1];
      if (!outputId) {
        return { type: 'error', content: C.error('Usage: /output <tool-call-id>') };
      }
      const output = (context.loadToolOutput || loadToolOutput)(outputId);
      if (output === null) {
        return { type: 'error', content: C.error('Saved tool output was not found.') };
      }
      return { type: 'info', content: output || C.dim('[No output]') };
    }

    case '/skills': {
      const skills = listSkills();
      if (skills.length === 0) {
        return { type: 'info', content: C.dim('No skills available.') };
      }
      let output = C.bold('\n  Available skills:\n');
      for (const s of skills) {
        output += C.tool(`  ${s.name}`) + C.dim(` — ${s.description}\n`);
      }
      return { type: 'info', content: output };
    }

    case '/skill': {
      const skillName = parts[1];
      if (!skillName) {
        return { type: 'error', content: C.error('Usage: /skill <name> [var1=value1 var2=value2 ...]') };
      }
      const skill = getSkill(skillName);
      if (!skill) {
        return { type: 'error', content: C.error(`Skill '${skillName}' not found. Use /skills to list available skills.`) };
      }

      const vars = {};
      for (let i = 2; i < parts.length; i++) {
        const [key, value] = parts[i].split('=');
        if (key && value) {
          vars[key] = value;
        }
      }

      await context.executeSkill(skill, vars);
      return null;
    }

    case '/tokens': {
      const config = loadConfig();
      const model = config.model || getProvider().defaultModel;
      const usage = getTokenUsage(context.messages, model);
      
      let output = C.bold('\n  Token Usage:\n');
      output += `  Used: ${C.tool(usage.used.toLocaleString())}\n`;
      output += `  Limit: ${C.tool(usage.limit.toLocaleString())}\n`;
      output += `  Usage: ${C.tool(usage.percentage + '%')}`;
      
      return { type: 'info', content: output };
    }

    case '/summarize': {
      const config = loadConfig();
      const model = config.model || getProvider().defaultModel;
      const { summarizeOldMessages } = await import('../ai/summary.js');
      const summarized = summarizeOldMessages(context.messages, model);
      if (summarized === context.messages) {
        return { type: 'info', content: C.dim('Conversation is below the summarization threshold.') };
      }
      context.messages = summarized;
      return { type: 'info', content: C.green('  ✓ Conversation summarized') };
    }

    case '/theme': {
      const themeName = parts[1];
      
      if (!themeName) {
        const available = themeManager.getAvailableThemes();
        const current = themeManager.getCurrentThemeName();
        
        let output = C.bold('\n  Available themes:\n');
        for (const theme of available) {
          const marker = theme === current ? C.green(' (current)') : '';
          output += `  ${theme}${marker}\n`;
        }
        output += C.dim('\n  Usage: /theme <name>');
        
        return { type: 'info', content: output };
      }
      
      const success = themeManager.setTheme(themeName);
      if (success) {
        return { type: 'info', content: C.green(`  ✓ Switched to ${themeName} theme`) };
      }
      return { type: 'error', content: C.error(`  Theme '${themeName}' not found`) };
    }

    case '/fullscreen': {
      const { fullScreenManager } = await import('../ui/fullScreen.js');
      fullScreenManager.toggle();
      const state = fullScreenManager.isActive() ? 'enabled' : 'disabled';
      return { type: 'info', content: C.dim(`  Fullscreen mode ${state}`) };
    }

    case '/editor': {
      const { getEditorInfo } = await import('../ui/externalEditor.js');
      const info = getEditorInfo();
      
      let output = C.bold('\n  External Editor:\n');
      output += `  Editor: ${C.tool(info.name)}\n`;
      output += `  Source: ${C.dim(info.envVar)}\n`;
      output += C.dim('\n  Press Ctrl+X Ctrl+E in input to open editor');
      
      return { type: 'info', content: output };
    }

    case '/quit':
    case '/exit':
      process.exit(0);

    default:
      return { type: 'error', content: C.error(`Unknown command: ${cmd}. Type /help for commands.`) };
  }
}
