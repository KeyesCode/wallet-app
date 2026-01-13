// Solana key derivation using ed25519 (SLIP-0010)

import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";

/**
 * Derive Solana keypair from mnemonic using ed25519 derivation
 * Path: m/44'/501'/{accountIndex}'/0'
 */
export function deriveSolanaKeypairFromMnemonic(
  mnemonic: string,
  accountIndex = 0
): Keypair {
  // Validate mnemonic
  if (!bip39.validateMnemonic(mnemonic.trim(), wordlist)) {
    throw new Error("Invalid mnemonic");
  }

  // Convert mnemonic to seed
  const seed = bip39.mnemonicToSeedSync(mnemonic.trim(), "");

  // Derive path: m/44'/501'/{accountIndex}'/0'
  const path = `m/44'/501'/${accountIndex}'/0'`;
  const derived = derivePath(path, seed.toString("hex"));

  // Create keypair from derived seed
  // ed25519-hd-key returns a 64-byte key (32 bytes private + 32 bytes chain code)
  // We only need the first 32 bytes for the seed
  const seedBytes = derived.key.slice(0, 32);
  // Ensure it's a Uint8Array for Keypair.fromSeed
  const seedArray = seedBytes instanceof Uint8Array 
    ? seedBytes 
    : new Uint8Array(seedBytes);
  return Keypair.fromSeed(seedArray);
}

/**
 * Get Solana address (public key) from mnemonic
 */
export function getSolanaAddressFromMnemonic(
  mnemonic: string,
  accountIndex = 0
): string {
  const keypair = deriveSolanaKeypairFromMnemonic(mnemonic, accountIndex);
  return keypair.publicKey.toBase58();
}

