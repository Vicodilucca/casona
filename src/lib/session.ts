export const COOKIE_NAME = 'quinta_session';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

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

export async function signSession(secret: string): Promise<string> {
  const payload = String(Date.now());
  const key = await getKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${bufToBase64(sig)}`;
}

export async function verifySession(token: string, secret: string): Promise<boolean> {
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return false;
  const payload = token.slice(0, dotIndex);
  const sigB64 = token.slice(dotIndex + 1);
  try {
    const key = await getKey(secret);
    return await crypto.subtle.verify(
      'HMAC',
      key,
      base64ToBuf(sigB64),
      new TextEncoder().encode(payload)
    );
  } catch {
    return false;
  }
}