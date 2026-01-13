// EvmAdapter implementing ChainAdapter

import { ChainAdapter } from "../adapter";
import { deriveEvmWalletFromMnemonic, sendEth } from "../../evm";
import { getNetwork } from "../../networks";
import { getTransactionHistory } from "../../../services/api";

export class EvmAdapter implements ChainAdapter {
  id = "evm";

  async getAddress(mnemonic: string, accountIndex: number): Promise<string> {
    const wallet = deriveEvmWalletFromMnemonic(mnemonic, accountIndex);
    return wallet.getAddress();
  }

  async getNativeBalance(
    address: string,
    chainId?: number | string
  ): Promise<string> {
    if (chainId === undefined || typeof chainId !== "number") {
      throw new Error("getNativeBalance requires chainId for EVM chains");
    }

    const network = getNetwork(chainId);
    if (!network) {
      throw new Error(`Network with chainId ${chainId} not found`);
    }

    const { getNativeBalanceWei } = await import("../../evm");
    const { formatEther } = await import("ethers");
    const balance = await getNativeBalanceWei(address, network.rpcUrl);
    return formatEther(balance);
  }

  async sendNative(args: {
    mnemonic: string;
    to: string;
    amount: string;
    accountIndex: number;
    chainId?: number | string;
  }): Promise<string> {
    if (args.chainId === undefined || typeof args.chainId !== "number") {
      throw new Error("sendNative requires chainId for EVM chains");
    }

    const network = getNetwork(args.chainId);
    if (!network) {
      throw new Error(`Network with chainId ${args.chainId} not found`);
    }

    return sendEth({
      mnemonic: args.mnemonic,
      to: args.to,
      amountEth: args.amount,
      chainId: args.chainId,
      rpcUrl: network.rpcUrl,
      accountIndex: args.accountIndex,
    });
  }

  async getTxHistory(
    address: string,
    cursor?: string,
    chainId?: number | string
  ): Promise<{ items: any[]; nextCursor?: string }> {
    if (chainId === undefined || typeof chainId !== "number") {
      throw new Error("getTxHistory requires chainId for EVM chains");
    }

    const response = await getTransactionHistory(chainId, address, {
      pageKey: cursor,
      pageSize: 20,
    });
    return {
      items: response.items,
      nextCursor: response.nextPageKey,
    };
  }
}

