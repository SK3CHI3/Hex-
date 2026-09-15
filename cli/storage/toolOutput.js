import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const OUTPUT_DIR = join(homedir(), '.hex', 'tool-output');
const VALID_OUTPUT_ID = /^[a-zA-Z0-9_-]+$/;

function ensureOutputDir() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
}

export function saveToolOutput(id, output) {
  if (!VALID_OUTPUT_ID.test(id)) return false;
  ensureOutputDir();
  writeFileSync(join(OUTPUT_DIR, `${id}.txt`), output, 'utf-8');
  return true;
}

export function loadToolOutput(id) {
  if (!VALID_OUTPUT_ID.test(id)) return null;
  const file = join(OUTPUT_DIR, `${id}.txt`);
  if (!existsSync(file)) return null;
  try {
    return readFileSync(file, 'utf-8');
  } catch {
    return null;
  }
}
