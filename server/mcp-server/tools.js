/**
 * MCP Tool Definitions
 * Converted from OpenAI/DeepSeek format to MCP format
 */

export const mcpTools = [
  // ==================== NETWORK SCANNING ====================
  {
    name: 'nmap_scan',
    description: 'Perform network reconnaissance using Nmap. Can scan ports, detect services, and identify vulnerabilities.',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Target IP address or domain to scan (e.g., "192.168.1.1" or "example.com")'
        },
        scan_type: {
          type: 'string',
          enum: ['ping', 'quick', 'port', 'service', 'full', 'stealth', 'vuln'],
          description: 'Type of scan: ping (host discovery), quick (common ports), port (specific ports), service (version detection), full (comprehensive), stealth (SYN scan), vuln (vulnerability scripts)'
        },
        ports: {
          type: 'string',
          description: 'Port specification (e.g., "80,443" or "1-1000"). Optional.'
        }
      },
      required: ['target', 'scan_type']
    }
  },

  // ==================== WEB APPLICATION TESTING ====================
  {
    name: 'sqlmap_test',
    description: 'Test for SQL injection vulnerabilities using SQLMap. Automatically detects and exploits SQL injection flaws.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Target URL to test for SQL injection'
        },
        level: {
          type: 'integer',
          minimum: 1,
          maximum: 5,
          description: 'Test level (1-5): Higher levels test more injection points'
        },
        risk: {
          type: 'integer',
          minimum: 1,
          maximum: 3,
          description: 'Risk level (1-3): Higher risks use more dangerous payloads'
        },
        technique: {
          type: 'string',
          enum: ['B', 'E', 'U', 'S', 'T', 'Q', 'BEUSTQ'],
          description: 'SQL injection techniques'
        },
        dump_db: {
          type: 'boolean',
          description: 'Attempt to dump database contents'
        }
      },
      required: ['url']
    }
  },

  {
    name: 'gobuster_scan',
    description: 'Directory and file brute-forcing to discover hidden web content.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Target URL to scan'
        },
        wordlist: {
          type: 'string',
          enum: ['common', 'medium', 'large'],
          description: 'Wordlist size'
        },
        extensions: {
          type: 'string',
          description: 'File extensions to search for'
        },
        threads: {
          type: 'integer',
          minimum: 1,
          maximum: 50,
          description: 'Number of concurrent threads'
        }
      },
      required: ['url', 'wordlist']
    }
  },

  {
    name: 'nikto_scan',
    description: 'Web server vulnerability scanner.',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Target web server'
        },
        port: {
          type: 'integer',
          description: 'Port to scan'
        },
        ssl: {
          type: 'boolean',
          description: 'Use SSL/TLS'
        },
        tuning: {
          type: 'string',
          enum: ['quick', 'full', 'specific'],
          description: 'Scan tuning'
        }
      },
      required: ['target']
    }
  },

  {
    name: 'wpscan',
    description: 'WordPress vulnerability scanner.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'WordPress site URL'
        },
        enumerate: {
          type: 'string',
          enum: ['p', 't', 'u', 'vp', 'vt', 'ap', 'at', 'all'],
          description: 'What to enumerate'
        },
        detection_mode: {
          type: 'string',
          enum: ['mixed', 'passive', 'aggressive'],
          description: 'Detection mode'
        }
      },
      required: ['url']
    }
  },

  // ==================== PASSWORD CRACKING ====================
  {
    name: 'hydra_attack',
    description: 'Network logon brute-force tool.',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Target IP or hostname'
        },
        service: {
          type: 'string',
          enum: ['ssh', 'ftp', 'http-get', 'http-post', 'mysql', 'postgres', 'rdp', 'vnc'],
          description: 'Service to attack'
        },
        username: {
          type: 'string',
          description: 'Single username to test'
        },
        username_list: {
          type: 'string',
          description: 'Path to username wordlist'
        },
        password_list: {
          type: 'string',
          enum: ['rockyou', 'common', 'custom'],
          description: 'Password wordlist'
        },
        threads: {
          type: 'integer',
          minimum: 1,
          maximum: 16,
          description: 'Number of parallel connections'
        }
      },
      required: ['target', 'service', 'password_list']
    }
  },

  {
    name: 'hashcat_crack',
    description: 'Advanced password recovery tool.',
    inputSchema: {
      type: 'object',
      properties: {
        hash: {
          type: 'string',
          description: 'Hash to crack'
        },
        hash_type: {
          type: 'string',
          enum: ['md5', 'sha1', 'sha256', 'sha512', 'ntlm', 'bcrypt'],
          description: 'Type of hash algorithm'
        },
        attack_mode: {
          type: 'string',
          enum: ['dictionary', 'combinator', 'brute-force', 'hybrid'],
          description: 'Attack mode'
        },
        wordlist: {
          type: 'string',
          enum: ['rockyou', 'common', 'passwords'],
          description: 'Wordlist for dictionary attacks'
        }
      },
      required: ['hash', 'hash_type', 'attack_mode']
    }
  },

  // ==================== ENUMERATION ====================
  {
    name: 'enum4linux',
    description: 'Enumerate information from Windows and Samba systems.',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Target Windows/Samba host IP'
        },
        enumerate: {
          type: 'string',
          enum: ['users', 'shares', 'groups', 'password-policy', 'all'],
          description: 'What to enumerate'
        }
      },
      required: ['target']
    }
  },

  {
    name: 'smbmap',
    description: 'SMB enumeration tool.',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Target SMB server IP'
        },
        username: {
          type: 'string',
          description: 'Username for authentication'
        },
        password: {
          type: 'string',
          description: 'Password for authentication'
        },
        domain: {
          type: 'string',
          description: 'Domain for authentication'
        },
        enumerate: {
          type: 'boolean',
          description: 'Recursively list all files'
        }
      },
      required: ['target']
    }
  },

  // ==================== NETWORK UTILITIES ====================
  {
    name: 'curl_request',
    description: 'Make HTTP/HTTPS requests with full control.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Target URL'
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH'],
          description: 'HTTP method'
        },
        headers: {
          type: 'object',
          description: 'Custom HTTP headers'
        },
        data: {
          type: 'string',
          description: 'Request body data'
        },
        follow_redirects: {
          type: 'boolean',
          description: 'Follow HTTP redirects'
        }
      },
      required: ['url']
    }
  },

  {
    name: 'whois_lookup',
    description: 'Query WHOIS database for domain information.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'Domain name or IP to lookup'
        }
      },
      required: ['domain']
    }
  },

  {
    name: 'dns_lookup',
    description: 'Perform DNS queries.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: {
          type: 'string',
          description: 'Domain name to query'
        },
        record_type: {
          type: 'string',
          enum: ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'ANY'],
          description: 'DNS record type'
        }
      },
      required: ['domain']
    }
  },

  {
    name: 'sslscan',
    description: 'Test SSL/TLS configuration.',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Target hostname or IP'
        },
        port: {
          type: 'integer',
          description: 'Port number'
        }
      },
      required: ['target']
    }
  },

  // ==================== RAW COMMAND ====================
  {
    name: 'raw_command',
    description: 'Execute a raw shell command directly (use with caution).',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Full command to execute'
        }
      },
      required: ['command']
    }
  }
];

// Tool name to command mapping (for executor)
export const toolCommandMap = {
  'nmap_scan': 'nmap',
  'sqlmap_test': 'sqlmap',
  'gobuster_scan': 'gobuster',
  'nikto_scan': 'nikto',
  'wpscan': 'wpscan',
  'hydra_attack': 'hydra',
  'hashcat_crack': 'hashcat',
  'enum4linux': 'enum4linux',
  'smbmap': 'smbmap',
  'curl_request': 'curl',
  'whois_lookup': 'whois',
  'dns_lookup': 'dig',
  'sslscan': 'sslscan',
  'raw_command': '__RAW__'
};


