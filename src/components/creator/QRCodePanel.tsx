import { useEffect, useRef, useState } from 'react'
import { Download, QrCode, RotateCw } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard'
import Button from '@/components/common/Button'
import ErrorState from '@/components/common/ErrorState'
import { renderQrToCanvas, downloadQrPng } from '@/services/qrService'

export interface QRCodePanelProps {
  url: string
  filename?: string
}

/** QR generated 100% locally (qrcode lib, canvas) — no external QR services. */
export default function QRCodePanel({ url, filename = 'nxxk-greeting-qr' }: QRCodePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let alive = true
    setStatus('loading')
    renderQrToCanvas(canvas, url, 512)
      .then(() => alive && setStatus('ready'))
      .catch(() => alive && setStatus('error'))
    return () => {
      alive = false
    }
  }, [url, attempt])

  const handleDownload = async () => {
    try {
      await downloadQrPng(url, filename)
    } catch {
      setStatus('error')
    }
  }

  return (
    <GlassCard className="p-5 text-center">
      <h3 className="flex items-center justify-center gap-2 font-display text-sm font-bold text-ink">
        <QrCode className="size-4 text-neon" aria-hidden="true" />
        QR Code
      </h3>
      <p className="mt-1 text-[11px] text-muted">Generated locally in your browser · scans to your greeting</p>

      <div className="relative mx-auto mt-4 flex size-44 items-center justify-center rounded-2xl bg-white p-2.5 shadow-[0_0_34px_-8px_rgba(34,211,238,0.4)]">
        <canvas
          ref={canvasRef}
          className={status === 'ready' ? 'size-full' : 'size-full opacity-0'}
          aria-label={`QR code linking to ${url}`}
          role="img"
        />
        {status === 'loading' && (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-surface">
            Generating…
          </span>
        )}
      </div>

      {status === 'error' ? (
        <ErrorState
          compact
          className="mt-4"
          title="QR generation failed"
          message="That’s unusual — it happens entirely on your device. Give it another shot."
          onRetry={() => setAttempt((a) => a + 1)}
          retryLabel="Regenerate"
        />
      ) : (
        <Button
          variant="secondary"
          size="sm"
          className="mt-4 w-full"
          icon={<Download className="size-4" />}
          onClick={handleDownload}
          disabled={status !== 'ready'}
        >
          Download PNG
        </Button>
      )}
      {status === 'ready' && (
        <button
          type="button"
          onClick={() => setAttempt((a) => a + 1)}
          className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted transition hover:text-ink"
        >
          <RotateCw className="size-3" aria-hidden="true" />
          Regenerate
        </button>
      )}
    </GlassCard>
  )
}
