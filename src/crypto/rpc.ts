let rpcId = 1;

const RPC_TIMEOUT_MS = 30000; // 30 seconds

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";

/**
 * Get the RPC URL to use for a given chain ID
 * Priority: 1. Custom RPC (if set), 2. Backend proxy
 */
async function getRpcUrl(
  chainId: number,
  customRpcUrl?: string | null
): Promise<string> {
  // If custom RPC is provided, use it
  if (customRpcUrl) {
    console.log(`[RPC] Using custom RPC for chainId ${chainId}`);
    return customRpcUrl;
  }

  // Otherwise, use backend proxy
  const backendUrl = `${API_BASE_URL}/evm/${chainId}/rpc`;
  console.log(`[RPC] Using backend proxy for chainId ${chainId}`);
  return backendUrl;
}

export async function rpcCall<T>(
  method: string,
  params: any[],
  rpcUrlOrChainId: string | number,
  customRpcUrl?: string | null
): Promise<T> {
  // Determine if rpcUrlOrChainId is a chainId (number) or direct URL (string)
  const isChainId = typeof rpcUrlOrChainId === "number";
  const chainId = isChainId ? rpcUrlOrChainId : undefined;

  // Get the actual RPC URL to use
  const rpcUrl = isChainId
    ? await getRpcUrl(rpcUrlOrChainId, customRpcUrl)
    : rpcUrlOrChainId;

  console.log(`[RPC] Calling ${method} on ${rpcUrl}`);
  const startTime = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

  try {
    // If using backend proxy, send method and params in body
    // Otherwise, use standard JSON-RPC format
    const body =
      isChainId && !customRpcUrl
        ? JSON.stringify({
            method,
            params,
          })
        : JSON.stringify({
            jsonrpc: "2.0",
            id: rpcId++,
            method,
            params,
          });

    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    console.log(`[RPC] ${method} completed in ${elapsed}ms`);

    // Read response body once and reuse it
    // Clone the response if we need to read it multiple times, or read once and parse
    const contentType = res.headers.get("content-type");
    let responseText: string;

    try {
      // Read the response body as text first (can only be read once)
      responseText = await res.text();
    } catch (readError: any) {
      throw new Error(`Failed to read response body: ${readError.message}`);
    }

    if (!res.ok) {
      // Try to get error message from response body
      let errorMessage = `HTTP error: ${res.status} ${res.statusText}`;
      try {
        if (contentType && contentType.includes("application/json")) {
          const errorJson = JSON.parse(responseText);
          errorMessage =
            errorJson.message || errorJson.error?.message || errorMessage;
        } else if (responseText) {
          errorMessage = `${errorMessage} - ${responseText.substring(0, 200)}`;
        }
      } catch (e) {
        // Ignore errors parsing error response, use default message
        if (responseText) {
          errorMessage = `${errorMessage} - ${responseText.substring(0, 200)}`;
        }
      }
      throw new Error(errorMessage);
    }

    // Backend proxy returns result directly (NestJS serializes it)
    // Standard RPC returns {result, error}
    if (isChainId && !customRpcUrl) {
      // Backend proxy: result is returned directly
      // Try to parse as JSON first
      let json: any;
      try {
        json = JSON.parse(responseText);
      } catch (parseError: any) {
        // If JSON parsing fails, the backend might be returning the raw value
        // In that case, treat the response text as the result directly
        // This can happen if NestJS returns a primitive value without proper JSON encoding
        console.warn(
          `[RPC] Backend response is not JSON, treating as raw value:`,
          responseText.substring(0, 100)
        );
        return responseText as T;
      }

      // If there was an error, we'd get an HTTP error status, not a JSON error field
      // But check for error fields just in case
      if (json && (json.error || json.message)) {
        const errorMsg = json.error?.message || json.message || "Unknown error";
        console.error(`[RPC] ${method} error from backend:`, json);
        throw new Error(errorMsg);
      }
      return json as T;
    } else {
      // Standard JSON-RPC format: {jsonrpc: "2.0", result: ..., error: ...}
      // Check content-type before parsing
      if (contentType && !contentType.includes("application/json")) {
        throw new Error(
          `Expected JSON response but got ${contentType}. Response: ${responseText.substring(
            0,
            200
          )}`
        );
      }

      let json;
      try {
        json = JSON.parse(responseText);
      } catch (parseError: any) {
        console.error(
          `[RPC] Failed to parse JSON response:`,
          responseText.substring(0, 500)
        );
        throw new Error(
          `Failed to parse JSON response: ${
            parseError.message
          }. Response: ${responseText.substring(0, 200)}`
        );
      }

      if (json.error) {
        console.error(`[RPC] ${method} error:`, json.error);
        throw new Error(json.error.message || "RPC error");
      }
      return json.result as T;
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    if (error.name === "AbortError") {
      console.error(`[RPC] ${method} timed out after ${elapsed}ms`);
      throw new Error(`RPC call ${method} timed out after ${RPC_TIMEOUT_MS}ms`);
    }
    console.error(`[RPC] ${method} failed after ${elapsed}ms:`, error.message);
    throw error;
  }
}
