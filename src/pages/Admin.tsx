import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import PremiumCharts from '@/components/PremiumCharts';

// Simplified Admin Dashboard

export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Only ONE admin user allowed
  const isAdmin = user?.email === 'vomollo101@gmail.com';

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      navigate('/');
      return;
    }

    if (isAuthenticated && isAdmin) {
      loadDashboardData();
    }
  }, [isAuthenticated, isAdmin, loading, navigate]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      setLastRefresh(new Date());
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };



  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-green-400">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading Admin Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="h-16 w-16 text-red-400 mx-auto" />
          <h1 className="text-2xl text-red-400">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this page.</p>
          <Button onClick={() => navigate('/')} variant="outline" className="border-green-500/30 text-green-400">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-green-500/30 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-400" />
              <div>
                <h1 className="text-2xl font-bold text-green-400">Hex Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">Ultimate monitoring and analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
              <Button 
                onClick={loadDashboardData}
                variant="outline" 
                size="sm"
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                onClick={() => navigate('/')}
                variant="outline" 
                size="sm"
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                Back to App
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Premium Professional Charts */}
        <PremiumCharts refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}
