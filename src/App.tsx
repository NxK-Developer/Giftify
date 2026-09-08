import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import LoadingScreen from '@/components/common/LoadingScreen'
import { RequireSession, RequireAdmin } from '@/components/common/Guards'

/* Eager: the landing page is the entry point and must paint fast. */
import LandingPage from '@/pages/LandingPage'

/* Lazy: everything else is code-split so the first load stays tiny and
   Firebase never ships to visitors who don't need it. */
const CreateStartPage = lazy(() => import('@/pages/CreateStartPage'))
const OccasionPage = lazy(() => import('@/pages/OccasionPage'))
const TemplatesPage = lazy(() => import('@/pages/TemplatesPage'))
const PersonalizePage = lazy(() => import('@/pages/PersonalizePage'))
const ThemePage = lazy(() => import('@/pages/ThemePage'))
const AnimationPage = lazy(() => import('@/pages/AnimationPage'))
const MusicPage = lazy(() => import('@/pages/MusicPage'))
const PreviewPage = lazy(() => import('@/pages/PreviewPage'))
const GeneratePage = lazy(() => import('@/pages/GeneratePage'))
const SharePage = lazy(() => import('@/pages/SharePage'))
const GreetingPage = lazy(() => import('@/pages/GreetingPage'))
const DemoPage = lazy(() => import('@/pages/DemoPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const SignupPage = lazy(() => import('@/pages/SignupPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const DashboardGreetingsPage = lazy(() => import('@/pages/dashboard/GreetingsPage'))
const DashboardSettingsPage = lazy(() => import('@/pages/dashboard/SettingsPage'))
const AdminOverviewPage = lazy(() => import('@/pages/admin/AdminOverviewPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminGreetingsPage = lazy(() => import('@/pages/admin/AdminGreetingsPage'))
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'))
const AdminTemplatesPage = lazy(() => import('@/pages/admin/AdminTemplatesPage'))
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'))
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

/** Reset scroll on navigation (recipient screens manage their own layout). */
function ScrollManager() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (pathname.startsWith('/g/') || pathname === '/demo') return
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Suspense fallback={<LoadingScreen label="Loading experience…" />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Creator flow */}
          <Route path="/create" element={<CreateStartPage />} />
          <Route path="/occasion" element={<OccasionPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/personalize" element={<PersonalizePage />} />
          <Route path="/theme" element={<ThemePage />} />
          <Route path="/animation" element={<AnimationPage />} />
          <Route path="/music" element={<MusicPage />} />
          <Route path="/preview" element={<PreviewPage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/share" element={<SharePage />} />

          {/* Recipient experience */}
          <Route path="/g/:greetingId" element={<GreetingPage />} />

          {/* Creator dashboard */}
          <Route
            path="/dashboard"
            element={
              <RequireSession>
                <DashboardPage />
              </RequireSession>
            }
          />
          <Route
            path="/dashboard/greetings"
            element={
              <RequireSession>
                <DashboardGreetingsPage />
              </RequireSession>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <RequireSession>
                <DashboardSettingsPage />
              </RequireSession>
            }
          />

          {/* Admin — frontend gate mirrors the real enforcement in firestore.rules */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminOverviewPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireAdmin>
                <AdminUsersPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/greetings"
            element={
              <RequireAdmin>
                <AdminGreetingsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <RequireAdmin>
                <AdminReportsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/templates"
            element={
              <RequireAdmin>
                <AdminTemplatesPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <RequireAdmin>
                <AdminAnalyticsPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RequireAdmin>
                <AdminSettingsPage />
              </RequireAdmin>
            }
          />

          {/* 404 */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  )
}
