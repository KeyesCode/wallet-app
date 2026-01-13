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

export async function getNativeBalanceWei(address: string): Promise<bigint> {
  const balHex = await rpcCall<string>("eth_getBalance", [address, "latest"]);
  return BigInt(balHex);
}

export async function getFeeData(): Promise<{
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}> {
  // Simple approach: use eth_feeHistory to estimate priority fee
  // MVP: fallback to a safe priority fee if needed.
  const latestBlock = await rpcCall<string>("eth_blockNumber", []);
  const feeHistory = await rpcCall<any>("eth_feeHistory", [
    "0x5",
    latestBlock,
    [10, 20, 30],
  ]);

  const baseFeePerGas = BigInt(feeHistory.baseFeePerGas.slice(-1)[0]);
  // reward is an array of arrays (per block) of hex values; take last block median-ish
  const rewards = feeHistory.reward?.slice(-1)[0] ?? ["0x0"];
  const priority = BigInt(rewards[Math.floor(rewards.length / 2)] ?? "0x0");

  const maxPriorityFeePerGas = priority > 0n ? priority : 1_500_000_000n; // 1.5 gwei fallback
  const maxFeePerGas = baseFeePerGas * 2n + maxPriorityFeePerGas;

  return { maxFeePerGas, maxPriorityFeePerGas };
}

export async function estimateGas(params: {
  from: string;
  to: string;
  valueWei: bigint;
}): Promise<bigint> {
  const gasHex = await rpcCall<string>("eth_estimateGas", [
    {
      from: params.from,
      to: params.to,
      value: "0x" + params.valueWei.toString(16),
    },
  ]);
  return BigInt(gasHex);
}

export async function sendEth(params: {
  mnemonic: string;
  to: string;
  amountEth: string;
  chainId: number;
  accountIndex?: number;
}): Promise<string> {
  const wallet = deriveEvmWalletFromMnemonic(
    params.mnemonic,
    params.accountIndex ?? 0
  );

  const from = await wallet.getAddress();
  const valueWei = parseEther(params.amountEth);

  const nonceHex = await rpcCall<string>("eth_getTransactionCount", [
    from,
    "latest",
  ]);
  const nonce = Number(BigInt(nonceHex));

  const { maxFeePerGas, maxPriorityFeePerGas } = await getFeeData();
  const gasLimit = await estimateGas({ from, to: params.to, valueWei });

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

  const signed = await wallet.signTransaction(tx);
  const txHash = await rpcCall<string>("eth_sendRawTransaction", [signed]);
  return txHash;
}

