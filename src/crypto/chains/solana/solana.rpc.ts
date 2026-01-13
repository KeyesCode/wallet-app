// Solana RPC functions

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";

/**
 * Get SOL balance for an address
 */
export async function getSolBalance(
  address: string,
  rpcUrl: string
): Promise<string> {
  try {
    const connection = new Connection(rpcUrl, "confirmed");
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    // Convert lamports to SOL
    return (balance / LAMPORTS_PER_SOL).toString();
  } catch (error: any) {
    throw new Error(`Failed to get SOL balance: ${error.message}`);
  }
}

/**
 * Send SOL transaction
 */
export async function sendSol(params: {
  keypair: Keypair;
  to: string;
  amountSol: string;
  rpcUrl: string;
}): Promise<string> {
  try {
    const connection = new Connection(params.rpcUrl, "confirmed");
    const toPublicKey = new PublicKey(params.to);
    const amountLamports = Math.floor(
      parseFloat(params.amountSol) * LAMPORTS_PER_SOL
    );

    // Create transfer instruction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: params.keypair.publicKey,
        toPubkey: toPublicKey,
        lamports: amountLamports,
      })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = params.keypair.publicKey;

    // Sign and send transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [params.keypair],
      {
        commitment: "confirmed",
      }
    );

    return signature;
  } catch (error: any) {
    throw new Error(`Failed to send SOL: ${error.message}`);
  }
}

/**
 * Get transaction history for an address
 * Uses getSignaturesForAddress + getTransaction
 */
export async function getSolanaTxHistory(
  address: string,
  rpcUrl: string,
  limit = 20,
  before?: string
): Promise<{ items: any[]; nextCursor?: string }> {
  try {
    const connection = new Connection(rpcUrl, "confirmed");
    const publicKey = new PublicKey(address);

    // Get signatures
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit,
      before: before ? before : undefined,
    });

    if (signatures.length === 0) {
      return { items: [] };
    }

    // Get full transaction details
    const transactions = await Promise.all(
      signatures.map((sig) =>
        connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        })
      )
    );

    // Transform to a common format
    const items = transactions
      .filter((tx) => tx !== null)
      .map((tx) => {
        if (!tx) return null;

        // Determine direction and value
        let direction: "in" | "out" | "self" = "self";
        let value = "0";
        let symbol = "SOL";

        // Check if this is a transfer instruction
        if (tx.meta && tx.transaction) {
          const preBalances = tx.meta.preBalances || [];
          const postBalances = tx.meta.postBalances || [];
          const accountKeys = tx.transaction.message.accountKeys;

          // Find our account index
          const ourAccountIndex = accountKeys.findIndex(
            (key) => key.toBase58() === address
          );

          if (ourAccountIndex >= 0) {
            const preBalance = preBalances[ourAccountIndex] || 0;
            const postBalance = postBalances[ourAccountIndex] || 0;
            const balanceChange = postBalance - preBalance;

            if (balanceChange > 0) {
              direction = "in";
              value = (balanceChange / LAMPORTS_PER_SOL).toString();
            } else if (balanceChange < 0) {
              direction = "out";
              value = (Math.abs(balanceChange) / LAMPORTS_PER_SOL).toString();
            }
          }
        }

        return {
          hash: tx.transaction.signatures[0],
          chainId: 0, // Solana doesn't use numeric chainIds, use 0 as placeholder
          timestamp: tx.blockTime
            ? new Date(tx.blockTime * 1000).toISOString()
            : new Date().toISOString(),
          direction,
          value,
          symbol,
          assetType: "native" as const,
          from: tx.transaction.message.accountKeys[0]?.toBase58() || "",
          to: tx.transaction.message.accountKeys[1]?.toBase58() || "",
        };
      })
      .filter((item) => item !== null);

    // Get next cursor (last signature)
    const nextCursor =
      signatures.length === limit
        ? signatures[signatures.length - 1].signature
        : undefined;

    return { items, nextCursor };
  } catch (error: any) {
    throw new Error(`Failed to get transaction history: ${error.message}`);
  }
}

