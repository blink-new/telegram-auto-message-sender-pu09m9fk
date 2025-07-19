import { useState } from 'react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet'
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Settings, 
  BarChart3, 
  FileText,
  User,
  Menu,
  X
} from 'lucide-react'
import type { Page } from '../../App'

interface SidebarProps {
  currentPage: Page
  onPageChange: (page: Page) => void
}

const navigation = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'account' as Page, label: 'Account Setup', icon: User },
  { id: 'groups' as Page, label: 'Group Management', icon: Users },
  { id: 'templates' as Page, label: 'Message Templates', icon: MessageSquare },
  { id: 'analytics' as Page, label: 'Analytics', icon: BarChart3 },
  { id: 'logs' as Page, label: 'Activity Logs', icon: FileText },
  { id: 'settings' as Page, label: 'Settings', icon: Settings },
]

function SidebarContent({ currentPage, onPageChange, onClose }: SidebarProps & { onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 text-sm sm:text-base">Telegram</h1>
              <p className="text-xs text-gray-500">Auto Sender</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="sm:hidden">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 sm:p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-10 sm:h-11 px-3 text-sm",
                isActive 
                  ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700" 
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
              onClick={() => {
                onPageChange(item.id)
                onClose?.()
              }}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
              <span className="truncate text-xs sm:text-sm">{item.label}</span>
            </Button>
          )
        })}
      </nav>

      <div className="p-3 sm:p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>Telegram Auto Sender</p>
          <p>v1.0.0</p>
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="fixed top-3 left-3 z-50 lg:hidden bg-white/90 backdrop-blur-sm border shadow-sm"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 sm:w-80">
          <SidebarContent 
            currentPage={currentPage} 
            onPageChange={onPageChange} 
            onClose={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-72 flex-shrink-0">
        <SidebarContent currentPage={currentPage} onPageChange={onPageChange} />
      </div>
    </>
  )
}