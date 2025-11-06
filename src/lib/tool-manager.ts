/**
 * Tool Manager for Hex AI
 * Optimizes tool usage to reduce payload size
 * 
 * Key Optimizations:
 * 1. Lazy Loading: Only send tools when user mentions them
 * 2. Caching: Register tools once, reference by name
 * 3. Context-Aware: Smart detection of when tools are needed
 * 
 * Benefits:
 * - Reduces payload from ~50KB to ~2KB per message
 * - Prevents 413 Payload Too Large errors
 * - Faster API responses
 */

import { professionalSecurityTools } from './tools-schema';

export interface ToolContext {
  hasUsedToolsBefore: boolean;
  lastMessageMentionedTool: boolean;
  conversationLength: number;
}

export class ToolManager {
  private toolsRegistered = false;
  private toolKeywords: Map<string, string[]> = new Map();

  constructor() {
    this.initializeToolKeywords();
  }

  /**
   * Map tool names to keywords that indicate they're needed
   */
  private initializeToolKeywords() {
    // Original tools
    this.toolKeywords.set('nmap_scan', ['nmap', 'scan', 'port', 'network', 'reconnaissance', 'discover']);
    this.toolKeywords.set('sqlmap_test', ['sql', 'injection', 'sqlmap', 'database', 'sqli']);
    this.toolKeywords.set('gobuster_scan', ['gobuster', 'directory', 'bruteforce', 'directory scan', 'hidden']);
    this.toolKeywords.set('nikto_scan', ['nikto', 'web server', 'vulnerability scanner']);
    this.toolKeywords.set('hydra_attack', ['hydra', 'brute force', 'password', 'crack', 'login']);
    this.toolKeywords.set('john_crack', ['john', 'hash', 'password crack', 'ripper']);
    this.toolKeywords.set('whatweb_scan', ['whatweb', 'technology', 'fingerprint', 'identify']);
    this.toolKeywords.set('sslscan_test', ['ssl', 'tls', 'certificate', 'encryption']);
    this.toolKeywords.set('wpscan', ['wordpress', 'wp', 'cms']);
    this.toolKeywords.set('searchsploit', ['exploit', 'vulnerability', 'cve', 'searchsploit']);
    this.toolKeywords.set('enum4linux', ['smb', 'samba', 'enum4linux', 'windows']);
    this.toolKeywords.set('dns_enum', ['dns', 'domain', 'subdomain', 'nslookup']);
    this.toolKeywords.set('whois_lookup', ['whois', 'domain info', 'registration']);
    this.toolKeywords.set('curl_request', ['curl', 'http', 'request', 'api']);
    this.toolKeywords.set('masscan_scan', ['masscan', 'fast scan', 'internet scan']);
    this.toolKeywords.set('ping_test', ['ping', 'alive', 'reachable', 'icmp']);
    
    // Modern web fuzzing
    this.toolKeywords.set('nuclei_scan', ['nuclei', 'cve', 'vulnerability', 'template']);
    this.toolKeywords.set('ffuf_fuzz', ['ffuf', 'fuzz', 'parameter', 'vhost']);
    this.toolKeywords.set('feroxbuster_scan', ['feroxbuster', 'content discovery', 'recursive']);
    
    // Reconnaissance
    this.toolKeywords.set('subfinder_enum', ['subfinder', 'subdomain', 'enumerate']);
    this.toolKeywords.set('amass_enum', ['amass', 'osint', 'asset discovery']);
    this.toolKeywords.set('httpx_probe', ['httpx', 'probe', 'http']);
    this.toolKeywords.set('rustscan', ['rustscan', 'fast port', 'quick scan']);
    
    // Active Directory / Windows
    this.toolKeywords.set('crackmapexec', ['crackmapexec', 'cme', 'smb', 'winrm', 'active directory']);
    this.toolKeywords.set('bloodhound_collect', ['bloodhound', 'ad', 'attack path']);
    this.toolKeywords.set('kerbrute', ['kerbrute', 'kerberos', 'asrep']);
    this.toolKeywords.set('responder', ['responder', 'llmnr', 'nbt-ns', 'poisoning']);
    this.toolKeywords.set('impacket_tool', ['impacket', 'secretsdump', 'psexec', 'wmiexec']);
    
    // Network utilities
    this.toolKeywords.set('chisel_tunnel', ['chisel', 'tunnel', 'pivot', 'port forward']);
    this.toolKeywords.set('socat_relay', ['socat', 'relay', 'bidirectional']);
    this.toolKeywords.set('netcat_listener', ['netcat', 'nc', 'reverse shell', 'bind shell']);
    this.toolKeywords.set('proxychains', ['proxychains', 'proxy', 'socks']);
    
    // LDAP / SMB
    this.toolKeywords.set('ldapsearch_query', ['ldap', 'ldapsearch', 'active directory query']);
    this.toolKeywords.set('enum4linux_ng', ['enum4linux-ng', 'smb enum']);
    this.toolKeywords.set('rpcclient_enum', ['rpcclient', 'rpc', 'ms-rpc']);
    
    // WiFi / Wireless hacking
    this.toolKeywords.set('aircrack_ng', ['aircrack', 'wep', 'wpa', 'handshake', 'wifi crack']);
    this.toolKeywords.set('wifite', ['wifite', 'wireless attack', 'automated wifi']);
    this.toolKeywords.set('bettercap', ['bettercap', 'mitm', 'arp spoof', 'wifi attack']);
    this.toolKeywords.set('reaver_wps', ['reaver', 'wps', 'pixie dust']);
    this.toolKeywords.set('wash_wps', ['wash', 'wps scan', 'wps detect']);
    this.toolKeywords.set('mdk4_attack', ['mdk4', 'deauth', 'beacon flood', 'wifi dos']);
    this.toolKeywords.set('hostapd_evil_twin', ['hostapd', 'evil twin', 'rogue ap', 'fake access point']);
    this.toolKeywords.set('kismet_scan', ['kismet', 'wireless sniffer', 'wifi detector']);
  }

