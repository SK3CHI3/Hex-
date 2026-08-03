import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import readline from 'readline';
import chalk from 'chalk';
import dotenv from 'dotenv';

const HEX_DIR = join(homedir(), '.hex');
const CONFIG_FILE = join(HEX_DIR, 'config.json');

// Load .env from project root if it exists
dotenv.config();
dotenv.config({ path: join(HEX_DIR, '.env') });

const DEFAULT_CONFIG = {
  provider: 'openai',
  model: '',
  executionMode: 'direct',
};

const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    envKey: 'OPENAI_API_KEY',
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4-turbo',
    apiFormat: 'openai',
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    envKey: 'ANTHROPIC_API_KEY',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    defaultModel: 'claude-3-opus-20240229',
    apiFormat: 'anthropic',
  },
  google: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    envKey: 'GOOGLE_API_KEY',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
    defaultModel: 'gemini-1.5-pro',
    apiFormat: 'openai',
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    envKey: 'DEEPSEEK_API_KEY',
    models: ['deepseek-chat', 'deepseek-coder'],
    defaultModel: 'deepseek-chat',
    apiFormat: 'openai',
  },
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    envKey: 'OPENROUTER_API_KEY',
    models: ['openai/gpt-4-turbo', 'anthropic/claude-3-opus', 'meta-llama/llama-3-70b-instruct'],
    defaultModel: 'openai/gpt-4-turbo',
    apiFormat: 'openai',
  },
  modelscope: {
    name: 'ModelScope',
    baseUrl: 'https://api-inference.modelscope.ai/v1',
    envKey: 'MODELSCOPE_API_KEY',
    models: ['Qwen-Ambassador/Qwen3.7-Plus'],
    defaultModel: 'Qwen-Ambassador/Qwen3.7-Plus',
    apiFormat: 'openai',
  },
  xai: {
    name: 'xAI (Grok)',
    baseUrl: 'https://api.x.ai/v1',
    envKey: 'XAI_API_KEY',
    models: ['grok-beta'],
    defaultModel: 'grok-beta',
    apiFormat: 'openai',
  },
  ollama: {
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/v1',
    envKey: '',
    models: ['llama3', 'llama2', 'codellama', 'mistral', 'phi3'],
    defaultModel: 'llama3',
    apiFormat: 'openai',
  },
  custom: {
    name: 'Custom (OpenAI-compatible)',
    baseUrl: '',
    envKey: 'CUSTOM_API_KEY',
    models: [],
    defaultModel: '',
    apiFormat: 'openai',
  },
};

export function ensureConfigDir() {
  if (!existsSync(HEX_DIR)) {
    mkdirSync(HEX_DIR, { recursive: true });
  }
}

export function loadConfig() {
  ensureConfigDir();
  
  let fileConfig = { ...DEFAULT_CONFIG };
  if (existsSync(CONFIG_FILE)) {
    try {
      const saved = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
      fileConfig = { ...DEFAULT_CONFIG, ...saved };
    } catch {
      fileConfig = { ...DEFAULT_CONFIG };
    }
  }

  // Priority cascade: env vars > config file
  const provider = process.env.HEX_PROVIDER || fileConfig.provider;
  const model = process.env.HEX_MODEL || fileConfig.model;
  const executionMode = process.env.HEX_EXECUTION_MODE || fileConfig.executionMode;

  return {
    provider,
    model,
    executionMode,
    apiKeys: fileConfig.apiKeys || {},
  };
}

export function saveConfig(config) {
  ensureConfigDir();
  
  // Read existing config to merge
  let existing = {};
  if (existsSync(CONFIG_FILE)) {
    try {
      existing = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    } catch {}
  }

  const merged = { ...existing, ...config };
  writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));
}

export function getApiKey(provider) {
  const providerConfig = PROVIDERS[provider];
  if (!providerConfig) return '';

  // Priority: env var > config file
  if (providerConfig.envKey && process.env[providerConfig.envKey]) {
    return process.env[providerConfig.envKey];
  }

  // Fallback to config file
  const config = loadConfig();
  return config.apiKeys?.[provider] || '';
}

