import { spawn } from 'child_process';
import { loadConfig } from '../core/config.js';

const CONTAINER = 'hex-kali-tools';
const USER = 'hexagent';
const DEFAULT_TIMEOUT_MS = 300000;

export async function runCommand(command, args = [], { onStdout, onStderr, user, shell = false, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const config = loadConfig();

  if (config.executionMode === 'docker') {
    // Docker exec does not invoke a shell. Preserve raw_command semantics only
    // for that explicitly requested tool; built-in tools remain argument-safe.
    const dockerCommand = shell ? 'sh' : command;
    const dockerArgs = shell ? ['-lc', command] : args;
    return runInDocker(dockerCommand, dockerArgs, { onStdout, onStderr, user, timeoutMs });
  } else {
    return runDirect(command, args, { onStdout, onStderr, shell, timeoutMs });
  }
}

async function runDirect(command, args, { onStdout, onStderr, shell, timeoutMs }) {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { shell });
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      proc.kill();
    }, timeoutMs);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      onStdout?.(text);
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      onStderr?.(text);
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      resolve({ stdout, stderr, exitCode: code, timedOut });
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ stdout, stderr: stderr + err.message, exitCode: 1, timedOut });
    });
  });
}

async function runInDocker(command, args, { onStdout, onStderr, user = USER, timeoutMs }) {
  return new Promise((resolve) => {
    const proc = spawn('docker', [
      'exec', '-u', user, CONTAINER,
      command, ...args,
    ]);
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      proc.kill();
    }, timeoutMs);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      onStdout?.(text);
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      onStderr?.(text);
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      resolve({ stdout, stderr, exitCode: code, timedOut });
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ stdout, stderr: stderr + err.message, exitCode: 1, timedOut });
    });
  });
}

export async function isDockerAvailable() {
  return new Promise((resolve) => {
    const proc = spawn('docker', [
      'inspect', '-f', '{{.State.Running}}', CONTAINER,
    ]);
    let out = '';
    proc.stdout.on('data', (d) => { out += d.toString(); });
    proc.on('close', () => resolve(out.trim() === 'true'));
    proc.on('error', () => resolve(false));
  });
}

export async function isToolAvailable(toolName) {
  const config = loadConfig();
  
  if (config.executionMode === 'docker') {
    const available = await isDockerAvailable();
    if (!available) return false;
    
    return new Promise((resolve) => {
      const proc = spawn('docker', [
        'exec', CONTAINER, 'which', toolName,
      ]);
      proc.on('close', (code) => resolve(code === 0));
      proc.on('error', () => resolve(false));
    });
  } else {
    return new Promise((resolve) => {
      const proc = spawn('which', [toolName], { shell: true });
      proc.on('close', (code) => resolve(code === 0));
      proc.on('error', () => resolve(false));
    });
  }
}
