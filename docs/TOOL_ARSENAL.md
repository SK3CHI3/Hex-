# Hex AI - Complete Tool Arsenal

## 17 Built-in Tools

Hex comes with 17 pre-configured pentesting tools. If you need more, Hex can install them automatically.

---

## Reconnaissance (4)

| Tool | Function | Use Case |
|------|----------|----------|
| `nmap_scan` | Port scanning & service detection | Network mapping, vulnerability discovery |
| `whois_lookup` | Domain registration info | OSINT, target profiling |
| `dns_lookup` | DNS enumeration (A, AAAA, MX, NS, TXT, CNAME, SOA, ANY) | Domain information gathering |
| `sslscan` | SSL/TLS configuration testing | Certificate & cipher analysis |

---

## Web Application Testing (5)

| Tool | Function | Use Case |
|------|----------|----------|
| `sqlmap_test` | SQL injection detection & exploitation | Database extraction, auth bypass |
| `nikto_scan` | Web server vulnerability scanner | Misconfiguration detection |
| `gobuster_scan` | Directory/file brute-forcing | Web content discovery |
| `wpscan` | WordPress vulnerability scanner | WP plugin/theme exploitation |
| `curl_request` | HTTP/HTTPS requests | API testing, header manipulation |

---

## Password Attacks (2)

| Tool | Function | Use Case |
|------|----------|----------|
| `hydra_attack` | Network login brute-forcing (ssh, ftp, http-get, mysql, postgres, rdp, vnc) | Online password cracking |
| `hashcat_crack` | Hash cracking (md5, sha1, sha256, sha512, ntlm, bcrypt) | Offline hash cracking |

---

## Enumeration (2)

| Tool | Function | Use Case |
|------|----------|----------|
| `enum4linux` | Windows/SMB enumeration (users, shares, groups, all) | AD reconnaissance |
| `smbmap` | SMB enumeration with authentication | Windows share/user enumeration |

---

## Utilities (4)

| Tool | Function | Use Case |
|------|----------|----------|
| `web_search` | DuckDuckGo search (no API key required) | OSINT, CVE research, documentation |
| `install_tool` | Install missing tools (apt, pip, npm, go, git) | Add tools on-the-fly |
| `raw_command` | Execute any shell command directly | Custom commands, scripts |
| `skill_manage` | Create/delete/list reusable attack workflows | Skill management |

---

## Automatic Tool Installation

**You're not limited to these 17 tools.** Hex can install any tool you need automatically.

### Ask Hex to Install Tools

```
❯ Install rustscan
❯ Install ffuf
❯ Install nuclei
❯ Install the latest version of sqlmap
```

Hex uses the `install_tool` function with automatic method detection:

```javascript
// AI calls install_tool
install_tool({ tool_name: "rustscan" })
install_tool({ tool_name: "requests", install_method: "pip" })
install_tool({ tool_name: "lodash", install_method: "npm" })
install_tool({ tool_name: "github.com/user/tool", install_method: "go" })
```

**Supported installation methods:**
- `apt` — Debian/Kali packages (default for Docker)
- `pip` — Python packages
- `npm` — Node.js packages
- `go` — Go tools
- `git` — Clone from repository
- `auto` — Detect best method based on tool name

### How It Works

**Docker Mode:**
```bash
# Hex runs inside Kali container
docker exec hex-kali-tools apt-get install -y rustscan
```

**Direct Mode:**
```bash
# Hex runs on your machine
sudo apt-get install -y rustscan
# or
pip3 install requests
# or
npm install -g lodash
```

### Using Installed Tools

Once installed, use them just like built-in tools:

```
❯ Use rustscan to scan 192.168.1.1
❯ Run ffuf against https://target.com
```

Hex will automatically detect and use the tool via `raw_command`.

---

## Tool Execution Flow

```
┌─────────────────────────────────────────┐
│  AI decides to use a tool               │
│  Example: nmap_scan(target, scan_type)  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  executor.js maps tool → command        │
│  nmap_scan → nmap -F 192.168.1.1       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  docker.js executes via mode            │
│  Direct: spawn('nmap', ['-F', '...'])   │
│  Docker: docker exec hex-kali-tools ... │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Output streams to terminal + AI        │
│  AI analyzes results, may call more     │
└─────────────────────────────────────────┘
```

---

## Docker Container Tools

When using Docker mode, the Kali container comes with 42+ pre-installed tools:

### Installed via APT:
- nmap, sqlmap, hydra, hashcat, john, nikto, gobuster, wpscan
- aircrack-ng, bettercap, kismet, mdk4
- crackmapexec, responder, enum4linux-ng
- impacket suite, bloodhound, pwntools

