# 🛠️ Hex AI - Complete Tool Arsenal

## 📊 **Total: 42 Professional Red Teaming Tools**

All tools are **installed in Docker** and **integrated with AI**!

---

## 🌐 **Network Scanning & Reconnaissance (7)**

| Tool | Function | Use Case |
|------|----------|----------|
| `nmap_scan` | Port scanning & service detection | Network mapping, vulnerability discovery |
| `rustscan` | Ultra-fast port scanner (65k ports in <10s) | Initial recon, time-sensitive engagements |
| `masscan` | Internet-scale port scanner | Large IP range scanning |
| `subfinder_enum` | Passive subdomain enumeration | Asset discovery via OSINT |
| `amass_enum` | Attack surface mapping | Comprehensive subdomain/DNS enumeration |
| `httpx_probe` | HTTP probing & tech detection | Identify live web services |
| `dns_lookup` | DNS enumeration | Domain information gathering |

---

## 🕸️ **Web Application Testing (10)**

| Tool | Function | Use Case |
|------|----------|----------|
| `sqlmap_test` | SQL injection detection & exploitation | Database extraction, auth bypass |
| `nuclei_scan` | CVE & vulnerability scanner (5000+ templates) | Automated vuln detection |
| `ffuf_fuzz` | Fast web fuzzer | Directory discovery, parameter fuzzing |
| `feroxbuster_scan` | Recursive content discovery | Hidden file/directory enumeration |
| `gobuster_scan` | Directory brute-forcing | Web content discovery |
| `nikto_scan` | Web server vulnerability scanner | Misconfiguration detection |
| `wpscan` | WordPress vulnerability scanner | WP plugin/theme exploitation |
| `curl_request` | HTTP requests | API testing, header manipulation |
| `sslscan` | SSL/TLS testing | Certificate & cipher analysis |
| `whatweb` | Technology fingerprinting | Tech stack identification |

---

## 💀 **Active Directory & Windows (8)**

| Tool | Function | Use Case |
|------|----------|----------|
| `crackmapexec` | SMB/WinRM/LDAP exploitation | AD enumeration, credential dumping |
| `bloodhound_collect` | AD attack path mapping | Privilege escalation paths |
| `kerbrute` | Kerberos brute-forcing | User enumeration, ASREPRoasting |
| `responder` | LLMNR/NBT-NS poisoning | Credential capture, MITM |
| `impacket_tool` | Network protocol exploitation | secretsdump, psexec, wmiexec |
| `enum4linux_ng` | SMB/LDAP enumeration | Windows share/user enumeration |
| `ldapsearch_query` | LDAP queries | AD reconnaissance |
| `rpcclient_enum` | MS-RPC enumeration | Windows system enumeration |

---

## 🔐 **Password Cracking (2)**

| Tool | Function | Use Case |
|------|----------|----------|
| `hydra_attack` | Network login brute-forcing | SSH, FTP, HTTP, RDP attacks |
| `hashcat_crack` | Hash cracking | NTLM, MD5, SHA, bcrypt cracking |

---

## 💣 **Exploitation & Post-Exploitation (1)**

| Tool | Function | Use Case |
|------|----------|----------|
| `metasploit_search` | Exploit framework | Vulnerability exploitation |

---

## 📡 **WiFi / Wireless Hacking (8)**

| Tool | Function | Use Case |
|------|----------|----------|
| `aircrack_ng` | WEP/WPA cracking | WiFi password recovery |
| `wifite` | Automated wireless attacks | Mass WiFi penetration testing |
| `bettercap` | Network MITM & attacks | ARP spoofing, packet sniffing |
| `reaver_wps` | WPS PIN brute-forcing | WPS exploitation |
| `wash_wps` | WPS scanner | Identify WPS-enabled APs |
| `mdk4_attack` | Wireless DoS | Deauth attacks, beacon flooding |
| `hostapd_evil_twin` | Rogue AP creation | Credential harvesting |
| `kismet_scan` | Wireless IDS | WiFi network detection |

---

## 🌉 **Pivoting & Tunneling (4)**

