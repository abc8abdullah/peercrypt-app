/**
 * Zero-Knowledge Cryptographic Utilities
 * Uses standard W3C Web Cryptography API (SubtleCrypto)
 * - AES-GCM 256-bit symmetric encryption
 * - PBKDF2 with SHA-256 (100,000 rounds) key derivation
 * - 12-byte cryptographically secure random Initialization Vectors (IV)
 * - Deterministic safety number / fingerprint derivation for MITM verification
 */

// Convert ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Generate random salt
export function generateSalt(length = 16): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(length));
}

// Generate random IV for AES-GCM (12 bytes is standard for GCM)
export function generateIV(length = 12): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Derives an AES-GCM 256-bit key from a room secret and salt using PBKDF2
 */
export async function deriveKeyFromSecret(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: (salt as unknown) as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plaintext string using AES-GCM
 */
export async function encryptData(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder();
  const iv = generateIV();
  const data = enc.encode(plaintext);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: (iv as unknown) as BufferSource,
    },
    key,
    data
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypt a ciphertext string using AES-GCM
 */
export async function decryptData(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<string> {
  const iv = base64ToBuffer(ivBase64);
  const ciphertext = base64ToBuffer(ciphertextBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: (iv as unknown) as BufferSource,
    },
    key,
    (ciphertext as unknown) as BufferSource
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}

/**
 * Generates human-verifiable Safety Numbers (Security Fingerprint)
 * similar to Signal / WhatsApp out-of-band verification.
 */
export async function generateSafetyFingerprint(
  roomId: string,
  roomSecret: string
): Promise<{
  safetyNumber: string;
  groups: string[];
  fullHash: string;
}> {
  const enc = new TextEncoder();
  const data = enc.encode(`PEERCRYPT_V1_VERIFY:${roomId}:${roomSecret}`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const fullHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Extract 6 groups of 5-digit numbers from the hash
  const groups: string[] = [];
  for (let i = 0; i < 6; i++) {
    const chunk = hashArray.slice(i * 4, i * 4 + 4);
    const num = ((chunk[0] << 24) | (chunk[1] << 16) | (chunk[2] << 8) | chunk[3]) >>> 0;
    const formatted = (num % 100000).toString().padStart(5, '0');
    groups.push(formatted);
  }

  return {
    safetyNumber: groups.join(' '),
    groups,
    fullHash,
  };
}
