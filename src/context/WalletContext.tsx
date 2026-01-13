import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  loadWalletMetadata,
  initializeWalletMetadata,
  Account,
  WalletMetadata,
  loadActiveChainId,
  saveActiveChainId,
  loadCustomRpcUrls,
  getCustomRpcUrl,
} from "../services/walletMetadata";
import { getNetwork, getDefaultChainId } from "../crypto/networks";

interface WalletContextType {
  mnemonic: string | null;
  setMnemonic: (mnemonic: string | null) => void;
  isUnlocked: boolean;
  activeAccountIndex: number;
  accounts: Account[];
  activeAccount: Account | null;
  setActiveAccountIndex: (index: number) => Promise<void>;
  addAccount: (accountName?: string) => Promise<Account>;
  refreshAccounts: () => Promise<void>;
  activeChainId: number;
  setActiveChainId: (chainId: number) => Promise<void>;
  activeNetwork: ReturnType<typeof getNetwork> | undefined;
  activeCustomRpcUrl: string | null;
  getCustomRpcUrl: (chainId: number) => Promise<string | null>;
  refreshCustomRpcUrl: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<WalletMetadata | null>(null);
  const [activeChainId, setActiveChainIdState] = useState<number>(getDefaultChainId());
  const [activeCustomRpcUrl, setActiveCustomRpcUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load active chain ID on mount
  useEffect(() => {
    loadActiveChainId().then(setActiveChainIdState);
  }, []);

  // Load custom RPC URL when chain ID changes
  useEffect(() => {
    if (activeChainId) {
      getCustomRpcUrl(activeChainId).then(setActiveCustomRpcUrl);
    }
  }, [activeChainId]);

  // Refresh custom RPC URL when app comes back to foreground
  // This ensures changes from Settings screen are reflected
  useEffect(() => {
    const refreshRpcUrl = () => {
      if (activeChainId) {
        getCustomRpcUrl(activeChainId).then(setActiveCustomRpcUrl);
      }
    };

    // Refresh on mount and when chain ID changes
    refreshRpcUrl();

    // Also refresh when app comes to foreground (if using AppState)
    // For now, we'll rely on navigation focus events
  }, [activeChainId]);

  // Load metadata when mnemonic is set
  useEffect(() => {
    if (mnemonic) {
      loadWalletMetadata().then((loaded) => {
        if (loaded) {
          setMetadata(loaded);
        } else {
          // Initialize metadata for new wallet
          initializeWalletMetadata(mnemonic).then(setMetadata);
        }
        setIsLoading(false);
      });
    } else {
      setMetadata(null);
      setIsLoading(false);
    }
  }, [mnemonic]);

  const setActiveAccountIndex = async (index: number) => {
    if (!metadata) return;
    const { setActiveAccountIndex: setActive } = await import(
      "../services/walletMetadata"
    );
    await setActive(index);
    const updated = await loadWalletMetadata();
    if (updated) {
      setMetadata(updated);
    }
  };

  const addAccount = async (accountName?: string): Promise<Account> => {
    if (!mnemonic) {
      throw new Error("Wallet not unlocked");
    }
    const { addAccount: add } = await import("../services/walletMetadata");
    const newAccount = await add(mnemonic, accountName);
    const updated = await loadWalletMetadata();
    if (updated) {
      setMetadata(updated);
    }
    return newAccount;
  };

  const refreshAccounts = async () => {
    if (!mnemonic) return;
    const loaded = await loadWalletMetadata();
    if (loaded) {
      setMetadata(loaded);
    }
  };

  const setActiveChainId = async (chainId: number) => {
    await saveActiveChainId(chainId);
    setActiveChainIdState(chainId);
  };

  const refreshCustomRpcUrl = async () => {
    if (activeChainId) {
      const url = await getCustomRpcUrl(activeChainId);
      setActiveCustomRpcUrl(url);
    }
  };

  const activeAccount =
    metadata && metadata.accounts.length > 0
      ? metadata.accounts.find(
          (a) => a.index === metadata.activeAccountIndex
        ) || metadata.accounts[0]
      : null;

  const activeNetwork = getNetwork(activeChainId);

  return (
    <WalletContext.Provider
      value={{
        mnemonic,
        setMnemonic,
        isUnlocked: mnemonic !== null,
        activeAccountIndex: metadata?.activeAccountIndex ?? 0,
        accounts: metadata?.accounts ?? [],
        activeAccount,
        setActiveAccountIndex,
        addAccount,
        refreshAccounts,
        activeChainId,
        setActiveChainId,
        activeNetwork,
        activeCustomRpcUrl,
        getCustomRpcUrl,
        refreshCustomRpcUrl,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
