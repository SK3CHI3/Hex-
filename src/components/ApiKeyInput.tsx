import React, { useState } from 'react';
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"

interface ApiKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
}

export function ApiKeyInput({ onApiKeySubmit }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');
  const envApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  // If we have an environment variable, use it and don't show the dialog
  React.useEffect(() => {
    if (envApiKey) {
      onApiKeySubmit(envApiKey);
      localStorage.setItem('openrouter_api_key', envApiKey);
    }
  }, [envApiKey, onApiKeySubmit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
      localStorage.setItem('openrouter_api_key', apiKey.trim());
    }
  };
  // Don't show dialog if we have an environment variable
  if (envApiKey) return null;

  return (
    <Dialog open={true}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter OpenRouter API Key</DialogTitle>
          <DialogDescription>
            Please enter your OpenRouter API key to continue. You can get one at{' '}
            <a 
              href="https://openrouter.ai/keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              openrouter.ai/keys
            </a>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter your API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
          />
          <Button type="submit" disabled={!apiKey.trim()}>
            Save API Key
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
