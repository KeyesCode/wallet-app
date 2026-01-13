import { HDNodeWallet, Wallet, parseEther } from "ethers";
import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { rpcCall } from "./rpc";

export function generateMnemonic(): string {
  return bip39.generateMnemonic(wordlist);
}

export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic.trim(), wordlist);
}

export function deriveEvmWalletFromMnemonic(
  mnemonic: string,
  accountIndex = 0
): Wallet {
  const path = `m/44'/60'/0'/0/${accountIndex}`;
  const hd = HDNodeWallet.fromPhrase(mnemonic, undefined, path);
  return new Wallet(hd.privateKey);
}

export async function getNativeBalanceWei(
  address: string,
  chainId: number,
  customRpcUrl?: string | null
): Promise<bigint> {
  const balHex = await rpcCall<string>("eth_getBalance", [address, "latest"], chainId, customRpcUrl);
  return BigInt(balHex);
}

export async function getFeeData(
  chainId: number,
  customRpcUrl?: string | null
): Promise<{
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}> {
  console.log("[getFeeData] Getting latest block number...");
  // Simple approach: use eth_feeHistory to estimate priority fee
  // MVP: fallback to a safe priority fee if needed.
  const latestBlock = await rpcCall<string>("eth_blockNumber", [], chainId, customRpcUrl);
  console.log("[getFeeData] Latest block:", latestBlock);
  
  console.log("[getFeeData] Getting fee history...");
  const feeHistory = await rpcCall<any>("eth_feeHistory", [
    "0x5",
    latestBlock,
    [10, 20, 30],
  ], chainId, customRpcUrl);

  const baseFeePerGas = BigInt(feeHistory.baseFeePerGas.slice(-1)[0]);
  // reward is an array of arrays (per block) of hex values; take last block median-ish
  const rewards = feeHistory.reward?.slice(-1)[0] ?? ["0x0"];
  const priority = BigInt(rewards[Math.floor(rewards.length / 2)] ?? "0x0");

  const maxPriorityFeePerGas = priority > 0n ? priority : 1_500_000_000n; // 1.5 gwei fallback
  const maxFeePerGas = baseFeePerGas * 2n + maxPriorityFeePerGas;

  console.log("[getFeeData] Calculated fees:", {
    baseFeePerGas: baseFeePerGas.toString(),
    maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    maxFeePerGas: maxFeePerGas.toString(),
  });

  return { maxFeePerGas, maxPriorityFeePerGas };
}

export async function estimateGas(
  params: {
    from: string;
    to: string;
    valueWei: bigint;
  },
  chainId: number,
  customRpcUrl?: string | null
): Promise<bigint> {
  const gasHex = await rpcCall<string>("eth_estimateGas", [
    {
      from: params.from,
      to: params.to,
      value: "0x" + params.valueWei.toString(16),
    },
  ], chainId, customRpcUrl);
  return BigInt(gasHex);
}

export async function sendEth(params: {
  mnemonic: string;
  to: string;
  amountEth: string;
  chainId: number;
  customRpcUrl?: string | null;
  accountIndex?: number;
}): Promise<string> {
  console.log("[sendEth] Starting transaction", {
    to: params.to,
    amountEth: params.amountEth,
    chainId: params.chainId,
    accountIndex: params.accountIndex,
    usingCustomRpc: !!params.customRpcUrl,
  });

  try {
    console.log("[sendEth] Deriving wallet...");
    const wallet = deriveEvmWalletFromMnemonic(
      params.mnemonic,
      params.accountIndex ?? 0
    );

    console.log("[sendEth] Getting wallet address...");
    const from = await wallet.getAddress();
    console.log("[sendEth] From address:", from);

    console.log("[sendEth] Parsing amount...");
    const valueWei = parseEther(params.amountEth);
    console.log("[sendEth] Amount in Wei:", valueWei.toString());

    console.log("[sendEth] Getting transaction count (nonce)...");
    const nonceHex = await rpcCall<string>("eth_getTransactionCount", [
      from,
      "latest",
    ], params.chainId, params.customRpcUrl);
    const nonce = Number(BigInt(nonceHex));
    console.log("[sendEth] Nonce:", nonce);

    console.log("[sendEth] Getting fee data...");
    const { maxFeePerGas, maxPriorityFeePerGas } = await getFeeData(params.chainId, params.customRpcUrl);
    console.log("[sendEth] Fee data:", {
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
    });

    console.log("[sendEth] Estimating gas...");
    const gasLimit = await estimateGas({ from, to: params.to, valueWei }, params.chainId, params.customRpcUrl);
    console.log("[sendEth] Gas limit:", gasLimit.toString());

    console.log("[sendEth] Building transaction...");
    const tx = {
      type: 2,
      chainId: params.chainId,
      to: params.to,
      value: valueWei,
      nonce,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
    };

    console.log("[sendEth] Signing transaction...");
    const signed = await wallet.signTransaction(tx);
    console.log("[sendEth] Transaction signed, sending to network...");
    
    const txHash = await rpcCall<string>("eth_sendRawTransaction", [signed], params.chainId, params.customRpcUrl);
    console.log("[sendEth] Transaction sent! Hash:", txHash);
    
    return txHash;
  } catch (error: any) {
    console.error("[sendEth] Error:", error);
    throw error;
  }
}

