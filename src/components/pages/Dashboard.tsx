import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { 
  Play, 
  Pause, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  Clock,
  Activity,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { blink } from '../../blink/client'

interface DashboardStats {
  totalGroups: number
  activeGroups: number
  totalMessages: number
  successRate: number
  isRunning: boolean
  lastRun: string
  nextRun: string
  blacklistedGroups: number
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalGroups: 0,
    activeGroups: 0,
    totalMessages: 0,
    successRate: 0,
    isRunning: false,
    lastRun: 'Never',
    nextRun: 'Not scheduled',
    blacklistedGroups: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load groups
      const groups = await blink.db.telegramGroups.list({
        where: { userId: (await blink.auth.me()).id }
      })

      // Load message logs
      const logs = await blink.db.messageLogs.list({
        where: { userId: (await blink.auth.me()).id },
        limit: 100
      })

      // Load blacklist
      const blacklist = await blink.db.blacklistedGroups.list({
        where: { userId: (await blink.auth.me()).id }
      })

      // Load settings
      const settings = await blink.db.userSettings.list({
        where: { userId: (await blink.auth.me()).id },
        limit: 1
      })

      const successfulLogs = logs.filter(log => log.status === 'success')
      const successRate = logs.length > 0 ? (successfulLogs.length / logs.length) * 100 : 0

      setStats({
        totalGroups: groups.length,
        activeGroups: groups.filter(g => Number(g.isActive) > 0).length,
        totalMessages: logs.length,
        successRate: Math.round(successRate),
        isRunning: settings[0] ? Number(settings[0].isRunning) > 0 : false,
        lastRun: logs[0]?.createdAt || 'Never',
        nextRun: 'Not scheduled',
        blacklistedGroups: blacklist.length
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSender = async () => {
    try {
      const user = await blink.auth.me()
      const settings = await blink.db.userSettings.list({
        where: { userId: user.id },
        limit: 1
      })

      if (settings.length > 0) {
        await blink.db.userSettings.update(settings[0].id, {
          isRunning: stats.isRunning ? "0" : "1",
          updatedAt: new Date().toISOString()
        })
      } else {
        await blink.db.userSettings.create({
          userId: user.id,
          isRunning: stats.isRunning ? "0" : "1",
          groupDelay: 7,
          cycleDelay: 75,
          maxRetries: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }

      setStats(prev => ({ ...prev, isRunning: !prev.isRunning }))
    } catch (error) {
      console.error('Error toggling sender:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your Telegram message automation
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={stats.isRunning ? "default" : "secondary"} className="px-3 py-1">
            {stats.isRunning ? (
              <>
                <Activity className="w-3 h-3 mr-1" />
                Running
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 mr-1" />
                Stopped
              </>
            )}
          </Badge>
          <Button onClick={toggleSender} className="min-w-[100px]">
            {stats.isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGroups}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeGroups} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
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
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <Progress value={stats.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blacklisted</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blacklistedGroups}</div>
            <p className="text-xs text-muted-foreground">
              Groups blocked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current automation status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Automation</span>
              <Badge variant={stats.isRunning ? "default" : "secondary"}>
                {stats.isRunning ? "Running" : "Stopped"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Run</span>
              <span className="text-sm text-muted-foreground">{stats.lastRun}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Next Run</span>
              <span className="text-sm text-muted-foreground">{stats.nextRun}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              Manage Groups
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MessageSquare className="w-4 h-4 mr-2" />
              Edit Templates
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Activity className="w-4 h-4 mr-2" />
              View Logs
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest message sending activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Message sent to Group {i + 1}</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}