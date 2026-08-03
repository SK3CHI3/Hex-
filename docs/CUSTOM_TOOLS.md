# Extending Hex - Custom Tools & Installation

## Overview

Hex comes with 42+ pre-configured tools, but you're not limited to those. You can ask the AI to install and use **any pentesting tool** you need. Hex will handle the installation and execution for you.

---

## Installing Custom Tools

### Direct Mode

When using Direct mode (default), you can ask Hex to install tools on your machine:

```
❯ Install gobuster on my machine

I'll install gobuster for you. This will download the latest release from GitHub.

$ wget https://github.com/OJ/gobuster/releases/download/v3.6.0/gobuster_Linux_x86_64.tar.gz
$ tar -xzf gobuster_Linux_x86_64.tar.gz
$ sudo mv gobuster /usr/local/bin/

✓ gobuster installed successfully. You can now use it for directory brute-forcing.
```

**Examples:**
- "Install rustscan"
- "Install ffuf"
- "Install nuclei"
- "Install the latest version of sqlmap"
- "Install impacket tools"

### Docker Mode

When using Docker mode, you can ask Hex to install tools inside the Kali container:

```
❯ Install rustscan in the container

I'll install rustscan inside the Kali container.

$ docker exec hex-kali-tools bash -c "curl -sL https://github.com/RustScan/RustScan/releases/download/2.2.3/rustscan_2.2.3_amd64.deb | dpkg -i -"

✓ rustscan installed in container. Ready to use.
```

**Note:** Tools installed in the container are ephemeral. If you rebuild the container, you'll need to reinstall them. To make tools permanent, add them to `server/docker/Dockerfile.kali`.

---

## Using Custom Tools

Once installed, you can use custom tools just like built-in ones:

```
❯ Use rustscan to scan 192.168.1.1

$ rustscan -a 192.168.1.1

.----. .-. .-. .----..---.  .----. .---.   .--.  .-. .-.
| {}  }| { } |{ {__ {_   _}{ {__  /  ___} / {} \ |  `| |
| .-. \| {_} |.-._} } | |  .-._} }\     }/  /\  \| |\  |
`-' `-'`-----'`----'  `-'  `----'  `---' `-'  `-'`-' `-'
The Modern Day Port Scanner.
________________________________________

[~] The config file is expected to be at "/root/.rustscan.toml"
[~] File limit higher than batch size. Can increase speed by increasing batch size.
Open [192.168.1.1]
22/tcp  ->  ssh
80/tcp  ->  http
443/tcp ->  https

Found 3 open ports.
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

To permanently add tools to the Kali container, edit `server/docker/Dockerfile.kali`:

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

# Solution: Use sudo or install to user directory
$ sudo apt install gobuster
# OR
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

Tools installed via `docker exec` are ephemeral. To make them permanent:

1. Add the installation command to `server/docker/Dockerfile.kali`
2. Rebuild: `npm run docker:build`

### Slow Tool Installation

Some tools (especially Go tools) take time to compile. Options:

- Use pre-compiled binaries when available
- Install during off-peak hours
- Use Docker mode with pre-built tools

---

## Best Practices

1. **Test tools in isolation first** - Especially in Docker mode
2. **Keep tools updated** - Ask Hex to update tools periodically
3. **Document custom tools** - Add notes to your conversation history
4. **Use wordlists wisely** - Download only what you need
5. **Monitor resource usage** - Some tools are CPU/memory intensive

---

## Wordlists

Many tools require wordlists. Hex can help you download them:

```
❯ Download common wordlists

I'll download popular wordlists to ~/.hex/wordlists/

$ wget -O ~/.hex/wordlists/common.txt https://raw.githubusercontent.com/danielmiessler/SecLists/master/Discovery/Web-Content/common.txt
$ wget -O ~/.hex/wordlists/rockyou.txt https://github.com/brannondorsey/naive-hashcat/releases/download/data/rockyou.txt
$ wget -O ~/.hex/wordlists/subdomains-top1million.txt https://raw.githubusercontent.com/danielmiessler/SecLists/master/Discovery/DNS/subdomains-top1million-110000.txt

✓ Downloaded 3 wordlists (156 MB total)
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

$ GO111MODULE=on go install -v github.com/projectdiscovery/naabu/v2/cmd/naabu@latest

✓ naabu installed. Ready to use.

❯ Use naabu to scan example.com

$ naabu -host example.com

                  __
  ___  ___  ___ _/ /
  / __|/ _ \/ _ \_  /
  \__ \  __/  __// /
  |___/\___|\___/_/ v2.1.0

[INF] Running scan on example.com
[INF] Found 3 ports
example.com:80
example.com:443
example.com:22
```

### Batch Install Multiple Tools

```
❯ Install rustscan, ffuf, and nuclei

I'll install all three tools for you.

[1/3] Installing rustscan...
$ curl -sL https://github.com/RustScan/RustScan/releases/download/2.2.3/rustscan_2.2.3_amd64.deb | sudo dpkg -i -
✓ rustscan installed

[2/3] Installing ffuf...
$ go install github.com/ffuf/ffuf/v2@latest
✓ ffuf installed

[3/3] Installing nuclei...
$ go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
✓ nuclei installed

All tools installed successfully.
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

**Remember:** Hex is your assistant. If you need a tool that's not pre-configured, just ask. The AI will handle installation, configuration, and execution for you.
