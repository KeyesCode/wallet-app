// Token model and static token lists per chain

export interface Token {
  symbol: string;
  name: string;
  address: string; // For native token, use special address "native" or empty string
  decimals: number;
  logoURI?: string;
  isNative?: boolean; // true for native token (ETH, etc.)
}

// Chain IDs
export const CHAIN_IDS = {
  ETHEREUM: 1,
  BASE: 8453,
  ARBITRUM: 42161,
  POLYGON: 137,
  SEPOLIA: 11155111, // Testnet
} as const;

// Native token definitions
export const NATIVE_TOKENS: Record<number, Token> = {
  [CHAIN_IDS.ETHEREUM]: {
    symbol: "ETH",
    name: "Ethereum",
    address: "native",
    decimals: 18,
    isNative: true,
  },
  [CHAIN_IDS.BASE]: {
    symbol: "ETH",
    name: "Ethereum",
    address: "native",
    decimals: 18,
    isNative: true,
  },
  [CHAIN_IDS.ARBITRUM]: {
    symbol: "ETH",
    name: "Ethereum",
    address: "native",
    decimals: 18,
    isNative: true,
  },
  [CHAIN_IDS.POLYGON]: {
    symbol: "MATIC",
    name: "Polygon",
    address: "native",
    decimals: 18,
    isNative: true,
  },
  [CHAIN_IDS.SEPOLIA]: {
    symbol: "ETH",
    name: "Ethereum",
    address: "native",
    decimals: 18,
    isNative: true,
  },
};

// Token addresses (mainnet)
const TOKEN_ADDRESSES = {
  // Ethereum Mainnet
  ETHEREUM: {
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  },
  // Base
  BASE: {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    WETH: "0x4200000000000000000000000000000000000006",
  },
  // Arbitrum
  ARBITRUM: {
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  },
  // Polygon
  POLYGON: {
    USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
  },
} as const;

// Static token lists per chain
export const TOKEN_LISTS: Record<number, Token[]> = {
  [CHAIN_IDS.ETHEREUM]: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: TOKEN_ADDRESSES.ETHEREUM.USDC,
      decimals: 6,
    },
    {
      symbol: "USDT",
      name: "Tether USD",
      address: TOKEN_ADDRESSES.ETHEREUM.USDT,
      decimals: 6,
    },
    {
      symbol: "DAI",
      name: "Dai Stablecoin",
      address: TOKEN_ADDRESSES.ETHEREUM.DAI,
      decimals: 18,
    },
    {
      symbol: "WETH",
      name: "Wrapped Ether",
      address: TOKEN_ADDRESSES.ETHEREUM.WETH,
      decimals: 18,
    },
  ],
  [CHAIN_IDS.BASE]: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: TOKEN_ADDRESSES.BASE.USDC,
      decimals: 6,
    },
    {
      symbol: "WETH",
      name: "Wrapped Ether",
      address: TOKEN_ADDRESSES.BASE.WETH,
      decimals: 18,
    },
  ],
  [CHAIN_IDS.ARBITRUM]: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: TOKEN_ADDRESSES.ARBITRUM.USDC,
      decimals: 6,
    },
    {
      symbol: "WETH",
      name: "Wrapped Ether",
      address: TOKEN_ADDRESSES.ARBITRUM.WETH,
      decimals: 18,
    },
  ],
  [CHAIN_IDS.POLYGON]: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: TOKEN_ADDRESSES.POLYGON.USDC,
      decimals: 6,
    },
    {
      symbol: "WETH",
      name: "Wrapped Ether",
      address: TOKEN_ADDRESSES.POLYGON.WETH,
      decimals: 18,
    },
  ],
  // Sepolia testnet - empty list for now, can add test tokens if needed
  [CHAIN_IDS.SEPOLIA]: [],
};

/**
 * Get token list for a given chain ID
 */
export function getTokenList(chainId: number): Token[] {
  return TOKEN_LISTS[chainId] ?? [];
}

/**
 * Get native token for a given chain ID
 */
export function getNativeToken(chainId: number): Token | undefined {
  return NATIVE_TOKENS[chainId];
}

/**
 * Get all tokens (native + ERC20) for a given chain ID
 */
export function getAllTokens(chainId: number): Token[] {
  const native = getNativeToken(chainId);
  const tokens = getTokenList(chainId);
  return native ? [native, ...tokens] : tokens;
}

