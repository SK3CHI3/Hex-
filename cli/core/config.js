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
    local: false,
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    envKey: 'ANTHROPIC_API_KEY',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    defaultModel: 'claude-3-opus-20240229',
    apiFormat: 'anthropic',
    local: false,
  },
  google: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    envKey: 'GOOGLE_API_KEY',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
    defaultModel: 'gemini-1.5-pro',
    apiFormat: 'openai',
    local: false,
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    envKey: 'DEEPSEEK_API_KEY',
    models: ['deepseek-chat', 'deepseek-coder'],
    defaultModel: 'deepseek-chat',
    apiFormat: 'openai',
    local: false,
  },
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    envKey: 'OPENROUTER_API_KEY',
    models: ['openai/gpt-4-turbo', 'anthropic/claude-3-opus', 'meta-llama/llama-3-70b-instruct'],
    defaultModel: 'openai/gpt-4-turbo',
    apiFormat: 'openai',
    local: false,
  },
  modelscope: {
    name: 'ModelScope',
    baseUrl: 'https://api-inference.modelscope.ai/v1',
    envKey: 'MODELSCOPE_API_KEY',
    models: ['Qwen-Ambassador/Qwen3.7-Plus'],
    defaultModel: 'Qwen-Ambassador/Qwen3.7-Plus',
    apiFormat: 'openai',
    local: false,
  },
  xai: {
    name: 'xAI (Grok)',
    baseUrl: 'https://api.x.ai/v1',
    envKey: 'XAI_API_KEY',
    models: ['grok-beta'],
    defaultModel: 'grok-beta',
    apiFormat: 'openai',
    local: false,
  },
  ollama: {
    name: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
    envKey: '',
    models: ['llama3', 'mistral', 'qwen2.5', 'codellama', 'phi3'],
    defaultModel: 'llama3',
    apiFormat: 'openai',
    local: true,
    installUrl: 'https://ollama.com/download',
    installCmd: 'ollama serve',
    pullCmd: 'ollama pull <model>',
  },
  lmstudio: {
    name: 'LM Studio',
    baseUrl: 'http://localhost:1234/v1',
    envKey: '',
    models: [],
    defaultModel: '',
    apiFormat: 'openai',
    local: true,
    installUrl: 'https://lmstudio.ai/',
    installCmd: '(start server from the LM Studio app)',
    pullCmd: '(download models from the LM Studio app)',
  },
  llamacpp: {
    name: 'llama.cpp',
    baseUrl: 'http://localhost:8080/v1',
    envKey: '',
    models: [],
    defaultModel: '',
    apiFormat: 'openai',
    local: true,
    installUrl: 'https://github.com/ggerganov/llama.cpp',
    installCmd: './llama-server -m <model.gguf> --port 8080',
    pullCmd: '(download GGUF models from https://huggingface.co)',
  },
  vllm: {
    name: 'vLLM',
    baseUrl: 'http://localhost:8000/v1',
    envKey: '',
    models: [],
    defaultModel: '',
    apiFormat: 'openai',
    local: true,
    installUrl: 'https://docs.vllm.ai/',
    installCmd: 'vllm serve <model>',
    pullCmd: '(model is loaded when starting the server)',
  },
  jan: {
    name: 'Jan.ai',
    baseUrl: 'http://127.0.0.1:1337/v1',
    envKey: '',
    models: [],
    defaultModel: '',
    apiFormat: 'openai',
    local: true,
    installUrl: 'https://jan.ai/',
    installCmd: '(start server from the Jan app)',
    pullCmd: '(download models from the Jan app)',
  },
  custom: {
    name: 'Custom (OpenAI-compatible)',
    baseUrl: '',
    envKey: 'CUSTOM_API_KEY',
    models: [],
    defaultModel: '',
    apiFormat: 'openai',
    local: false,
  },
};

const LOCAL_PROVIDERS = Object.keys(PROVIDERS).filter(k => PROVIDERS[k].local);

function isLocalProvider(provider) {
  return PROVIDERS[provider]?.local === true;
}

