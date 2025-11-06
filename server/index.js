import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8081;

// Supabase client for authentication
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for server-side auth
);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`🚀 Hex Execution Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
});

// WebSocket Server
const wss = new WebSocketServer({ server });

// Active command executions (for tracking and cancellation)
const activeCommands = new Map();

wss.on('connection', async (ws, req) => {
  console.log('🔌 New WebSocket connection');
  
  let userId = null;
  let isPremium = false;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      const { type, payload } = data;

      switch (type) {
        case 'auth':
          // Authenticate user
          const authResult = await authenticateUser(payload.token);
          if (authResult.success) {
            userId = authResult.userId;
            isPremium = authResult.isPremium;
            
            ws.send(JSON.stringify({
              type: 'auth_success',
              payload: { userId, isPremium }
            }));
            
            console.log(`✅ User authenticated: ${userId} (Premium: ${isPremium})`);
          } else {
            ws.send(JSON.stringify({
              type: 'auth_error',
              payload: { message: 'Authentication failed' }
            }));
            ws.close();
          }
          break;

        case 'execute':
          // Verify authentication
          if (!userId) {
            ws.send(JSON.stringify({
              type: 'error',
              payload: { message: 'Not authenticated' }
            }));
            return;
          }

          // Execute command (available for all authenticated users)
          await executeCommand(ws, payload, userId);
          break;

        case 'cancel':
          // Cancel running command
          if (activeCommands.has(payload.executionId)) {
            const proc = activeCommands.get(payload.executionId);
            proc.kill('SIGTERM');
            activeCommands.delete(payload.executionId);
            
            ws.send(JSON.stringify({
              type: 'cancelled',
              payload: { executionId: payload.executionId }
            }));
          }
          break;

        default:
          ws.send(JSON.stringify({
            type: 'error',
            payload: { message: `Unknown message type: ${type}` }
          }));
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: error.message }
      }));
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

/**
 * Authenticate user using Supabase token
 */
async function authenticateUser(token) {
  try {
    console.log('🔐 Attempting to authenticate with token length:', token?.length || 0);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('❌ Supabase auth error:', error.message);
      return { success: false };
    }
    
    if (!user) {
      console.error('❌ No user returned from Supabase');
      return { success: false };
    }

    console.log('✅ User found:', user.id);

    // Get user profile to check premium status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_status, subscription_end_date')
      .eq('id', user.id)
      .single();

    // Check if premium and not expired
    const isPremium = profile?.subscription_status === 'premium' && 
      (!profile.subscription_end_date || new Date() < new Date(profile.subscription_end_date));

    console.log('✅ Profile loaded - Premium:', isPremium);

    return {
      success: true,
      userId: user.id,
      isPremium
    };
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return { success: false };
  }
}

/**
 * Execute command in Docker container
 */
async function executeCommand(ws, payload, userId) {
  const { command, args, executionId } = payload;
  
  console.log(`🔧 Executing: ${command} ${args.join(' ')}`);
  
  // Validate command (security check)
  const validation = validateCommand(command, args);
  if (!validation.valid) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: validation.reason }
    }));
    return;
  }

  // Send command echo
  ws.send(JSON.stringify({
    type: 'output',
    payload: {
      executionId,
      outputType: 'command',
      data: `${command} ${args.join(' ')}`,
      timestamp: new Date().toISOString()
    }
  }));

  // Execute command in Docker container
  const proc = spawn('docker', [
    'exec',
    '-u', 'hexagent', // Run as non-root user
    'hex-kali-tools',
    command,
    ...args
  ]);

  // Store process for potential cancellation
  activeCommands.set(executionId, proc);

  // Set timeout (5 minutes max)
  const timeout = setTimeout(() => {
    proc.kill('SIGTERM');
    ws.send(JSON.stringify({
      type: 'output',
      payload: {
        executionId,
        outputType: 'error',
        data: 'Command timed out after 5 minutes',
        timestamp: new Date().toISOString()
      }
    }));
  }, 5 * 60 * 1000);

  // Stream stdout
  proc.stdout.on('data', (data) => {
    ws.send(JSON.stringify({
      type: 'output',
      payload: {
        executionId,
        outputType: 'stdout',
        data: data.toString(),
        timestamp: new Date().toISOString()
      }
    }));
  });

  // Stream stderr
  proc.stderr.on('data', (data) => {
    ws.send(JSON.stringify({
      type: 'output',
      payload: {
        executionId,
        outputType: 'stderr',
        data: data.toString(),
        timestamp: new Date().toISOString()
      }
    }));
  });

  // Handle completion
  proc.on('close', (code) => {
    clearTimeout(timeout);
    activeCommands.delete(executionId);
    
    ws.send(JSON.stringify({
      type: 'complete',
      payload: {
        executionId,
        exitCode: code,
        timestamp: new Date().toISOString()
      }
    }));
    
    console.log(`✅ Command completed with exit code: ${code}`);
  });

  // Handle errors
  proc.on('error', (error) => {
    clearTimeout(timeout);
    activeCommands.delete(executionId);
    
    ws.send(JSON.stringify({
      type: 'error',
      payload: {
        executionId,
        message: `Execution error: ${error.message}`,
        timestamp: new Date().toISOString()
      }
    }));
    
    console.error(`❌ Command error:`, error);
  });
}

/**
 * Validate command for security
 */
function validateCommand(command, args) {
  // Whitelist of allowed security tools
  const allowedTools = new Set([
    // Network scanning
    'nmap', 'masscan', 'zmap', 'naabu',
    // Web application testing
    'sqlmap', 'nikto', 'gobuster', 'dirb', 'wpscan', 'whatweb', 'commix',
    // Vulnerability scanning
    'nuclei',
    // Subdomain discovery
    'subfinder',
    // HTTP probing
    'httpx',
    // Web crawling
    'katana',
    // Exploitation
    'msfconsole', 'msfvenom', 'searchsploit',
    // Password cracking
    'hydra', 'john', 'hashcat', 'medusa',
    // Wireless
    'aircrack-ng', 'reaver', 'wifite',
    // Enumeration
    'enum4linux', 'smbmap', 'crackmapexec', 'nbtscan',
    // Network tools
    'netcat', 'nc', 'socat', 'tcpdump',
    // Web tools
    'curl', 'wget',
    // DNS tools
    'dig', 'nslookup', 'host',
    // SSL/TLS
    'openssl', 'sslscan', 'sslyze',
    // Misc
    'whois', 'traceroute', 'ping'
  ]);

  // Check if tool is allowed
  if (!allowedTools.has(command)) {
    return {
      valid: false,
      reason: `Tool '${command}' is not in the allowed list. Contact admin if you need this tool added.`
    };
  }

  // Blocked patterns (dangerous operations)
  const blockedPatterns = [
    /rm\s+-rf/, // Recursive delete
    /mkfs/, // Format filesystem
    /dd\s+if=/, // Disk operations
    /:(){ :|:& };:/, // Fork bomb
    /chmod\s+777/, // Dangerous permissions
    /\/etc\/shadow/, // Shadow file
    /\/etc\/passwd/, // Password file
    /sudo/, // Privilege escalation
    /su\s+/, // User switching
  ];

  const fullCommand = `${command} ${args.join(' ')}`;
  
  for (const pattern of blockedPatterns) {
    if (pattern.test(fullCommand)) {
      return {
        valid: false,
        reason: 'Command contains dangerous pattern and has been blocked'
      };
    }
  }

  // IP validation disabled for testing
  // WARNING: This allows scanning ANY target - use responsibly and only on authorized systems
  
  return { valid: true };
}

/**
 * Check if IP is private
 */
function isPrivateIP(ip) {
  const parts = ip.split('.').map(Number);
  
  return (
    parts[0] === 10 || // 10.0.0.0/8
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // 172.16.0.0/12
    (parts[0] === 192 && parts[1] === 168) || // 192.168.0.0/16
    parts[0] === 127 // 127.0.0.0/8 (localhost)
  );
}

/**
 * Check if public IP is in allowed list
 * This could be expanded to check against user's authorized targets from database
 */
function isAllowedPublicTarget(ip) {
  // For now, we'll be conservative and only allow private IPs
  // In production, you'd check against user's authorized target list
  return false;
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  // Cancel all active commands
  for (const [id, proc] of activeCommands) {
    console.log(`⏹️ Killing process: ${id}`);
    proc.kill('SIGTERM');
  }
  
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  
  for (const [id, proc] of activeCommands) {
    proc.kill('SIGTERM');
  }
  
  server.close(() => {
    process.exit(0);
  });
});

console.log('🎯 Hex AI Execution Server initialized');
console.log('🔓 Tool execution enabled for all authenticated users');
console.log('🐳 Docker container: hex-kali-tools');


