/**
 * Professional Security Tool Schemas for DeepSeek Function Calling
 * These define all the pentesting tools available to Hex AI
 */

export const professionalSecurityTools = [
  // ==================== NETWORK SCANNING ====================
  {
    type: 'function',
    function: {
      name: 'nmap_scan',
      description: 'Perform network reconnaissance using Nmap. Can scan ports, detect services, and identify vulnerabilities.',
      parameters: {
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
            description: 'Port specification (e.g., "80,443" or "1-1000" or "top-ports 100"). Optional.'
          }
        },
        required: ['target', 'scan_type']
      }
    }
  },

  // ==================== WEB APPLICATION TESTING ====================
  {
    type: 'function',
    function: {
      name: 'sqlmap_test',
      description: 'Test for SQL injection vulnerabilities using SQLMap. Automatically detects and exploits SQL injection flaws.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Target URL to test for SQL injection (e.g., "http://example.com/page?id=1")'
          },
          level: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            description: 'Test level (1-5): Higher levels test more injection points. Default: 1'
          },
          risk: {
            type: 'integer',
            minimum: 1,
            maximum: 3,
            description: 'Risk level (1-3): Higher risks use more dangerous payloads. Default: 1'
          },
          technique: {
            type: 'string',
            enum: ['B', 'E', 'U', 'S', 'T', 'Q', 'BEUSTQ'],
            description: 'SQL injection techniques: B(Boolean), E(Error), U(Union), S(Stacked), T(Time), Q(Inline). Default: BEUSTQ (all)'
          },
          dump_db: {
            type: 'boolean',
            description: 'Attempt to dump database contents. Default: false'
          }
        },
        required: ['url']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'gobuster_scan',
      description: 'Directory and file brute-forcing to discover hidden web content using Gobuster.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Target URL to scan (e.g., "http://example.com")'
          },
          wordlist: {
            type: 'string',
            enum: ['common', 'medium', 'large'],
            description: 'Wordlist size: common (~1000 entries), medium (~200k entries), large (~1M entries)'
          },
          extensions: {
            type: 'string',
            description: 'File extensions to search for (e.g., "php,html,js,txt"). Optional.'
          },
          threads: {
            type: 'integer',
            minimum: 1,
            maximum: 50,
            description: 'Number of concurrent threads. Default: 10'
          }
        },
        required: ['url', 'wordlist']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'nikto_scan',
      description: 'Web server vulnerability scanner that checks for outdated servers, dangerous files, and misconfigurations.',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'Target web server (e.g., "http://example.com" or "192.168.1.1")'
          },
          port: {
            type: 'integer',
            description: 'Port to scan. Default: 80 for HTTP, 443 for HTTPS'
          },
          ssl: {
            type: 'boolean',
            description: 'Use SSL/TLS (HTTPS). Default: auto-detected from URL'
          },
          tuning: {
            type: 'string',
            enum: ['quick', 'full', 'specific'],
            description: 'Scan tuning: quick (common checks), full (all tests), specific (targeted tests)'
          }
        },
        required: ['target']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'wpscan',
      description: 'WordPress vulnerability scanner that checks for vulnerable plugins, themes, and core files.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'WordPress site URL (e.g., "http://example.com")'
          },
          enumerate: {
            type: 'string',
            enum: ['p', 't', 'u', 'vp', 'vt', 'ap', 'at', 'all'],
            description: 'Enumerate: p(plugins), t(themes), u(users), vp(vulnerable plugins), vt(vulnerable themes), ap(all plugins), at(all themes), all(everything)'
          },
          detection_mode: {
            type: 'string',
            enum: ['mixed', 'passive', 'aggressive'],
            description: 'Detection mode: mixed (default), passive (stealthy), aggressive (comprehensive but noisy)'
          }
        },
        required: ['url']
      }
    }
  },

  // ==================== PASSWORD CRACKING ====================
  {
    type: 'function',
    function: {
      name: 'hydra_attack',
      description: 'Network logon brute-force tool supporting multiple protocols (SSH, FTP, HTTP, etc.).',
      parameters: {
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
            description: 'Single username to test. Use username_list for multiple.'
          },
          username_list: {
            type: 'string',
            description: 'Path to username wordlist. Mutually exclusive with username.'
          },
          password_list: {
            type: 'string',
            enum: ['rockyou', 'common', 'custom'],
            description: 'Password wordlist to use'
          },
          threads: {
            type: 'integer',
            minimum: 1,
            maximum: 16,
            description: 'Number of parallel connections. Default: 4'
          }
        },
        required: ['target', 'service', 'password_list']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'hashcat_crack',
      description: 'Advanced password recovery tool for cracking hashes using GPU acceleration.',
      parameters: {
        type: 'object',
        properties: {
          hash: {
            type: 'string',
            description: 'Hash to crack (or file path containing hashes)'
          },
          hash_type: {
            type: 'string',
            enum: ['md5', 'sha1', 'sha256', 'sha512', 'ntlm', 'bcrypt'],
            description: 'Type of hash algorithm'
          },
          attack_mode: {
            type: 'string',
            enum: ['dictionary', 'combinator', 'brute-force', 'hybrid'],
            description: 'Attack mode to use'
          },
          wordlist: {
            type: 'string',
            enum: ['rockyou', 'common', 'passwords'],
            description: 'Wordlist for dictionary attacks'
          }
        },
        required: ['hash', 'hash_type', 'attack_mode']
      }
    }
  },

  // ==================== EXPLOITATION ====================
  {
    type: 'function',
    function: {
      name: 'metasploit_search',
      description: 'Search the Metasploit Framework database for exploits, payloads, and auxiliary modules.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search term (e.g., "apache", "windows smb", "CVE-2023-1234")'
          },
          type: {
            type: 'string',
            enum: ['exploit', 'auxiliary', 'payload', 'all'],
            description: 'Module type to search. Default: all'
          }
        },
        required: ['query']
      }
    }
  },

  // ==================== ENUMERATION ====================
  {
    type: 'function',
    function: {
      name: 'enum4linux',
      description: 'Enumerate information from Windows and Samba systems (shares, users, groups, etc.).',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'Target Windows/Samba host IP address'
          },
          enumerate: {
            type: 'string',
            enum: ['users', 'shares', 'groups', 'password-policy', 'all'],
            description: 'What to enumerate: users, shares, groups, password-policy, or all'
          }
        },
        required: ['target']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'smbmap',
      description: 'SMB enumeration tool for discovering shares and permissions on SMB servers.',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'Target SMB server IP address'
          },
          username: {
            type: 'string',
            description: 'Username for authentication. Optional for null session.'
          },
          password: {
            type: 'string',
            description: 'Password for authentication. Optional for null session.'
          },
          domain: {
            type: 'string',
            description: 'Domain for authentication. Optional.'
          },
          enumerate: {
            type: 'boolean',
            description: 'Recursively list all files on shares. Default: false'
          }
        },
        required: ['target']
      }
    }
  },

  // ==================== NETWORK UTILITIES ====================
  {
    type: 'function',
    function: {
      name: 'curl_request',
      description: 'Make HTTP/HTTPS requests with full control over headers, methods, and data.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Target URL'
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH'],
            description: 'HTTP method. Default: GET'
          },
          headers: {
            type: 'object',
            description: 'Custom HTTP headers as key-value pairs'
          },
          data: {
            type: 'string',
            description: 'Request body data (for POST/PUT)'
          },
          follow_redirects: {
            type: 'boolean',
            description: 'Follow HTTP redirects. Default: true'
          },
          output: {
            type: 'string',
            enum: ['headers', 'body', 'full'],
            description: 'What to show: headers, body, or full. Default: full'
          }
        },
        required: ['url']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'whois_lookup',
      description: 'Query WHOIS database for domain registration and ownership information.',
      parameters: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description: 'Domain name or IP address to lookup'
          }
        },
        required: ['domain']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'dns_lookup',
      description: 'Perform DNS queries to resolve domain names and find DNS records.',
      parameters: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description: 'Domain name to query'
          },
          record_type: {
            type: 'string',
            enum: ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'ANY'],
            description: 'DNS record type to query. Default: A'
          }
        },
        required: ['domain']
      }
    }
  },

  // ==================== SSL/TLS TESTING ====================
  {
    type: 'function',
    function: {
      name: 'sslscan',
      description: 'Test SSL/TLS configuration and identify weak ciphers, protocols, and vulnerabilities.',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'Target hostname or IP address'
          },
          port: {
            type: 'integer',
            description: 'Port number. Default: 443'
          }
        },
        required: ['target']
      }
    }
  },

  // ==================== MODERN WEB FUZZING ====================
  {
    type: 'function',
    function: {
      name: 'nuclei_scan',
      description: 'Fast and customizable vulnerability scanner using community templates. Detects CVEs, misconfigurations, and security issues.',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'Target URL or IP (e.g., "https://example.com")'
          },
          severity: {
            type: 'string',
            enum: ['critical', 'high', 'medium', 'low', 'info', 'all'],
            description: 'Minimum severity level to report. Default: medium'
          },
          templates: {
            type: 'string',
            enum: ['cves', 'exposed-panels', 'misconfigurations', 'vulnerabilities', 'default-logins', 'all'],
            description: 'Template categories to use. Default: all'
          },
          rate_limit: {
            type: 'integer',
            description: 'Max requests per second. Default: 150'
          }
        },
        required: ['target']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'ffuf_fuzz',
      description: 'Fast web fuzzer for directory discovery, parameter fuzzing, and vhost discovery.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Target URL with FUZZ keyword (e.g., "http://example.com/FUZZ")'
          },
          wordlist: {
            type: 'string',
            enum: ['common', 'medium', 'large', 'params', 'subdomains'],
            description: 'Wordlist type to use'
          },
          mode: {
            type: 'string',
            enum: ['dir', 'vhost', 'param', 'extension'],
            description: 'Fuzzing mode: dir(directories), vhost(virtual hosts), param(parameters), extension(file extensions)'
          },
          match_codes: {
            type: 'string',
            description: 'HTTP status codes to match (e.g., "200,301,302"). Default: 200,204,301,302,307,401,403'
          },
          threads: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            description: 'Number of threads. Default: 40'
          }
        },
        required: ['url', 'wordlist', 'mode']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'feroxbuster_scan',
      description: 'Modern content discovery tool - fast, recursive, and feature-rich alternative to Gobuster.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Target base URL (e.g., "http://example.com")'
          },
          wordlist: {
            type: 'string',
            enum: ['common', 'raft-small', 'raft-medium', 'raft-large', 'api'],
            description: 'Wordlist size/type'
          },
          depth: {
            type: 'integer',
            minimum: 0,
            maximum: 10,
            description: 'Recursion depth. 0 = no recursion. Default: 4'
          },
          extensions: {
            type: 'string',
            description: 'File extensions to search (e.g., "php,html,js,txt")'
          },
          threads: {
            type: 'integer',
            minimum: 1,
            maximum: 200,
            description: 'Number of threads. Default: 50'
          },
          scan_limit: {
            type: 'integer',
            description: 'Max number of concurrent scans. Default: 0 (unlimited)'
          }
        },
        required: ['url', 'wordlist']
      }
    }
  },

  // ==================== RECONNAISSANCE ====================
  {
    type: 'function',
    function: {
      name: 'subfinder_enum',
      description: 'Passive subdomain enumeration using multiple sources (APIs, search engines, certificate transparency).',
      parameters: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description: 'Target domain (e.g., "example.com")'
          },
          sources: {
            type: 'string',
            enum: ['all', 'passive', 'active', 'cert-transparency'],
            description: 'Data sources to use. Default: all'
          },
          recursive: {
            type: 'boolean',
            description: 'Recursively find subdomains. Default: false'
          },
          resolve: {
            type: 'boolean',
            description: 'Resolve found subdomains to IPs. Default: true'
          }
        },
        required: ['domain']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'amass_enum',
      description: 'Advanced asset discovery and external attack surface mapping using OSINT.',
      parameters: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description: 'Target domain (e.g., "example.com")'
          },
          mode: {
            type: 'string',
            enum: ['passive', 'active', 'intel'],
            description: 'Enumeration mode: passive(OSINT only), active(DNS enumeration), intel(organization intelligence)'
          },
          max_depth: {
            type: 'integer',
            minimum: 0,
            maximum: 5,
            description: 'Subdomain recursion depth. Default: 0'
          },
          brute: {
            type: 'boolean',
            description: 'Enable brute-force subdomain discovery. Default: false'
          }
        },
        required: ['domain', 'mode']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'httpx_probe',
      description: 'Fast HTTP toolkit for probing, title extraction, status codes, and technology detection.',
      parameters: {
        type: 'object',
        properties: {
          targets: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of URLs or domains to probe'
          },
          ports: {
            type: 'string',
            description: 'Ports to probe (e.g., "80,443,8080,8443")'
          },
          tech_detect: {
            type: 'boolean',
            description: 'Detect web technologies. Default: true'
          },
          screenshot: {
            type: 'boolean',
            description: 'Take screenshots of responses. Default: false'
          },
          follow_redirects: {
            type: 'boolean',
            description: 'Follow HTTP redirects. Default: true'
          }
        },
        required: ['targets']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'rustscan',
      description: 'Extremely fast port scanner (scans all 65k ports in <10 seconds). Modern Nmap alternative.',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'Target IP or domain'
          },
          ports: {
            type: 'string',
            description: 'Port range (e.g., "1-1000" or "80,443,8080"). Default: 1-65535'
          },
          batch_size: {
            type: 'integer',
            description: 'Batch size for port scanning. Higher = faster but noisier. Default: 4500'
          },
          timeout: {
            type: 'integer',
            description: 'Timeout in milliseconds. Default: 1500'
          },
          nmap_args: {
            type: 'string',
            description: 'Additional Nmap arguments to run after port discovery (e.g., "-sV -sC")'
          }
        },
        required: ['target']
      }
    }
  },

  // ==================== ACTIVE DIRECTORY / WINDOWS ====================
  {
    type: 'function',
    function: {
      name: 'crackmapexec',
      description: 'Swiss army knife for pentesting Windows/Active Directory networks. Supports SMB, WinRM, LDAP, MSSQL.',
      parameters: {
        type: 'object',
        properties: {
          protocol: {
            type: 'string',
            enum: ['smb', 'winrm', 'ldap', 'mssql', 'ssh'],
            description: 'Protocol to use'
          },
          target: {
            type: 'string',
            description: 'Target IP, range, or hostname'
          },
          action: {
            type: 'string',
            enum: ['enum', 'auth', 'dump', 'exec', 'shares', 'sessions', 'disks', 'users', 'groups', 'password-policy'],
            description: 'Action to perform'
          },
          username: {
            type: 'string',
            description: 'Username for authentication'
          },
          password: {
            type: 'string',
            description: 'Password or hash for authentication'
          },
          domain: {
            type: 'string',
            description: 'Domain name. Optional.'
          }
        },
        required: ['protocol', 'target', 'action']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'bloodhound_collect',
      description: 'Collect Active Directory data for BloodHound analysis (attack path mapping).',
      parameters: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description: 'Target domain (e.g., "CORP.LOCAL")'
          },
          dc_ip: {
            type: 'string',
            description: 'Domain controller IP address'
          },
          collection_method: {
            type: 'string',
            enum: ['All', 'DCOnly', 'Session', 'LoggedOn', 'Group', 'ACL', 'ObjectProps', 'RDP', 'DCOM', 'LocalAdmin'],
            description: 'Data collection method. Default: All'
          },
          username: {
            type: 'string',
            description: 'Domain username for authentication'
          },
          password: {
            type: 'string',
            description: 'Domain password'
          },
          stealth: {
            type: 'boolean',
            description: 'Use stealth collection (slower, less noisy). Default: false'
          }
        },
        required: ['domain', 'dc_ip']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'kerbrute',
      description: 'Kerberos pre-authentication brute-forcing and username enumeration.',
      parameters: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description: 'Target domain (e.g., "CORP.LOCAL")'
          },
          dc_ip: {
            type: 'string',
            description: 'Domain controller IP'
          },
          action: {
            type: 'string',
            enum: ['userenum', 'bruteuser', 'bruteforce', 'passwordspray'],
            description: 'Action: userenum(enumerate users), bruteuser(bruteforce single user), bruteforce(user+password lists), passwordspray(one password, many users)'
          },
          userlist: {
            type: 'string',
            description: 'Path or type of username list'
          },
          password: {
            type: 'string',
            description: 'Single password for passwordspray, or password list path'
          },
          threads: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            description: 'Number of threads. Default: 10'
          }
        },
        required: ['domain', 'dc_ip', 'action']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'responder',
      description: 'LLMNR/NBT-NS/MDNS poisoner for credential capture on Windows networks.',
      parameters: {
        type: 'object',
        properties: {
          interface: {
            type: 'string',
            description: 'Network interface to listen on (e.g., "eth0", "tun0")'
          },
          analyze: {
            type: 'boolean',
            description: 'Analyze mode only (no poisoning). Default: false'
          },
          wpad: {
            type: 'boolean',
            description: 'Start WPAD rogue proxy server. Default: true'
          },
          force_wpad: {
            type: 'boolean',
            description: 'Force WPAD authentication. Default: false'
          },
          fingerprint: {
            type: 'boolean',
            description: 'Fingerprint mode. Default: false'
          }
        },
        required: ['interface']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'impacket_tool',
      description: 'Collection of Python network protocol tools (secretsdump, psexec, smbexec, wmiexec, etc.).',
      parameters: {
        type: 'object',
        properties: {
          tool: {
            type: 'string',
            enum: ['secretsdump', 'psexec', 'smbexec', 'wmiexec', 'dcomexec', 'atexec', 'GetNPUsers', 'GetUserSPNs', 'ticketer', 'lookupsid'],
            description: 'Impacket tool to use'
          },
          target: {
            type: 'string',
            description: 'Target in format: [[domain/]username[:password]@]<targetName or address>'
          },
          command: {
            type: 'string',
            description: 'Command to execute (for psexec, smbexec, wmiexec, etc.)'
          },
          hash: {
            type: 'string',
            description: 'NTLM hash for pass-the-hash. Format: LMHASH:NTHASH'
          },
          dc_ip: {
            type: 'string',
            description: 'Domain controller IP (for Kerberos authentication)'
          }
        },
        required: ['tool', 'target']
      }
    }
  },

  // ==================== NETWORK UTILITIES ====================
  {
    type: 'function',
    function: {
      name: 'chisel_tunnel',
      description: 'Fast TCP/UDP tunnel over HTTP for pivoting and port forwarding.',
      parameters: {
        type: 'object',
        properties: {
          mode: {
            type: 'string',
            enum: ['server', 'client'],
            description: 'Run as server or client'
          },
          listen_port: {
            type: 'integer',
            description: 'Port to listen on (server mode)'
          },
          remote: {
            type: 'string',
            description: 'Remote forwarding configuration (client mode). Format: "<local-port>:<remote-host>:<remote-port>"'
          },
          reverse: {
            type: 'boolean',
            description: 'Enable reverse tunneling. Default: false'
          },
          socks: {
            type: 'boolean',
            description: 'Enable SOCKS5 proxy. Default: false'
          }
        },
        required: ['mode']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'socat_relay',
      description: 'Multipurpose relay tool for bi-directional data transfer between network connections.',
      parameters: {
        type: 'object',
        properties: {
          source: {
            type: 'string',
            description: 'Source address (e.g., "TCP-LISTEN:8080", "STDIN", "UDP-LISTEN:53")'
          },
          destination: {
            type: 'string',
            description: 'Destination address (e.g., "TCP:192.168.1.1:80", "STDOUT", "EXEC:/bin/bash")'
          },
          fork: {
            type: 'boolean',
            description: 'Fork new process for each connection. Default: true for listeners'
          },
          reuseaddr: {
            type: 'boolean',
            description: 'Allow address reuse. Default: true'
          }
        },
        required: ['source', 'destination']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'netcat_listener',
      description: 'Network Swiss army knife for reading/writing network connections, reverse shells, port scanning.',
      parameters: {
        type: 'object',
        properties: {
          mode: {
            type: 'string',
            enum: ['listen', 'connect', 'scan'],
            description: 'Operation mode'
          },
          host: {
            type: 'string',
            description: 'Target host (for connect/scan mode)'
          },
          port: {
            type: 'integer',
            description: 'Port number'
          },
          udp: {
            type: 'boolean',
            description: 'Use UDP instead of TCP. Default: false'
          },
          execute: {
            type: 'string',
            description: 'Execute command on connection (e.g., "/bin/bash" for reverse shell)'
          },
          verbose: {
            type: 'boolean',
            description: 'Verbose output. Default: true'
          }
        },
        required: ['mode', 'port']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'proxychains',
      description: 'Route connections through proxy chains (SOCKS4/SOCKS5/HTTP) for anonymity and pivoting.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Command to run through proxy (e.g., "nmap -sT 10.10.10.1")'
          },
          proxy_type: {
            type: 'string',
            enum: ['socks4', 'socks5', 'http'],
            description: 'Proxy type. Default: socks5'
          },
          proxy_host: {
            type: 'string',
            description: 'Proxy server host. Default: 127.0.0.1'
          },
          proxy_port: {
            type: 'integer',
            description: 'Proxy server port. Default: 9050'
          },
          quiet: {
            type: 'boolean',
            description: 'Suppress proxychains output. Default: false'
          }
        },
        required: ['command']
      }
    }
  },

  // ==================== LDAP / SMB ENUMERATION ====================
  {
    type: 'function',
    function: {
      name: 'ldapsearch_query',
      description: 'LDAP enumeration and querying for Active Directory reconnaissance.',
      parameters: {
        type: 'object',
        properties: {
          server: {
            type: 'string',
            description: 'LDAP server IP or hostname'
          },
          base_dn: {
            type: 'string',
            description: 'Base distinguished name (e.g., "DC=corp,DC=local")'
          },
          query: {
            type: 'string',
            description: 'LDAP query filter (e.g., "(objectClass=user)" or "(servicePrincipalName=*)")'
          },
          attributes: {
            type: 'string',
            description: 'Attributes to return (comma-separated). Default: all'
          },
          username: {
            type: 'string',
            description: 'Bind username for authentication. Optional for anonymous bind.'
          },
          password: {
            type: 'string',
            description: 'Bind password. Optional for anonymous bind.'
          }
        },
        required: ['server', 'base_dn']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'enum4linux_ng',
      description: 'Next-generation enum4linux for SMB/LDAP enumeration with better performance and features.',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'Target IP or hostname'
          },
          enumerate: {
            type: 'string',
            enum: ['all', 'users', 'groups', 'shares', 'policy', 'printers', 'os'],
            description: 'What to enumerate. Default: all'
          },
          username: {
            type: 'string',
            description: 'Username for authenticated enumeration'
          },
          password: {
            type: 'string',
            description: 'Password for authenticated enumeration'
          },
          rid_brute: {
            type: 'boolean',
            description: 'Brute force RIDs to find users. Default: false'
          }
        },
        required: ['target']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'rpcclient_enum',
      description: 'RPC client for enumerating Windows systems via MS-RPC.',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'Target IP or hostname'
          },
          commands: {
            type: 'array',
            items: { type: 'string' },
            description: 'RPC commands to execute (e.g., ["enumdomusers", "querydominfo", "lsaenu mprivs"])'
          },
          username: {
            type: 'string',
            description: 'Username. Use empty string for null session.'
          },
          password: {
            type: 'string',
            description: 'Password'
          }
        },
        required: ['target', 'commands']
      }
    }
  },

  // ==================== WIRELESS / WIFI HACKING ====================
  {
    type: 'function',
    function: {
      name: 'aircrack_ng',
      description: 'WEP and WPA/WPA2-PSK cracking tool. Captures packets and cracks wireless encryption keys.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['monitor', 'capture', 'deauth', 'crack', 'scan'],
            description: 'Action: monitor(enable monitor mode), capture(capture packets), deauth(deauthenticate clients), crack(crack captured handshake), scan(scan for networks)'
          },
          interface: {
            type: 'string',
            description: 'Wireless interface (e.g., "wlan0", "wlan0mon")'
          },
          bssid: {
            type: 'string',
            description: 'Target AP BSSID (MAC address). Required for targeted attacks.'
          },
          channel: {
            type: 'integer',
            minimum: 1,
            maximum: 14,
            description: 'WiFi channel to use. Required for capture/deauth.'
          },
          wordlist: {
            type: 'string',
            enum: ['rockyou', 'common-wifi', 'default-passwords', 'custom'],
            description: 'Wordlist for WPA cracking. Required for crack action.'
          },
          capture_file: {
            type: 'string',
            description: 'Path to .cap file for cracking. Required for crack action.'
          },
          essid: {
            type: 'string',
            description: 'Target network ESSID (name). Optional but helps with cracking.'
          }
        },
        required: ['action', 'interface']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'wifite',
      description: 'Automated wireless attack tool. Attacks multiple WEP, WPA, and WPS encrypted networks.',
      parameters: {
        type: 'object',
        properties: {
          interface: {
            type: 'string',
            description: 'Wireless interface (e.g., "wlan0")'
          },
          attack_type: {
            type: 'string',
            enum: ['all', 'wep', 'wpa', 'wps'],
            description: 'Type of attack: all(try all methods), wep(WEP only), wpa(WPA only), wps(WPS only). Default: all'
          },
          wordlist: {
            type: 'string',
            enum: ['rockyou', 'common-wifi', 'default-passwords'],
            description: 'Wordlist for WPA attacks. Default: rockyou'
          },
          target_bssid: {
            type: 'string',
            description: 'Target specific BSSID (MAC address). Optional - attacks all if not specified.'
          },
          channel: {
            type: 'integer',
            description: 'Scan specific channel only. Optional.'
          },
          timeout: {
            type: 'integer',
            description: 'Attack timeout in seconds. Default: 600'
          },
          wps_only: {
            type: 'boolean',
            description: 'Only attack WPS-enabled networks. Default: false'
          }
        },
        required: ['interface']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'bettercap',
      description: 'Network attack and monitoring framework. Supports WiFi attacks, MITM, packet sniffing, and more.',
      parameters: {
        type: 'object',
        properties: {
          interface: {
            type: 'string',
            description: 'Network interface (e.g., "wlan0", "eth0")'
          },
          attack_type: {
            type: 'string',
            enum: ['wifi-recon', 'wifi-deauth', 'arp-spoof', 'dns-spoof', 'packet-sniff', 'credential-capture'],
            description: 'Attack type to perform'
          },
          target: {
            type: 'string',
            description: 'Target IP, BSSID, or range (e.g., "192.168.1.100" or "AA:BB:CC:DD:EE:FF")'
          },
          channel: {
            type: 'integer',
            description: 'WiFi channel for wireless attacks. Optional.'
          },
          caplet: {
            type: 'string',
            description: 'Bettercap caplet script to run (e.g., "http-ui", "hstshijack"). Optional.'
          },
          gateway: {
            type: 'string',
            description: 'Gateway IP for ARP spoofing. Optional.'
          }
        },
        required: ['interface', 'attack_type']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'reaver_wps',
      description: 'WPS PIN brute-force attack tool. Exploits weak WPS implementations to recover WPA/WPA2 passphrase.',
      parameters: {
        type: 'object',
        properties: {
          interface: {
            type: 'string',
            description: 'Wireless interface in monitor mode (e.g., "wlan0mon")'
          },
          bssid: {
            type: 'string',
            description: 'Target AP BSSID (MAC address)'
          },
          channel: {
            type: 'integer',
            minimum: 1,
            maximum: 14,
            description: 'Target AP channel'
          },
          delay: {
            type: 'integer',
            description: 'Delay between PIN attempts in seconds. Default: 1'
          },
          timeout: {
            type: 'integer',
            description: 'Timeout for each PIN attempt. Default: 5'
          },
          fail_wait: {
            type: 'integer',
            description: 'Time to wait after failed attempt. Default: 0'
          },
          pixie_dust: {
            type: 'boolean',
            description: 'Use Pixie Dust attack (faster offline attack). Default: false'
          }
        },
        required: ['interface', 'bssid', 'channel']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'wash_wps',
      description: 'Scan for WPS-enabled access points and identify vulnerable routers.',
      parameters: {
        type: 'object',
        properties: {
          interface: {
            type: 'string',
            description: 'Wireless interface in monitor mode (e.g., "wlan0mon")'
          },
          channel: {
            type: 'integer',
            description: 'Scan specific channel. Optional - scans all if not specified.'
          },
          scan_time: {
            type: 'integer',
            description: 'Scan duration in seconds. Default: 60'
          },
          ignore_fcs: {
            type: 'boolean',
            description: 'Ignore frame checksum errors. Default: false'
          }
        },
        required: ['interface']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'mdk4_attack',
      description: 'Wireless stress testing and DoS tool. Can perform deauth, beacon flood, and other attacks.',
      parameters: {
        type: 'object',
        properties: {
          interface: {
            type: 'string',
            description: 'Wireless interface in monitor mode'
          },
          attack_mode: {
            type: 'string',
            enum: ['deauth', 'beacon-flood', 'authentication-dos', 'eapol-start', 'wids-confusion'],
            description: 'Attack mode: deauth(disconnect clients), beacon-flood(create fake APs), authentication-dos(auth flood), eapol-start(fake EAPOL), wids-confusion(confuse WIDS)'
          },
          target_bssid: {
            type: 'string',
            description: 'Target AP BSSID. Required for deauth.'
          },
          channel: {
            type: 'integer',
            description: 'Channel to attack on. Required for some attacks.'
          },
          speed: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'max'],
            description: 'Attack speed/intensity. Default: medium'
          },
          essid: {
            type: 'string',
            description: 'ESSID for beacon flood attacks. Optional.'
          }
        },
        required: ['interface', 'attack_mode']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'hostapd_evil_twin',
      description: 'Create rogue access point (Evil Twin) for credential harvesting and phishing.',
      parameters: {
        type: 'object',
        properties: {
          interface: {
            type: 'string',
            description: 'Wireless interface for AP'
          },
          essid: {
            type: 'string',
            description: 'Network name (ESSID) for fake AP'
          },
          channel: {
            type: 'integer',
            minimum: 1,
            maximum: 14,
            description: 'WiFi channel to broadcast on'
          },
          security: {
            type: 'string',
            enum: ['open', 'wpa2'],
            description: 'AP security type. Default: open'
          },
          password: {
            type: 'string',
            description: 'WPA2 password if security is wpa2. Optional.'
          },
          captive_portal: {
            type: 'boolean',
            description: 'Enable captive portal for credential harvesting. Default: false'
          }
        },
        required: ['interface', 'essid', 'channel']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'kismet_scan',
      description: 'Wireless network detector, sniffer, and intrusion detection system.',
      parameters: {
        type: 'object',
        properties: {
          interface: {
            type: 'string',
            description: 'Wireless interface (can be in monitor mode or managed mode)'
          },
          channel_hop: {
            type: 'boolean',
            description: 'Enable channel hopping to scan all channels. Default: true'
          },
          log_type: {
            type: 'string',
            enum: ['pcap', 'wiglecsv', 'netxml', 'all'],
            description: 'Log file format. Default: pcap'
          },
          scan_time: {
            type: 'integer',
            description: 'Scan duration in seconds. Default: 300 (5 minutes)'
          },
          filter_bssid: {
            type: 'string',
            description: 'Filter for specific BSSID. Optional.'
          }
        },
        required: ['interface']
      }
    }
  },

  // ==================== REPORTING ====================
  {
    type: 'function',
    function: {
      name: 'generate_report',
      description: 'Generate a professional penetration testing report from findings.',
      parameters: {
        type: 'object',
        properties: {
          findings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
                description: { type: 'string' },
                impact: { type: 'string' },
                remediation: { type: 'string' },
                cvss_score: { type: 'number' }
              }
            },
            description: 'List of security findings to include in the report'
          },
          format: {
            type: 'string',
            enum: ['markdown', 'json', 'html'],
            description: 'Report format. Default: markdown'
          },
          include_executive_summary: {
            type: 'boolean',
            description: 'Include executive summary. Default: true'
          }
        },
        required: ['findings']
      }
    }
  }
];

