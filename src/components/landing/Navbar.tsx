import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, Sparkles, LayoutDashboard, FlaskConical } from 'lucide-react'
import NxKMonogram from '@/components/common/NxKMonogram'
import Button from '@/components/common/Button'
import { BRAND } from '@/constants/brand'
import { useAuth } from '@/store/AuthContext'
import { cn } from '@/utils/cn'

const LINKS = [
  { to: '/create', label: 'Create' },
  { to: '/demo', label: 'Demo' },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { session, isDemoMode } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => setMenuOpen(false), 0)
    return () => window.clearTimeout(t)
  }, [location.pathname])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled || menuOpen ? 'glass-strong shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)]' : 'bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6" aria-label="Main">
        <Link to="/" className="flex items-center gap-2.5 press" aria-label={`${BRAND.app} — home`}>
          <NxKMonogram size="sm" />
          <span className="font-display text-[15px] font-bold tracking-tight text-ink">
            NxK <span className="text-gradient">Greetings</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition',
                  isActive ? 'bg-white/8 text-ink' : 'text-muted hover:bg-white/5 hover:text-ink',
                )
              }
            >
              {l.icon && <l.icon className="size-4" aria-hidden="true" />}
              {l.label}
            </NavLink>
          ))}
          {isDemoMode && (
            <span
              className="ml-1 flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-gold"
              title="Firebase is not configured — exploring with on-device demo data"
            >
              <FlaskConical className="size-3" aria-hidden="true" />
              DEMO MODE
            </span>
          )}
          {session ? (
            <Button to="/create" size="sm" icon={<Sparkles className="size-4" />}>
              New greeting
            </Button>
          ) : (
            <div className="ml-1 flex items-center gap-2">
              <Button to="/login" variant="ghost" size="sm">
                Log in
              </Button>
              <Button to="/create" size="sm" icon={<Sparkles className="size-4" />}>
                Create a Greeting
              </Button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="glass flex size-11 items-center justify-center rounded-2xl text-ink md:hidden press"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-line px-4 pb-5 pt-3 md:hidden animate-fade-up">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-12 items-center gap-2.5 rounded-2xl px-4 text-[15px] font-medium transition',
                    isActive ? 'bg-brand/15 text-ink' : 'text-ink-dim hover:bg-white/5',
                  )
                }
              >
                {l.icon && <l.icon className="size-4.5" aria-hidden="true" />}
                {l.label}
              </NavLink>
            ))}
          </div>
          {isDemoMode && (
            <p className="mt-3 rounded-xl border border-gold/25 bg-gold/8 px-3 py-2 text-[11px] leading-relaxed text-gold">
              Demo Mode — Firebase isn’t configured, so greetings are saved on this device only. Everything you
              see is real functionality, clearly labeled.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            {!session && (
              <Button to="/login" variant="secondary" size="md" fullWidth>
                Log in
              </Button>
            )}
            <Button to="/create" size="md" fullWidth icon={<Sparkles className="size-4" />}>
              Create a Greeting
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
