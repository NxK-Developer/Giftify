import QRCode from 'qrcode'

/**
 * qrService — QR codes generated 100% locally in the browser.
 * No paid QR APIs, no third-party services, no network calls.
 * Rendered with premium brand colors and exportable as PNG.
 */

const QR_COLORS = {
  dark: '#171026',
  light: '#ffffff',
}

export async function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  widthPx = 512,
): Promise<void> {
  await QRCode.toCanvas(canvas, text, {
    width: widthPx,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: QR_COLORS.dark, light: QR_COLORS.light },
  })
}

export async function qrDataUrl(text: string, widthPx = 1024): Promise<string> {
  return QRCode.toDataURL(text, {
    width: widthPx,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: QR_COLORS.dark, light: QR_COLORS.light },
  })
}

/** Download the QR as a PNG file (uses the local data URL — no services). */
export async function downloadQrPng(text: string, filename: string): Promise<void> {
  const dataUrl = await qrDataUrl(text, 1024)
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
