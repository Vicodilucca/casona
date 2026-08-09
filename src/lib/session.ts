export const COOKIE_NAME = 'quinta_session';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días
const COOKIE_MAX_AGE_MS = COOKIE_MAX_AGE * 1000;

export interface SessionPayload {
  uid: number;
  issuedAt: number;
}

async function getKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuf(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Sesión = "<uid>|<issuedAt>.<firma HMAC>". El rol NUNCA viaja en el token:
// se resuelve siempre contra la base de datos en cada request para que
// desactivar/cambiar de rol a un usuario tenga efecto inmediato.
export async function signSession(uid: number, secret: string): Promise<string> {
  const payload = `${uid}|${Date.now()}`;
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${bufToBase64(sig)}`;
}

export async function verifySession(token: string, secret: string): Promise<SessionPayload | null> {
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return null;
  const payload = token.slice(0, dotIndex);
  const sigB64 = token.slice(dotIndex + 1);
  try {
    const key = await getKey(secret);
    const validSig = await crypto.subtle.verify(
      'HMAC',
      key,
      base64ToBuf(sigB64),
      new TextEncoder().encode(payload)
    );
    if (!validSig) return null;

    const [uidStr, issuedAtStr] = payload.split('|');
    const uid = Number(uidStr);
    const issuedAt = Number(issuedAtStr);
    if (!Number.isFinite(uid) || !Number.isFinite(issuedAt)) return null;
    if (Date.now() - issuedAt > COOKIE_MAX_AGE_MS) return null;

    return { uid, issuedAt };
  } catch {
    return null;
  }
}
