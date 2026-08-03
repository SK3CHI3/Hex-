/**
 * Tool definitions in ModelScope function-calling format.
 * These map to commands executed inside the Kali Docker container.
 */

export const tools = [
  {
    type: 'function',
    function: {
      name: 'nmap_scan',
      description: 'Perform network reconnaissance using Nmap. Scan ports, detect services, identify vulnerabilities.',
      parameters: {
        type: 'object',
        properties: {
          target: { type: 'string', description: 'Target IP or domain (e.g. "192.168.1.1")' },
          scan_type: {
            type: 'string',
            enum: ['ping', 'quick', 'port', 'service', 'full', 'stealth', 'vuln'],
            description: 'ping=host discovery, quick=common ports, port=specific ports, service=version detect, full=comprehensive, stealth=SYN scan, vuln=vulnerability scripts',
          },
          ports: { type: 'string', description: 'Port spec (e.g. "80,443" or "1-1000"). Optional.' },
        },
        required: ['target', 'scan_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sqlmap_test',
      description: 'Test for SQL injection vulnerabilities using SQLMap.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL to test' },
          level: { type: 'integer', minimum: 1, maximum: 5, description: 'Test level (1-5)' },
          risk: { type: 'integer', minimum: 1, maximum: 3, description: 'Risk level (1-3)' },
          technique: { type: 'string', enum: ['B', 'E', 'U', 'S', 'T', 'Q', 'BEUSTQ'] },
          dump_db: { type: 'boolean', description: 'Attempt to dump database contents' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'gobuster_scan',
      description: 'Directory and file brute-forcing to discover hidden web content.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          wordlist: { type: 'string', enum: ['common', 'medium', 'large'], description: 'Wordlist size' },
          extensions: { type: 'string', description: 'File extensions (e.g. "php,html,js")' },
          threads: { type: 'integer', minimum: 1, maximum: 50 },
        },
        required: ['url', 'wordlist'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'nikto_scan',
      description: 'Web server vulnerability scanner.',
      parameters: {
        type: 'object',
        properties: {
          target: { type: 'string', description: 'Target web server' },
          port: { type: 'integer' },
          ssl: { type: 'boolean' },
        },
        required: ['target'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'wpscan',
      description: 'WordPress vulnerability scanner.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'WordPress site URL' },
          enumerate: { type: 'string', enum: ['p', 't', 'u', 'vp', 'vt', 'ap', 'at', 'all'] },
          detection_mode: { type: 'string', enum: ['mixed', 'passive', 'aggressive'] },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'hydra_attack',
      description: 'Network logon brute-force tool.',
      parameters: {
        type: 'object',
        properties: {
          target: { type: 'string', description: 'Target IP or hostname' },
          service: { type: 'string', enum: ['ssh', 'ftp', 'http-get', 'http-post', 'mysql', 'postgres', 'rdp', 'vnc'] },
          username: { type: 'string', description: 'Single username' },
          username_list: { type: 'string', description: 'Path to username wordlist' },
          password_list: { type: 'string', enum: ['rockyou', 'common', 'custom'] },
          threads: { type: 'integer', minimum: 1, maximum: 16 },
        },
        required: ['target', 'service', 'password_list'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'hashcat_crack',
      description: 'Advanced password recovery / hash cracking.',
      parameters: {
        type: 'object',
        properties: {
          hash: { type: 'string', description: 'Hash to crack' },
          hash_type: { type: 'string', enum: ['md5', 'sha1', 'sha256', 'sha512', 'ntlm', 'bcrypt'] },
          attack_mode: { type: 'string', enum: ['dictionary', 'combinator', 'brute-force', 'hybrid'] },
          wordlist: { type: 'string', enum: ['rockyou', 'common', 'passwords'] },
        },
        required: ['hash', 'hash_type', 'attack_mode'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'enum4linux',
      description: 'Enumerate information from Windows/Samba systems.',
      parameters: {
        type: 'object',
        properties: {
          target: { type: 'string', description: 'Target Windows/Samba IP' },
          enumerate: { type: 'string', enum: ['users', 'shares', 'groups', 'password-policy', 'all'] },
        },
        required: ['target'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'smbmap',
      description: 'SMB enumeration tool.',
      parameters: {
        type: 'object',
        properties: {
          target: { type: 'string', description: 'Target SMB server IP' },
          username: { type: 'string' },
          password: { type: 'string' },
          domain: { type: 'string' },
        },
        required: ['target'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'curl_request',
      description: 'Make HTTP/HTTPS requests.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target URL' },
          method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH'] },
          headers: { type: 'object', description: 'Custom HTTP headers' },
          data: { type: 'string', description: 'Request body' },
          follow_redirects: { type: 'boolean' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'whois_lookup',
      description: 'Query WHOIS database for domain information.',
      parameters: {
        type: 'object',
        properties: {
          domain: { type: 'string', description: 'Domain or IP to lookup' },
        },
        required: ['domain'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'dns_lookup',
      description: 'Perform DNS queries.',
      parameters: {
        type: 'object',
        properties: {
          domain: { type: 'string', description: 'Domain to query' },
          record_type: { type: 'string', enum: ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'ANY'] },
        },
        required: ['domain'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'sslscan',
      description: 'Test SSL/TLS configuration of a server.',
      parameters: {
        type: 'object',
        properties: {
          target: { type: 'string', description: 'Target hostname or IP' },
          port: { type: 'integer' },
        },
        required: ['target'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'raw_command',
      description: 'Execute a raw shell command in the Kali container. Use with caution.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Full command to execute' },
        },
        required: ['command'],
      },
    },
  },
];
