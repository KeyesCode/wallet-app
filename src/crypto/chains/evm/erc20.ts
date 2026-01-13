// ERC20 ABI and balance fetching functions

import { Contract, formatUnits, JsonRpcProvider } from "ethers";
import { rpcCall } from "../../rpc";
import { Token } from "./tokens";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Minimal ERC20 ABI
export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
] as const;


// Cache keys
const CACHE_PREFIX = "token_cache_";
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface TokenCache {
  decimals: number;
  symbol: string;
  timestamp: number;
}

/**
 * Get cached token metadata
 */
async function getCachedTokenMetadata(
  tokenAddress: string
): Promise<TokenCache | null> {
  try {
    const key = `${CACHE_PREFIX}${tokenAddress.toLowerCase()}`;
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const data: TokenCache = JSON.parse(cached);
    const age = Date.now() - data.timestamp;
    if (age > CACHE_EXPIRY_MS) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Cache token metadata
 */
async function cacheTokenMetadata(
  tokenAddress: string,
  decimals: number,
  symbol: string
): Promise<void> {
  try {
    const key = `${CACHE_PREFIX}${tokenAddress.toLowerCase()}`;
    const data: TokenCache = {
      decimals,
      symbol,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore cache errors
  }
}

/**
 * Get token decimals, using cache if available
 */
export async function getTokenDecimals(
  tokenAddress: string,
  rpcUrl: string,
  fallbackDecimals?: number
): Promise<number> {
  // Check cache first
  const cached = await getCachedTokenMetadata(tokenAddress);
  if (cached) {
    return cached.decimals;
  }

  // If fallback is provided and we have it, use it
  if (fallbackDecimals !== undefined) {
    return fallbackDecimals;
  }

  // Fetch from contract
  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);
    const decimals = await contract.decimals();
    const symbol = await contract.symbol().catch(() => "UNKNOWN");

    // Cache the result
    await cacheTokenMetadata(tokenAddress, Number(decimals), symbol);

    return Number(decimals);
  } catch (error) {
    // If fetch fails and we have fallback, use it
    if (fallbackDecimals !== undefined) {
      return fallbackDecimals;
    }
    throw error;
  }
}

/**
 * Get token symbol, using cache if available
 */
export async function getTokenSymbol(
  tokenAddress: string,
  rpcUrl: string,
  fallbackSymbol?: string
): Promise<string> {
  // Check cache first
  const cached = await getCachedTokenMetadata(tokenAddress);
  if (cached) {
    return cached.symbol;
  }

  // If fallback is provided, use it
  if (fallbackSymbol) {
    return fallbackSymbol;
  }

  // Fetch from contract
  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);
    const symbol = await contract.symbol();
    const decimals = await contract.decimals().catch(() => 18);

    // Cache the result
    await cacheTokenMetadata(tokenAddress, Number(decimals), symbol);

    return symbol;
  } catch (error) {
    // If fetch fails and we have fallback, use it
    if (fallbackSymbol) {
      return fallbackSymbol;
    }
    throw error;
  }
}

/**
 * Get ERC20 token balance
 */
export async function getTokenBalance(
  tokenAddress: string,
  userAddress: string,
  rpcUrl: string,
  decimals?: number
): Promise<string> {
  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);

    // Get balance
    const balance = await contract.balanceOf(userAddress);

    // Get decimals (use provided, cached, or fetch)
    const tokenDecimals =
      decimals ?? (await getTokenDecimals(tokenAddress, rpcUrl, decimals));

    // Format balance
    return formatUnits(balance, tokenDecimals);
  } catch (error: any) {
    throw new Error(`Failed to fetch token balance: ${error.message}`);
  }
}

/**
 * Get token balance with formatted result
 */
export interface TokenBalance {
  token: Token;
  balance: string;
  formatted: string;
}

/**
 * Fetch balance for a single token
 */
export async function fetchTokenBalance(
  token: Token,
  userAddress: string,
  rpcUrl: string
): Promise<TokenBalance> {
  if (token.isNative || token.address === "native") {
    // Native token balance
    const balHex = await rpcCall<string>("eth_getBalance", [
      userAddress,
      "latest",
    ], rpcUrl);
    const balance = BigInt(balHex);
    const formatted = formatUnits(balance, token.decimals);

    return {
      token,
      balance: balance.toString(),
      formatted,
    };
  } else {
    // ERC20 token balance
    const balance = await getTokenBalance(
      token.address,
      userAddress,
      rpcUrl,
      token.decimals
    );

    return {
      token,
      balance,
      formatted: balance,
    };
  }
}

/**
 * Fetch balances for multiple tokens
 */
export async function fetchTokenBalances(
  tokens: Token[],
  userAddress: string,
  rpcUrl: string
): Promise<TokenBalance[]> {
  const promises = tokens.map((token) =>
    fetchTokenBalance(token, userAddress, rpcUrl).catch((error) => {
      console.error(`Error fetching balance for ${token.symbol}:`, error);
      // Return zero balance on error
      return {
        token,
        balance: "0",
        formatted: "0.0",
      };
    })
  );

  return Promise.all(promises);
}

