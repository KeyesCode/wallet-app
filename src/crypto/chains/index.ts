// Export chain adapters

export { ChainAdapter } from "./adapter";
export { EvmAdapter } from "./evm/evm.adapter";
export { SolanaAdapter } from "./solana/solana.adapter";
import { isEvmChain } from "../networks";

/**
 * Get the appropriate adapter for a chain
 */
export function getAdapterForChain(chainId: number | string): ChainAdapter {
  // If chainId is a string, it's likely a Solana network name
  if (typeof chainId === "string") {
    return new SolanaAdapter();
  }

  // For numeric chainIds, check if it's an EVM chain
  if (isEvmChain(chainId)) {
    return new EvmAdapter();
  }

  throw new Error(`No adapter found for chain: ${chainId}`);
}

