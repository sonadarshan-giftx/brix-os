/**
 * e2e.ts — End-to-end encryption using browser WebCrypto API
 * ECDH P-256 key exchange + AES-GCM 256-bit symmetric encryption
 * Keys are generated per workspace and persisted in localStorage
 * Public keys are shared via the workspace API for key discovery
 */

export interface E2EKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

/** Generate a new ECDH P-256 key pair */
export async function generateKeyPair(): Promise<E2EKeyPair> {
  const kp = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey'],
  ) as CryptoKeyPair;
  return { publicKey: kp.publicKey, privateKey: kp.privateKey };
}

/** Export a CryptoKey to JWK format for storage / transmission */
export async function exportKey(key: CryptoKey): Promise<JsonWebKey> {
  return window.crypto.subtle.exportKey('jwk', key);
}

/** Import a JWK public key for use in ECDH */
export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    'jwk', jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false, [],
  );
}

/** Import a JWK private key for use in ECDH */
export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    'jwk', jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false, ['deriveKey'],
  );
}

/** Derive a shared AES-GCM key from ECDH private + peer public */
async function deriveSharedKey(privateKey: CryptoKey, peerPublicKey: CryptoKey): Promise<CryptoKey> {
  return window.crypto.subtle.deriveKey(
    { name: 'ECDH', public: peerPublicKey },
    privateKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypt plaintext for a recipient.
 * Returns a base64 string: 12-byte IV || ciphertext
 */
export async function encryptMessage(
  plaintext: string,
  senderPrivateKey: CryptoKey,
  recipientPublicKey: CryptoKey,
): Promise<string> {
  const sharedKey = await deriveSharedKey(senderPrivateKey, recipientPublicKey);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, sharedKey, encoded);
  const combined = new Uint8Array(12 + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), 12);
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a base64-encoded ciphertext.
 * Returns plaintext string or throws on failure.
 */
export async function decryptMessage(
  encryptedB64: string,
  recipientPrivateKey: CryptoKey,
  senderPublicKey: CryptoKey,
): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const sharedKey = await deriveSharedKey(recipientPrivateKey, senderPublicKey);
  const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, sharedKey, ciphertext);
  return new TextDecoder().decode(decrypted);
}

const KEY_PREFIX = 'brixstac_e2e_';

/** Load or generate a persistent key pair for this workspace (stored in localStorage) */
export async function getOrCreateKeyPair(workspaceId: string): Promise<E2EKeyPair> {
  const stored = localStorage.getItem(`${KEY_PREFIX}${workspaceId}`);
  if (stored) {
    try {
      const { privateKeyJwk, publicKeyJwk } = JSON.parse(stored);
      const [privateKey, publicKey] = await Promise.all([
        importPrivateKey(privateKeyJwk),
        window.crypto.subtle.importKey('jwk', publicKeyJwk, { name: 'ECDH', namedCurve: 'P-256' }, true, []),
      ]);
      return { privateKey, publicKey };
    } catch {
      // corrupted — regenerate
    }
  }
  const kp = await generateKeyPair();
  const [privateKeyJwk, publicKeyJwk] = await Promise.all([exportKey(kp.privateKey), exportKey(kp.publicKey)]);
  localStorage.setItem(`${KEY_PREFIX}${workspaceId}`, JSON.stringify({ privateKeyJwk, publicKeyJwk }));
  return kp;
}

/** Check if WebCrypto is available in this browser */
export function isE2ESupported(): boolean {
  return typeof window !== 'undefined' && 'crypto' in window && 'subtle' in window.crypto;
}
