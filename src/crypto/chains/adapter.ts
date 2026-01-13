// ChainAdapter interface for multi-chain support

export interface ChainAdapter {
  id: string;
  getAddress(mnemonic: string, accountIndex: number): Promise<string>;
  getNativeBalance(address: string, chainId?: number | string): Promise<string>;
  sendNative(args: {
    mnemonic: string;
    to: string;
    amount: string;
    accountIndex: number;
    chainId?: number | string;
  }): Promise<string>;
  getTxHistory(
    address: string,
    cursor?: string,
    chainId?: number | string
  ): Promise<{ items: any[]; nextCursor?: string }>;
}