async function testConnection(baseUrl) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${baseUrl}/models`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return { ok: false, error: `Server responded with status ${res.status}` };
    const data = await res.json();
    const models = (data.data || []).map(m => m.id).filter(Boolean);
    return { ok: true, models };
  } catch (err) {
    if (err.name === 'AbortError') return { ok: false, error: 'Connection timed out (5s)' };
    return { ok: false, error: err.message || 'Connection refused' };
  }
}

async function discoverModels(baseUrl) {
  const result = await testConnection(baseUrl);
  return result.ok ? result.models : [];
}

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
    customBaseUrl: fileConfig.customBaseUrl || '',
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

  // Check custom base URL from config
  const config = loadConfig();
  if (provider === 'custom' && config.customBaseUrl) {
    return config.customBaseUrl;
  }

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

  // ── Step 1: Provider selection (grouped) ──────────────────────────
  const cloudKeys = Object.keys(PROVIDERS).filter(k => !PROVIDERS[k].local && k !== 'custom');
  const localKeys = Object.keys(PROVIDERS).filter(k => PROVIDERS[k].local);
  const allKeys = [...cloudKeys, ...localKeys, 'custom'];

  let idx = 0;
  const indexMap = {};

  console.log(chalk.bold('  CLOUD PROVIDERS:'));
  for (const k of cloudKeys) {
    idx++;
    indexMap[idx] = k;
    const envKey = PROVIDERS[k].envKey;
    const marker = envKey && process.env[envKey] ? chalk.green(' (env var detected)') : '';
    console.log(`  ${idx}. ${PROVIDERS[k].name}${marker}`);
  }

  console.log(chalk.bold('\n  LOCAL PROVIDERS') + chalk.dim(' (run models on your machine)'));
  for (const k of localKeys) {
    idx++;
    indexMap[idx] = k;
    console.log(`  ${idx}. ${PROVIDERS[k].name}`);
  }

  console.log(chalk.bold('\n  OTHER:'));
  idx++;
  indexMap[idx] = 'custom';
  console.log(`  ${idx}. Custom (any OpenAI-compatible server)`);

  const total = idx;
  const providerChoice = await ask(`\nEnter number (1-${total}): `);
  const provider = indexMap[parseInt(providerChoice)] || 'openai';

  console.log(chalk.dim(`\nSelected: ${PROVIDERS[provider].name}\n`));

  // ── Step 2: Connection test + model discovery for local providers ─
  let baseUrl = PROVIDERS[provider].baseUrl;
  let model = PROVIDERS[provider].defaultModel;

  if (isLocalProvider(provider)) {
    const provConfig = PROVIDERS[provider];

    // Test connection
    console.log(chalk.dim(`Testing connection to ${baseUrl}...`));
    let connResult = await testConnection(baseUrl);

    // Loop until connected or user switches provider
    while (!connResult.ok) {
      console.log(chalk.red(`\n✗ Could not connect to ${provConfig.name} at ${baseUrl}`));
      console.log(chalk.red(`  ${connResult.error}\n`));
      console.log(chalk.bold(`To use ${provConfig.name}:`));
      console.log(`  1. Install: ${provConfig.installUrl}`);
      console.log(`  2. Start:   ${provConfig.installCmd}`);
      console.log(`  3. Models:  ${provConfig.pullCmd}\n`);

      console.log('What would you like to do?');
      console.log('  1. Retry connection (I just started it)');
      console.log('  2. Choose a different provider');
      console.log('  3. Continue anyway (I\'ll configure it later)\n');
      const choice = await ask('Enter choice (1-3): ');

      if (choice === '1') {
        console.log(chalk.dim('\nRetrying...'));
        connResult = await testConnection(baseUrl);
      } else if (choice === '2') {
        rl.close();
        return setupWizard(); // restart wizard
      } else {
        // Continue with default model, warn user
        console.log(chalk.yellow(`\n⚠ ${provConfig.name} is not running. Hex won't work until you start it.`));
        model = provConfig.defaultModel || 'llama3';
        break;
      }
    }

    // If connected, discover models
    if (connResult.ok) {
      const discovered = connResult.models;

      if (discovered.length === 0) {
        console.log(chalk.yellow(`\n⚠ Connected to ${provConfig.name} but no models found.\n`));
        console.log(`Download a model first:`);
        console.log(`  ${provConfig.pullCmd}\n`);

        console.log('What would you like to do?');
        console.log('  1. Retry (I just pulled a model)');
        console.log('  2. Choose a different provider');
        console.log('  3. Enter model name manually\n');
        const choice = await ask('Enter choice (1-3): ');

        if (choice === '1') {
          const retryResult = await testConnection(baseUrl);
          if (retryResult.ok && retryResult.models.length > 0) {
            model = await pickModel(retryResult.models, provConfig.defaultModel, ask);
          } else {
            console.log(chalk.yellow('\n⚠ Still no models found. Enter a model name manually or restart after pulling a model.'));
            model = await ask('Enter model name: ');
          }
        } else if (choice === '2') {
          rl.close();
          return setupWizard();
        } else {
          model = await ask('Enter model name: ');
        }
      } else {
        model = await pickModel(discovered, provConfig.defaultModel, ask);
      }
    }
  }

  // ── Step 3: API key for cloud providers ───────────────────────────
  let apiKey = '';
  if (!isLocalProvider(provider) && provider !== 'custom') {
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

  // ── Step 4: Custom provider setup ─────────────────────────────────
  if (provider === 'custom') {
    baseUrl = await ask('Enter base URL (OpenAI-compatible): ');
    model = await ask('Enter model name: ');
  }

  // ── Step 5: Execution mode ────────────────────────────────────────
  console.log(chalk.bold('\nExecution Mode:'));
  console.log('  1. Direct (run tools on your machine) — recommended for local network testing');
  console.log('  2. Docker (run tools in isolated Kali container)');
  const execChoice = await ask('\nSelect mode (1-2, default: 1): ');
  const executionMode = execChoice === '2' ? 'docker' : 'direct';

  // ── Step 6: Save config ───────────────────────────────────────────
  const config = {
    provider,
    model,
    executionMode,
  };

  if (provider === 'custom' && !apiKey) {
    const customKey = await ask('API key for custom server (or press Enter to skip): ');
    if (customKey) apiKey = customKey;
  }

  if (apiKey && PROVIDERS[provider].envKey && !process.env[PROVIDERS[provider].envKey]) {
    config.apiKeys = { [provider]: apiKey };
  }

  // Store custom base URL if different from default
  if (provider === 'custom' && baseUrl) {
    config.customBaseUrl = baseUrl;
  }

  saveConfig(config);

  // ── Done ──────────────────────────────────────────────────────────
  console.log(chalk.green('\n✓ Configuration saved to ~/.hex/config.json\n'));
  console.log(chalk.bold('Summary:'));
  console.log(`  Provider:  ${PROVIDERS[provider].name}`);
  console.log(`  Model:     ${model}`);
  if (isLocalProvider(provider)) {
    console.log(`  Server:    ${baseUrl}`);
  }
  console.log(`  Execution: ${executionMode}\n`);

  if (isLocalProvider(provider)) {
    console.log(chalk.dim('Tip: Set OLLAMA_CONTEXT_LENGTH=8192 for better results with Ollama.\n'));
  } else if (PROVIDERS[provider].envKey) {
    console.log(chalk.dim(`Tip: You can also set API keys via environment variables:\n`));
    console.log(chalk.dim(`  export ${PROVIDERS[provider].envKey}=your-key-here\n`));
  }

  rl.close();
  return config;
}

async function pickModel(models, defaultModel, ask) {
  console.log(chalk.bold('\nAvailable models on your server:'));
  models.forEach((m, i) => {
    const recommended = m === defaultModel || (i === 0 && !defaultModel) ? chalk.green(' (recommended)') : '';
    console.log(`  ${i + 1}. ${m}${recommended}`);
  });
  const choice = await ask(`\nSelect model (number) or press Enter for default (${defaultModel || models[0]}): `);
  if (choice) {
    const idx = parseInt(choice) - 1;
    return models[idx] || defaultModel || models[0];
  }
  return defaultModel || models[0];
}

export { PROVIDERS, LOCAL_PROVIDERS, isLocalProvider, testConnection, discoverModels };
