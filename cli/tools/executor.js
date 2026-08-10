/**
 * Converts AI tool calls into actual commands.
 */

import { listSkills, getSkill, saveSkill, deleteSkill } from '../storage/skills.js';

const WORDLIST_MAP = {
  common: '/usr/share/wordlists/common.txt',
  medium: '/usr/share/wordlists/medium.txt',
  large: '/usr/share/wordlists/large.txt',
  rockyou: '/usr/share/wordlists/rockyou.txt',
  passwords: '/usr/share/wordlists/passwords.txt',
};

export function buildCommand(toolName, args) {
  switch (toolName) {
    case 'nmap_scan':     return buildNmap(args);
    case 'sqlmap_test':   return buildSQLMap(args);
    case 'gobuster_scan': return buildGobuster(args);
    case 'nikto_scan':    return buildNikto(args);
    case 'wpscan':        return buildWPScan(args);
    case 'hydra_attack':  return buildHydra(args);
    case 'hashcat_crack': return buildHashcat(args);
    case 'curl_request':  return buildCurl(args);
    case 'whois_lookup':  return { command: 'whois', args: [args.domain] };
    case 'dns_lookup':    return { command: 'dig', args: [args.domain, args.record_type || 'A'] };
    case 'sslscan':       return { command: 'sslscan', args: args.port ? [`${args.target}:${args.port}`] : [args.target] };
    case 'enum4linux':    return { command: 'enum4linux', args: [args.target] };
    case 'smbmap': {
      const a = ['-H', args.target];
      if (args.username) a.push('-u', args.username);
      if (args.password) a.push('-p', args.password);
      return { command: 'smbmap', args: a };
    }
    case 'raw_command': {
      const parts = args.command.trim().split(/\s+/);
      return { command: parts[0] || '', args: parts.slice(1) };
    }
    default:
      return null;
  }
}

function buildNmap(a) {
  const cmd = [];
  switch (a.scan_type) {
    case 'ping':    cmd.push('-sn'); break;
    case 'quick':   cmd.push('-F'); break;
    case 'port':    cmd.push('-sV'); if (a.ports) cmd.push('-p', a.ports); break;
    case 'service': cmd.push('-sV', '-sC'); if (a.ports) cmd.push('-p', a.ports); break;
    case 'full':    cmd.push('-A', '-T4', '-p-'); break;
    case 'stealth': cmd.push('-sS', '-T2'); if (a.ports) cmd.push('-p', a.ports); break;
    case 'vuln':    cmd.push('--script', 'vuln'); if (a.ports) cmd.push('-p', a.ports); break;
  }
  cmd.push(a.target);
  return { command: 'nmap', args: cmd };
}

function buildSQLMap(a) {
  const cmd = ['--url', a.url, '--batch'];
  if (a.level) cmd.push('--level', String(a.level));
  if (a.risk) cmd.push('--risk', String(a.risk));
  if (a.technique) cmd.push('--technique', a.technique);
  if (a.dump_db) cmd.push('--dump');
  return { command: 'sqlmap', args: cmd };
}

function buildGobuster(a) {
  const cmd = ['dir', '-u', a.url, '-w', WORDLIST_MAP[a.wordlist] || WORDLIST_MAP.common];
  if (a.extensions) cmd.push('-x', a.extensions);
  if (a.threads) cmd.push('-t', String(a.threads));
  return { command: 'gobuster', args: cmd };
}

function buildNikto(a) {
  const cmd = ['-h', a.target];
  if (a.port) cmd.push('-p', String(a.port));
  if (a.ssl) cmd.push('-ssl');
  return { command: 'nikto', args: cmd };
}

function buildWPScan(a) {
  const cmd = ['--url', a.url];
  if (a.enumerate) cmd.push('--enumerate', a.enumerate);
  if (a.detection_mode) cmd.push('--detection-mode', a.detection_mode);
  return { command: 'wpscan', args: cmd };
}

function buildHydra(a) {
  const cmd = [];
  if (a.username) cmd.push('-l', a.username);
  else if (a.username_list) cmd.push('-L', a.username_list);
  cmd.push('-P', WORDLIST_MAP[a.password_list] || WORDLIST_MAP.common);
  if (a.threads) cmd.push('-t', String(a.threads));
  cmd.push(a.target, a.service);
  return { command: 'hydra', args: cmd };
}

