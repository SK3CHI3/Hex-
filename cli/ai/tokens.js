import { encodingForModel } from 'js-tiktoken';

let encoder = null;

function getEncoder() {
  if (!encoder) {
    try {
      encoder = encodingForModel('gpt-4');
    } catch {
      // Fallback to cl100k_base if gpt-4 fails
      encoder = encodingForModel('gpt-3.5-turbo');
    }
  }
  return encoder;
}

export function countTokens(text) {
  if (!text) return 0;
  const enc = getEncoder();
  return enc.encode(text).length;
}

export function countMessagesTokens(messages) {
  let total = 0;
  for (const msg of messages) {
    // Each message has overhead of ~4 tokens
    total += 4;
    if (msg.role) total += countTokens(msg.role);
    if (msg.content) total += countTokens(msg.content);
    if (msg.name) total += countTokens(msg.name);
  }
  // Add 2 tokens for message priming
  total += 2;
  return total;
}

// Token limits for different models
const TOKEN_LIMITS = {
  'gpt-4': 8192,
  'gpt-4-turbo': 128000,
  'gpt-3.5-turbo': 16385,
  'claude-3-opus': 200000,
  'claude-3-sonnet': 200000,
  'claude-3-haiku': 200000,
  'default': 8192,
};

export function getTokenLimit(model) {
  return TOKEN_LIMITS[model] || TOKEN_LIMITS['default'];
}

export function shouldSummarize(messages, model) {
  const tokens = countMessagesTokens(messages);
  const limit = getTokenLimit(model);
  // Summarize when we hit 70% of the limit
  return tokens > limit * 0.7;
}

export function getTokenUsage(messages, model) {
  const tokens = countMessagesTokens(messages);
  const limit = getTokenLimit(model);
  return {
    used: tokens,
    limit,
    percentage: Math.round((tokens / limit) * 100),
  };
}
