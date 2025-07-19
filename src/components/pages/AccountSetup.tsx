import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Separator } from '../ui/separator'
import { 
  Shield, 
  Key, 
  Phone, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  EyeOff,
  ExternalLink,
  HelpCircle,
  Loader2,
  Copy,
  Check
} from 'lucide-react'
import { blink } from '../../blink/client'
import toast from 'react-hot-toast'
import { TelegramAPI, type TelegramCredentials } from '../../lib/telegram'

interface TelegramAccount {
  apiId: string
  apiHash: string
  phoneNumber: string
  isConnected: boolean
  sessionString?: string
  user?: any
}

export function AccountSetup() {
  const [account, setAccount] = useState<TelegramAccount>({
    apiId: '',
    apiHash: '',
    phoneNumber: '',
    isConnected: false
  })
  const [loading, setLoading] = useState(false)
  const [showApiHash, setShowApiHash] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [showVerification, setShowVerification] = useState(false)
  const [twoFactorPassword, setTwoFactorPassword] = useState('')
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadAccountData()
  }, [])

  const loadAccountData = async () => {
    try {
      const user = await blink.auth.me()
      const accounts = await blink.db.telegramAccounts.list({
        where: { userId: user.id },
        limit: 1
      })

      if (accounts.length > 0) {
        const acc = accounts[0]
        setAccount({
          apiId: acc.apiId || '',
          apiHash: acc.apiHash || '',
          phoneNumber: acc.phoneNumber || '',
          isConnected: Number(acc.isConnected) > 0,
          sessionString: acc.sessionString || '',
          user: acc.userData ? JSON.parse(acc.userData) : null
        })
      }
    } catch (error) {
      console.error('Error loading account data:', error)
    }
  }

  const validateAndSaveAccount = async () => {
    const credentials: TelegramCredentials = {
      apiId: account.apiId.trim(),
      apiHash: account.apiHash.trim(),
      phoneNumber: TelegramAPI.formatPhoneNumber(account.phoneNumber)
    }

    // Validate credentials
    const validation = TelegramAPI.validateCredentials(credentials)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      toast.error('Please fix the validation errors')
      return
    }

    setValidationErrors([])
    setLoading(true)

    try {
      // Send verification code
      const result = await TelegramAPI.sendVerificationCode(credentials)
      
      if (result.success) {
        // Save credentials to database
        const user = await blink.auth.me()
        const accounts = await blink.db.telegramAccounts.list({
          where: { userId: user.id },
          limit: 1
        })

        const accountData = {
          userId: user.id,
          apiId: credentials.apiId,
          apiHash: credentials.apiHash,
          phoneNumber: credentials.phoneNumber,
          isConnected: "0",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        if (accounts.length > 0) {
          await blink.db.telegramAccounts.update(accounts[0].id, {
            ...accountData,
            createdAt: accounts[0].createdAt
          })
        } else {
          await blink.db.telegramAccounts.create(accountData)
        }

        // Update local state
        setAccount(prev => ({
          ...prev,
          apiId: credentials.apiId,
          apiHash: credentials.apiHash,
          phoneNumber: credentials.phoneNumber
        }))

        setShowVerification(true)
        toast.success(result.message)
      } else {
        toast.error(result.message)
        if (result.error === 'INVALID_CREDENTIALS') {
          setValidationErrors(['Invalid API credentials. Please check your API ID and Hash.'])
        }
      }
    } catch (error) {
      console.error('Error saving account:', error)
      toast.error('Failed to connect to Telegram. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const verifyTelegramCode = async () => {
    if (!verificationCode.trim()) {
      toast.error('Please enter the verification code')
      return
    }

    if (!/^\d{5}$/.test(verificationCode)) {
      toast.error('Verification code must be 5 digits')
      return
    }

    setLoading(true)
    try {
      const credentials: TelegramCredentials = {
        apiId: account.apiId,
        apiHash: account.apiHash,
        phoneNumber: account.phoneNumber
      }

      const result = await TelegramAPI.verifyCode(credentials, verificationCode)
      
      if (result.success) {
        // Update database with session
        const user = await blink.auth.me()
        const accounts = await blink.db.telegramAccounts.list({
          where: { userId: user.id },
          limit: 1
        })

        if (accounts.length > 0) {
          await blink.db.telegramAccounts.update(accounts[0].id, {
            isConnected: "1",
            sessionString: result.sessionString,
            userData: JSON.stringify(result.user),
            updatedAt: new Date().toISOString()
          })
        }

        setAccount(prev => ({ 
          ...prev, 
          isConnected: true, 
          sessionString: result.sessionString,
          user: result.user
        }))
        setShowVerification(false)
        setVerificationCode('')
        toast.success(result.message)
      } else if (result.requiresPassword) {
        setShowTwoFactor(true)
        toast.error(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error verifying code:', error)
      toast.error('Failed to verify code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const verifyTwoFactorPassword = async () => {
    if (!twoFactorPassword.trim()) {
      toast.error('Please enter your two-factor password')
      return
    }

    setLoading(true)
    try {
      const credentials: TelegramCredentials = {
        apiId: account.apiId,
        apiHash: account.apiHash,
        phoneNumber: account.phoneNumber
      }

      const result = await TelegramAPI.checkPassword(credentials, twoFactorPassword, account.sessionString)
      
      if (result.success) {
        // Update database with session
        const user = await blink.auth.me()
        const accounts = await blink.db.telegramAccounts.list({
          where: { userId: user.id },
          limit: 1
        })

        if (accounts.length > 0) {
          await blink.db.telegramAccounts.update(accounts[0].id, {
            isConnected: "1",
            sessionString: result.sessionString,
            userData: JSON.stringify(result.user),
            updatedAt: new Date().toISOString()
          })
        }

        setAccount(prev => ({ 
          ...prev, 
          isConnected: true, 
          sessionString: result.sessionString,
          user: result.user
        }))
        setShowVerification(false)
        setShowTwoFactor(false)
        setTwoFactorPassword('')
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error verifying password:', error)
      toast.error('Failed to verify password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const disconnectAccount = async () => {
    setLoading(true)
    try {
      const user = await blink.auth.me()
      const accounts = await blink.db.telegramAccounts.list({
        where: { userId: user.id },
        limit: 1
      })

      if (accounts.length > 0) {
        await blink.db.telegramAccounts.update(accounts[0].id, {
          isConnected: "0",
          sessionString: null,
          userData: null,
          updatedAt: new Date().toISOString()
        })
      }

      setAccount(prev => ({ 
        ...prev, 
        isConnected: false, 
        sessionString: undefined,
        user: undefined
      }))
      setShowVerification(false)
      setShowTwoFactor(false)
      setVerificationCode('')
      setTwoFactorPassword('')
      toast.success('Account disconnected successfully')
    } catch (error) {
      console.error('Error disconnecting account:', error)
      toast.error('Failed to disconnect account')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const instructions = TelegramAPI.getApiInstructions()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Setup</h1>
        <p className="text-muted-foreground">
          Configure your Telegram account for message automation
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Connection Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {account.isConnected ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p className="font-medium">
                  {account.isConnected ? 'Connected' : 'Not Connected'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {account.isConnected 
                    ? `Connected as ${account.user?.firstName || 'User'} (${account.phoneNumber})`
                    : 'Connect your Telegram account to start sending messages'
                  }
                </p>
              </div>
            </div>
            <Badge variant={account.isConnected ? "default" : "secondary"}>
              {account.isConnected ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* API Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5" />
              <span>API Setup Instructions</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              {showInstructions ? 'Hide' : 'Show'} Instructions
            </Button>
          </CardTitle>
          {showInstructions && (
            <CardContent className="pt-0">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{instructions.description}</p>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  {instructions.steps.map((step, index) => (
                    <li key={index} className={step.startsWith('  ') ? 'ml-4 list-none' : ''}>
                      {step.startsWith('  ') ? `• ${step.trim()}` : step}
                    </li>
                  ))}
                </ol>
                <div className="flex items-center space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://my.telegram.org/apps', '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Telegram Apps
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </CardHeader>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Please fix the following errors:</p>
              <ul className="list-disc list-inside text-sm">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>API Configuration</span>
          </CardTitle>
          <CardDescription>
            Enter your Telegram API credentials obtained from{' '}
            <a 
              href="https://my.telegram.org/apps" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              my.telegram.org/apps
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apiId">API ID</Label>
              <Input
                id="apiId"
                placeholder="1234567 (numeric)"
                value={account.apiId}
                onChange={(e) => setAccount(prev => ({ ...prev, apiId: e.target.value }))}
                disabled={account.isConnected}
              />
              <p className="text-xs text-muted-foreground">
                6-8 digit number from Telegram
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiHash">API Hash</Label>
              <div className="relative">
                <Input
                  id="apiHash"
                  type={showApiHash ? "text" : "password"}
                  placeholder="32-character hex string"
                  value={account.apiHash}
                  onChange={(e) => setAccount(prev => ({ ...prev, apiHash: e.target.value }))}
                  disabled={account.isConnected}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiHash(!showApiHash)}
                  disabled={account.isConnected}
                >
                  {showApiHash ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                32-character hexadecimal string (a-f, 0-9)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              placeholder="+1234567890 (with country code)"
              value={account.phoneNumber}
              onChange={(e) => setAccount(prev => ({ 
                ...prev, 
                phoneNumber: TelegramAPI.formatPhoneNumber(e.target.value)
              }))}
              disabled={account.isConnected}
            />
            <p className="text-xs text-muted-foreground">
              Include country code (e.g., +1 for US, +62 for Indonesia)
            </p>
          </div>

          {!account.isConnected && (
            <Button 
              onClick={validateAndSaveAccount} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect to Telegram'
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Verification */}
      {showVerification && !account.isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="w-5 h-5" />
              <span>Verification</span>
            </CardTitle>
            <CardDescription>
              Enter the 5-digit verification code sent to your Telegram app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verificationCode">Verification Code</Label>
              <Input
                id="verificationCode"
                placeholder="12345"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                maxLength={5}
              />
              <p className="text-xs text-muted-foreground">
                Check your Telegram app for the verification code
              </p>
            </div>

            {showTwoFactor && (
              <div className="space-y-2">
                <Label htmlFor="twoFactorPassword">Two-Factor Password</Label>
                <Input
                  id="twoFactorPassword"
                  type="password"
                  placeholder="Enter your 2FA password"
                  value={twoFactorPassword}
                  onChange={(e) => setTwoFactorPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your Telegram two-factor authentication password
                </p>
              </div>
            )}

            <div className="flex space-x-2">
              {showTwoFactor ? (
                <Button onClick={verifyTwoFactorPassword} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Password'
                  )}
                </Button>
              ) : (
                <Button onClick={verifyTelegramCode} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowVerification(false)
                  setShowTwoFactor(false)
                  setVerificationCode('')
                  setTwoFactorPassword('')
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Account Actions */}
      {account.isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Account Management</CardTitle>
            <CardDescription>
              Manage your connected Telegram account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {account.user && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Connected Account</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {account.user.firstName} {account.user.lastName}</p>
                  {account.user.username && (
                    <p><span className="font-medium">Username:</span> @{account.user.username}</p>
                  )}
                  <p><span className="font-medium">Phone:</span> {account.phoneNumber}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="font-medium">Session ID:</span>
                    <code className="text-xs bg-background px-2 py-1 rounded">
                      {account.sessionString?.slice(0, 20)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(account.sessionString || '')}
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Disconnecting will stop all automated message sending and require re-authentication.
              </AlertDescription>
            </Alert>
            
            <Button 
              variant="destructive" 
              onClick={disconnectAccount} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                'Disconnect Account'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Security & Privacy</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Encrypted Storage</p>
              <p className="text-sm text-muted-foreground">
                Your API credentials are encrypted and stored securely
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Session Management</p>
              <p className="text-sm text-muted-foreground">
                Sessions are managed securely with automatic refresh
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Rate Limiting</p>
              <p className="text-sm text-muted-foreground">
                Built-in rate limiting to comply with Telegram's policies
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}