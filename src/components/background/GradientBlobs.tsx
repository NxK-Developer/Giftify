import { cn } from '@/utils/cn'

export interface GradientBlobsProps {
  className?: string
  /** Reduce to a single soft blob for calmer pages */
  minimal?: boolean
}

/**
 * Soft animated gradient blobs — pure CSS depth layer behind glass content.
 * Combined with ParticleBackground this creates the cinematic dark-space
 * look without any images.
 */
export default function GradientBlobs({ className, minimal = false }: GradientBlobsProps) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div
        className="absolute -top-32 -left-24 size-[26rem] rounded-full bg-brand-deep/28 blur-[110px] animate-blob"
        style={{ animationDuration: '19s' }}
      />
      {!minimal && (
        <>
          <div
            className="absolute top-1/3 -right-28 size-[24rem] rounded-full bg-accent/18 blur-[120px] animate-blob"
            style={{ animationDuration: '23s', animationDelay: '-6s' }}
          />
          <div
            className="absolute -bottom-36 left-1/4 size-[22rem] rounded-full bg-neon/10 blur-[110px] animate-blob"
            style={{ animationDuration: '27s', animationDelay: '-12s' }}
          />
        </>
      )}
    </div>
  )
}
