# Hex Admin Dashboard

## Overview

The Hex Admin Dashboard provides comprehensive monitoring and analytics for your cybersecurity assistant platform. It features real-time metrics, user analytics, system health monitoring, and administrative controls.

## Access

### Admin Authentication
- **URL**: `/admin`
- **Access Control**: Email-based admin verification
- **Current Admin**: `vomollo101@gmail.com`
- **Fallback**: Any email containing "admin"

### Security Features
- Automatic redirect for non-admin users
- Session-based authentication via Supabase
- Real-time access verification

## Dashboard Components

### 1. Stats Overview
**Real-time metrics displayed in cards:**
- **Total Users**: Complete user count with premium breakdown
- **Daily Active Users**: Users active in last 24 hours with engagement percentage
- **Total Messages**: All messages sent with average per user
- **Monthly Revenue**: Premium subscriptions × $3 with subscriber count

### 2. Real-Time Monitor
**Live system monitoring (30-second refresh):**
- **Active Users**: Users with activity in last 5 minutes
- **Messages/Hour**: Message volume in last hour
- **New Chats/Hour**: Conversation creation rate
- **System Load**: Simulated server load percentage
- **Response Time**: Database query performance
- **Error Rate**: System error percentage with status indicators

### 3. System Health
**Three-panel health overview:**

#### Database Status
- Connection health with visual indicators
- Response time monitoring
- Uptime percentage tracking

#### Conversations Analytics
- Total active conversations
- Average conversations per user
- Progress bar visualization (target: 1000 conversations)

#### Growth Metrics
- Premium conversion rate
- User engagement percentage
- Average messages per user

### 4. Analytics Charts
**Time-series data visualization:**
- **Time Ranges**: 7 days, 30 days, 90 days
- **Metrics Tracked**:
  - New user registrations
  - Message volume
  - Conversation creation
  - Premium signups
- **Visual Format**: Horizontal bar charts with gradients
- **Totals Display**: Aggregated metrics for selected period

### 5. User Activity Table
**Recent user activity overview:**
- User identification (GitHub username, email)
- Subscription status with color-coded badges
- Message count per user
- Conversation count per user
- Last activity timestamp
- Hover effects for better UX

### 6. Admin Actions
**Quick administrative tools:**
- **Database Cleanup**: Manual cleanup trigger
- **Export Analytics**: Data export functionality
- **System Check**: Health verification

## Technical Implementation

### Database Queries
```sql
-- Active users (last 5 minutes)
SELECT COUNT(DISTINCT user_id) FROM conversations 
WHERE updated_at >= NOW() - INTERVAL '5 minutes';

-- Messages in last hour
SELECT COUNT(*) FROM messages 
WHERE created_at >= NOW() - INTERVAL '1 hour';

-- Premium conversion rate
SELECT 
  COUNT(CASE WHEN subscription_status = 'premium' THEN 1 END) * 100.0 / COUNT(*) 
FROM profiles;
```

### Real-Time Features
- **Auto-refresh**: 30-second intervals for live data
- **Connection status**: Visual indicators for system health
- **Error handling**: Graceful degradation on connection issues
- **Performance**: Optimized queries with proper indexing

### Data Sources
- **Supabase Tables**: profiles, conversations, messages, daily_usage
- **Auth System**: Supabase authentication
- **Metrics**: Real-time calculations from database
- **System Health**: Simulated metrics (can be replaced with actual monitoring)

## Design System

### Color Scheme
- **Primary**: Green (#10B981) - Hex brand color
- **Secondary**: Blue (#3B82F6) - Activity metrics
- **Accent**: Purple (#8B5CF6) - Conversations
- **Warning**: Yellow (#F59E0B) - Revenue/Premium
- **Error**: Red (#EF4444) - Alerts/Issues
- **Background**: Black/Gray gradient matching main app

### Typography
- **Headers**: Green accent color
- **Metrics**: Large, bold numbers with color coding
- **Labels**: Gray text for readability
- **Monospace**: Used for technical metrics (response times, etc.)

### Layout
- **Responsive**: Mobile-first design with grid layouts
- **Cards**: Consistent card-based components
- **Spacing**: Proper spacing with Tailwind CSS
- **Icons**: Lucide React icons for consistency

## Performance Considerations

### Optimization
- **Lazy Loading**: Components load as needed
- **Efficient Queries**: Indexed database queries
- **Caching**: Browser caching for static assets
- **Debouncing**: Prevents excessive API calls

### Scalability
- **Pagination**: Ready for large datasets
- **Filtering**: Time-based data filtering
- **Aggregation**: Server-side data aggregation
- **Monitoring**: Built-in performance tracking

## Security

### Access Control
- **Admin Verification**: Email-based admin checking
- **Session Management**: Supabase session handling
- **Route Protection**: Automatic redirects for unauthorized access
- **Data Isolation**: Row Level Security (RLS) policies

### Data Privacy
- **Minimal Exposure**: Only necessary data displayed
- **Anonymization**: User data properly handled
- **Audit Trail**: Activity logging capabilities
- **Secure Queries**: Parameterized database queries

## Future Enhancements

### Planned Features
- **Advanced Analytics**: More detailed user behavior analysis
- **Alert System**: Automated alerts for system issues
- **Export Functionality**: CSV/JSON data exports
- **User Management**: Direct user administration tools
- **API Monitoring**: OpenRouter API usage tracking
- **Cost Analysis**: Detailed cost breakdown and optimization

### Integration Opportunities
- **External Monitoring**: Integration with monitoring services
- **Notification System**: Email/Slack alerts
- **Backup Management**: Automated backup monitoring
- **Performance Metrics**: APM integration
- **Business Intelligence**: Advanced reporting tools

## Troubleshooting

### Common Issues
1. **Access Denied**: Verify admin email configuration
2. **Loading Issues**: Check Supabase connection
3. **Data Inconsistencies**: Verify database indexes
4. **Performance**: Monitor query execution times

### Debug Mode
- Browser console logs for detailed error information
- Network tab for API call monitoring
- Supabase dashboard for database query analysis

## Maintenance

### Regular Tasks
- **Database Cleanup**: Monitor and clean old data
- **Performance Review**: Check query performance
- **Security Audit**: Review access logs
- **Backup Verification**: Ensure data backup integrity

### Monitoring
- **System Health**: Regular health checks
- **User Activity**: Monitor usage patterns
- **Error Rates**: Track and resolve errors
- **Performance Metrics**: Monitor response times
