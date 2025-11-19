// Chiffrement AES-GCM avec clé dérivée PBKDF2 (Web Crypto)
// NOTE: Pour l’instant stockage dans localStorage. En production sur mobile -> SecureStore / Keychain.

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

// Paramètres PBKDF2
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = 'SHA-256';
const KEY_LENGTH_BITS = 256;

export interface EncryptedPayload {
  cipherBase64: string;
  ivBase64: string;
  saltBase64: string;
  version: number;
}

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const passBuf = TEXT_ENCODER.encode(password);
  const keyMaterial = await crypto.subtle.importKey('raw', passBuf, { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH_BITS },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMnemonic(plaintextMnemonic: string, password: string): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const data = TEXT_ENCODER.encode(plaintextMnemonic);

  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return {
    cipherBase64: toBase64(cipherBuf),
    ivBase64: toBase64(iv.buffer),
    saltBase64: toBase64(salt.buffer),
    version: 1,
  };
}

export async function decryptMnemonic(payload: EncryptedPayload, password: string): Promise<string> {
  const iv = fromBase64(payload.ivBase64);
  const salt = fromBase64(payload.saltBase64);
  const cipher = fromBase64(payload.cipherBase64);

  const key = await deriveKey(password, salt);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return TEXT_DECODER.decode(plainBuf);
}

// Stockage simple
const MNEMONIC_KEY = 'wallet.encryptedMnemonic';

export function storeEncryptedMnemonic(payload: EncryptedPayload) {
  localStorage.setItem(MNEMONIC_KEY, JSON.stringify(payload));
}

export function loadEncryptedMnemonic(): EncryptedPayload | null {
  const raw = localStorage.getItem(MNEMONIC_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearEncryptedMnemonic() {
  localStorage.removeItem(MNEMONIC_KEY);
}