export function getBaseUrl(provider) {
  const providerConfig = PROVIDERS[provider];
  if (!providerConfig) return '';

  // Check env var override
  const envBaseUrl = process.env[`${provider.toUpperCase()}_BASE_URL`];
  if (envBaseUrl) return envBaseUrl;

  return providerConfig.baseUrl;
}

export function getProvider() {
  const config = loadConfig();
  return PROVIDERS[config.provider] || PROVIDERS.openai;
}

export async function setupWizard() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

  console.log(chalk.cyan('\n╔═══════════════════════════════════════╗'));
  console.log(chalk.cyan('║') + chalk.bold('  Welcome to Hex - Initial Setup') + chalk.cyan('      ║'));
  console.log(chalk.cyan('╚═══════════════════════════════════════╝\n'));

  console.log(chalk.bold('Select AI Provider:'));
  const providerKeys = Object.keys(PROVIDERS);
  providerKeys.forEach((key, i) => {
    const envKey = PROVIDERS[key].envKey;
    const hasEnvKey = envKey && process.env[envKey];
    const marker = hasEnvKey ? chalk.green(' (env var detected)') : '';
    console.log(`  ${i + 1}. ${PROVIDERS[key].name}${marker}`);
  });

  const providerChoice = await ask('\nEnter number (1-9): ');
  const providerIdx = parseInt(providerChoice) - 1;
  const provider = providerKeys[providerIdx] || 'openai';

  console.log(chalk.dim(`\nSelected: ${PROVIDERS[provider].name}\n`));

  let apiKey = '';
  if (provider !== 'ollama') {
    const envKey = PROVIDERS[provider].envKey;
    const existingKey = process.env[envKey];
    
    if (existingKey) {
      console.log(chalk.green(`✓ ${envKey} detected in environment`));
      const useEnv = await ask('Use environment variable? (Y/n): ');
      if (useEnv.toLowerCase() !== 'n') {
        apiKey = existingKey;
      }
    }

    if (!apiKey) {
      apiKey = await ask(`Enter your ${PROVIDERS[provider].name} API key (or press Enter to skip): `);
    }
  }

  let baseUrl = PROVIDERS[provider].baseUrl;
  let model = PROVIDERS[provider].defaultModel;

  if (provider === 'custom') {
    baseUrl = await ask('Enter base URL (OpenAI-compatible): ');
    model = await ask('Enter model name: ');
  } else if (PROVIDERS[provider].models.length > 0) {
    console.log(chalk.bold('\nAvailable models:'));
    PROVIDERS[provider].models.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m}${i === 0 ? ' (recommended)' : ''}`);
    });
    const modelChoice = await ask('\nSelect model (number) or press Enter for default: ');
    if (modelChoice) {
      const modelIdx = parseInt(modelChoice) - 1;
      model = PROVIDERS[provider].models[modelIdx] || model;
    }
  }

  console.log(chalk.bold('\nExecution Mode:'));
  console.log('  1. Direct (run tools on your machine) — recommended for local network testing');
  console.log('  2. Docker (run tools in isolated Kali container)');
  const execChoice = await ask('\nSelect mode (1-2, default: 1): ');
  const executionMode = execChoice === '2' ? 'docker' : 'direct';

  const config = {
    provider,
    model,
    executionMode,
  };

  // Store API key in config if provided (not from env)
  if (apiKey && !process.env[PROVIDERS[provider].envKey]) {
    config.apiKeys = { [provider]: apiKey };
  }

  saveConfig(config);

  console.log(chalk.green('\n✓ Configuration saved to ~/.hex/config.json\n'));
  console.log(chalk.dim('Tip: You can also set API keys via environment variables:\n'));
  console.log(chalk.dim(`  export ${PROVIDERS[provider].envKey}=your-key-here\n`));

  rl.close();
  return config;
}

export { PROVIDERS };
