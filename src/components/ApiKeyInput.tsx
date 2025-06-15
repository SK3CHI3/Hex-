import React, { useState } from 'react';
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"

interface ApiKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
}

export function ApiKeyInput({ onApiKeySubmit }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
      localStorage.setItem('openrouter_api_key', apiKey.trim());
    }
  };

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
