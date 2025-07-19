import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Switch } from '../ui/switch'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Download, 
  Search,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { blink } from '../../blink/client'
import toast from 'react-hot-toast'

interface TelegramGroup {
  id: string
  name: string
  username: string
  chatId: string
  isActive: string
  lastMessageSent?: string
  status: 'active' | 'inactive' | 'error' | 'blacklisted'
  createdAt: string
}

export function GroupManagement() {
  const [groups, setGroups] = useState<TelegramGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingGroup, setEditingGroup] = useState<TelegramGroup | null>(null)
  const [newGroup, setNewGroup] = useState({
    name: '',
    username: '',
    chatId: ''
  })

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const user = await blink.auth.me()
      const groupsData = await blink.db.telegramGroups.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })

      setGroups(groupsData.map(group => ({
        ...group,
        status: Number(group.isActive) > 0 ? 'active' : 'inactive'
      })))
    } catch (error) {
      console.error('Error loading groups:', error)
      toast.error('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  const addGroup = async () => {
    if (!newGroup.name || !newGroup.username) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const user = await blink.auth.me()
      await blink.db.telegramGroups.create({
        userId: user.id,
        name: newGroup.name,
        username: newGroup.username,
        chatId: newGroup.chatId || `@${newGroup.username}`,
        isActive: "1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      setNewGroup({ name: '', username: '', chatId: '' })
      setShowAddDialog(false)
      loadGroups()
      toast.success('Group added successfully')
    } catch (error) {
      console.error('Error adding group:', error)
      toast.error('Failed to add group')
    }
  }

  const updateGroup = async () => {
    if (!editingGroup) return

    try {
      await blink.db.telegramGroups.update(editingGroup.id, {
        name: editingGroup.name,
        username: editingGroup.username,
        chatId: editingGroup.chatId,
        updatedAt: new Date().toISOString()
      })

      setEditingGroup(null)
      loadGroups()
      toast.success('Group updated successfully')
    } catch (error) {
      console.error('Error updating group:', error)
      toast.error('Failed to update group')
    }
  }

  const deleteGroup = async (groupId: string) => {
    try {
      await blink.db.telegramGroups.delete(groupId)
      loadGroups()
      toast.success('Group deleted successfully')
    } catch (error) {
      console.error('Error deleting group:', error)
      toast.error('Failed to delete group')
    }
  }

  const toggleGroupStatus = async (groupId: string, currentStatus: string) => {
    try {
      await blink.db.telegramGroups.update(groupId, {
        isActive: Number(currentStatus) > 0 ? "0" : "1",
        updatedAt: new Date().toISOString()
      })
      loadGroups()
    } catch (error) {
      console.error('Error toggling group status:', error)
      toast.error('Failed to update group status')
    }
  }

  const exportGroups = () => {
    const csvContent = [
      'Name,Username,Chat ID,Status',
      ...groups.map(group => 
        `"${group.name}","${group.username}","${group.chatId}","${group.status}"`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'telegram-groups.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'inactive':
        return <XCircle className="w-4 h-4 text-gray-500" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'blacklisted':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'blacklisted':
        return <Badge variant="destructive">Blacklisted</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Group Management</h1>
          <p className="text-muted-foreground">
            Manage your Telegram groups for message automation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={exportGroups}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Group</DialogTitle>
                <DialogDescription>
                  Add a new Telegram group to your automation list
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    placeholder="Enter group name"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groupUsername">Username</Label>
                  <Input
                    id="groupUsername"
                    placeholder="@groupusername"
                    value={newGroup.username}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chatId">Chat ID (Optional)</Label>
                  <Input
                    id="chatId"
                    placeholder="-1001234567890"
                    value={newGroup.chatId}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, chatId: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={addGroup}>Add Group</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{groups.length}</p>
                <p className="text-sm text-muted-foreground">Total Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {groups.filter(g => g.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">
                  {groups.filter(g => g.status === 'inactive').length}
                </p>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">
                  {groups.filter(g => g.status === 'error' || g.status === 'blacklisted').length}
                </p>
                <p className="text-sm text-muted-foreground">Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Groups Table */}
      <Card>
        <CardHeader>
          <CardTitle>Groups ({filteredGroups.length})</CardTitle>
          <CardDescription>
            Manage your Telegram groups and their settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Chat ID</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Last Message</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(group.status)}
                      {getStatusBadge(group.status)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    @{group.username}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {group.chatId}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={Number(group.isActive) > 0}
                      onCheckedChange={() => toggleGroupStatus(group.id, group.isActive)}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {group.lastMessageSent || 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingGroup(group)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteGroup(group.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update group information
            </DialogDescription>
          </DialogHeader>
          {editingGroup && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editGroupName">Group Name</Label>
                <Input
                  id="editGroupName"
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup(prev => 
                    prev ? { ...prev, name: e.target.value } : null
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editGroupUsername">Username</Label>
                <Input
                  id="editGroupUsername"
                  value={editingGroup.username}
                  onChange={(e) => setEditingGroup(prev => 
                    prev ? { ...prev, username: e.target.value } : null
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editChatId">Chat ID</Label>
                <Input
                  id="editChatId"
                  value={editingGroup.chatId}
                  onChange={(e) => setEditingGroup(prev => 
                    prev ? { ...prev, chatId: e.target.value } : null
                  )}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGroup(null)}>
              Cancel
            </Button>
            <Button onClick={updateGroup}>Update Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}