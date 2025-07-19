import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  MessageSquare,
  Users,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { blink } from '../../blink/client'

interface AnalyticsData {
  totalMessages: number
  successfulMessages: number
  failedMessages: number
  successRate: number
  totalGroups: number
  activeGroups: number
  averageResponseTime: number
  dailyStats: Array<{
    date: string
    sent: number
    success: number
    failed: number
  }>
}

export function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalMessages: 0,
    successfulMessages: 0,
    failedMessages: 0,
    successRate: 0,
    totalGroups: 0,
    activeGroups: 0,
    averageResponseTime: 0,
    dailyStats: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAnalytics = async () => {
    try {
      const user = await blink.auth.me()
      
      // Load message logs
      const logs = await blink.db.messageLogs.list({
        where: { userId: user.id }
      })

      // Load groups
      const groups = await blink.db.telegramGroups.list({
        where: { userId: user.id }
      })

      const successfulLogs = logs.filter(log => log.status === 'success')
      const failedLogs = logs.filter(log => log.status === 'failed')
      const successRate = logs.length > 0 ? (successfulLogs.length / logs.length) * 100 : 0

      // Generate daily stats for the last 7 days
      const dailyStats = generateDailyStats(logs)

      setAnalytics({
        totalMessages: logs.length,
        successfulMessages: successfulLogs.length,
        failedMessages: failedLogs.length,
        successRate: Math.round(successRate),
        totalGroups: groups.length,
        activeGroups: groups.filter(g => Number(g.isActive) > 0).length,
        averageResponseTime: 1.2, // Mock data
        dailyStats
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateDailyStats = (logs: any[]) => {
    const stats = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayLogs = logs.filter(log => 
        log.createdAt && log.createdAt.startsWith(dateStr)
      )
      
      stats.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sent: dayLogs.length,
        success: dayLogs.filter(log => log.status === 'success').length,
        failed: dayLogs.filter(log => log.status === 'failed').length
      })
    }
    return stats
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Monitor your message automation performance and statistics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              All time total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.successRate}%</div>
            <Progress value={analytics.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeGroups}</div>
            <p className="text-xs text-muted-foreground">
              of {analytics.totalGroups} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageResponseTime}s</div>
            <p className="text-xs text-muted-foreground">
              Per message
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Success vs Failure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Message Status</CardTitle>
            <CardDescription>Breakdown of message delivery status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Successful</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold">{analytics.successfulMessages}</span>
                <Badge variant="default">{analytics.successRate}%</Badge>
              </div>
            </div>
            <Progress value={analytics.successRate} className="h-2" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">Failed</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold">{analytics.failedMessages}</span>
                <Badge variant="destructive">{100 - analytics.successRate}%</Badge>
              </div>
            </div>
            <Progress value={100 - analytics.successRate} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Delivery Rate</span>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-bold">{analytics.successRate}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Error Rate</span>
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-sm font-bold">{100 - analytics.successRate}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Group Utilization</span>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold">
                  {analytics.totalGroups > 0 ? Math.round((analytics.activeGroups / analytics.totalGroups) * 100) : 0}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Avg Response Time</span>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-bold">{analytics.averageResponseTime}s</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Daily Activity (Last 7 Days)</span>
          </CardTitle>
          <CardDescription>
            Message sending activity over the past week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.dailyStats.map((day, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{day.date}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-green-600">{day.success} success</span>
                    <span className="text-red-600">{day.failed} failed</span>
                    <span className="font-medium">{day.sent} total</span>
                  </div>
                </div>
                <div className="flex space-x-1 h-2">
                  <div 
                    className="bg-green-500 rounded-sm"
                    style={{ 
                      width: day.sent > 0 ? `${(day.success / day.sent) * 100}%` : '0%' 
                    }}
                  ></div>
                  <div 
                    className="bg-red-500 rounded-sm"
                    style={{ 
                      width: day.sent > 0 ? `${(day.failed / day.sent) * 100}%` : '0%' 
                    }}
                  ></div>
                  <div 
                    className="bg-gray-200 rounded-sm flex-1"
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Best Performing Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.dailyStats.reduce((best, day) => 
                day.success > best.success ? day : best, 
                analytics.dailyStats[0] || { date: 'N/A', success: 0 }
              ).date}
            </div>
            <p className="text-sm text-muted-foreground">
              {analytics.dailyStats.reduce((best, day) => 
                day.success > best.success ? day : best, 
                analytics.dailyStats[0] || { success: 0 }
              ).success} successful messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.dailyStats.reduce((sum, day) => sum + day.sent, 0)}
            </div>
            <p className="text-sm text-muted-foreground">
              Messages sent in the last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.dailyStats.reduce((sum, day) => sum + day.sent, 0) > 0 
                ? Math.round((analytics.dailyStats.reduce((sum, day) => sum + day.success, 0) / 
                   analytics.dailyStats.reduce((sum, day) => sum + day.sent, 0)) * 100)
                : 0}%
            </div>
            <p className="text-sm text-muted-foreground">
              Success rate for this week
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}