// Tool name mapping for execution
export const toolCommandMap: Record<string, string> = {
  // Original tools
  'nmap_scan': 'nmap',
  'sqlmap_test': 'sqlmap',
  'gobuster_scan': 'gobuster',
  'nikto_scan': 'nikto',
  'wpscan': 'wpscan',
  'hydra_attack': 'hydra',
  'hashcat_crack': 'hashcat',
  'metasploit_search': 'msfconsole',
  'enum4linux': 'enum4linux',
  'smbmap': 'smbmap',
  'curl_request': 'curl',
  'whois_lookup': 'whois',
  'dns_lookup': 'dig',
  'sslscan': 'sslscan',
  
  // Modern web fuzzing & scanning
  'nuclei_scan': 'nuclei',
  'ffuf_fuzz': 'ffuf',
  'feroxbuster_scan': 'feroxbuster',
  
  // Reconnaissance
  'subfinder_enum': 'subfinder',
  'amass_enum': 'amass',
  'httpx_probe': 'httpx',
  'rustscan': 'rustscan',
  
  // Active Directory / Windows
  'crackmapexec': 'crackmapexec',
  'bloodhound_collect': 'bloodhound-python',
  'kerbrute': 'kerbrute',
  'responder': 'responder',
  'impacket_tool': 'impacket',
  
  // Network utilities
  'chisel_tunnel': 'chisel',
  'socat_relay': 'socat',
  'netcat_listener': 'nc',
  'proxychains': 'proxychains',
  
  // LDAP / SMB enumeration
  'ldapsearch_query': 'ldapsearch',
  'enum4linux_ng': 'enum4linux-ng',
  'rpcclient_enum': 'rpcclient',
  
  // Wireless / WiFi hacking
  'aircrack_ng': 'aircrack-ng',
  'wifite': 'wifite',
  'bettercap': 'bettercap',
  'reaver_wps': 'reaver',
  'wash_wps': 'wash',
  'mdk4_attack': 'mdk4',
  'hostapd_evil_twin': 'hostapd',
  'kismet_scan': 'kismet',
  
  // Reporting
  'generate_report': '__REPORT__',
  'raw_command': '__RAW__' // Special marker for direct command execution
};


