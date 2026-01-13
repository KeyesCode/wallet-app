// SolanaAdapter implementing ChainAdapter

import { ChainAdapter } from "../adapter";
import {
  deriveSolanaKeypairFromMnemonic,
  getSolanaAddressFromMnemonic,
} from "./solana.derivation";
import {
  getSolBalance,
  sendSol,
  getSolanaTxHistory,
} from "./solana.rpc";
import { getSolanaNetwork } from "../../networks";

export class SolanaAdapter implements ChainAdapter {
  id = "solana";

  async getAddress(mnemonic: string, accountIndex: number): Promise<string> {
    return getSolanaAddressFromMnemonic(mnemonic, accountIndex);
  }

  async getNativeBalance(
    address: string,
    chainId?: number | string
  ): Promise<string> {
    // For Solana, chainId can be "mainnet" or "devnet", default to "mainnet"
    const networkName =
      typeof chainId === "string" ? chainId : chainId?.toString() || "mainnet";
    const network = getSolanaNetwork(networkName);
    if (!network) {
      throw new Error(`Solana network ${networkName} not configured`);
    }
    return getSolBalance(address, network.rpcUrl);
  }

  async sendNative(args: {
    mnemonic: string;
    to: string;
    amount: string;
    accountIndex: number;
    chainId?: number | string;
  }): Promise<string> {
    // For Solana, chainId can be "mainnet" or "devnet", default to "mainnet"
    const networkName =
      typeof args.chainId === "string"
        ? args.chainId
        : args.chainId?.toString() || "mainnet";
    const network = getSolanaNetwork(networkName);
    if (!network) {
      throw new Error(`Solana network ${networkName} not configured`);
    }

    const keypair = deriveSolanaKeypairFromMnemonic(
      args.mnemonic,
      args.accountIndex
    );

    return sendSol({
      keypair,
      to: args.to,
      amountSol: args.amount,
      rpcUrl: network.rpcUrl,
    });
  }

  async getTxHistory(
    address: string,
    cursor?: string,
    chainId?: number | string
  ): Promise<{ items: any[]; nextCursor?: string }> {
    // For Solana, chainId can be "mainnet" or "devnet", default to "mainnet"
    const networkName =
      typeof chainId === "string" ? chainId : chainId?.toString() || "mainnet";
    const network = getSolanaNetwork(networkName);
    if (!network) {
      throw new Error(`Solana network ${networkName} not configured`);
    }

    return getSolanaTxHistory(address, network.rpcUrl, 20, cursor);
  }
}

