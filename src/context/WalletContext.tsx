import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  loadWalletMetadata,
  initializeWalletMetadata,
  Account,
  WalletMetadata,
  loadActiveChainId,
  saveActiveChainId,
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
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<WalletMetadata | null>(null);
  const [activeChainId, setActiveChainIdState] = useState<number>(getDefaultChainId());
  const [isLoading, setIsLoading] = useState(true);

  // Load active chain ID on mount
  useEffect(() => {
    loadActiveChainId().then(setActiveChainIdState);
  }, []);

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
