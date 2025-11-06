/**
 * Tool Executor for MCP Server
 * Interfaces with existing Docker execution infrastructure
 */

import { spawn } from 'child_process';
import { toolCommandMap } from './tools.js';

/**
 * Build command arguments from tool call
 */
function buildCommandArgs(toolName, args) {
  switch (toolName) {
    case 'raw_command':
      // Parse raw command
      const parts = args.command.trim().split(/\s+/);
      return {
        command: parts[0] || '',
        commandArgs: parts.slice(1)
      };
    
    case 'nmap_scan':
      return buildNmapCommand(args);
    
    case 'sqlmap_test':
      return buildSQLMapCommand(args);
    
    case 'gobuster_scan':
      return buildGobusterCommand(args);
    
    case 'nikto_scan':
      return buildNiktoCommand(args);
    
    case 'wpscan':
      return buildWPScanCommand(args);
    
    case 'hydra_attack':
      return buildHydraCommand(args);
    
    case 'hashcat_crack':
      return buildHashcatCommand(args);
    
    case 'curl_request':
      return buildCurlCommand(args);
    
    case 'whois_lookup':
      return {
        command: 'whois',
        commandArgs: [args.domain]
      };
    
    case 'dns_lookup':
      return {
        command: 'dig',
        commandArgs: [args.domain, args.record_type || 'A']
      };
    
    case 'sslscan':
      const sslArgs = [args.target];
      if (args.port) sslArgs.push(`${args.target}:${args.port}`);
      return {
        command: 'sslscan',
        commandArgs: sslArgs
      };
    
    case 'enum4linux':
      return {
        command: 'enum4linux',
        commandArgs: [args.target]
      };
    
    case 'smbmap':
      const smbArgs = ['-H', args.target];
      if (args.username) smbArgs.push('-u', args.username);
      if (args.password) smbArgs.push('-p', args.password);
      return {
        command: 'smbmap',
        commandArgs: smbArgs
      };
    
    default:
      return {
        command: toolCommandMap[toolName] || '',
        commandArgs: []
      };
  }
}

function buildNmapCommand(args) {
  const cmd = [];
  
  switch (args.scan_type) {
    case 'ping':
      cmd.push('-sn');
      break;
    case 'quick':
      cmd.push('-F');
      break;
    case 'port':
      cmd.push('-sV');
      if (args.ports) cmd.push('-p', args.ports);
      break;
    case 'service':
      cmd.push('-sV', '-sC');
      if (args.ports) cmd.push('-p', args.ports);
      break;
    case 'full':
      cmd.push('-A', '-T4', '-p-');
      break;
    case 'stealth':
      cmd.push('-sS', '-T2');
      if (args.ports) cmd.push('-p', args.ports);
      break;
    case 'vuln':
      cmd.push('--script', 'vuln');
      if (args.ports) cmd.push('-p', args.ports);
      break;
  }
  
  cmd.push(args.target);
  return { command: 'nmap', commandArgs: cmd };
}

function buildSQLMapCommand(args) {
  const cmd = ['--url', args.url, '--batch'];
  
  if (args.level) cmd.push('--level', args.level.toString());
  if (args.risk) cmd.push('--risk', args.risk.toString());
  if (args.technique) cmd.push('--technique', args.technique);
  if (args.dump_db) cmd.push('--dump');
  
  return { command: 'sqlmap', commandArgs: cmd };
}

function buildGobusterCommand(args) {
  const wordlistMap = {
    'common': '/usr/share/wordlists/common.txt',
    'medium': '/usr/share/wordlists/medium.txt',
    'large': '/usr/share/wordlists/large.txt'
  };
  
  const cmd = [
    'dir',
    '-u', args.url,
    '-w', wordlistMap[args.wordlist] || wordlistMap.common
  ];
  
  if (args.extensions) cmd.push('-x', args.extensions);
  if (args.threads) cmd.push('-t', args.threads.toString());
  
  return { command: 'gobuster', commandArgs: cmd };
}

