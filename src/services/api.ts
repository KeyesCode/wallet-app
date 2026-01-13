export interface TxItem {
  hash: string;
  chainId: number;
  timestamp: string;
  direction: 'in' | 'out' | 'self' | 'unknown';
  assetType: 'native' | 'erc20' | 'erc721' | 'erc1155';
  from: string;
  to: string;
  value: string;
  symbol?: string;
  tokenAddress?: string;
  tokenId?: string;
  raw?: any;
}

export interface TxHistoryResponse {
  items: TxItem[];
  nextPageKey?: string;
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export async function getTransactionHistory(
  chainId: number,
  address: string,
  options?: {
    pageKey?: string;
    pageSize?: number;
    fromBlock?: string;
    categories?: string[];
  },
): Promise<TxHistoryResponse> {
  const params = new URLSearchParams({
    address,
  });

  if (options?.pageKey) {
    params.append('pageKey', options.pageKey);
  }
  if (options?.pageSize) {
    params.append('pageSize', options.pageSize.toString());
  }
  if (options?.fromBlock) {
    params.append('fromBlock', options.fromBlock);
  }
  if (options?.categories) {
    params.append('categories', options.categories.join(','));
  }

  const url = `${API_BASE_URL}/evm/${chainId}/tx-history?${params.toString()}`;

  // Add timeout to prevent hanging (30 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection and try again');
    }
    throw error;
  }
}

