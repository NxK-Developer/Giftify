import { useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Gift,
  Settings,
  ShieldCheck,
  LogOut,
  Sparkles,
  Menu,
  X,
  FlaskConical,
} from 'lucide-react'
import NxKMonogram from '@/components/common/NxKMonogram'
import Button from '@/components/common/Button'
import { useAuth } from '@/store/AuthContext'
import { useToast } from '@/store/ToastContext'
import { cn } from '@/utils/cn'

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/greetings', label: 'My Greetings', icon: Gift, end: false },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings, end: false },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { session, isAdmin, isDemoMode, signOut } = useAuth()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      pushToast('info', 'Signed out', 'Your drafts stay saved on this device.')
      navigate('/')
    } catch {
      pushToast('error', 'Sign-out failed', 'Please try again.')
    }
  }

  const navItems = (
    <>
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex min-h-11 items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold transition',
              isActive
                ? 'bg-brand/15 text-ink shadow-[inset_0_0_0_1px_rgba(167,139,250,0.25)]'
                : 'text-muted hover:bg-white/5 hover:text-ink',
            )
          }
        >
          <item.icon className="size-4.5" aria-hidden="true" />
          {item.label}
        </NavLink>
      ))}
      {isAdmin && (
        <NavLink
          to="/admin"
          onClick={() => setMenuOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex min-h-11 items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold transition',
              isActive ? 'bg-brand/15 text-ink' : 'text-muted hover:bg-white/5 hover:text-ink',
            )
          }
        >
          <ShieldCheck className="size-4.5" aria-hidden="true" />
          Admin Panel
        </NavLink>
      )}
    </>
  )

  return (
    <div className="relative min-h-dvh">
      <div className="grid-overlay pointer-events-none fixed inset-0 opacity-50" aria-hidden="true" />

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-line bg-base-2/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="glass flex size-10 items-center justify-center rounded-xl lg:hidden press"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            </button>
            <Link to="/" className="flex items-center gap-2.5 press" aria-label="NxK Greetings home">
              <NxKMonogram size="sm" />
              <span className="hidden font-display text-[15px] font-bold text-ink sm:block">
                NxK <span className="text-gradient">Greetings</span>
              </span>
            </Link>
            {isDemoMode && (
              <span className="flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-gold">
                <FlaskConical className="size-3" aria-hidden="true" />
                DEMO MODE
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <Button to="/create" size="sm" icon={<Sparkles className="size-4" />} className="hidden sm:inline-flex">
              New greeting
            </Button>
            <div className="hidden items-center gap-2.5 rounded-2xl border border-line bg-white/3 px-3 py-1.5 md:flex">
              <span className="flex size-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#ec4899)] text-[11px] font-bold text-white" aria-hidden="true">
                {(session?.displayName ?? session?.email ?? (isDemoMode ? 'D' : 'G')).charAt(0).toUpperCase()}
              </span>
              <span className="max-w-36 truncate text-xs font-semibold text-ink-dim">
                {session?.displayName ?? session?.email ?? (isDemoMode ? 'Demo Creator' : 'Guest')}
                {session?.isAnonymous && !isDemoMode && <span className="ml-1.5 text-[10px] text-muted">· guest</span>}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden size-10 items-center justify-center rounded-xl border border-line bg-white/3 text-muted transition hover:text-danger md:flex"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-line px-4 pb-4 pt-3 lg:hidden animate-fade-up">
            <nav className="flex flex-col gap-1" aria-label="Dashboard">
              {navItems}
            </nav>
            <div className="mt-3 flex gap-2">
              <Button to="/create" size="md" fullWidth icon={<Sparkles className="size-4" />}>
                New greeting
              </Button>
              <Button variant="secondary" size="md" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          </div>
        )}
      </header>

      <div className="relative z-10 mx-auto flex max-w-6xl gap-8 px-4 py-8 sm:px-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 flex flex-col gap-1" aria-label="Dashboard">
            {navItems}
            <div className="mt-6 rounded-2xl border border-line bg-white/3 p-4">
              <p className="text-[11px] leading-relaxed text-muted">
                Signed in as{' '}
                <strong className="text-ink-dim">
                  {session?.displayName ?? session?.email ?? (isDemoMode ? 'Demo Creator' : 'Guest')}
                </strong>
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-2 text-[11px] font-semibold text-muted transition hover:text-danger"
              >
                Sign out →
              </button>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
