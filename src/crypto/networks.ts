// EVM Network configurations

export interface EvmNetwork {
  name: string;
  rpcUrl: string;
  nativeSymbol: string;
  chainId: number;
}

export const EVM_NETWORKS: Record<number, EvmNetwork> = {
  1: {
    name: "Ethereum",
    rpcUrl: "https://eth.llamarpc.com",
    nativeSymbol: "ETH",
    chainId: 1,
  },
  8453: {
    name: "Base",
    rpcUrl: "https://base.llamarpc.com",
    nativeSymbol: "ETH",
    chainId: 8453,
  },
  42161: {
    name: "Arbitrum",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    nativeSymbol: "ETH",
    chainId: 42161,
  },
  137: {
    name: "Polygon",
    rpcUrl: "https://polygon.llamarpc.com",
    nativeSymbol: "MATIC",
    chainId: 137,
  },
};

/**
 * Get network configuration by chain ID
 */
export function getNetwork(chainId: number): EvmNetwork | undefined {
  return EVM_NETWORKS[chainId];
}

/**
 * Get all available network chain IDs
 */
export function getAvailableChainIds(): number[] {
  return Object.keys(EVM_NETWORKS).map(Number);
}

/**
 * Get default chain ID (Ethereum mainnet)
 */
export function getDefaultChainId(): number {
  return 1;
}

