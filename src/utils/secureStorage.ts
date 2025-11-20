// Secure storage utilities (Web demo - NOT production hardened)

export interface EncryptedPayload {
  cipherBase64: string;
  ivBase64: string;
  saltBase64: string;
  version: 1 | 2;
}

interface EncryptedPayloadV2 extends EncryptedPayload {
  kdf: 'argon2id';
  integrity: string;
}

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

function toBase64(buf: ArrayBuffer | Uint8Array) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function fromBase64(b64: string) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Storage keys
const KEY_ENCRYPTED = 'wallet.encryptedMnemonic.v';

// ------------------------------------------------------------------
// PBKDF2 (Version 1) - Legacy
// ------------------------------------------------------------------
export async function deriveKey(password: string, salt: Uint8Array) {
  const passKey = await crypto.subtle.importKey(
    'raw',
    TEXT_ENCODER.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptMnemonic(plaintext: string, password: string): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
  const data = TEXT_ENCODER.encode(plaintext);
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return {
    cipherBase64: toBase64(cipher),
    ivBase64: toBase64(iv),
    saltBase64: toBase64(salt),
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

// ------------------------------------------------------------------
// Argon2id (Version 2) - Upgraded
// ------------------------------------------------------------------
export function isMigrationNeeded(payload: EncryptedPayload | null) {
  return !!payload && payload.version === 1;
}

async function sha256(data: Uint8Array) {
  const h = await crypto.subtle.digest('SHA-256', data);
  return toBase64(h);
}

export async function deriveKeyArgon2(password: string, salt: Uint8Array) {
  const { hash } = await import('argon2-browser');
  const passBuf = TEXT_ENCODER.encode(password);
  const argon = await hash({
    pass: passBuf,
    salt,
    time: 3,
    mem: 65536,
    hashLen: 32,
    parallelism: 2,
    type: 2, // Argon2id
  });
  return crypto.subtle.importKey('raw', argon.hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptMnemonicV2(plaintext: string, password: string): Promise<EncryptedPayloadV2> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKeyArgon2(password, salt);
  const data = TEXT_ENCODER.encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const integrity = await sha256(new Uint8Array([...data, ...salt]));
  return {
    cipherBase64: toBase64(cipherBuf),
    ivBase64: toBase64(iv),
    saltBase64: toBase64(salt),
    version: 2,
    kdf: 'argon2id',
    integrity,
  };
}

export async function decryptMnemonicAny(
  payload: EncryptedPayload | EncryptedPayloadV2,
  password: string
): Promise<string> {
  const iv = fromBase64(payload.ivBase64);
  const salt = fromBase64(payload.saltBase64);
  const cipher = fromBase64(payload.cipherBase64);
  let key: CryptoKey;
  if ((payload as any).kdf === 'argon2id') {
    key = await deriveKeyArgon2(password, salt);
  } else {
    key = await deriveKey(password, salt);
  }
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  const text = TEXT_DECODER.decode(plainBuf);
  if ((payload as any).kdf === 'argon2id') {
    const integrityCheck = await sha256(new Uint8Array([...TEXT_ENCODER.encode(text), ...salt]));
    if (integrityCheck !== (payload as any).integrity) throw new Error('Integrity failed');
  }
  return text;
}

// ------------------------------------------------------------------
// Storage helpers
// ------------------------------------------------------------------
export function storeEncryptedMnemonic(payload: EncryptedPayload | EncryptedPayloadV2) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEY_ENCRYPTED, JSON.stringify(payload));
  }
}

export function loadEncryptedMnemonic(): EncryptedPayload | EncryptedPayloadV2 | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(KEY_ENCRYPTED);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearEncryptedMnemonic() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(KEY_ENCRYPTED);
  }
}
