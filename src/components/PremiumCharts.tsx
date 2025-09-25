import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  BarChart3,
  Calendar,
  RefreshCw 
} from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { supabase } from '@/lib/supabase';

interface ChartData {
  date: string;
  users: number;
  messages: number;
  conversations: number;
  revenue: number;
  day: string;
}

interface UserDistribution {
  name: string;
  value: number;
  color: string;
}

interface PremiumChartsProps {
  refreshTrigger: number;
}

interface StatsData {
  totalUsers: number;
  totalMessages: number;
  totalConversations: number;
  monthlyRevenue: number;
}

const COLORS = {
  primary: '#10B981',    // Green
  secondary: '#3B82F6',  // Blue  
  accent: '#8B5CF6',     // Purple
  warning: '#F59E0B',    // Yellow
  success: '#059669',    // Emerald
  info: '#0EA5E9',       // Sky
  danger: '#DC2626'      // Red
};

export default function PremiumCharts({ refreshTrigger }: PremiumChartsProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [userDistribution, setUserDistribution] = useState<UserDistribution[]>([]);
  const [statsData, setStatsData] = useState<StatsData>({
    totalUsers: 0,
    totalMessages: 0,
    totalConversations: 0,
    monthlyRevenue: 0
  });
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '1y'>('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [timeRange, refreshTrigger]);

  // Auto-refresh every 5 minutes to keep data current
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing chart data...');
      loadChartData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [timeRange]);

  const loadChartData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading chart data for time range:', timeRange);
      await Promise.all([
        loadTimeSeriesData(),
        loadUserDistribution(),
        loadStatsData()
      ]);
      console.log('✅ Chart data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTimeSeriesData = async () => {
    if (timeRange === '1y') {
      await loadYearlyData();
    } else if (timeRange === '30d') {
      await loadWeeklyData();
    } else {
      await loadDailyData();
    }
  };

  const loadDailyData = async () => {
    // For 7d view - show last 7 days including today
    const today = new Date();
    const days = 7;

    // Always start from 6 days ago to include today as the last day
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (days - 1));

    const dateRange = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dateRange.push(date.toISOString().split('T')[0]);
    }

    console.log(`📅 7-Day view:`, {
      from: dateRange[0],
      to: dateRange[dateRange.length - 1],
      today: today.toISOString().split('T')[0],
      totalDays: dateRange.length
    });

    const data = await Promise.all(
      dateRange.map(async (date) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextDateString = nextDate.toISOString().split('T')[0];

        // Real data queries for daily view
        const [usersResult, messagesResult, conversationsResult, billingResult] = await Promise.all([
          // New users registered on this specific date
          supabase.from('user_profiles').select('*', { count: 'exact', head: true })
            .gte('created_at', date)
            .lt('created_at', nextDateString),

          // Messages sent on this specific date from daily_usage
          supabase.from('daily_usage').select('message_count')
            .eq('usage_date', date),

          // Conversations started on this specific date
          supabase.from('conversations').select('*', { count: 'exact', head: true })
            .gte('created_at', date)
            .lt('created_at', nextDateString),

          // Actual billing transactions on this specific date
          supabase.from('billing_transactions').select('amount')
            .eq('status', 'completed')
            .gte('created_at', date)
            .lt('created_at', nextDateString)
        ]);

        // Calculate real revenue from actual billing transactions
        const dailyRevenue = billingResult.data?.reduce((sum, transaction) => {
          return sum + (parseFloat(transaction.amount) || 0);
        }, 0) || 0;

        // For 7-day view, show day of week + date
        const dateObj = new Date(date);
        const dayLabel = dateObj.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });

        const dayData = {
          date,
          users: usersResult.count || 0,
          messages: messagesResult.data?.reduce((sum, row) => sum + (row.message_count || 0), 0) || 0,
          conversations: conversationsResult.count || 0,
          revenue: dailyRevenue,
          day: dayLabel
        };

        // Log data for debugging (only for recent dates with activity)
        if (dayData.users > 0 || dayData.messages > 0 || dayData.conversations > 0) {
          console.log(`📊 Daily data for ${dayData.day}:`, dayData);
        }

        return dayData;
      })
    );

    console.log(`📈 Loaded ${data.length} days of 7-day data`);
    setChartData(data);
  };

  const loadWeeklyData = async () => {
    // For 30d view - show last 4-5 weeks as data points
    const today = new Date();
    const weekRanges = [];

    // Generate last 5 weeks including current week
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7) - today.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
      weekEnd.setHours(23, 59, 59, 999);

      const weekLabel = `Week of ${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

      weekRanges.push({
        start: weekStart.toISOString(),
        end: weekEnd.toISOString(),
        label: weekLabel,
        date: weekStart.toISOString().split('T')[0]
      });
    }

    console.log(`📅 30-Day view - 5 weeks:`, {
      from: weekRanges[0].label,
      to: weekRanges[weekRanges.length - 1].label,
      weeks: weekRanges.map(w => w.label)
    });

    const data = await Promise.all(
      weekRanges.map(async (weekRange) => {
        // Real data queries for entire week
        const [usersResult, messagesResult, conversationsResult, billingResult] = await Promise.all([
          // New users registered in this week
          supabase.from('user_profiles').select('*', { count: 'exact', head: true })
            .gte('created_at', weekRange.start)
            .lt('created_at', weekRange.end),

          // Messages sent in this week from daily_usage
          supabase.from('daily_usage').select('message_count')
            .gte('usage_date', weekRange.start.split('T')[0])
            .lt('usage_date', weekRange.end.split('T')[0]),

          // Conversations started in this week
          supabase.from('conversations').select('*', { count: 'exact', head: true })
            .gte('created_at', weekRange.start)
            .lt('created_at', weekRange.end),

          // Actual billing transactions in this week
          supabase.from('billing_transactions').select('amount')
            .eq('status', 'completed')
            .gte('created_at', weekRange.start)
            .lt('created_at', weekRange.end)
        ]);

        // Calculate weekly revenue from actual billing transactions
        const weeklyRevenue = billingResult.data?.reduce((sum, transaction) => {
          return sum + (parseFloat(transaction.amount) || 0);
        }, 0) || 0;

        const weekData = {
          date: weekRange.date,
          users: usersResult.count || 0,
          messages: messagesResult.data?.reduce((sum, row) => sum + (row.message_count || 0), 0) || 0,
          conversations: conversationsResult.count || 0,
          revenue: weeklyRevenue,
          day: weekRange.label
        };

        // Log data for debugging (only for weeks with activity)
        if (weekData.users > 0 || weekData.messages > 0 || weekData.conversations > 0) {
          console.log(`📊 Weekly data for ${weekData.day}:`, weekData);
        }

        return weekData;
      })
    );

    console.log(`📈 Loaded 5 weeks of 30-day data`);
    setChartData(data);
  };

  const loadYearlyData = async () => {
    // For 1y view - show 12 months as data points
    const today = new Date();
    const monthRanges = [];

    // Generate last 12 months including current month
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

      monthRanges.push({
        start: monthStart.toISOString(),
        end: monthEnd.toISOString(),
        label: monthDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
        date: monthStart.toISOString().split('T')[0]
      });
    }

    console.log(`📅 Yearly view - 12 months:`, {
      from: monthRanges[0].label,
      to: monthRanges[monthRanges.length - 1].label,
      months: monthRanges.map(m => m.label)
    });

    const data = await Promise.all(
      monthRanges.map(async (monthRange) => {
        // Real data queries for entire month
        const [usersResult, messagesResult, conversationsResult, billingResult] = await Promise.all([
          // New users registered in this month
          supabase.from('user_profiles').select('*', { count: 'exact', head: true })
            .gte('created_at', monthRange.start)
            .lt('created_at', monthRange.end),

          // Messages sent in this month from daily_usage
          supabase.from('daily_usage').select('message_count')
            .gte('usage_date', monthRange.start.split('T')[0])
            .lt('usage_date', monthRange.end.split('T')[0]),

          // Conversations started in this month
          supabase.from('conversations').select('*', { count: 'exact', head: true })
            .gte('created_at', monthRange.start)
            .lt('created_at', monthRange.end),

          // Actual billing transactions in this month
          supabase.from('billing_transactions').select('amount')
            .eq('status', 'completed')
            .gte('created_at', monthRange.start)
            .lt('created_at', monthRange.end)
        ]);

        // Calculate monthly revenue from actual billing transactions
        const monthlyRevenue = billingResult.data?.reduce((sum, transaction) => {
          return sum + (parseFloat(transaction.amount) || 0);
        }, 0) || 0;

        const monthData = {
          date: monthRange.date,
          users: usersResult.count || 0,
          messages: messagesResult.data?.reduce((sum, row) => sum + (row.message_count || 0), 0) || 0,
          conversations: conversationsResult.count || 0,
          revenue: monthlyRevenue,
          day: monthRange.label
        };

        // Log data for debugging (only for months with activity)
        if (monthData.users > 0 || monthData.messages > 0 || monthData.conversations > 0) {
          console.log(`📊 Monthly data for ${monthData.day}:`, monthData);
        }

        return monthData;
      })
    );

    console.log(`📈 Loaded 12 months of yearly data`);
    setChartData(data);
  };

  const loadUserDistribution = async () => {
    // Real user distribution data - no sample data
    const [totalResult, premiumResult] = await Promise.all([
      // Count all users in the system
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),

      // Count only premium users
      supabase.from('user_profiles').select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'premium')
    ]);

    const totalUsers = totalResult.count || 0;
    const premiumUsers = premiumResult.count || 0;
    const freeUsers = totalUsers - premiumUsers;

    console.log(`👥 User Distribution - Total: ${totalUsers}, Premium: ${premiumUsers}, Free: ${freeUsers}`);

    // Real data only - no demo data
    setUserDistribution([
      { name: 'Free Users', value: freeUsers, color: COLORS.secondary },
      { name: 'Premium Users', value: premiumUsers, color: COLORS.warning }
    ]);
  };

  const loadStatsData = async () => {
    // Calculate current month date range for revenue
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    // Load overall statistics for the stats cards
    const [usersResult, messagesResult, conversationsResult, billingResult, premiumResult] = await Promise.all([
      // Total users
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),

      // Total messages from daily_usage table
      supabase.from('daily_usage').select('message_count'),

      // Total conversations
      supabase.from('conversations').select('*', { count: 'exact', head: true }),

      // Current month's billing transactions
      supabase.from('billing_transactions').select('amount')
        .eq('status', 'completed')
        .gte('created_at', currentMonthStart)
        .lt('created_at', nextMonthStart),

      // Premium users as fallback for revenue calculation
      supabase.from('user_profiles').select('*', { count: 'exact', head: true })
        .eq('subscription_status', 'premium')
    ]);

    const totalUsers = usersResult.count || 0;
    const totalMessages = messagesResult.data?.reduce((sum, row) => sum + (row.message_count || 0), 0) || 0;
    const totalConversations = conversationsResult.count || 0;

    // Calculate actual monthly revenue from billing transactions
    let monthlyRevenue = billingResult.data?.reduce((sum, transaction) => {
      return sum + (parseFloat(transaction.amount) || 0);
    }, 0) || 0;

    // Fallback: If no billing transactions, estimate from premium users
    if (monthlyRevenue === 0 && premiumResult.count && premiumResult.count > 0) {
      // Note: This is an estimate - actual pricing should come from billing_transactions
      monthlyRevenue = premiumResult.count * 3; // Temporary fallback
      console.log(`💡 Using fallback revenue calculation: ${premiumResult.count} premium users × $3`);
    }

    console.log(`📊 Stats - Users: ${totalUsers}, Messages: ${totalMessages}, Conversations: ${totalConversations}, Revenue: $${monthlyRevenue}`);

    setStatsData({
      totalUsers,
      totalMessages,
      totalConversations,
      monthlyRevenue
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={`stat-${i}`} className="bg-gray-900/50 border-green-500/30 backdrop-blur-sm">
              <CardContent className="flex items-center justify-center py-6">
                <div className="flex items-center gap-2 text-green-400">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={`chart-${i}`} className="bg-gray-900/50 border-green-500/30 backdrop-blur-sm">
              <CardContent className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-green-400">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span>Loading premium chart {i}...</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-green-400 flex items-center gap-3">
          <BarChart3 className="h-8 w-8" />
          Premium Analytics Dashboard
        </h2>
        <div className="flex gap-2">
          {(['7d', '30d', '1y'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className={
                timeRange === range
                  ? 'bg-green-600 text-white'
                  : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
              }
            >
              <Calendar className="h-4 w-4 mr-1" />
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 12 Months'}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Users Card */}
        <Card className="bg-gray-900/50 border-green-500/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-green-400">{statsData.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        {/* Total Messages Card */}
        <Card className="bg-gray-900/50 border-blue-500/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Messages</p>
                <p className="text-2xl font-bold text-blue-400">{statsData.totalMessages.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        {/* Total Conversations Card */}
        <Card className="bg-gray-900/50 border-purple-500/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Conversations</p>
                <p className="text-2xl font-bold text-purple-400">{statsData.totalConversations.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue Card */}
        <Card className="bg-gray-900/50 border-yellow-500/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Monthly Revenue</p>
                <p className="text-2xl font-bold text-yellow-400">${statsData.monthlyRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. User Growth Line Chart */}
        <Card className="bg-gray-900/50 border-green-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              User Growth Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="day" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #10B981',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke={COLORS.primary}
                  strokeWidth={3}
                  dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: COLORS.primary, strokeWidth: 2 }}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. Revenue Line Chart */}
        <Card className="bg-gray-900/50 border-yellow-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="day"
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #F59E0B',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => [`$${value}`, 'Daily Revenue']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={COLORS.warning}
                  strokeWidth={3}
                  dot={{ fill: COLORS.warning, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: COLORS.warning, strokeWidth: 2 }}
                  name="Daily Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3. User Distribution Pie Chart */}
        <Card className="bg-gray-900/50 border-blue-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #3B82F6',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4. Activity Area Chart */}
        <Card className="bg-gray-900/50 border-purple-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-purple-400 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Activity Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="day" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #8B5CF6',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="messages" 
                  stackId="1"
                  stroke={COLORS.accent}
                  fill={COLORS.accent}
                  fillOpacity={0.6}
                  name="Messages"
                />
                <Area 
                  type="monotone" 
                  dataKey="conversations" 
                  stackId="1"
                  stroke={COLORS.info}
                  fill={COLORS.info}
                  fillOpacity={0.6}
                  name="Conversations"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
