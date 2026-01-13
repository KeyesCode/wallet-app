import * as SecureStore from "expo-secure-store";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { randomBytes } from "ethers";

const MNEMONIC_KEY = "wallet.mnemonic.enc";
const DEVICE_SECRET_KEY = "wallet.device_secret";

/**
 * MVP approach:
 * - Generate a random device secret once
 * - Use it to XOR-encrypt the mnemonic bytes
 * Later: replace with proper AES-GCM + user passcode key derivation.
 */
async function getOrCreateDeviceSecret(): Promise<Uint8Array> {
  const existing = await SecureStore.getItemAsync(DEVICE_SECRET_KEY);
  if (existing) return hexToBytes(existing);

  const secret = randomBytes(32); // Uint8Array
  await SecureStore.setItemAsync(DEVICE_SECRET_KEY, bytesToHex(secret));
  return secret;
}

function xorBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i % b.length];
  return out;
}

export async function storeMnemonic(mnemonic: string): Promise<void> {
  const secret = await getOrCreateDeviceSecret();
  const key = sha256(secret); // 32 bytes
  const plain = new TextEncoder().encode(mnemonic);
  const enc = xorBytes(plain, key);
  await SecureStore.setItemAsync(MNEMONIC_KEY, bytesToHex(enc));
}

export async function loadMnemonic(): Promise<string | null> {
  const encHex = await SecureStore.getItemAsync(MNEMONIC_KEY);
  if (!encHex) return null;

  const secret = await getOrCreateDeviceSecret();
  const key = sha256(secret);
  const enc = hexToBytes(encHex);
  const dec = xorBytes(enc, key);
  return new TextDecoder().decode(dec);
}

export async function clearWallet(): Promise<void> {
  await SecureStore.deleteItemAsync(MNEMONIC_KEY);
  // Keep device secret; it's fine. If you want full wipe:
  // await SecureStore.deleteItemAsync(DEVICE_SECRET_KEY);
}

