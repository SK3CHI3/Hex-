import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Terminal, Copy, Download, Trash2, Maximize2, Minimize2, Square, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface TerminalOutput {
  type: 'stdout' | 'stderr' | 'info' | 'error' | 'command';
  content: string;
  timestamp: Date;
}

interface TerminalWindowProps {
  outputs: TerminalOutput[];
  isRunning?: boolean;
  onClear?: () => void;
  onCommand?: (command: string) => void;
  onCancel?: () => void;
  onForceReset?: () => void;
  className?: string;
  title?: string;
}

export const TerminalWindow: React.FC<TerminalWindowProps> = ({
  outputs,
  isRunning = false,
  onClear,
  onCommand,
  onCancel,
  onForceReset,
  className,
  title = 'Terminal Output'
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const outputEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Use refs for drag state to avoid re-renders
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    translateX: 0,
    translateY: 0
  });
  const rafRef = useRef<number>();

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [outputs]);

  // Optimized drag handlers using refs and RAF
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    if (e.target !== headerRef.current && !headerRef.current?.contains(e.target as Node)) return;
    
    e.preventDefault();
    
    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX - dragStateRef.current.translateX,
      startY: e.clientY - dragStateRef.current.translateY,
      translateX: dragStateRef.current.translateX,
      translateY: dragStateRef.current.translateY
    };
    
    setIsDragging(true);
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  }, [isMaximized]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current.isDragging) return;
      
      // Cancel previous RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      // Use RAF for smooth updates
      rafRef.current = requestAnimationFrame(() => {
        const newX = e.clientX - dragStateRef.current.startX;
        const newY = e.clientY - dragStateRef.current.startY;
        
        dragStateRef.current.translateX = newX;
        dragStateRef.current.translateY = newY;
        
        // Update DOM directly for performance
        if (containerRef.current) {
          containerRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
        }
      });
    };

    const handleMouseUp = () => {
      if (dragStateRef.current.isDragging) {
        dragStateRef.current.isDragging = false;
        setIsDragging(false);
        
        // Restore cursor and text selection
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        
        // Cancel any pending RAF
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Cleanup
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    const text = outputs
      .map(output => output.content)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const text = outputs
      .map(output => `[${output.timestamp.toLocaleTimeString()}] [${output.type}] ${output.content}`)
      .join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-output-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCommandSubmit = () => {
    if (commandInput.trim() && onCommand && !isRunning) {
      onCommand(commandInput.trim());
      setCommandInput('');
    }
  };

  const handleTerminalKeyDown = (e: React.KeyboardEvent) => {
    // Don't handle if no command handler provided
    if (!onCommand) return;
    
    // Allow Ctrl+C for cancel even when running
    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      onCancel?.();
      return;
    }
    
    // Block other input when running
    if (isRunning) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommandSubmit();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      setCommandInput(prev => prev.slice(0, -1));
    } else if (e.key === 'Delete') {
      e.preventDefault();
      setCommandInput('');
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      // Could implement command history here
    } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      setCommandInput(prev => prev + e.key);
    }
  };

  const handleTerminalClick = (e: React.MouseEvent) => {
    // Only focus if clicking inside the terminal output area
    if (!isRunning && onCommand && terminalRef.current) {
      // Check if click is within terminal div (not on buttons)
      const target = e.target as HTMLElement;
      const isTerminalClick = terminalRef.current === target || terminalRef.current.contains(target);
      
      if (isTerminalClick) {
        terminalRef.current.focus();
        setIsFocused(true);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'terminal-window bg-black/95 rounded-lg border border-green-500/30 backdrop-blur-sm will-change-transform',
        isMaximized ? 'fixed inset-4 z-50 transition-all duration-300' : 'fixed z-40',
        isDragging && 'cursor-grabbing',
        className
      )}
      style={{
        top: isMaximized ? 'auto' : '50%',
        left: isMaximized ? 'auto' : '50%',
        margin: isMaximized ? 'auto' : '-200px 0 0 -400px',
        width: isMaximized ? 'auto' : '800px',
        maxWidth: '90vw',
        transform: isMaximized ? 'none' : `translate(${dragStateRef.current.translateX}px, ${dragStateRef.current.translateY}px)`
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Terminal Header */}
      <div 
        ref={headerRef}
        className={cn(
          "flex items-center justify-between px-4 py-2 border-b border-green-500/20 bg-gray-900/50",
          !isMaximized && "cursor-grab active:cursor-grabbing"
        )}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-green-400" />
          <span className="text-green-300 font-mono text-sm">{title}</span>
          {isRunning && (
            <div className="flex items-center gap-2 ml-2">
              <div className="animate-spin h-3 w-3 border-2 border-green-400 border-t-transparent rounded-full" />
              <span className="text-green-400 text-xs">Running...</span>
            </div>
          )}
        </div>

        {/* Terminal Controls */}
        <div className="flex items-center gap-1">
          {isRunning && onCancel && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 font-mono text-xs"
              onClick={onCancel}
              title="Stop execution"
            >
              <Square className="h-3.5 w-3.5 mr-1" />
              Stop
            </Button>
          )}
          
          {onForceReset && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 font-mono text-xs"
              onClick={onForceReset}
              title="Force reset if stuck"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10"
            onClick={handleCopy}
            title="Copy output"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10"
            onClick={handleDownload}
            title="Download log"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          
          {onClear && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10"
              onClick={onClear}
              title="Clear output"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/10"
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Minimize' : 'Maximize'}
          >
            {isMaximized ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        tabIndex={0}
        className={cn(
          'overflow-y-auto overflow-x-auto font-mono text-sm p-4 scrollbar-thin scrollbar-thumb-green-500/30 scrollbar-track-transparent outline-none cursor-text transition-all duration-200',
          isMaximized ? 'h-[calc(100vh-8rem)]' : 'h-[500px]',
          isFocused && onCommand ? 'ring-2 ring-green-400/50 bg-black/80' : 'bg-black/95'
        )}
        onKeyDown={handleTerminalKeyDown}
        onClick={handleTerminalClick}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        {outputs.length === 0 && !commandInput ? (
          <div className="text-gray-500 italic">
            {onCommand ? (
              <>
                <span className="text-green-400">●</span> Ready. Click here to focus and type commands...
              </>
            ) : (
              'No output yet...'
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {outputs.map((output, index) => (
              <div
                key={index}
                className={cn(
                  'leading-relaxed break-all',
                  output.type === 'command' && 'text-blue-400 font-semibold',
                  output.type === 'stdout' && 'text-green-300',
                  output.type === 'stderr' && 'text-red-400',
                  output.type === 'info' && 'text-cyan-400',
                  output.type === 'error' && 'text-red-500 font-semibold'
                )}
              >
                {output.type === 'command' && '$ '}
                {output.content}
              </div>
            ))}
            
            {/* Current command input line */}
            {!isRunning && onCommand && (
              <div className="text-green-400 flex items-start">
                <span className="mr-2">$</span>
                <span className="flex-1">{commandInput}</span>
                <span className={cn(
                  'inline-block w-2 h-4 ml-1 bg-green-400',
                  isFocused ? 'animate-pulse' : 'opacity-30'
                )} />
              </div>
            )}
            
            <div ref={outputEndRef} />
          </div>
        )}
      </div>

      {/* Terminal Footer (Optional Status) */}

      {outputs.length > 0 && (
        <div className="px-4 py-2 border-t border-green-500/20 bg-gray-900/50 text-xs text-gray-400 flex items-center justify-between">
          <span>{outputs.length} line{outputs.length !== 1 ? 's' : ''}</span>
          {outputs[outputs.length - 1] && (
            <span>Last update: {outputs[outputs.length - 1].timestamp.toLocaleTimeString()}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default TerminalWindow;

