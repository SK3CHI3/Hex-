import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const HEX_DIR = join(homedir(), '.hex');
const CONVERSATIONS_DIR = join(HEX_DIR, 'conversations');

function ensureDirs() {
  if (!existsSync(HEX_DIR)) mkdirSync(HEX_DIR, { recursive: true });
  if (!existsSync(CONVERSATIONS_DIR)) mkdirSync(CONVERSATIONS_DIR, { recursive: true });
}

export function saveConversation(id, messages) {
  ensureDirs();
  const file = join(CONVERSATIONS_DIR, `${id}.json`);
  writeFileSync(file, JSON.stringify({ id, messages, updatedAt: new Date().toISOString() }, null, 2));
}

export function loadConversation(id) {
  const file = join(CONVERSATIONS_DIR, `${id}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function listConversations() {
  ensureDirs();
  return readdirSync(CONVERSATIONS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        const data = JSON.parse(readFileSync(join(CONVERSATIONS_DIR, f), 'utf-8'));
        return { id: data.id, updatedAt: data.updatedAt, messageCount: data.messages?.length || 0 };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export function deleteConversation(id) {
  const file = join(CONVERSATIONS_DIR, `${id}.json`);
  if (existsSync(file)) {
    const { unlinkSync } = require('fs');
    unlinkSync(file);
    return true;
  }
  return false;
}
