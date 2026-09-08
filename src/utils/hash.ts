/**
 * Password hashing with the Web Crypto API — plaintext passwords are NEVER
 * stored, in Firestore or anywhere else.
 *
 * Approach (₹0 constraint: no Cloud Functions available on the free plan):
 * PBKDF2-SHA256 with a per-greeting random salt and a high iteration count,
 * computed in the browser. Documented limitation: because verification
 * happens client-side, the hash could be attacked offline by a determined
 * adversary — strong passwords and the iteration count mitigate this.
 * When a backend becomes available later, swap verifyPassword() for a
 * server-side check without changing any stored data format.
 */

const PBKDF2_ITERATIONS = 150_000

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function randomSaltHex(bytes = 16): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return toHex(arr.buffer)
}

async function deriveKey(password: string, saltHex: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16))).buffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomSaltHex()
  const bits = await deriveKey(password, salt)
  return { hash: toHex(bits), salt }
}

/** Constant-time-ish comparison (length check + char loop without early exit). */
export async function verifyPassword(
  password: string,
  expectedHash: string,
  salt: string,
): Promise<boolean> {
  try {
    const bits = await deriveKey(password, salt)
    const actual = toHex(bits)
    if (actual.length !== expectedHash.length) return false
    let diff = 0
    for (let i = 0; i < actual.length; i++) {
      diff |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}