| Tool | Function | Use Case |
|------|----------|----------|
| `chisel_tunnel` | TCP/UDP tunneling over HTTP | Port forwarding, pivoting |
| `socat_relay` | Bidirectional relay | Network redirection |
| `netcat_listener` | Network Swiss army knife | Reverse shells, port forwarding |
| `proxychains` | Proxy routing | Traffic anonymization, pivoting |

---

## 📝 **Utilities & Reporting (2)**

| Tool | Function | Use Case |
|------|----------|----------|
| `whois_lookup` | Domain registration info | OSINT, target profiling |
| `generate_report` | Professional pentesting reports | Documentation, deliverables |

---

## 🎯 **Quick Use Examples**

### Network Recon
```
"Scan 192.168.1.0/24 for open ports using rustscan"
"Enumerate subdomains for example.com with subfinder"
```

### Web Testing
```
"Use nuclei to scan https://target.com for CVEs"
"Fuzz https://target.com/FUZZ with ffuf using common wordlist"
"Test https://target.com for SQL injection with sqlmap"
```

### Active Directory
```
"Use crackmapexec to enumerate SMB shares on 10.10.10.10"
"Run bloodhound collection against CORP.LOCAL domain"
"Use kerbrute to enumerate users on domain DC 10.10.10.5"
```

### WiFi Hacking
```
"Use wifite to attack wireless networks on wlan0"
"Perform WPS attack with reaver on BSSID AA:BB:CC:DD:EE:FF"
"Create evil twin AP named 'Free WiFi' on channel 6"
```

### Password Attacks
```
"Use hydra to brute-force SSH on 192.168.1.10"
"Crack NTLM hash with hashcat"
```

---

## 🐳 **Docker Container**

All tools are pre-installed in **Kali Linux Docker container** (`hex-kali-tools`):

### Installed via APT:
- Standard Kali tools (nmap, aircrack-ng, hydra, etc.)
- WiFi tools (bettercap, kismet, mdk4)
- Windows tools (crackmapexec, responder)

### Installed via Go:
- nuclei, subfinder, httpx (ProjectDiscovery suite)
- ffuf, kerbrute

### Installed via Binary:
- feroxbuster (Rust)
- chisel (tunneling)
- enum4linux-ng

### Installed via Python:
- impacket suite
- bloodhound
- pwntools

---

## 🚀 **AI Integration**

Hex AI automatically:
- ✅ **Detects tool needs** based on your requests
- ✅ **Selects appropriate tools** using smart keyword matching
- ✅ **Executes tools** in isolated Docker environment
- ✅ **Parses results** and provides analysis
- ✅ **Optimizes payload** (only sends tools when needed)

### Smart Tool Loading

```
User: "Hello"
→ AI skips sending tools (saved 50KB payload)

User: "Scan example.com for vulnerabilities"
→ AI loads nuclei, nmap, httpx tools automatically

User: "Crack WiFi password"
→ AI loads aircrack-ng, wifite, bettercap tools
```

---

## 📈 **Statistics**

| Category | Tools | Installed |
|----------|-------|-----------|
| Network Recon | 7 | ✅ |
| Web Testing | 10 | ✅ |
| Active Directory | 8 | ✅ |
| Password Cracking | 2 | ✅ |
| Exploitation | 1 | ✅ |
| WiFi Hacking | 8 | ✅ |
| Pivoting | 4 | ✅ |
| Utilities | 2 | ✅ |
| **TOTAL** | **42** | **✅** |

---

## 🔒 **Security Notes**

- All tools run in **isolated Docker container**
- **Non-root user** (`hexagent`) for security
- **Resource limits** enforced (2GB RAM, 2 CPUs)
- **Timeout protection** (300s default)
- **Ethical use only** - for authorized testing

---

## 🛠️ **Rebuild Docker Container**

If you need to rebuild with all new tools:

```bash
cd server/docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**Build time:** ~15-20 minutes (downloads Go, compiles tools)

---

**Built by Victor** | Powered by ModelScope (Qwen3.7-Plus) | Kali Linux Tools











