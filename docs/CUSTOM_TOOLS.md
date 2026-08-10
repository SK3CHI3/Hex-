# Extending Hex - Custom Tools & Installation

## Overview

Hex comes with 17 built-in tools, but you're not limited to those. Hex can **automatically install** any tool you need using the `install_tool` function, or you can ask the AI to install tools manually.

---

## Automatic Tool Installation

### The install_tool Function

Hex has a built-in `install_tool` function that the AI can call to install missing tools:

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
- `auto` — Detect best method based on tool name (default)

### How Auto-Detection Works

```javascript
if (install_method === 'auto') {
  if (tool_name.includes('git+') || tool_name.startsWith('http')) {
    // Git clone
    command = 'git';
  } else if (tool_name.includes('/') && !tool_name.includes(' ')) {
    // Go package (e.g. github.com/user/tool)
    command = 'go';
  } else {
    // Default to apt
    command = 'apt-get';
  }
}
```

### Execution Modes

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

---

## Asking Hex to Install Tools

### Simple Installation

```
❯ Install rustscan

I'll install rustscan for you.

[install_tool({ tool_name: "rustscan" })]
✓ Successfully installed rustscan
```

### Install and Use

```
❯ Install ffuf and use it to fuzz https://target.com

I'll install ffuf first, then run it.

[install_tool({ tool_name: "ffuf" })]
✓ Successfully installed ffuf

[raw_command("ffuf -u https://target.com/FUZZ -w /usr/share/wordlists/common.txt")]
...
```

### Batch Installation

```
❯ Install rustscan, ffuf, and nuclei

I'll install all three tools for you.

[1/3] Installing rustscan...
[install_tool({ tool_name: "rustscan" })]
✓ rustscan installed

[2/3] Installing ffuf...
[install_tool({ tool_name: "ffuf" })]
✓ ffuf installed

[3/3] Installing nuclei...
[install_tool({ tool_name: "nuclei" })]
✓ nuclei installed

All tools installed successfully.
```

---

## Installation Methods

### APT Packages (Debian/Kali)

```
❯ Install nmap
❯ Install sqlmap
❯ Install hydra
```

Hex runs:
```bash
# Docker mode
docker exec hex-kali-tools apt-get update -qq
docker exec hex-kali-tools apt-get install -y nmap

# Direct mode
sudo apt-get update -qq
sudo apt-get install -y nmap
```

### Python Packages (pip)

```
❯ Install requests using pip
❯ Install pwntools
❯ Install impacket
```

Hex runs:
```bash
pip3 install requests
```

Or specify the method:
```
❯ install_tool({ tool_name: "requests", install_method: "pip" })
```

### Node.js Packages (npm)

```
❯ Install lodash using npm
❯ Install axios globally
```

Hex runs:
```bash
npm install -g lodash
```

### Go Tools

```
❯ Install github.com/projectdiscovery/nuclei/v3/cmd/nuclei
❯ Install ffuf from Go
```

Hex runs:
```bash
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
```

### Git Repositories

```
❯ Clone https://github.com/user/tool
❯ Install from git+https://github.com/user/tool
```

Hex runs:
```bash
git clone https://github.com/user/tool
```

---

## Using Installed Tools

Once installed, use tools via `raw_command`:

```
❯ Use rustscan to scan 192.168.1.1

[raw_command("rustscan -a 192.168.1.1")]
...
```

Hex will automatically detect and use the tool, even if it's not in the pre-configured list.

---

## Adding Tools Permanently

### Direct Mode

Tools installed on your machine persist across sessions. To ensure tools are always available:

**Linux/macOS:**
```bash
# Add to your shell profile (~/.bashrc, ~/.zshrc, etc.)
export PATH="$PATH:/path/to/your/tools"
```

**Windows:**
Add the tool directory to your system PATH environment variable.

### Docker Mode

Tools installed via `install_tool` in Docker mode are ephemeral. If you rebuild the container, you'll need to reinstall them.

To make tools permanent, add them to `server/docker/Dockerfile.kali`:

```dockerfile
# Example: Add rustscan
RUN curl -sL https://github.com/RustScan/RustScan/releases/download/2.2.3/rustscan_2.2.3_amd64.deb | dpkg -i -

# Example: Add a Go tool
RUN go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

# Example: Add a Python tool
RUN pip3 install pwntools
```

Then rebuild the container:

```bash
npm run docker:build
```

---

## Tool Categories & Recommendations

### Network Scanning
- **rustscan** - Ultra-fast port scanner (65k ports in <10s)
- **masscan** - Internet-scale scanner
- **naabu** - Fast port discovery

### Web Testing
- **ffuf** - Fast web fuzzer
- **feroxbuster** - Recursive content discovery
- **katana** - Next-gen crawler

