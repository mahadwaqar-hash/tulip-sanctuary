// src/crypto.ts

/**
 * Derives an AES-GCM 256-bit key from a given passcode using PBKDF2.
 */
async function deriveKey(passcode: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passcode),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a string (e.g. JSON stringified message) using the given passcode.
 * Returns a base64 string containing salt:iv:ciphertext.
 */
export async function encryptMessage(text: string, passcode: string): Promise<string> {
  if (!text || !passcode) return text;
  
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const key = await deriveKey(passcode, salt);
    
    const enc = new TextEncoder();
    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      enc.encode(text)
    );

    const encryptedBytes = new Uint8Array(encryptedContent);
    
    // Combine salt + iv + ciphertext
    const combined = new Uint8Array(salt.length + iv.length + encryptedBytes.length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(encryptedBytes, salt.length + iv.length);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (e) {
    console.error("Encryption failed:", e);
    return text; // Fallback to plaintext if something breaks
  }
}

/**
 * Decrypts a base64 string (salt:iv:ciphertext) using the given passcode.
 */
export async function decryptMessage(encryptedBase64: string, passcode: string): Promise<string> {
  if (!encryptedBase64 || !passcode) return encryptedBase64;
  
  try {
    // If it's not base64 or doesn't have the expected format, it might be an old plaintext message
    if (!encryptedBase64.match(/^[A-Za-z0-9+/=]+$/)) {
      return encryptedBase64;
    }
    
    const combinedStr = atob(encryptedBase64);
    const combined = new Uint8Array(combinedStr.length);
    for (let i = 0; i < combinedStr.length; i++) {
      combined[i] = combinedStr.charCodeAt(i);
    }

    if (combined.length < 28) {
      // Too short to contain salt + iv
      return encryptedBase64;
    }

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    const key = await deriveKey(passcode, salt);

    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedContent);
  } catch (e) {
    // If decryption fails (wrong password, or it was actually plaintext), return original
    return encryptedBase64;
  }
}