### Installed via Go:
- nuclei, subfinder, httpx (ProjectDiscovery suite)
- ffuf, kerbrute

### Installed via Binary:
- feroxbuster (Rust)
- chisel (tunneling)

### Installed via Python:
- impacket suite
- bloodhound
- pwntools

**Note:** These tools are available in Docker mode regardless of what's installed on your host machine.

---

## Quick Use Examples

### Network Recon
```
❯ Scan 192.168.1.0/24 for open ports
❯ Enumerate DNS records for example.com
❯ Check SSL configuration for target.com
```

### Web Testing
```
❯ Test https://target.com for SQL injection
❯ Find hidden directories on http://testsite.local
❯ Scan WordPress site for vulnerable plugins
```

### Password Attacks
```
❯ Brute force SSH on 192.168.1.10 with common passwords
❯ Crack this NTLM hash: abc123...
❯ Test FTP login with username admin
```

### Active Directory
```
❯ Enumerate SMB shares on 192.168.1.100
❯ List domain users on CORP.LOCAL
```

### Research & OSINT
```
❯ Search for recent CVEs in Apache
❯ Find information about Log4j vulnerability
❯ Research target.com technology stack
```

---

## Beyond the Built-in Tools

**You're not limited to these 17 tools.** Hex can install and use any pentesting tool you need.

### Popular Tools to Install

**Network Scanning:**
- rustscan — Ultra-fast port scanner
- masscan — Internet-scale scanner
- naabu — Fast port discovery

**Web Testing:**
- ffuf — Fast web fuzzer
- feroxbuster — Recursive content discovery
- katana — Next-gen crawler

**Enumeration:**
- crackmapexec — Network pentesting
- bloodhound — AD attack path mapping

**Exploitation:**
- metasploit — Exploit framework
- exploitdb — Exploit database

### Install and Use

```
❯ Install rustscan

✓ Successfully installed rustscan

❯ Use rustscan to scan 192.168.1.1

$ rustscan -a 192.168.1.1
...
```

See [Custom Tools Guide](CUSTOM_TOOLS.md) for detailed instructions.

---

## AI Integration

Hex AI automatically:
- Detects tool needs based on your requests
- Selects appropriate tools from the 17 built-in options
- Installs missing tools via `install_tool` when needed
- Executes tools in isolated Docker environment (if using Docker mode)
- Parses results and provides analysis
- Chains multiple tools in agentic loop (up to 100 rounds)

### Smart Tool Loading

```
User: "Hello"
→ AI skips sending tools (saved payload size)

User: "Scan example.com for vulnerabilities"
→ AI uses nmap_scan, nikto_scan, sqlmap_test

User: "Crack this hash"
→ AI uses hashcat_crack
```

### Agentic Loop Example

```
❯ Pentest example.com

I'll create a plan:
  1. Reconnaissance - scan ports, enumerate subdomains
  2. Web testing - check for vulnerabilities
  3. Analysis - compile findings

Executing Step 1/3: Reconnaissance...
[nmap_scan("example.com", "quick")]
→ Found 3 open ports: 22, 80, 443

[dns_lookup("example.com", "A")]
→ IP: 93.184.216.34

Executing Step 2/3: Web Testing...
[nikto_scan("example.com")]
→ Found 5 vulnerabilities

[sqlmap_test("http://example.com/login", level=3)]
→ SQL injection found in 'username' parameter

Executing Step 3/3: Analysis...
→ Compiled findings into report
```

---

## Tool Definitions

Tools are defined in `cli/tools/tools.js` using OpenAI-compatible function calling format:

```javascript
{
  type: 'function',
  function: {
    name: 'nmap_scan',
    description: 'Perform network reconnaissance using Nmap...',
    parameters: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Target IP or domain' },
        scan_type: {
          type: 'string',
          enum: ['ping', 'quick', 'port', 'service', 'full', 'stealth', 'vuln']
        },
        ports: { type: 'string', description: 'Port spec (e.g. "80,443")' }
      },
      required: ['target', 'scan_type']
    }
  }
}
```

The AI sees these definitions and knows exactly how to call each tool.

---

## Security Notes

- All tools run in **isolated Docker container** (if using Docker mode)
- **Non-root user** (`hexagent`) for security in Docker
- **Five-minute timeout** — long-running tools are stopped after five minutes
- **Ethical use only** — for authorized testing
- **Local execution** in Direct mode (tools run on your machine)

---

## Rebuild Docker Container

If you need to rebuild with all tools:

```bash
cd server/docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```
