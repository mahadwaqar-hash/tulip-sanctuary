/**
 * Cryptographic Engine - WebCrypto API (AES-256-GCM)
 * Handles client-side encryption/decryption before Supabase sync.
 */

// Generate a random initialization vector
export const generateIV = (): Uint8Array => crypto.getRandomValues(new Uint8Array(12));

// Derive a symmetric key from a user password/PIN (PBKDF2)
export const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Encrypt a string (e.g., text, JSON)
export const encryptText = async (text: string, key: CryptoKey): Promise<{ cipherText: ArrayBuffer; iv: Uint8Array }> => {
  const iv = generateIV();
  const enc = new TextEncoder();
  const encoded = enc.encode(text);
  
  const cipherText = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    encoded
  );
  
  return { cipherText, iv };
};

// Decrypt a string
export const decryptText = async (cipherText: ArrayBuffer, iv: Uint8Array, key: CryptoKey): Promise<string> => {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    cipherText
  );
  
  const dec = new TextDecoder();
  return dec.decode(decrypted);
};
