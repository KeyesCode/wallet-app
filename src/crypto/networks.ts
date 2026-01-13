// Network configurations for EVM and Solana

export interface EvmNetwork {
  name: string;
  rpcUrl: string;
  nativeSymbol: string;
  chainId: number;
  type: "evm";
}

export interface SolanaNetwork {
  name: string;
  rpcUrl: string;
  nativeSymbol: string;
  type: "solana";
}

export type Network = EvmNetwork | SolanaNetwork;

export const EVM_NETWORKS: Record<number, EvmNetwork> = {
  1: {
    name: "Ethereum",
    rpcUrl: "https://eth.llamarpc.com",
    nativeSymbol: "ETH",
    chainId: 1,
    type: "evm",
  },
  8453: {
    name: "Base",
    rpcUrl: "https://base.llamarpc.com",
    nativeSymbol: "ETH",
    chainId: 8453,
    type: "evm",
  },
  42161: {
    name: "Arbitrum",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    nativeSymbol: "ETH",
    chainId: 42161,
    type: "evm",
  },
  137: {
    name: "Polygon",
    rpcUrl: "https://polygon.llamarpc.com",
    nativeSymbol: "MATIC",
    chainId: 137,
    type: "evm",
  },
  11155111: {
    name: "Sepolia",
    rpcUrl: "https://0xrpc.io/sep",
    nativeSymbol: "ETH",
    chainId: 11155111,
    type: "evm",
  },
};

export const SOLANA_NETWORKS: Record<string, SolanaNetwork> = {
  mainnet: {
    name: "Solana",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    nativeSymbol: "SOL",
    type: "solana",
  },
  devnet: {
    name: "Solana Devnet",
    rpcUrl: "https://api.devnet.solana.com",
    nativeSymbol: "SOL",
    type: "solana",
  },
};

/**
 * Get EVM network configuration by chain ID
 */
export function getNetwork(chainId: number): EvmNetwork | undefined {
  return EVM_NETWORKS[chainId];
}

/**
 * Get Solana network configuration by network name
 */
export function getSolanaNetwork(
  networkName: string
): SolanaNetwork | undefined {
  return SOLANA_NETWORKS[networkName];
}

/**
 * Get all available EVM network chain IDs
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

/**
 * Check if a chain ID is an EVM chain
 */
export function isEvmChain(chainId: number): boolean {
  return chainId in EVM_NETWORKS;
}
