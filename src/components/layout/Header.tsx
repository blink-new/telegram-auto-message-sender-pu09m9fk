import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Bell, 
  Settings, 
  User,
  LogOut,
  Smartphone,
  Wifi,
  WifiOff
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { blink } from '../../blink/client'
import { useState, useEffect } from 'react'

interface HeaderProps {
  user: any
}

export function Header({ user }: HeaderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [notifications, setNotifications] = useState(3)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleLogout = () => {
    blink.auth.logout()
  }

  return (
    <header className="h-14 sm:h-16 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 sticky top-0 z-40">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Left side - Status indicators */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Mobile spacing for hamburger menu */}
          <div className="w-10 lg:hidden"></div>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <Badge 
              variant={isOnline ? "default" : "destructive"} 
              className="hidden sm:inline-flex text-xs"
            >
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>

          {/* Mobile indicator */}
          <div className="sm:hidden">
            <Smartphone className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative p-2">
            <Bell className="w-4 h-4" />
            {notifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {notifications > 9 ? '9+' : notifications}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2 p-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <span className="hidden sm:inline-block text-sm font-medium truncate max-w-24 lg:max-w-32">
                  {user?.email?.split('@')[0] || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.displayName || user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs leading-none text-gray-500">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}