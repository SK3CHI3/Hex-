import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './use-auth';
import type { TerminalOutput } from '@/components/TerminalWindow';
import { toolCommandMap } from '@/lib/tools-schema';

interface ToolExecutionOptions {
  onOutput?: (output: TerminalOutput) => void;
  onComplete?: (exitCode: number, outputs: TerminalOutput[]) => void;
  onError?: (error: string) => void;
}

export function useToolExecution(options: ToolExecutionOptions = {}) {
  const { user, isPremium, session } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [outputs, setOutputs] = useState<TerminalOutput[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const executionIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const currentCommandOutputsRef = useRef<TerminalOutput[]>([]); // Track current command outputs only
  const MAX_RECONNECT_ATTEMPTS = 5;
  
  // Log when isPremium changes
  useEffect(() => {
    console.log('💎 isPremium changed to:', isPremium);
  }, [isPremium]);

  // WebSocket connection function
  const connectWebSocket = useCallback(() => {
    if (!user) {
      console.warn('⚠️ WebSocket not connecting - User not authenticated');
      return;
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8081';
    console.log('🔌 Attempting to connect to:', wsUrl, '(Attempt:', reconnectAttemptsRef.current + 1, ')');
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('🔌 Connected to execution server');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0; // Reset reconnect counter on successful connection
      
      // Authenticate with session token
      const token = session?.access_token || '';
      console.log('🔐 Authenticating with token length:', token.length);
      ws.send(JSON.stringify({
        type: 'auth',
        payload: { token }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
      // Don't reset executing state on temporary errors
    };

    ws.onclose = (event) => {
      console.log('🔌 Disconnected from execution server. Code:', event.code, 'Reason:', event.reason);
      setIsConnected(false);
      wsRef.current = null;
      
      // Only reset executing state if it was a clean close
      if (event.code === 1000) {
        setIsExecuting(false);
      }
      
      // Attempt to reconnect if we haven't exceeded max attempts
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 10000); // Exponential backoff, max 10s
        console.log(`🔄 Reconnecting in ${delay}ms... (Attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, delay);
      } else {
        console.error('❌ Max reconnection attempts reached. Please refresh the page.');
        setIsExecuting(false);
      }
    };

    wsRef.current = ws;
  }, [user, session?.access_token]);

  // Connect to WebSocket server
  useEffect(() => {
    console.log('🔍 Tool execution hook - User:', !!user, 'Premium:', isPremium);
    
    if (!user) {
      console.warn('⚠️ WebSocket not connecting - User not authenticated');
      return;
    }

    connectWebSocket();

    return () => {
      // Cleanup on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user?.id, session?.access_token, connectWebSocket]); // Reconnect when session changes

  const handleWebSocketMessage = (message: any) => {
    const { type, payload } = message;

    switch (type) {
      case 'auth_success':
        console.log('✅ Authenticated with execution server');
        break;

      case 'auth_error':
        console.error('❌ Authentication failed:', payload.message);
        options.onError?.(payload.message);
        break;

      case 'output':
        const output: TerminalOutput = {
          type: payload.outputType,
          content: payload.data,
          timestamp: new Date(payload.timestamp)
        };
        
        // Track this output for the current command
        currentCommandOutputsRef.current.push(output);
        
        setOutputs(prev => [...prev, output]);
        options.onOutput?.(output);
        break;

      case 'complete':
        console.log(`✅ Command completed with exit code: ${payload.exitCode}`);
        setIsExecuting(false);
        
        // Pass exit code and ONLY current command's outputs to callback
        options.onComplete?.(payload.exitCode, currentCommandOutputsRef.current);
        
        // Reset current command outputs for next execution
        currentCommandOutputsRef.current = [];
        
        // Add completion message
        const completeOutput: TerminalOutput = {
          type: 'info',
          content: `\n✅ Command completed with exit code: ${payload.exitCode}`,
          timestamp: new Date()
        };
        setOutputs(prev => [...prev, completeOutput]);
        break;

      case 'error':
        console.error('❌ Execution error:', payload.message);
        setIsExecuting(false);
        options.onError?.(payload.message);
        
        const errorOutput: TerminalOutput = {
          type: 'error',
          content: `❌ Error: ${payload.message}`,
          timestamp: new Date()
        };
        setOutputs(prev => [...prev, errorOutput]);
        break;

      case 'cancelled':
        console.log('⏹️ Command cancelled');
        setIsExecuting(false);
        
        const cancelOutput: TerminalOutput = {
          type: 'info',
          content: '\n⏹️ Command cancelled by user',
          timestamp: new Date()
        };
        setOutputs(prev => [...prev, cancelOutput]);
        break;

      default:
        console.warn('Unknown message type:', type);
    }
  };

  const executeTool = useCallback((toolName: string, args: any) => {
    console.log('🔧 executeTool called:', toolName, args);
    console.log('🔧 Connection status:', { 
      isConnected, 
      hasWS: !!wsRef.current, 
      wsState: wsRef.current?.readyState,
      isExecuting 
    });
    
    // More robust connection check
    if (!wsRef.current) {
      const error = 'WebSocket not initialized';
      console.error('❌', error);
      options.onError?.(error);
      return;
    }

    // Check WebSocket state - if not OPEN but CONNECTING, wait briefly
    if (wsRef.current.readyState === WebSocket.CONNECTING) {
      console.log('⏳ WebSocket still connecting, retrying in 1 second...');
      setTimeout(() => executeTool(toolName, args), 1000);
      return;
    }

    if (wsRef.current.readyState !== WebSocket.OPEN) {
      const error = 'Not connected to execution server. Please refresh the page to reconnect.';
      console.error('❌ WebSocket state:', wsRef.current.readyState);
      options.onError?.(error);
      return;
    }

    if (isExecuting) {
      const error = 'Another command is already running. Please wait for it to complete.';
      console.error('❌', error);
      options.onError?.(error);
      return;
    }

    // Build command and arguments
    const { command, commandArgs } = buildCommand(toolName, args);
    console.log('🔧 Built command:', command, commandArgs);
    
    if (!command) {
      const error = `Unknown tool: ${toolName}`;
      console.error('❌', error);
      options.onError?.(error);
      return;
    }

    // Generate execution ID
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    executionIdRef.current = executionId;

    // Reset current command outputs before starting new execution
    currentCommandOutputsRef.current = [];

    // Send execution request
    wsRef.current.send(JSON.stringify({
      type: 'execute',
      payload: {
        command,
        args: commandArgs,
        executionId
      }
    }));

    setIsExecuting(true);
  }, [isConnected, isExecuting, options]);

  const cancelExecution = useCallback(() => {
    if (!wsRef.current || !executionIdRef.current) return;
    
    // Check WebSocket state before sending
    if (wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not open, cannot send cancel command');
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'cancel',
      payload: {
        executionId: executionIdRef.current
      }
    }));
  }, []);

  const clearOutputs = useCallback(() => {
    setOutputs([]);
  }, []);

  const forceReset = useCallback(() => {
    console.log('🔄 Force resetting execution state');
    setIsExecuting(false);
    executionIdRef.current = null;
  }, []);

  return {
    isConnected,
    isExecuting,
    outputs,
    executeTool,
    cancelExecution,
    clearOutputs,
    forceReset
  };
}

/**
 * Build command and arguments from tool call
 */
function buildCommand(toolName: string, args: any): { command: string; commandArgs: string[] } {
  const baseCommand = toolCommandMap[toolName];
  
  if (!baseCommand) {
    return { command: '', commandArgs: [] };
  }

  let commandArgs: string[] = [];

  switch (toolName) {
    case 'raw_command':
      // Parse raw command string
      const parts = args.command.trim().split(/\s+/);
      return {
        command: parts[0] || '',
        commandArgs: parts.slice(1)
      };
    
    case 'nmap_scan':
      commandArgs = buildNmapCommand(args);
      break;
    
    case 'sqlmap_test':
      commandArgs = buildSQLMapCommand(args);
      break;
    
    case 'gobuster_scan':
      commandArgs = buildGobusterCommand(args);
      break;
    
    case 'nikto_scan':
      commandArgs = buildNiktoCommand(args);
      break;
    
    case 'wpscan':
      commandArgs = buildWPScanCommand(args);
      break;
    
    case 'hydra_attack':
      commandArgs = buildHydraCommand(args);
      break;
    
    case 'curl_request':
      commandArgs = buildCurlCommand(args);
      break;
    
    case 'whois_lookup':
      commandArgs = [args.domain];
      break;
    
    case 'dns_lookup':
      commandArgs = [args.domain, args.record_type || 'A'];
      break;
    
    case 'sslscan':
      commandArgs = [args.target];
      if (args.port) commandArgs.push(`${args.target}:${args.port}`);
      break;
    
    default:
      commandArgs = [];
  }

  return { command: baseCommand, commandArgs };
}

function buildNmapCommand(args: any): string[] {
  const cmd: string[] = [];
  
  switch (args.scan_type) {
    case 'ping':
      cmd.push('-sn'); // Ping scan
      break;
    case 'quick':
      cmd.push('-F'); // Fast scan (100 common ports)
      break;
    case 'port':
      cmd.push('-sV'); // Version detection
      if (args.ports) cmd.push('-p', args.ports);
      break;
    case 'service':
      cmd.push('-sV', '-sC'); // Version + default scripts
      if (args.ports) cmd.push('-p', args.ports);
      break;
    case 'full':
      cmd.push('-A', '-T4', '-p-'); // Aggressive, all ports
      break;
    case 'stealth':
      cmd.push('-sS', '-T2'); // SYN scan, slower
      if (args.ports) cmd.push('-p', args.ports);
      break;
    case 'vuln':
      cmd.push('--script', 'vuln'); // Vulnerability scripts
      if (args.ports) cmd.push('-p', args.ports);
      break;
  }
  
  cmd.push(args.target);
  return cmd;
}

function buildSQLMapCommand(args: any): string[] {
  const cmd: string[] = ['--url', args.url, '--batch'];
  
  if (args.level) cmd.push('--level', args.level.toString());
  if (args.risk) cmd.push('--risk', args.risk.toString());
  if (args.technique) cmd.push('--technique', args.technique);
  if (args.dump_db) cmd.push('--dump');
  
  return cmd;
}

function buildGobusterCommand(args: any): string[] {
  const wordlistMap = {
    'common': '/usr/share/wordlists/common.txt',
    'medium': '/usr/share/wordlists/medium.txt',
    'large': '/usr/share/wordlists/large.txt'
  };
  
  const cmd: string[] = [
    'dir',
    '-u', args.url,
    '-w', wordlistMap[args.wordlist] || wordlistMap.common
  ];
  
  if (args.extensions) cmd.push('-x', args.extensions);
  if (args.threads) cmd.push('-t', args.threads.toString());
  
  return cmd;
}

function buildNiktoCommand(args: any): string[] {
  const cmd: string[] = ['-h', args.target];
  
  if (args.port) cmd.push('-p', args.port.toString());
  if (args.ssl) cmd.push('-ssl');
  if (args.tuning === 'quick') cmd.push('-Tuning', '1');
  else if (args.tuning === 'full') cmd.push('-Tuning', 'x');
  
  return cmd;
}

function buildWPScanCommand(args: any): string[] {
  const cmd: string[] = ['--url', args.url];
  
  if (args.enumerate) cmd.push('--enumerate', args.enumerate);
  if (args.detection_mode) cmd.push('--detection-mode', args.detection_mode);
  
  return cmd;
}

function buildHydraCommand(args: any): string[] {
  const cmd: string[] = [];
  
  if (args.username) cmd.push('-l', args.username);
  else if (args.username_list) cmd.push('-L', args.username_list);
  
  const passwordListMap = {
    'rockyou': '/usr/share/wordlists/rockyou.txt',
    'common': '/usr/share/wordlists/common-passwords.txt',
    'custom': '/usr/share/wordlists/custom.txt'
  };
  
  cmd.push('-P', passwordListMap[args.password_list] || passwordListMap.common);
  
  if (args.threads) cmd.push('-t', args.threads.toString());
  
  cmd.push(args.target, args.service);
  
  return cmd;
}

function buildCurlCommand(args: any): string[] {
  const cmd: string[] = ['-i']; // Include headers
  
  if (args.method && args.method !== 'GET') {
    cmd.push('-X', args.method);
  }
  
  if (args.headers) {
    for (const [key, value] of Object.entries(args.headers)) {
      cmd.push('-H', `${key}: ${value}`);
    }
  }
  
  if (args.data) {
    cmd.push('-d', args.data);
  }
  
  if (args.follow_redirects !== false) {
    cmd.push('-L');
  }
  
  cmd.push(args.url);
  
  return cmd;
}

