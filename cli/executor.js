/**
 * Converts AI tool calls into actual commands.
 */

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

export async function executeToolCall(toolCall) {
  const { name, arguments: args } = toolCall;
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
    return { error: 'Command timed out after 5 minutes' };
  }

  const output = result.stdout || result.stderr || 'Command completed with no output';
  const MAX_LEN = 8000;
  const truncated = output.length > MAX_LEN
    ? output.slice(0, MAX_LEN) + `\n\n... [output truncated, ${output.length - MAX_LEN} chars omitted]`
    : output;

  return { output: truncated, exitCode: result.exitCode };
}
