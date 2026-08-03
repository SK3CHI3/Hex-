import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const SKILLS_DIR = join(homedir(), '.hex', 'skills');

// Ensure skills directory exists
if (!existsSync(SKILLS_DIR)) {
  mkdirSync(SKILLS_DIR, { recursive: true });
}

export function listSkills() {
  if (!existsSync(SKILLS_DIR)) return [];
  
  const files = readdirSync(SKILLS_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    try {
      const content = readFileSync(join(SKILLS_DIR, f), 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

export function getSkill(name) {
  const path = join(SKILLS_DIR, `${name}.json`);
  if (!existsSync(path)) return null;
  
  try {
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function saveSkill(skill) {
  const path = join(SKILLS_DIR, `${skill.name}.json`);
  writeFileSync(path, JSON.stringify(skill, null, 2));
  return true;
}

export function deleteSkill(name) {
  const path = join(SKILLS_DIR, `${name}.json`);
  if (!existsSync(path)) return false;
  
  const { unlinkSync } = require('fs');
  unlinkSync(path);
  return true;
}

// Built-in skills
export const BUILTIN_SKILLS = [
  {
    name: 'web-recon',
    description: 'Comprehensive web reconnaissance',
    steps: [
      { tool: 'whois_lookup', args: { domain: '{{target}}' } },
      { tool: 'dns_lookup', args: { domain: '{{target}}', record_type: 'A' } },
      { tool: 'dns_lookup', args: { domain: '{{target}}', record_type: 'MX' } },
      { tool: 'subfinder_enum', args: { domain: '{{target}}' } },
      { tool: 'httpx_probe', args: { targets: ['{{target}}'] } },
      { tool: 'nuclei_scan', args: { target: '{{target}}', templates: ['default'] } }
    ]
  },
  {
    name: 'network-scan',
    description: 'Full network port scan with service detection',
    steps: [
      { tool: 'nmap_scan', args: { target: '{{target}}', scan_type: '-sS', ports: '1-1000' } },
      { tool: 'nmap_scan', args: { target: '{{target}}', scan_type: '-sV', ports: '{{open_ports}}' } },
      { tool: 'nmap_scan', args: { target: '{{target}}', scan_type: '-sC', ports: '{{open_ports}}' } }
    ]
  },
  {
    name: 'password-audit',
    description: 'Password security assessment',
    steps: [
      { tool: 'hydra_attack', args: { service: '{{service}}', target: '{{target}}', usernames: '{{usernames}}', wordlist: '{{wordlist}}' } },
      { tool: 'hashcat_crack', args: { hash_file: '{{hash_file}}', attack_mode: '0', hash_type: '{{hash_type}}' } }
    ]
  },
  {
    name: 'vuln-scan',
    description: 'Vulnerability scanning with multiple tools',
    steps: [
      { tool: 'nikto_scan', args: { target: '{{target}}' } },
      { tool: 'nuclei_scan', args: { target: '{{target}}', templates: ['cves', 'default'] } },
      { tool: 'sqlmap_test', args: { url: '{{target}}', level: '3' } }
    ]
  }
];

export function initBuiltinSkills() {
  for (const skill of BUILTIN_SKILLS) {
    if (!getSkill(skill.name)) {
      saveSkill(skill);
    }
  }
}