### Enumeration
- **enum4linux-ng** - SMB/LDAP enumeration
- **crackmapexec** - Network pentesting
- **bloodhound** - AD attack path mapping

### Exploitation
- **metasploit** - Exploit framework
- **exploitdb** - Exploit database
- **searchsploit** - Local exploit search

### Password Attacks
- **hashcat** - GPU-accelerated cracking
- **john** - John the Ripper
- **hydra** - Network brute-forcer

---

## Troubleshooting Tool Installation

### Permission Denied (Direct Mode)

If you get permission errors:

```
❯ Install gobuster
Error: Permission denied

# Solution: Hex uses sudo automatically for apt
# Or install to user directory
$ mkdir -p ~/.local/bin
$ wget ... -O ~/.local/bin/gobuster
$ chmod +x ~/.local/bin/gobuster
```

### Tool Not Found After Installation

Verify the tool is in your PATH:

```bash
which gobuster
# OR
gobuster version
```

If not found, add the installation directory to your PATH.

### Docker Container Tool Lost After Rebuild

Tools installed via `install_tool` in Docker mode are ephemeral. To make them permanent:

1. Add the installation command to `server/docker/Dockerfile.kali`
2. Rebuild: `npm run docker:build`

### Slow Tool Installation

Some tools (especially Go tools) take time to compile. Options:

- Use pre-compiled binaries when available
- Install during off-peak hours
- Use Docker mode with pre-built tools

### Installation Method Detection Fails

If auto-detection doesn't work, specify the method:

```
❯ install_tool({ tool_name: "requests", install_method: "pip" })
❯ install_tool({ tool_name: "lodash", install_method: "npm" })
❯ install_tool({ tool_name: "nuclei", install_method: "go" })
```

---

## Best Practices

1. **Use install_tool for missing tools** — Hex handles installation automatically
2. **Test tools in isolation first** — Especially in Docker mode
3. **Keep tools updated** — Ask Hex to update tools periodically
4. **Document custom tools** — Add notes to your conversation history
5. **Use wordlists wisely** — Download only what you need
6. **Monitor resource usage** — Some tools are CPU/memory intensive

---

## Wordlists

Many tools require wordlists. Hex can help you download them:

```
❯ Download common wordlists

I'll download popular wordlists to ~/.hex/wordlists/

[raw_command("wget -O ~/.hex/wordlists/common.txt https://raw.githubusercontent.com/danielmiessler/SecLists/master/Discovery/Web-Content/common.txt")]
[raw_command("wget -O ~/.hex/wordlists/rockyou.txt https://github.com/brannondorsey/naive-hashcat/releases/download/data/rockyou.txt")]

✓ Downloaded 2 wordlists
```

**Popular wordlists:**
- `common.txt` - Web directory brute-forcing
- `rockyou.txt` - Password cracking
- `subdomains-top1million.txt` - Subdomain enumeration
- `raft-*.txt` - Comprehensive web fuzzing

---

## Examples

### Install and Use a Custom Tool

```
❯ Install naabu

[install_tool({ tool_name: "naabu", install_method: "go" })]
✓ naabu installed. Ready to use.

❯ Use naabu to scan example.com

[raw_command("naabu -host example.com")]
...
```

### Batch Install Multiple Tools

```
❯ Install rustscan, ffuf, and nuclei

[install_tool({ tool_name: "rustscan" })]
✓ rustscan installed

[install_tool({ tool_name: "ffuf", install_method: "go" })]
✓ ffuf installed

[install_tool({ tool_name: "nuclei", install_method: "go" })]
✓ nuclei installed

All tools installed successfully.
```

### Install Python Tool and Use It

```
❯ Install impacket and dump hashes from 10.0.0.1

[install_tool({ tool_name: "impacket", install_method: "pip" })]
✓ impacket installed

[raw_command("secretsdump.py CORP/admin@10.0.0.1")]
...
```

---

## Security Considerations

- **Review tool sources** - Only install from official repositories
- **Verify checksums** - Especially for binary downloads
- **Use Docker for untrusted tools** - Isolate potentially malicious software
- **Keep tools updated** - Security tools get updates regularly
- **Monitor network activity** - Some tools make outbound connections

---

## Need Help?

If you're unsure about installing a tool or how to use it:

```
❯ What is rustscan and how do I use it?

RustScan is a modern port scanner written in Rust. It's designed to be
extremely fast - scanning all 65k ports in under 10 seconds.

Key features:
- Automatic nmap integration for service detection
- Scripting engine for custom scans
- Configurable timeout and batch size

Basic usage:
  rustscan -a <target>

With nmap scripts:
  rustscan -a <target> -- -sV -sC

Want me to install it for you?
```

---

**Remember:** Hex is your assistant. If you need a tool that's not pre-configured, just ask. The AI will handle installation, configuration, and execution for you using the `install_tool` function.
