import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { 
  Search, 
  Download, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Calendar
} from 'lucide-react'
import { blink } from '../../blink/client'

interface LogEntry {
  id: string
  groupName: string
  groupId: string
  message: string
  status: 'success' | 'failed' | 'pending' | 'retry'
  errorMessage?: string
  timestamp: string
  responseTime?: number
}

export function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    try {
      const user = await blink.auth.me()
      const logsData = await blink.db.messageLogs.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 100
      })

      // Transform logs data
      const transformedLogs: LogEntry[] = logsData.map(log => ({
        id: log.id,
        groupName: log.groupName || 'Unknown Group',
        groupId: log.groupId || '',
        message: log.message || '',
        status: log.status as 'success' | 'failed' | 'pending' | 'retry',
        errorMessage: log.errorMessage || undefined,
        timestamp: log.createdAt || new Date().toISOString(),
        responseTime: log.responseTime || undefined
      }))

      setLogs(transformedLogs)
    } catch (error) {
      console.error('Error loading logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'retry':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default">Success</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'retry':
        return <Badge variant="outline">Retry</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const exportLogs = () => {
    const csvContent = [
      'Timestamp,Group,Status,Message,Error,Response Time',
      ...filteredLogs.map(log => 
        `"${log.timestamp}","${log.groupName}","${log.status}","${log.message.replace(/"/g, '""')}","${log.errorMessage || ''}","${log.responseTime || ''}"`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `telegram-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.errorMessage && log.errorMessage.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    all: logs.length,
    success: logs.filter(log => log.status === 'success').length,
    failed: logs.filter(log => log.status === 'failed').length,
    pending: logs.filter(log => log.status === 'pending').length,
    retry: logs.filter(log => log.status === 'retry').length
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse"></div>
        <div className="h-64 bg-muted rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground">
            Monitor message sending activity and troubleshoot issues
          </p>
        </div>
        <Button variant="outline" onClick={exportLogs}>
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold">{statusCounts.all}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-lg font-bold">{statusCounts.success}</p>
                <p className="text-xs text-muted-foreground">Success</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-lg font-bold">{statusCounts.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-lg font-bold">{statusCounts.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-lg font-bold">{statusCounts.retry}</p>
                <p className="text-xs text-muted-foreground">Retry</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
                <option value="retry">Retry</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs ({filteredLogs.length})</CardTitle>
          <CardDescription>
            Recent message sending activity and status updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(log.status)}
                      {getStatusBadge(log.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3" />
                      <span className="text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.groupName}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={log.message}>
                      {log.message || 'No message content'}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.responseTime ? `${log.responseTime}ms` : '-'}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {log.errorMessage ? (
                      <div className="truncate text-red-600 text-sm" title={log.errorMessage}>
                        {log.errorMessage}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No logs found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start sending messages to see activity logs here'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Errors */}
      {logs.filter(log => log.status === 'failed').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>Recent Errors</span>
            </CardTitle>
            <CardDescription>
              Latest error messages that need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs
                .filter(log => log.status === 'failed' && log.errorMessage)
                .slice(0, 5)
                .map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{log.groupName}</p>
                      <p className="text-sm text-red-600">{log.errorMessage}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}