function buildNiktoCommand(args) {
  const cmd = ['-h', args.target];
  
  if (args.port) cmd.push('-p', args.port.toString());
  if (args.ssl) cmd.push('-ssl');
  if (args.tuning === 'quick') cmd.push('-Tuning', '1');
  else if (args.tuning === 'full') cmd.push('-Tuning', 'x');
  
  return { command: 'nikto', commandArgs: cmd };
}

function buildWPScanCommand(args) {
  const cmd = ['--url', args.url];
  
  if (args.enumerate) cmd.push('--enumerate', args.enumerate);
  if (args.detection_mode) cmd.push('--detection-mode', args.detection_mode);
  
  return { command: 'wpscan', commandArgs: cmd };
}

function buildHydraCommand(args) {
  const cmd = [];
  
  if (args.username) cmd.push('-l', args.username);
  else if (args.username_list) cmd.push('-L', args.username_list);
  
  const passwordListMap = {
    'rockyou': '/usr/share/wordlists/rockyou.txt',
    'common': '/usr/share/wordlists/common-passwords.txt',
    'custom': '/usr/share/wordlists/custom.txt'
  };
  
  cmd.push('-P', passwordListMap[args.password_list] || passwordListMap.common);
  
  if (args.threads) cmd.push('-t', args.threads.toString());
  
  cmd.push(args.target, args.service);
  
  return { command: 'hydra', commandArgs: cmd };
}

function buildHashcatCommand(args) {
  const cmd = ['-m'];
  
  // Hash type codes
  const hashTypes = {
    'md5': '0',
    'sha1': '100',
    'sha256': '1400',
    'sha512': '1700',
    'ntlm': '1000',
    'bcrypt': '3200'
  };
  
  cmd.push(hashTypes[args.hash_type] || '0');
  cmd.push(args.hash);
  
  if (args.wordlist) {
    const wordlistMap = {
      'rockyou': '/usr/share/wordlists/rockyou.txt',
      'common': '/usr/share/wordlists/common-passwords.txt',
      'passwords': '/usr/share/wordlists/passwords.txt'
    };
    cmd.push(wordlistMap[args.wordlist]);
  }
  
  return { command: 'hashcat', commandArgs: cmd };
}

function buildCurlCommand(args) {
  const cmd = ['-i']; // Include headers
  
  if (args.method && args.method !== 'GET') {
    cmd.push('-X', args.method);
  }
  
  if (args.headers) {
    for (const [key, value] of Object.entries(args.headers)) {
      cmd.push('-H', `${key}: ${value}`);
    }
  }
  
  if (args.data) {
    cmd.push('-d', args.data);
  }
  
  if (args.follow_redirects !== false) {
    cmd.push('-L');
  }
  
  cmd.push(args.url);
  
  return { command: 'curl', commandArgs: cmd };
}

/**
 * Execute tool command in Docker container
 */
export async function executeToolCommand(toolName, args) {
  return new Promise((resolve) => {
    const { command, commandArgs } = buildCommandArgs(toolName, args);

    if (!command) {
      resolve({
        output: `Unknown tool: ${toolName}`,
        isError: true,
        exitCode: 1
      });
      return;
    }

    console.error(`[Executor] Running: docker exec hex-kali-tools ${command} ${commandArgs.join(' ')}`);

    // Execute in Docker container
    const proc = spawn('docker', [
      'exec',
      '-u', 'hexagent',
      'hex-kali-tools',
      command,
      ...commandArgs
    ]);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Set 5 minute timeout
    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      resolve({
        output: 'Command timed out after 5 minutes',
        isError: true,
        exitCode: 124
      });
    }, 5 * 60 * 1000);

    proc.on('close', (code) => {
      clearTimeout(timeout);
      
      const output = stdout + (stderr ? `\n\nSTDERR:\n${stderr}` : '');
      
      resolve({
        output: output || 'Command completed with no output',
        isError: code !== 0,
        exitCode: code
      });
    });

    proc.on('error', (error) => {
      clearTimeout(timeout);
      resolve({
        output: `Execution error: ${error.message}`,
        isError: true,
        exitCode: 1
      });
    });
  });
}


