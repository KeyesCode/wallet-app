import React, { createContext, useContext, useState, ReactNode } from "react";

interface WalletContextType {
  mnemonic: string | null;
  setMnemonic: (mnemonic: string | null) => void;
  isUnlocked: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [mnemonic, setMnemonic] = useState<string | null>(null);

  return (
    <WalletContext.Provider
      value={{
        mnemonic,
        setMnemonic,
        isUnlocked: mnemonic !== null,
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
