import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Terminal } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/?error=auth_failed');
          return;
        }

        if (data.session) {
          // Successfully authenticated, redirect to home
          navigate('/');
        } else {
          // No session, redirect to home
          navigate('/');
        }
      } catch (error) {
        console.error('Unexpected auth callback error:', error);
        navigate('/?error=auth_failed');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
      <div className="text-center space-y-4">
        <Terminal className="h-16 w-16 text-green-400 mx-auto animate-pulse" />
        <div>
          <h2 className="text-xl text-green-400 mb-2">Authenticating...</h2>
          <p className="text-gray-400">
            Please wait while we complete your GitHub authentication.
          </p>
        </div>
      </div>
    </div>
  );
}