function buildHashcat(a) {
  const hashTypes = { md5: '0', sha1: '100', sha256: '1400', sha512: '1700', ntlm: '1000', bcrypt: '3200' };
  const cmd = ['-m', hashTypes[a.hash_type] || '0', a.hash];
  if (a.wordlist) cmd.push(WORDLIST_MAP[a.wordlist] || WORDLIST_MAP.common);
  return { command: 'hashcat', args: cmd };
}

function buildCurl(a) {
  const cmd = ['-i'];
  if (a.method && a.method !== 'GET') cmd.push('-X', a.method);
  if (a.headers) {
    for (const [k, v] of Object.entries(a.headers)) cmd.push('-H', `${k}: ${v}`);
  }
  if (a.data) cmd.push('-d', a.data);
  if (a.follow_redirects !== false) cmd.push('-L');
  cmd.push(a.url);
  return { command: 'curl', args: cmd };
}

// Handle skill management operations
function handleSkillManagement(args) {
  const { action, name, description, steps } = args;

  switch (action) {
    case 'list': {
      const skills = listSkills();
      if (skills.length === 0) {
        return { output: 'No skills available.' };
      }
      const skillList = skills.map(s => `- ${s.name}: ${s.description}`).join('\n');
      return { output: `Available skills:\n${skillList}` };
    }

    case 'create': {
      if (!name) {
        return { error: 'Skill name is required for create action.' };
      }
      if (!description) {
        return { error: 'Skill description is required for create action.' };
      }
      if (!steps || !Array.isArray(steps) || steps.length === 0) {
        return { error: 'Steps array is required for create action.' };
      }

      // Validate steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (!step.tool || !step.args) {
          return { error: `Step ${i + 1} is missing 'tool' or 'args' property.` };
        }
      }

      // Check if skill already exists
      const existing = getSkill(name);
      if (existing) {
        return { error: `Skill '${name}' already exists. Delete it first or use a different name.` };
      }

      const skill = {
        name,
        description,
        steps,
        createdAt: new Date().toISOString(),
      };

      saveSkill(skill);
      return { output: `Skill '${name}' created successfully. Users can run it with: /skill ${name}` };
    }

    case 'delete': {
      if (!name) {
        return { error: 'Skill name is required for delete action.' };
      }

      const skill = getSkill(name);
      if (!skill) {
        return { error: `Skill '${name}' not found.` };
      }

      deleteSkill(name);
      return { output: `Skill '${name}' deleted successfully.` };
    }

    default:
      return { error: `Unknown skill action: ${action}. Use 'list', 'create', or 'delete'.` };
  }
}

