import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { Dashboard } from './components/pages/Dashboard'
import { GroupManagement } from './components/pages/GroupManagement'
import { MessageTemplates } from './components/pages/MessageTemplates'
import { Settings } from './components/pages/Settings'
import { Analytics } from './components/pages/Analytics'
import { Logs } from './components/pages/Logs'
import { AccountSetup } from './components/pages/AccountSetup'
import toast, { Toaster } from 'react-hot-toast'

export type Page = 'dashboard' | 'groups' | 'templates' | 'settings' | 'analytics' | 'logs' | 'account'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
          <p className="text-muted-foreground">You need to be authenticated to use this application.</p>
        </div>
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'groups':
        return <GroupManagement />
      case 'templates':
        return <MessageTemplates />
      case 'settings':
        return <Settings />
      case 'analytics':
        return <Analytics />
      case 'logs':
        return <Logs />
      case 'account':
        return <AccountSetup />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#1f2937',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <div className="flex min-h-screen">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="flex-1 flex flex-col min-w-0">
          <Header user={user} />
          <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App