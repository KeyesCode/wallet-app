import * as SecureStore from "expo-secure-store";
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import * as nacl from "tweetnacl";
import * as naclUtil from "tweetnacl-util";
import { randomBytes } from "ethers";

const MNEMONIC_KEY = "wallet.mnemonic.enc";
const PIN_SET_KEY = "wallet.pin.set"; // Flag to check if PIN is configured

// PBKDF2 parameters
const KDF_ITERATIONS = 200_000;
const KEY_LENGTH = 32; // 32 bytes for secretbox key
const NONCE_LENGTH = 24; // 24 bytes for secretbox nonce
const SALT_LENGTH = 16; // 16 bytes salt

interface EncryptedMnemonic {
  salt: string; // hex
  nonce: string; // hex
  ciphertext: string; // base64 (from secretbox)
  kdfIterations: number;
}

/**
 * Derive encryption key from PIN using PBKDF2-HMAC-SHA256
 */
function deriveKeyFromPin(pin: string, salt: Uint8Array): Uint8Array {
  const pinBytes = new TextEncoder().encode(pin);
  return pbkdf2(sha256, pinBytes, salt, {
    c: KDF_ITERATIONS,
    dkLen: KEY_LENGTH,
  });
}

/**
 * Check if a PIN has been set (encrypted mnemonic exists)
 */
export async function hasEncryptedMnemonic(): Promise<boolean> {
  const encrypted = await SecureStore.getItemAsync(MNEMONIC_KEY);
  return encrypted !== null;
}

/**
 * Store mnemonic encrypted with PIN-derived key using NaCl secretbox
 */
export async function storeMnemonicWithPin(
  mnemonic: string,
  pin: string
): Promise<void> {
  // Generate random salt and nonce
  const salt = randomBytes(SALT_LENGTH);
  const nonce = randomBytes(NONCE_LENGTH);

  // Derive key from PIN
  const key = deriveKeyFromPin(pin, salt);

  // Encrypt mnemonic with secretbox
  const plaintext = new TextEncoder().encode(mnemonic);
  const ciphertext = nacl.secretbox(plaintext, nonce, key);

  if (!ciphertext) {
    throw new Error("Encryption failed");
  }

  // Store encrypted data
  const encrypted: EncryptedMnemonic = {
    salt: bytesToHex(salt),
    nonce: bytesToHex(nonce),
    ciphertext: naclUtil.encodeBase64(ciphertext),
    kdfIterations: KDF_ITERATIONS,
  };

  await SecureStore.setItemAsync(MNEMONIC_KEY, JSON.stringify(encrypted));
  await SecureStore.setItemAsync(PIN_SET_KEY, "true");
}

/**
 * Decrypt and load mnemonic using PIN
 */
export async function loadMnemonicWithPin(pin: string): Promise<string | null> {
  const encryptedJson = await SecureStore.getItemAsync(MNEMONIC_KEY);
  if (!encryptedJson) return null;

  try {
    const encrypted: EncryptedMnemonic = JSON.parse(encryptedJson);
    const salt = hexToBytes(encrypted.salt);
    const nonce = hexToBytes(encrypted.nonce);
    const ciphertext = naclUtil.decodeBase64(encrypted.ciphertext);

    // Derive key from PIN
    const key = deriveKeyFromPin(pin, salt);

    // Decrypt
    const plaintext = nacl.secretbox.open(ciphertext, nonce, key);
    if (!plaintext) {
      // Wrong PIN or corrupted data
      return null;
    }

    return new TextDecoder().decode(plaintext);
  } catch (e) {
    console.error("Decryption error:", e);
    return null;
  }
}

/**
 * Re-encrypt mnemonic with a new PIN (for PIN change)
 * Requires the old PIN to decrypt first
 */
export async function changePin(
  oldPin: string,
  newPin: string
): Promise<boolean> {
  const mnemonic = await loadMnemonicWithPin(oldPin);
  if (!mnemonic) {
    return false; // Old PIN incorrect
  }

  // Re-encrypt with new PIN
  await storeMnemonicWithPin(mnemonic, newPin);
  return true;
}

/**
 * Clear all wallet data (including encrypted mnemonic and PIN flag)
 */
export async function clearWallet(): Promise<void> {
  await SecureStore.deleteItemAsync(MNEMONIC_KEY);
  await SecureStore.deleteItemAsync(PIN_SET_KEY);
}

// Legacy functions for backward compatibility during migration
// These can be removed after migration is complete
export async function storeMnemonic(mnemonic: string): Promise<void> {
  // This should not be called directly anymore - use storeMnemonicWithPin
  throw new Error(
    "storeMnemonic is deprecated. Use storeMnemonicWithPin(mnemonic, pin) instead."
  );
}

export async function loadMnemonic(): Promise<string | null> {
  // This should not be called directly anymore - use loadMnemonicWithPin
  throw new Error(
    "loadMnemonic is deprecated. Use loadMnemonicWithPin(pin) instead."
  );
}