// Handle tool installation
async function handleToolInstallation(args) {
  const { tool_name, install_method = 'auto' } = args;

  if (!tool_name) {
    return { error: 'tool_name is required' };
  }

  const { loadConfig } = await import('../core/config.js');
  const config = loadConfig();
  const isDocker = config.executionMode === 'docker';

  let command, cmdArgs;

  // Determine installation method
  if (install_method === 'auto') {
    // Try to detect best method based on tool name
    if (tool_name.includes('git+') || tool_name.startsWith('http')) {
      command = 'git';
      cmdArgs = ['clone', tool_name];
    } else if (tool_name.includes('/') && !tool_name.includes(' ')) {
      // Looks like a Go package (e.g. github.com/user/tool)
      command = 'go';
      cmdArgs = ['install', '-v', tool_name + '@latest'];
    } else {
      // Default to apt for Docker, or try apt then pip for direct
      if (isDocker) {
        command = 'apt-get';
        cmdArgs = ['install', '-y', tool_name];
      } else {
        // For direct mode, try apt first (works on Linux), fallback message for other OS
        command = 'apt-get';
        cmdArgs = ['install', '-y', tool_name];
      }
    }
  } else if (install_method === 'apt') {
    command = 'apt-get';
    cmdArgs = ['install', '-y', tool_name];
  } else if (install_method === 'pip') {
    command = 'pip3';
    cmdArgs = ['install', tool_name];
  } else if (install_method === 'npm') {
    command = 'npm';
    cmdArgs = ['install', '-g', tool_name];
  } else if (install_method === 'go') {
    command = 'go';
    cmdArgs = ['install', '-v', tool_name + '@latest'];
  } else if (install_method === 'git') {
    command = 'git';
    cmdArgs = ['clone', tool_name];
  } else {
    return { error: `Unknown install method: ${install_method}` };
  }

  // Execute installation
  if (isDocker) {
    // Install in Docker container
    const { runCommand } = await import('./docker.js');

    // Update package list first if using apt
    if (command === 'apt-get') {
      await runCommand('apt-get', ['update', '-qq'], {});
    }

    const result = await runCommand(command, cmdArgs, {});

    if (result.exitCode === 0) {
      return {
        output: `✓ Successfully installed ${tool_name}\n\n${result.stdout || 'Installation completed'}`,
        exitCode: 0
      };
    } else {
      return {
        error: `Failed to install ${tool_name}\n\n${result.stderr || result.stdout || 'Unknown error'}`,
        exitCode: result.exitCode
      };
    }
  } else {
    // Install on host system
    const { spawn } = await import('child_process');

    return new Promise((resolve) => {
      // Update package list first if using apt
      if (command === 'apt-get') {
        const update = spawn('sudo', ['apt-get', 'update', '-qq'], { shell: true });
        update.on('close', () => {
          const proc = spawn('sudo', [command, ...cmdArgs], { shell: true });
          let stdout = '';
          let stderr = '';

          proc.stdout.on('data', (data) => { stdout += data.toString(); });
          proc.stderr.on('data', (data) => { stderr += data.toString(); });

          proc.on('close', (code) => {
            if (code === 0) {
              resolve({
                output: `✓ Successfully installed ${tool_name}\n\n${stdout || 'Installation completed'}`,
                exitCode: 0
              });
            } else {
              resolve({
                error: `Failed to install ${tool_name}\n\n${stderr || stdout || 'Unknown error'}`,
                exitCode: code
              });
            }
          });

          proc.on('error', (err) => {
            resolve({
              error: `Failed to execute installation: ${err.message}`,
              exitCode: 1
            });
          });
        });
      } else {
        const proc = spawn(command, cmdArgs, { shell: true });
        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => { stdout += data.toString(); });
        proc.stderr.on('data', (data) => { stderr += data.toString(); });

        proc.on('close', (code) => {
          if (code === 0) {
            resolve({
              output: `✓ Successfully installed ${tool_name}\n\n${stdout || 'Installation completed'}`,
              exitCode: 0
            });
          } else {
            resolve({
              error: `Failed to install ${tool_name}\n\n${stderr || stdout || 'Unknown error'}`,
              exitCode: code
            });
          }
        });

        proc.on('error', (err) => {
          resolve({
            error: `Failed to execute installation: ${err.message}`,
            exitCode: 1
          });
        });
      }
    });
  }
}

export async function executeToolCall(toolCall) {
  const { name, arguments: args } = toolCall;

  // Handle web_search specially - it doesn't use buildCommand
  if (name === 'web_search') {
    const { webSearch, formatSearchResults } = await import('../utils/search.js');
    const result = await webSearch(args.query, args.max_results || 5);
    return { output: formatSearchResults(result) };
  }

  // Handle skill management
  if (name === 'skill_manage') {
    return handleSkillManagement(args);
  }

  // Handle tool installation
  if (name === 'install_tool') {
    return await handleToolInstallation(args);
  }

  const built = buildCommand(name, args);

  if (!built) {
    return { error: `Unknown tool: ${name}` };
  }

  const { runCommand } = await import('./docker.js');
  const result = await runCommand(built.command, built.args, {
    onStdout: (text) => process.stdout.write(text),
    onStderr: (text) => process.stdout.write(text),
  });

  if (result.timedOut) {
    return { error: 'Command timed out' };
  }

  const output = result.stdout || result.stderr || 'Command completed with no output';
  const MAX_LEN = 8000;
  let truncated = output;
  let wasTruncated = false;

  if (output.length > MAX_LEN) {
    truncated = output.slice(0, MAX_LEN);
    wasTruncated = true;
  }

  return {
    output: truncated,
    exitCode: result.exitCode,
    fullLength: output.length,
    wasTruncated,
    expandHint: wasTruncated ? `\n\n[Output truncated. Full output: ${output.length} chars. Use 'show full' to see complete output.]` : null
  };
}
