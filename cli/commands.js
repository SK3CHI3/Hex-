import chalk from 'chalk';
import { tools } from './tools.js';
import { isDockerAvailable, isToolAvailable } from './docker.js';
import { loadConversation, listConversations } from './storage.js';
import { loadConfig, saveConfig, setupWizard, getProvider, getApiKey, PROVIDERS } from './config.js';
import { listSkills, getSkill } from './skills.js';
import { randomUUID } from 'crypto';
import { getTokenUsage } from './tokens.js';

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
      console.log(`
${C.bold('Commands:')}
  /help        Show this help
  /clear       Clear conversation and start fresh
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
  /tokens      Show token usage
  /summarize   Manually summarize conversation
  /quit        Exit Hex
`);
      return true;

    case '/clear':
      context.conversationId = randomUUID();
      context.messages = [{ role: 'system', content: context.SYSTEM_PROMPT }];
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
        context.conversationId = convo.id;
        context.messages = convo.messages;
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
      const choice = await context.prompt();
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

    case '/thinking':
      context.showThinking = !context.showThinking;
      console.log(C.dim(`  Thinking display: ${context.showThinking ? 'expanded' : 'collapsed'}`));
      return true;

    case '/tokens': {
      const config = loadConfig();
      const model = config.model || getProvider().defaultModel;
      const usage = getTokenUsage(context.messages, model);
      console.log(C.bold('\n  Token Usage:'));
      console.log(`  Used: ${C.tool(usage.used.toLocaleString())} / ${usage.limit.toLocaleString()}`);
      console.log(`  Progress: ${C.tool(usage.percentage)}%`);
      
      const barWidth = 30;
      const filled = Math.round((usage.percentage / 100) * barWidth);
      const empty = barWidth - filled;
      const bar = '█'.repeat(filled) + '░'.repeat(empty);
      
      let color = C.green;
      if (usage.percentage > 70) color = C.tool;
      if (usage.percentage > 90) color = C.error;
      
      console.log(`  ${color(bar)} ${usage.percentage}%\n`);
      return true;
    }

    case '/summarize': {
      const { summarizeOldMessages } = await import('./summary.js');
      const config = loadConfig();
      const model = config.model || getProvider().defaultModel;
      const beforeCount = context.messages.length;
      context.messages = summarizeOldMessages(context.messages, model);
      const afterCount = context.messages.length;
      console.log(C.green(`  ✓ Summarized conversation (${beforeCount} → ${afterCount} messages)`));
      return true;
    }

    case '/skills': {
      const skills = listSkills();
      if (skills.length === 0) {
        console.log(C.dim('No skills available.'));
      } else {
        console.log(C.bold('\n  Available skills:'));
        for (const s of skills) {
          console.log(C.tool(`  ${s.name}`) + C.dim(` — ${s.description}`));
        }
        console.log('');
      }
      return true;
    }

    case '/skill': {
      const skillName = parts[1];
      if (!skillName) {
        console.log(C.error('Usage: /skill <name> [var1=value1 var2=value2 ...]'));
        return true;
      }
      const skill = getSkill(skillName);
      if (!skill) {
        console.log(C.error(`Skill '${skillName}' not found. Use /skills to list available skills.`));
        return true;
      }

      // Parse variables from command line
      const vars = {};
      for (let i = 2; i < parts.length; i++) {
        const [key, value] = parts[i].split('=');
        if (key && value) {
          vars[key] = value;
        }
      }

      await context.executeSkill(skill, vars);
      return true;
    }

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