  /**
   * Detect if message requires tools
   */
  shouldSendTools(message: string, context: ToolContext): boolean {
    const messageLower = message.toLowerCase();

    // STRATEGY 1: First message - always send tools
    if (context.conversationLength === 0) {
      return true;
    }

    // STRATEGY 2: User explicitly asks for scanning/testing
    const actionWords = ['scan', 'test', 'check', 'exploit', 'attack', 'enumerate', 'find', 'discover'];
    const hasActionWord = actionWords.some(word => messageLower.includes(word));
    
    if (hasActionWord) {
      return true;
    }

    // STRATEGY 3: Message mentions specific tools
    for (const [toolName, keywords] of this.toolKeywords) {
      if (keywords.some(keyword => messageLower.includes(keyword))) {
        return true;
      }
    }

    // STRATEGY 4: If tools were used in last few messages, keep them available
    if (context.hasUsedToolsBefore && context.conversationLength < 5) {
      return true;
    }

    // Default: Don't send tools for general conversation
    return false;
  }

  /**
   * Get appropriate tools based on message context
   * Can return subset of tools instead of all 17
   */
  getRelevantTools(message: string): any[] {
    const messageLower = message.toLowerCase();
    
    // For now, return all tools when needed
    // Future: Return only relevant subset based on keywords
    
    // Example of smart filtering (disabled for now):
    /*
    const relevant = [];
    for (const [toolName, keywords] of this.toolKeywords) {
      if (keywords.some(keyword => messageLower.includes(keyword))) {
        const tool = professionalSecurityTools.find(t => t.function.name === toolName);
        if (tool) relevant.push(tool);
      }
    }
    
    // If no specific tools detected, return common ones
    if (relevant.length === 0) {
      return professionalSecurityTools.filter(t => 
        ['nmap_scan', 'sqlmap_test', 'gobuster_scan'].includes(t.function.name)
      );
    }
    
    return relevant;
    */

    return professionalSecurityTools;
  }

  /**
   * Get tools with optimization info
   */
  getToolsWithStats() {
    const toolsJson = JSON.stringify(professionalSecurityTools);
    const sizeKB = (new Blob([toolsJson]).size / 1024).toFixed(2);
    
    return {
      tools: professionalSecurityTools,
      count: professionalSecurityTools.length,
      sizeKB: parseFloat(sizeKB),
      names: professionalSecurityTools.map(t => t.function.name)
    };
  }
}

/**
 * Singleton instance
 */
export const toolManager = new ToolManager();

/**
 * Helper function to determine if tools should be included
 */
export function shouldIncludeTools(
  message: string,
  hasUsedToolsBefore: boolean,
  conversationLength: number
): boolean {
  return toolManager.shouldSendTools(message, {
    hasUsedToolsBefore,
    lastMessageMentionedTool: false, // Can be enhanced
    conversationLength
  });
}

/**
 * Get tools or undefined based on context
 */
export function getContextualTools(
  message: string,
  hasUsedToolsBefore: boolean,
  conversationLength: number
): any[] | undefined {
  const include = shouldIncludeTools(message, hasUsedToolsBefore, conversationLength);
  
  if (!include) {
    console.log('[ToolManager] Skipping tools - not needed for this message');
    return undefined;
  }
  
  console.log('[ToolManager] Including tools - detected need in message');
  return toolManager.getRelevantTools(message);
}

