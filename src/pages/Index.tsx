import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Shield, Zap, Database, Code, Lock, AlertTriangle, Menu, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { useIsMobile } from '@/hooks/use-mobile';
import { createApiClient, ApiError } from '@/lib/api-error-handler';

const PROMPT_PRESETS = {
  'payload-generation': {
    name: 'Payload Generation',
    icon: Code,
    prompt: 'Generate a payload for [type: XSS/SQLi/CSRF/etc] targeting [context: parameter/header/cookie] in [environment: web app/API/etc]. Include variations and bypasses.'
  },
  'tool-analysis': {
    name: 'Tool Output Analysis',
    icon: Terminal,
    prompt: 'Analyze this [tool: Nmap/Burp/Nikto/etc] output and identify potential vulnerabilities, attack vectors, and next steps: [paste output here]'
  },
  'vulnerability-research': {
    name: 'Vulnerability Research',
    icon: Shield,
    prompt: 'Research vulnerabilities for [technology/version] including CVEs, exploit techniques, and mitigation strategies.'
  },
  'privilege-escalation': {
    name: 'Privilege Escalation',
    icon: Zap,
    prompt: 'Suggest privilege escalation techniques for [OS: Linux/Windows] given [current access level] and [discovered information].'
  },
  'network-enumeration': {
    name: 'Network Enumeration',
    icon: Database,
    prompt: 'Provide enumeration strategies for [network range/target] including tools, techniques, and stealth considerations.'
  },
  'code-review': {
    name: 'Security Code Review',
    icon: Lock,
    prompt: 'Review this code for security vulnerabilities, focusing on [language/framework]: [paste code here]'
  }
};

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [lastError, setLastError] = useState<ApiError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showWarning, setShowWarning] = useState(true);
  const [showMobilePresets, setShowMobilePresets] = useState(false);
  const isMobile = useIsMobile();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadingMessages = [
    "🔍 Scanning for vulnerabilities...",
    "💻 Crafting the perfect payload...",
    "🛡️ Bypassing security measures...",
    "⚡ Analyzing attack vectors...",
    "🎯 Preparing penetration strategy...",
    "🔐 Decrypting security protocols...",
    "🌐 Mapping network infrastructure...",
    "📡 Intercepting network traffic...",
    "🔧 Exploiting system weaknesses...",
    "🎭 Executing social engineering...",
    "💣 Deploying zero-day exploits...",
    "🕵️ Conducting reconnaissance...",
    "⚔️ Launching cyber offensive...",
    "🎪 Performing magic tricks...",
    "🧠 Processing hacker thoughts...",
    "🔮 Predicting security flaws...",
    "🎨 Painting the target red...",
    "🚀 Initiating cyber warfare...",
    "🎪 Running penetration circus...",
    "⚡ Charging up the matrix..."
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const applyPreset = (presetKey: string) => {
    const preset = PROMPT_PRESETS[presetKey as keyof typeof PROMPT_PRESETS];
    if (preset) {
      setInput(preset.prompt);
    }
  };

  const handleApiError = (error: ApiError) => {
    // Add error as a HEX message in the chat
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'assistant',
        content: `❌ ${error.message}`,
        timestamp: new Date(),
        isError: true,
      },
    ]);
    setLastError(error); // Optionally keep for retry logic, but not for UI
  };

  const retryLastMessage = async () => {
    if (lastError && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.type === 'user') {
        // Remove the last user message and retry
        setMessages(prev => prev.slice(0, -1));
        setInput(lastUserMessage.content);
        setRetryCount(prev => prev + 1);
        setLastError(null);
        // Call sendMessage without parameters since it has a default value
        await sendMessage();
      }
    }
  };

  const startLoadingAnimation = () => {
    let index = 0;
    setLoadingMessage(loadingMessages[0]);
    
    const interval = setInterval(() => {
      index = (index + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[index]);
    }, 2000);

    return interval;
  };

  const sendMessage = async (isRetry: boolean = false) => {
    const messageToSend = input.trim();
    if (!messageToSend) return;

    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
      handleApiError({
        type: 'client',
        message: 'OpenRouter API key not found. Please set VITE_OPENROUTER_API_KEY in your .env file.',
        status: 0,
        retryable: true,
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    if (!isRetry) {
      setMessages(prev => [...prev, userMessage]);
      setInput('');
    }
    
    setIsLoading(true);
    setLastError(null);

    // Start loading animation
    const loadingInterval = startLoadingAnimation();

    try {
      const requestPayload = {
        model: 'deepseek/deepseek-chat:free',
        messages: [
          {
            role: 'system',
            content: `You are Hex, an AI cybersecurity assistant. Help with ethical penetration testing, vulnerability assessment, and security research. Always emphasize legal, authorized testing.`
          },
          {
            role: 'user',
            content: messageToSend
          }
        ],
        temperature: 0.7,
        max_tokens: 2048
      };
      
      // OpenRouter API call
      const response = await fetch(import.meta.env.VITE_OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Hex'
        },
        body: JSON.stringify(requestPayload)
      });
      
      if (!response.ok) {
        let errorMessage = 'API request failed';
        
        try {
          // Check if response is JSON
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error?.message || errorData.message || errorMessage;
          } else {
            // Handle plain text responses
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        handleApiError({
          type: response.status === 401 ? 'auth' : 'payment_required',
          message: errorMessage,
          status: response.status,
          retryable: response.status === 401 ? false : false
        });
        return;
      }
      
      const responseData = await response.json();
      
      if (responseData.choices && responseData.choices[0]) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: responseData.choices[0].message.content || 'No response content received',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        setRetryCount(0); // Reset retry count on success
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      handleApiError({
        type: 'client',
        message: 'An unexpected error occurred',
        status: 0,
        retryable: true,
      });
    } finally {
      clearInterval(loadingInterval);
      setIsLoading(false);
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Auto-adjust textarea height
  useEffect(() => {
    adjustTextareaHeight();
  }, [input, isMobile]);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Minimal Header */}
      <div className="relative border-b border-green-500/20 bg-black/80 backdrop-blur-md">
        {/* Hanging glass threads - hidden on mobile */}
        <div className="absolute top-0 left-1/4 w-px h-4 bg-gradient-to-b from-green-400/30 to-transparent hidden md:block"></div>
        <div className="absolute top-0 right-1/3 w-px h-3 bg-gradient-to-b from-green-300/20 to-transparent hidden md:block"></div>
        <div className="absolute top-0 left-3/4 w-px h-5 bg-gradient-to-b from-emerald-400/25 to-transparent hidden md:block"></div>
        
        <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative group">
                <div className="absolute -inset-1 bg-green-400/10 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 border border-green-500/20">
                  <Terminal className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                  <div>
                    <h1 className="text-base sm:text-lg font-light text-green-400 tracking-wide">Hex</h1>
                    <p className="text-xs text-gray-400/70 font-light hidden sm:block">AI Penetration Testing</p>
                  </div>
                </div>
              </div>
              
              {/* Compact Badge */}
              <Badge variant="outline" className="border-green-500/30 text-green-300/80 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-black/30 backdrop-blur-sm font-light text-xs">
                <span className="hidden sm:inline">v2.0 • </span>Ethical
              </Badge>
            </div>
            
            {/* Mobile presets button and status */}
            <div className="flex items-center gap-2">
              {/* Mobile Presets Button */}
              <Sheet open={showMobilePresets} onOpenChange={setShowMobilePresets}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden border-green-500/30 text-green-400 hover:bg-green-500/10 px-2 py-1"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] max-w-80 bg-gray-900/95 border-green-500/30 backdrop-blur-md">
                  <SheetHeader>
                    <SheetTitle className="text-green-400 flex items-center gap-2 text-sm sm:text-base">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                      Penetration Testing Presets
                    </SheetTitle>
                  </SheetHeader>
                  <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
                    {Object.entries(PROMPT_PRESETS).map(([key, preset]) => (
                      <Button
                        key={key}
                        variant="outline"
                        onClick={() => applyPreset(key)}
                        className="w-full justify-start gap-2 sm:gap-3 bg-black/50 border-green-500/30 text-green-400 hover:bg-green-600/20 hover:border-green-500/50 py-2 sm:py-3 h-auto text-xs sm:text-sm transition-all duration-200"
                      >
                        <preset.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <div className="text-left">
                          <div className="font-medium">{preset.name}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Status */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 sm:px-3 sm:py-1.5 border border-green-500/20">
                <div className="relative">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                  <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping opacity-30"></div>
                </div>
                <span className="text-green-300/80 text-xs font-light">Online</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/3 sm:w-1/2 h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent"></div>
      </div>

      <div className="h-[calc(100vh-80px)] flex flex-col lg:flex-row">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0 p-4 space-y-6">          <Card className="bg-gray-900/50 border-green-500/30 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-green-400 text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Penetration Testing Presets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(PROMPT_PRESETS).map(([key, preset]) => (
                <Button
                  key={key}
                  variant="outline"
                  onClick={() => applyPreset(key)}
                  className="w-full justify-start gap-3 bg-black/50 border-green-500/30 text-green-400 hover:bg-green-600/20 hover:border-green-500/50 py-3 h-auto text-sm transition-all duration-200"
                >
                  <preset.icon className="h-5 w-5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{preset.name}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 p-2 sm:p-3 md:p-4">
          {/* Messages */}
          <div className="flex-1 bg-gray-900/50 border border-green-500/30 rounded-lg overflow-hidden backdrop-blur-sm mb-2 sm:mb-3 md:mb-4">
            <div className="h-full overflow-y-auto p-2 sm:p-3 md:p-4 lg:p-6">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-3 sm:space-y-4 md:space-y-6 px-2 sm:px-4">
                    <Terminal className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-green-400 mx-auto" />
                    <div>
                      <h3 className="text-lg sm:text-xl md:text-2xl text-green-400 mb-2 sm:mb-3">Welcome to Hex</h3>
                      <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg max-w-lg mx-auto">
                        Your AI assistant for ethical hacking and penetration testing. 
                        Start by selecting a preset or asking a security-related question.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 md:space-y-6">
                  {messages.map((message) => (
                    <div key={message.id} className="group">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                          message.type === 'user' 
                            ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300' 
                            : 'bg-green-500/20 border border-green-500/50 text-green-300'
                        }`}>
                          {message.type === 'user' ? (
                            <>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full"></div>
                              USER
                            </>
                          ) : (
                            <>
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full"></div>
                              HEX
                            </>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 opacity-70 group-hover:opacity-100 transition-opacity">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className={`relative rounded-xl p-2 sm:p-3 md:p-4 lg:p-6 shadow-lg transition-all duration-200 hover:shadow-xl ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-500/30 ml-1 sm:ml-2 md:ml-4' 
                          : 'bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-500/30 mr-1 sm:mr-2 md:mr-4'
                      }`}>
                        <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${
                          message.type === 'user' ? 'bg-blue-400' : 'bg-green-400'
                        }`}></div>
                        <div className="prose prose-invert max-w-none">
                          <ReactMarkdown 
                            components={{
                              p: ({ children, ...props }) => <p className="mb-2 sm:mb-3 last:mb-0 text-xs sm:text-sm leading-relaxed text-gray-200" {...props}>{children}</p>,
                              code: ({ children, ...props }) => {
                                const { node, ...rest } = props;
                                const isInline = !node || node.tagName !== 'pre';
                                return isInline ? (
                                  <code className="bg-gray-800 px-1 sm:px-1.5 py-0.5 rounded text-green-300 font-mono text-xs" {...rest}>
                                    {children}
                                  </code>
                                ) : (
                                  <code className="text-green-300 font-mono text-xs sm:text-sm" {...rest}>{children}</code>
                                );
                              },
                              pre: ({ children, ...props }) => (
                                <pre className="bg-gray-800 p-2 sm:p-3 md:p-4 rounded-lg overflow-x-auto mb-2 sm:mb-3 text-xs sm:text-sm" {...props}>
                                  {children}
                                </pre>
                              ),
                              strong: ({ children, ...props }) => <strong className="text-green-300 font-semibold" {...props}>{children}</strong>,
                              em: ({ children, ...props }) => <em className="text-blue-300 italic" {...props}>{children}</em>,
                              ul: ({ children, ...props }) => <ul className="list-disc list-inside mb-2 sm:mb-3 space-y-1" {...props}>{children}</ul>,
                              ol: ({ children, ...props }) => <ol className="list-decimal list-inside mb-2 sm:mb-3 space-y-1" {...props}>{children}</ol>,
                              li: ({ children, ...props }) => <li className="text-gray-200 text-xs sm:text-sm" {...props}>{children}</li>,
                              h1: ({ children, ...props }) => <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-green-300 mb-2 sm:mb-3" {...props}>{children}</h1>,
                              h2: ({ children, ...props }) => <h2 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-green-300 mb-2" {...props}>{children}</h2>,
                              h3: ({ children, ...props }) => <h3 className="text-xs sm:text-sm md:text-base font-bold text-green-300 mb-2" {...props}>{children}</h3>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 lg:p-6 bg-green-900/20 border border-green-500/30 rounded-xl mr-1 sm:mr-2 md:mr-4">
                      <div className="flex space-x-1 sm:space-x-2">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-green-400 font-mono text-xs sm:text-sm">
                        {retryCount > 0 ? `Retrying... (${retryCount}/3)` : loadingMessage}
                      </span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Input Area - Improved mobile responsiveness */}
          <div className="flex-shrink-0">
            <div className="bg-gray-900/70 border border-green-500/30 rounded-lg p-2 sm:p-3 backdrop-blur-sm">
              <div className="flex gap-2 sm:gap-3 items-end">
                <div className="flex-1">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Ask about penetration testing, request payloads, or security analysis..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="bg-black/50 border-green-500/40 text-green-100 placeholder-gray-400 resize-none text-sm focus:border-green-400 focus:ring-1 focus:ring-green-400/20 rounded-md transition-all duration-200 scrollbar-hide"
                    rows={1}
                    style={{ 
                      minHeight: isMobile ? '40px' : '44px',
                      maxHeight: isMobile ? '100px' : '120px'
                    }}
                  />
                </div>
                <Button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !input.trim()}
                  className="bg-green-600 hover:bg-green-700 text-black font-semibold px-2 sm:px-3 md:px-4 py-2 h-10 sm:h-11 rounded-md shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
