import { spawn } from 'child_process';
import { loadConfig } from './config.js';

const CONTAINER = 'hex-kali-tools';
const USER = 'hexagent';

export async function runCommand(command, args = [], { onStdout, onStderr } = {}) {
  const config = loadConfig();

  if (config.executionMode === 'docker') {
    return runInDocker(command, args, { onStdout, onStderr });
  } else {
    return runDirect(command, args, { onStdout, onStderr });
  }
}

async function runDirect(command, args, { onStdout, onStderr }) {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { shell: true });

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
      resolve({ stdout, stderr, exitCode: code, timedOut: false });
    });

    proc.on('error', (err) => {
      resolve({ stdout, stderr: stderr + err.message, exitCode: 1, timedOut: false });
    });
  });
}

async function runInDocker(command, args, { onStdout, onStderr }) {
  return new Promise((resolve) => {
    const proc = spawn('docker', [
      'exec', '-u', USER, CONTAINER,
      command, ...args,
    ]);

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
      resolve({ stdout, stderr, exitCode: code, timedOut: false });
    });

    proc.on('error', (err) => {
      resolve({ stdout, stderr: stderr + err.message, exitCode: 1, timedOut: false });
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
