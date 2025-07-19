import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Slider } from '../ui/slider'
import { Separator } from '../ui/separator'
import { 
  Settings as SettingsIcon, 
  Clock, 
  Shield, 
  Bell,
  Save
} from 'lucide-react'
import { blink } from '../../blink/client'
import toast from 'react-hot-toast'

interface UserSettings {
  groupDelay: number
  cycleDelay: number
  maxRetries: number
  isRunning: string
  enableNotifications: string
  autoBlacklist: string
  rateLimitBuffer: number
}

export function Settings() {
  const [settings, setSettings] = useState<UserSettings>({
    groupDelay: 7,
    cycleDelay: 75,
    maxRetries: 3,
    isRunning: "0",
    enableNotifications: "1",
    autoBlacklist: "1",
    rateLimitBuffer: 10
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const user = await blink.auth.me()
      const userSettings = await blink.db.userSettings.list({
        where: { userId: user.id },
        limit: 1
      })

      if (userSettings.length > 0) {
        setSettings(userSettings[0])
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const user = await blink.auth.me()
      const userSettings = await blink.db.userSettings.list({
        where: { userId: user.id },
        limit: 1
      })

      const settingsData = {
        ...settings,
        userId: user.id,
        updatedAt: new Date().toISOString()
      }

      if (userSettings.length > 0) {
        await blink.db.userSettings.update(userSettings[0].id, settingsData)
      } else {
        await blink.db.userSettings.create({
          ...settingsData,
          createdAt: new Date().toISOString()
        })
      }

      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
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
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your automation preferences and limits
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Timing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Timing Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure delays and timing for message sending
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Group Delay: {settings.groupDelay} seconds</Label>
            <Slider
              value={[settings.groupDelay]}
              onValueChange={(value) => setSettings(prev => ({ ...prev, groupDelay: value[0] }))}
              max={30}
              min={5}
              step={1}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Delay between sending messages to different groups
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Cycle Delay: {settings.cycleDelay} minutes</Label>
            <Slider
              value={[settings.cycleDelay]}
              onValueChange={(value) => setSettings(prev => ({ ...prev, cycleDelay: value[0] }))}
              max={120}
              min={60}
              step={5}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Delay between complete message cycles (recommended: 66-78 minutes)
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Rate Limit Buffer: {settings.rateLimitBuffer}%</Label>
            <Slider
              value={[settings.rateLimitBuffer]}
              onValueChange={(value) => setSettings(prev => ({ ...prev, rateLimitBuffer: value[0] }))}
              max={50}
              min={0}
              step={5}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Additional buffer to stay well below Telegram's rate limits
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error Handling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Error Handling</span>
          </CardTitle>
          <CardDescription>
            Configure how errors and failures are handled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="maxRetries">Maximum Retries</Label>
            <Input
              id="maxRetries"
              type="number"
              min="1"
              max="10"
              value={settings.maxRetries}
              onChange={(e) => setSettings(prev => ({ ...prev, maxRetries: parseInt(e.target.value) || 3 }))}
            />
            <p className="text-sm text-muted-foreground">
              Number of retry attempts for failed messages
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Blacklist</Label>
              <p className="text-sm text-muted-foreground">
                Automatically blacklist groups after repeated failures
              </p>
            </div>
            <Switch
              checked={Number(settings.autoBlacklist) > 0}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBlacklist: checked ? "1" : "0" }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </CardTitle>
          <CardDescription>
            Configure notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications about automation status
              </p>
            </div>
            <Switch
              checked={Number(settings.enableNotifications) > 0}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableNotifications: checked ? "1" : "0" }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="w-5 h-5" />
            <span>System Status</span>
          </CardTitle>
          <CardDescription>
            Current system configuration and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Automation Status</p>
              <p className="text-sm text-muted-foreground">
                {Number(settings.isRunning) > 0 ? 'Running' : 'Stopped'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Current Cycle Time</p>
              <p className="text-sm text-muted-foreground">
                {settings.cycleDelay} minutes
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Group Delay</p>
              <p className="text-sm text-muted-foreground">
                {settings.groupDelay} seconds
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Max Retries</p>
              <p className="text-sm text-muted-foreground">
                {settings.maxRetries} attempts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}