import React, { useState } from 'react';
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { AlertTriangle, Key, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ApiKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
}

export function ApiKeyInput({ onApiKeySubmit }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const envApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  // If we have an environment variable, use it and don't show the dialog
  React.useEffect(() => {
    if (envApiKey) {
      onApiKeySubmit(envApiKey);
      localStorage.setItem('openrouter_api_key', envApiKey);
    }
  }, [envApiKey, onApiKeySubmit]);

  const validateApiKey = async (key: string): Promise<boolean> => {
    if (!key.trim()) {
      setValidationError('API key cannot be empty');
      return false;
    }

    if (key.length < 20) {
      setValidationError('API key appears to be too short');
      return false;
    }

    // Basic format validation for OpenRouter API keys
    if (!key.startsWith('sk-')) {
      setValidationError('API key should start with "sk-"');
      return false;
    }

    setIsValidating(true);
    setValidationError('');

    try {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.key) {
          toast({
            title: 'API Key Validated',
            description: `Connected as ${data.key.name || 'User'}`,
          });
          return true;
        }
      } else if (response.status === 401) {
        setValidationError('Invalid API key. Please check your key and try again.');
        return false;
      } else {
        setValidationError('Failed to validate API key. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('API key validation error:', error);
      setValidationError('Network error during validation. Please check your connection and try again.');
      return false;
    } finally {
      setIsValidating(false);
    }

    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setValidationError('Please enter your API key');
      return;
    }

    const isValid = await validateApiKey(trimmedKey);
    if (isValid) {
      onApiKeySubmit(trimmedKey);
      localStorage.setItem('openrouter_api_key', trimmedKey);
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    if (validationError) {
      setValidationError('');
    }
  };

  // Don't show dialog if we have an environment variable
  if (envApiKey) return null;

  return (
    <Dialog open={true}>
      <DialogContent className="bg-gray-900 border-green-500/30 max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-green-400 flex items-center gap-2">
            <Key className="h-5 w-5" />
            Enter OpenRouter API Key
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-sm">
            Hex requires an OpenRouter API key to function. You can get one for free at{' '}
            <a 
              href="https://openrouter.ai/keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 underline inline-flex items-center gap-1"
            >
              openrouter.ai/keys
              <ExternalLink className="h-3 w-3" />
            </a>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="sk-or-v1-..."
              value={apiKey}
              onChange={handleKeyChange}
              className={`bg-black/50 border-green-500/40 text-green-100 placeholder-gray-400 focus:border-green-400 focus:ring-1 focus:ring-green-400/20 ${
                validationError ? 'border-red-500 focus:border-red-400 focus:ring-red-400/20' : ''
              }`}
              disabled={isValidating}
              required
            />
            {validationError && (
              <div className="flex items-center gap-2 text-red-400 text-xs">
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={!apiKey.trim() || isValidating}
              className="flex-1 bg-green-600 hover:bg-green-700 text-black font-semibold disabled:opacity-50"
            >
              {isValidating ? 'Validating...' : 'Save API Key'}
            </Button>
          </div>
          
          <div className="text-xs text-gray-400 space-y-1">
            <p>• Your API key is stored locally and never sent to our servers</p>
            <p>• OpenRouter offers free credits for new users</p>
            <p>• You can revoke this key anytime from your OpenRouter dashboard</p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
