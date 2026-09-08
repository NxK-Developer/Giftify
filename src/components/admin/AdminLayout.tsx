import { useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  Activity,
  Users,
  Gift,
  Flag,
  LayoutTemplate,
  BarChart3,
  Settings,
  Menu,
  X,
  ArrowLeft,
} from 'lucide-react'
import NxKMonogram from '@/components/common/NxKMonogram'
import Badge from '@/components/common/Badge'
import { useAuth } from '@/store/AuthContext'
import { cn } from '@/utils/cn'

const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', icon: Activity, end: true },
  { to: '/admin/users', label: 'Users', icon: Users, end: false },
  { to: '/admin/greetings', label: 'Greetings', icon: Gift, end: false },
  { to: '/admin/reports', label: 'Reports', icon: Flag, end: false },
  { to: '/admin/templates', label: 'Templates', icon: LayoutTemplate, end: false },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, end: false },
  { to: '/admin/settings', label: 'Settings', icon: Settings, end: false },
]

export default function AdminLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { profile } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = ADMIN_NAV.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      onClick={() => setMenuOpen(false)}
      className={({ isActive }) =>
        cn(
          'flex min-h-11 items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold transition',
          isActive ? 'bg-brand/15 text-ink shadow-[inset_0_0_0_1px_rgba(167,139,250,0.25)]' : 'text-muted hover:bg-white/5 hover:text-ink',
        )
      }
    >
      <item.icon className="size-4.5" aria-hidden="true" />
      {item.label}
    </NavLink>
  ))

  return (
    <div className="relative min-h-dvh">
      <div className="grid-overlay pointer-events-none fixed inset-0 opacity-40" aria-hidden="true" />

      <header className="sticky top-0 z-40 border-b border-line bg-base-2/88 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
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
            <NxKMonogram size="sm" />
            <span className="font-display text-[15px] font-bold text-ink">Admin</span>
            <Badge tone="violet">role: {profile?.role ?? 'admin'}</Badge>
          </div>
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted transition hover:bg-white/5 hover:text-ink"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Creator dashboard</span>
          </Link>
        </div>
        {menuOpen && (
          <nav className="border-t border-line px-4 pb-4 pt-3 lg:hidden animate-fade-up" aria-label="Admin">
            <div className="flex flex-col gap-1">{navItems}</div>
          </nav>
        )}
      </header>

      <div className="relative z-10 mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-24 flex flex-col gap-1" aria-label="Admin">
            {navItems}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
