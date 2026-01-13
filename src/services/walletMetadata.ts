import AsyncStorage from "@react-native-async-storage/async-storage";
import { deriveEvmWalletFromMnemonic } from "../crypto/evm";
import { getDefaultChainId } from "../crypto/networks";

const WALLET_METADATA_KEY = "wallet.metadata";
const ACTIVE_CHAIN_ID_KEY = "wallet.activeChainId";

export interface Account {
  index: number;
  name: string;
  evmAddress: string;
}

export interface WalletMetadata {
  activeAccountIndex: number;
  accounts: Account[];
}

/**
 * Load wallet metadata from AsyncStorage
 */
export async function loadWalletMetadata(): Promise<WalletMetadata | null> {
  try {
    const data = await AsyncStorage.getItem(WALLET_METADATA_KEY);
    if (!data) return null;
    return JSON.parse(data) as WalletMetadata;
  } catch (e) {
    console.error("Error loading wallet metadata:", e);
    return null;
  }
}

/**
 * Save wallet metadata to AsyncStorage
 */
export async function saveWalletMetadata(
  metadata: WalletMetadata
): Promise<void> {
  try {
    await AsyncStorage.setItem(WALLET_METADATA_KEY, JSON.stringify(metadata));
  } catch (e) {
    console.error("Error saving wallet metadata:", e);
    throw e;
  }
}

/**
 * Initialize wallet metadata with the first account (index 0)
 */
export async function initializeWalletMetadata(
  mnemonic: string
): Promise<WalletMetadata> {
  const wallet = deriveEvmWalletFromMnemonic(mnemonic, 0);
  const address = await wallet.getAddress();

  const metadata: WalletMetadata = {
    activeAccountIndex: 0,
    accounts: [
      {
        index: 0,
        name: "Account 1",
        evmAddress: address,
      },
    ],
  };

  await saveWalletMetadata(metadata);
  return metadata;
}

/**
 * Add a new account to the wallet metadata
 */
export async function addAccount(
  mnemonic: string,
  accountName?: string
): Promise<Account> {
  const metadata = await loadWalletMetadata();
  if (!metadata) {
    throw new Error("Wallet metadata not found. Please initialize wallet first.");
  }

  // Find the maximum index
  const maxIndex = Math.max(...metadata.accounts.map((a) => a.index), -1);
  const newIndex = maxIndex + 1;

  // Derive the new address
  const wallet = deriveEvmWalletFromMnemonic(mnemonic, newIndex);
  const address = await wallet.getAddress();

  const newAccount: Account = {
    index: newIndex,
    name: accountName || `Account ${newIndex + 1}`,
    evmAddress: address,
  };

  metadata.accounts.push(newAccount);
  await saveWalletMetadata(metadata);

  return newAccount;
}

/**
 * Set the active account index
 */
export async function setActiveAccountIndex(index: number): Promise<void> {
  const metadata = await loadWalletMetadata();
  if (!metadata) {
    throw new Error("Wallet metadata not found");
  }

  if (!metadata.accounts.find((a) => a.index === index)) {
    throw new Error(`Account with index ${index} not found`);
  }

  metadata.activeAccountIndex = index;
  await saveWalletMetadata(metadata);
}

/**
 * Clear wallet metadata (used when resetting wallet)
 */
export async function clearWalletMetadata(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WALLET_METADATA_KEY);
    await AsyncStorage.removeItem(ACTIVE_CHAIN_ID_KEY);
  } catch (e) {
    console.error("Error clearing wallet metadata:", e);
  }
}

/**
 * Load active chain ID from AsyncStorage
 */
export async function loadActiveChainId(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(ACTIVE_CHAIN_ID_KEY);
    if (!data) return getDefaultChainId();
    const chainId = Number(data);
    return isNaN(chainId) ? getDefaultChainId() : chainId;
  } catch (e) {
    console.error("Error loading active chain ID:", e);
    return getDefaultChainId();
  }
}

/**
 * Save active chain ID to AsyncStorage
 */
export async function saveActiveChainId(chainId: number): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVE_CHAIN_ID_KEY, chainId.toString());
  } catch (e) {
    console.error("Error saving active chain ID:", e);
    throw e;
  }
}

