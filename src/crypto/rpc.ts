const RPC_URL = process.env.EXPO_PUBLIC_EVM_RPC_URL!;
if (!RPC_URL) {
  throw new Error("Missing EXPO_PUBLIC_EVM_RPC_URL");
}

let rpcId = 1;

export async function rpcCall<T>(method: string, params: any[]): Promise<T> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: rpcId++,
      method,
      params,
    }),
  });

  const json = await res.json();
  if (json.error) {
    throw new Error(json.error.message || "RPC error");
  }
  return json.result as T;
}

