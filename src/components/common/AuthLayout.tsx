import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FlaskConical } from 'lucide-react'
import NxKMonogram from '@/components/common/NxKMonogram'
import ParticleBackground from '@/components/background/ParticleBackground'
import GradientBlobs from '@/components/background/GradientBlobs'
import { THEME_MAP } from '@/constants/themes'
import { BRAND } from '@/constants/brand'
import { useAuth } from '@/store/AuthContext'

export interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

/** Shared shell for /login and /signup — cinematic but focused. */
export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const { isDemoMode } = useAuth()
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <GradientBlobs minimal />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <ParticleBackground theme={THEME_MAP.galaxy} baseCount={80} intensity={0.6} />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <Link to="/" className="mb-8 inline-flex items-center gap-1.5 self-start text-xs font-semibold text-muted transition hover:text-ink">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back home
        </Link>

        <div className="glass-card rounded-[2rem] p-7 animate-scale-in sm:p-8">
          <div className="flex flex-col items-center text-center">
            <NxKMonogram size="lg" />
            <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{subtitle}</p>
          </div>

          {isDemoMode && (
            <p className="mt-5 flex items-start gap-2 rounded-2xl border border-gold/25 bg-gold/8 px-3.5 py-3 text-[12px] leading-relaxed text-gold/90">
              <FlaskConical className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                <strong className="font-bold">Demo Mode:</strong> Firebase isn’t configured, so real accounts
                are unavailable — we won’t pretend otherwise. You can still explore everything with an
                on-device demo identity.
              </span>
            </p>
          )}

          <div className="mt-6">{children}</div>
        </div>

        <div className="mt-6 text-center text-[13px] text-muted">{footer}</div>

        <p className="mt-8 text-center text-[10.5px] leading-relaxed text-muted/70">
          {BRAND.name} · Founder: {BRAND.founder} · Co-Founder: {BRAND.coFounder}
        </p>
      </div>
    </div>
  )
}
