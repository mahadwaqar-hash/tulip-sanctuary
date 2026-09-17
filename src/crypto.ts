// src/crypto.ts

/**
 * Simple, fast, reliable message obfuscation.
 * 
 * The old AES-GCM + PBKDF2 approach used window.crypto.subtle which:
 * - Requires HTTPS (breaks on localhost/HTTP)
 * - Has 100,000 PBKDF2 iterations (slow on some PCs)
 * - Used spread operator in btoa() which crashes on large payloads
 * 
 * This approach uses a simple XOR + Base64 encoding. It's not
 * military-grade encryption, but this is a private 2-person app 
 * behind a password gate — the data is already protected by 
 * Firestore security rules. This just ensures messages aren't 
 * stored as readable plaintext in the database.
 */

function xorWithKey(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/**
 * Encrypts (obfuscates) a message string.
 * Returns a base64 string prefixed with "xor:" to identify the format.
 */
export async function encryptMessage(text: string, passcode: string): Promise<string> {
  if (!text || !passcode) return text;
  
  try {
    const xored = xorWithKey(text, passcode);
    const encoded = encodeURIComponent(xored);
    return 'xor:' + btoa(encoded);
  } catch (e) {
    console.error("Encryption failed:", e);
    return text;
  }
}

/**
 * Decrypts a message. Handles both new "xor:" format and old AES-GCM format.
 */
export async function decryptMessage(encryptedText: string, passcode: string): Promise<string> {
  if (!encryptedText || !passcode) return encryptedText;
  
  try {
    // New XOR format
    if (encryptedText.startsWith('xor:')) {
      const b64 = encryptedText.slice(4);
      const decoded = decodeURIComponent(atob(b64));
      return xorWithKey(decoded, passcode);
    }
    
    // Legacy AES-GCM format — try to decrypt with crypto.subtle
    if (encryptedText.match(/^[A-Za-z0-9+/=]+$/) && encryptedText.length > 40) {
      if (window.crypto?.subtle) {
        return await decryptLegacyAES(encryptedText, passcode);
      }
    }
    
    // Not encrypted or unknown format
    return encryptedText;
  } catch (e) {
    return encryptedText;
  }
}

/**
 * Legacy AES-GCM decryption for old messages.
 * Only used for reading messages that were encrypted with the old system.
 */
async function decryptLegacyAES(encryptedBase64: string, passcode: string): Promise<string> {
  try {
    const combinedStr = atob(encryptedBase64);
    const combined = new Uint8Array(combinedStr.length);
    for (let i = 0; i < combinedStr.length; i++) {
      combined[i] = combinedStr.charCodeAt(i);
    }

    if (combined.length < 28) return encryptedBase64;

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw', enc.encode(passcode), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']
    );
    const key = await window.crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, key, ciphertext
    );

    return new TextDecoder().decode(decryptedContent);
  } catch (e) {
    return encryptedBase64;
  }
}
