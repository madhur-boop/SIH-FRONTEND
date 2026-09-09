import { useState, useEffect } from 'react'
import type { PageType, BackendDocument, BackendUser } from './types'
import LoginPage from './pages/LoginPage'
import Layout, { ProfilePage, SettingsPage } from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import DocumentsPage, { DocumentFilterState } from './pages/DocumentsPage'
import DocumentReviewPage from './pages/DocumentReviewPage'
import VerificationHistoryPage from './pages/VerificationHistoryPage'
import { getProfile } from './services/authApi'
import { getToken, removeToken } from './services/apiClient'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<BackendUser | null>(null)
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard')
  const [navSelection, setNavSelection] = useState('dashboard')
  const [reviewDoc, setReviewDoc] = useState<BackendDocument | null>(null)
  const [docFilter, setDocFilter] = useState<DocumentFilterState | undefined>(undefined)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      if (getToken()) {
        try {
          const res = await getProfile()
          if (res.success && res.user) {
            setCurrentUser(res.user)
            setIsLoggedIn(true)
          } else {
            throw new Error('Profile fetch failed')
          }
        } catch (e) {
          removeToken()
          setIsLoggedIn(false)
        }
      }
      setIsAuthLoading(false)
    }

    const handleUnauthorized = () => {
      setIsLoggedIn(false)
      setCurrentUser(null)
    }

    initAuth()
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  if (isAuthLoading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={(user) => { setCurrentUser(user); setIsLoggedIn(true) }} />
  }

  const handleNavigate = (page: PageType, nav: string = page, filterState?: DocumentFilterState) => {
    if (filterState) {
      setDocFilter(filterState)
    } else if (page === 'documents') {
      setDocFilter(undefined)
    } else if (page === 'verification') {
      setDocFilter({ statusFilter: 'PENDING', sourceMetric: 'Review Queue' })
    }
    setCurrentPage(page)
    setNavSelection(nav)
  }

  const handleReview = (doc: any) => {
    setReviewDoc(doc)
    setCurrentPage('review')
    setNavSelection('review')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />
      case 'users':
        return <UsersPage onReview={handleReview} />
      case 'documents':
        return (
          <DocumentsPage
            key={docFilter ? JSON.stringify(docFilter) : 'all-documents'}
            onReview={handleReview}
            mode="all"
            initialFilter={docFilter}
            onClearFilter={() => setDocFilter(undefined)}
          />
        )
      case 'verification':
        return (
          <DocumentsPage
            key="verification-queue"
            onReview={handleReview}
            mode="queue"
            initialFilter={docFilter || { statusFilter: 'PENDING', sourceMetric: 'Review Queue' }}
            onClearFilter={() => setDocFilter(undefined)}
          />
        )
      case 'review':
        return reviewDoc
          ? <DocumentReviewPage doc={reviewDoc} onBack={() => handleNavigate(navSelection === 'verification' ? 'verification' : 'documents', navSelection === 'verification' ? 'verification' : 'documents')} />
          : <DocumentsPage onReview={handleReview} mode="all" />
      case 'history':
        return <VerificationHistoryPage />
      case 'profile':
        return <ProfilePage currentUser={currentUser} />
      case 'settings':
        return <SettingsPage />
      case 'notifications':
        return (
          <div style={{ padding:32, color:'#5a6a40', fontSize:13 }}>
            Open the notifications bell in the header to view alerts.
          </div>
        )
      default:
        return (
          <div style={{ padding:40, textAlign:'center' }}>
            <div style={{ fontSize:13, color:'#5a6a40', marginBottom:12 }}>Coming soon.</div>
            <button className="btn-ghost" onClick={() => handleNavigate('dashboard','dashboard')} style={{ padding:'8px 20px', borderRadius:6, fontSize:13, cursor:'pointer' }}>
              Return to Dashboard
            </button>
          </div>
        )
    }
  }

  return (
    <Layout
      currentPage={currentPage}
      navSelection={navSelection}
      onNavigate={handleNavigate}
      isSidebarOpen={isSidebarOpen}
      onToggleSidebar={() => setIsSidebarOpen(s => !s)}
      onLogout={() => { removeToken(); setIsLoggedIn(false); setCurrentUser(null); }}
      currentUser={currentUser}
    >
      {renderPage()}
    </Layout>
  )
}
