import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { clearWallet } from "../crypto/vault";
import { useWallet } from "../context/WalletContext";
import { getAllTokens } from "../crypto/chains/evm/tokens";
import { fetchTokenBalances, TokenBalance } from "../crypto/chains/evm/erc20";
import { getTransactionHistory, TxItem } from "../services/api";
import { clearWalletMetadata } from "../services/walletMetadata";
import { EVM_NETWORKS, getAvailableChainIds } from "../crypto/networks";

type Props = NativeStackScreenProps<RootStackParamList, "Wallet">;

export default function WalletScreen({ navigation }: Props) {
  const {
    mnemonic,
    setMnemonic,
    activeAccount,
    accounts,
    activeAccountIndex,
    setActiveAccountIndex,
    addAccount,
    refreshAccounts,
    activeChainId,
    setActiveChainId,
    activeNetwork,
  } = useWallet();
  const [address, setAddress] = useState<string>("");
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<TxItem[]>([]);
  const [nextPageKey, setNextPageKey] = useState<string | undefined>();
  const [loadingTx, setLoadingTx] = useState(false);
  const [loadingMoreTx, setLoadingMoreTx] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  // Update address when active account changes
  useEffect(() => {
    if (!mnemonic) {
      navigation.replace("Unlock");
      return;
    }

    if (activeAccount) {
      setAddress(activeAccount.evmAddress);
    }
  }, [mnemonic, activeAccount, navigation]);

  const fetchTransactions = useCallback(
    async (pageKey?: string, append = false) => {
      if (!address || !activeChainId) return;

      try {
        if (append) {
          setLoadingMoreTx(true);
        } else {
          setLoadingTx(true);
        }

        const response = await getTransactionHistory(activeChainId, address, {
          pageKey,
          pageSize: 20,
        });

        if (append) {
          setTransactions((prev) => [...prev, ...response.items]);
        } else {
          setTransactions(response.items);
        }
        setNextPageKey(response.nextPageKey);
      } catch (e: any) {
        if (!append) {
          Alert.alert("Transaction history error", e.message ?? "Unknown error");
        }
      } finally {
        setLoadingTx(false);
        setLoadingMoreTx(false);
      }
    },
    [address, activeChainId]
  );

  const refresh = useCallback(async () => {
    if (!address || !activeNetwork) return;

    try {
      setRefreshing(true);
      const tokens = getAllTokens(activeChainId);
      const balances = await fetchTokenBalances(tokens, address, activeNetwork.rpcUrl);
      setTokenBalances(balances);
      await fetchTransactions(undefined, false);
    } catch (e: any) {
      Alert.alert("Balance error", e.message ?? "Unknown error");
    } finally {
      setRefreshing(false);
    }
  }, [address, activeChainId, activeNetwork, fetchTransactions]);

  useEffect(() => {
    if (address && activeNetwork) {
      refresh();
    }
  }, [address, activeChainId, activeNetwork, refresh]);

  const onReset = async () => {
    Alert.alert(
      "Reset Wallet",
      "This will delete all wallet data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await clearWallet();
            await clearWalletMetadata();
            setMnemonic(null);
            navigation.replace("Welcome");
          },
        },
      ]
    );
  };

  const onSwitchAccount = async (index: number) => {
    if (index === activeAccountIndex) {
      setShowAccountPicker(false);
      return;
    }
    try {
      await setActiveAccountIndex(index);
      setShowAccountPicker(false);
      // Address will update via useEffect, which will trigger refresh
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to switch account");
    }
  };

  const onAddAccount = async () => {
    try {
      setIsAddingAccount(true);
      await addAccount();
      await refreshAccounts();
      Alert.alert("Success", "New account added");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to add account");
    } finally {
      setIsAddingAccount(false);
    }
  };

  const onSwitchNetwork = async (chainId: number) => {
    if (chainId === activeChainId) {
      setShowNetworkPicker(false);
      return;
    }
    try {
      await setActiveChainId(chainId);
      setShowNetworkPicker(false);
      // Refresh will be triggered by useEffect when activeChainId changes
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to switch network");
    }
  };

  const copyAddressToClipboard = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      Alert.alert("Copied", "Address copied to clipboard");
    }
  };


  const nativeBalance = tokenBalances.find((tb) => tb.token.isNative);
  const erc20Balances = tokenBalances.filter((tb) => !tb.token.isNative);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
        <View style={styles.accountControls}>
          <TouchableOpacity
            style={styles.accountButton}
            onPress={() => setShowAccountPicker(true)}
          >
            <Text style={styles.accountButtonText}>
              {activeAccount?.name || "Account"}
            </Text>
            <Text style={styles.accountButtonSubtext}>
              {accounts.length} account{accounts.length !== 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>
          <Button
            title="+ Add"
            onPress={onAddAccount}
            disabled={isAddingAccount}
          />
        </View>
        <View style={styles.networkControls}>
          <TouchableOpacity
            style={styles.networkButton}
            onPress={() => setShowNetworkPicker(true)}
          >
            <Text style={styles.networkButtonText}>
              {activeNetwork?.name || "Network"}
            </Text>
            <Text style={styles.networkButtonSubtext}>
              {activeNetwork?.nativeSymbol || ""}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeAccount && (
        <>
          <Text style={styles.label}>Account: {activeAccount.name}</Text>
          <Text style={styles.label}>Address</Text>
          <TouchableOpacity onPress={copyAddressToClipboard} activeOpacity={0.7}>
            <Text style={styles.addressText}>
              {address}
            </Text>
            <Text style={styles.copyHint}>Tap to copy</Text>
          </TouchableOpacity>
        </>
      )}

      {nativeBalance && (
        <>
          <Text style={styles.label}>Balance ({nativeBalance.token.symbol})</Text>
          <Text style={styles.balance}>
            {parseFloat(nativeBalance.formatted).toLocaleString(undefined, {
              maximumFractionDigits: 6,
              minimumFractionDigits: 2,
            })}
          </Text>
        </>
      )}

      {erc20Balances.length > 0 && (
        <>
          <Text style={[styles.label, { marginTop: 24 }]}>Tokens</Text>
          <View style={styles.tokenList}>
            {erc20Balances.map((tb, index) => (
              <View
                key={`${tb.token.address}-${index}`}
                style={
                  index < erc20Balances.length - 1
                    ? styles.tokenItem
                    : [styles.tokenItem, { borderBottomWidth: 0 }]
                }
              >
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenSymbol}>{tb.token.symbol}</Text>
                  <Text style={styles.tokenName}>{tb.token.name}</Text>
                </View>
                <Text style={styles.tokenBalance}>
                  {(() => {
                    const balance = parseFloat(tb.formatted);
                    return balance === 0
                      ? "0.0"
                      : balance.toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                          minimumFractionDigits: balance < 0.01 ? 6 : 2,
                        });
                  })()}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <Text style={[styles.label, { marginTop: 24 }]}>Transaction History</Text>
      {loadingTx ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <Text style={styles.emptyText}>No transactions found</Text>
      ) : (
        <>
          <View style={styles.txList}>
            {transactions.map((tx, index) => (
              <View
                key={`${tx.hash}-${index}`}
                style={
                  index < transactions.length - 1
                    ? styles.txItem
                    : [styles.txItem, { borderBottomWidth: 0 }]
                }
              >
                <View style={styles.txHeader}>
                  <View
                    style={[
                      styles.directionBadge,
                      {
                        backgroundColor:
                          tx.direction === "in"
                            ? "#4caf50"
                            : tx.direction === "out"
                            ? "#f44336"
                            : "#9e9e9e",
                      },
                    ]}
                  >
                    <Text style={styles.directionText}>
                      {tx.direction === "in"
                        ? "↓ IN"
                        : tx.direction === "out"
                        ? "↑ OUT"
                        : "↔ SELF"}
                    </Text>
                  </View>
                  <Text style={styles.txType}>{tx.assetType.toUpperCase()}</Text>
                </View>
                <View style={styles.txBody}>
                  <View style={styles.txInfo}>
                    <Text style={styles.txValue}>
                      {parseFloat(tx.value).toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                        minimumFractionDigits: 2,
                      })}{" "}
                      {tx.symbol || "TOKEN"}
                    </Text>
                    <Text style={styles.txTime}>
                      {new Date(tx.timestamp).toLocaleDateString()}{" "}
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.txHash} numberOfLines={1} ellipsizeMode="middle">
                  {tx.hash}
                </Text>
              </View>
            ))}
          </View>
          {nextPageKey && (
            <View style={styles.loadMoreContainer}>
              {loadingMoreTx ? (
                <ActivityIndicator size="small" />
              ) : (
                <Button
                  title="Load More"
                  onPress={() => fetchTransactions(nextPageKey, true)}
                />
              )}
            </View>
          )}
        </>
      )}

      <View style={styles.row}>
        <Button title="Refresh" onPress={refresh} />
        <Button title="Send" onPress={() => navigation.navigate("Send")} />
      </View>

      <View style={{ marginTop: 24, gap: 12 }}>
        <Button
          title="Change PIN"
          onPress={() => navigation.navigate("ChangePin")}
        />
        <Button title="Reset Wallet" color="#b00020" onPress={onReset} />
      </View>

      {/* Account Picker Modal */}
      <Modal
        visible={showAccountPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAccountPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Account</Text>
            <ScrollView>
              {accounts.map((account) => (
                <TouchableOpacity
                  key={account.index}
                  style={[
                    styles.accountOption,
                    account.index === activeAccountIndex &&
                      styles.accountOptionActive,
                  ]}
                  onPress={() => onSwitchAccount(account.index)}
                >
                  <View style={styles.accountOptionContent}>
                    <Text style={styles.accountOptionName}>{account.name}</Text>
                    <Text style={styles.accountOptionAddress} numberOfLines={1}>
                      {account.evmAddress}
                    </Text>
                  </View>
                  {account.index === activeAccountIndex && (
                    <Text style={styles.accountOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button
              title="Close"
              onPress={() => setShowAccountPicker(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Network Picker Modal */}
      <Modal
        visible={showNetworkPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNetworkPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Network</Text>
            <ScrollView>
              {getAvailableChainIds().map((chainId) => {
                const network = EVM_NETWORKS[chainId];
                if (!network) return null;
                return (
                  <TouchableOpacity
                    key={chainId}
                    style={[
                      styles.accountOption,
                      chainId === activeChainId && styles.accountOptionActive,
                    ]}
                    onPress={() => onSwitchNetwork(chainId)}
                  >
                    <View style={styles.accountOptionContent}>
                      <Text style={styles.accountOptionName}>
                        {network.name}
                      </Text>
                      <Text style={styles.accountOptionAddress} numberOfLines={1}>
                        {network.nativeSymbol} • Chain ID: {chainId}
                      </Text>
                    </View>
                    {chainId === activeChainId && (
                      <Text style={styles.accountOptionCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Button
              title="Close"
              onPress={() => setShowNetworkPicker(false)}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  accountControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  accountButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  accountButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  accountButtonSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  networkControls: {
    marginTop: 12,
  },
  networkButton: {
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  networkButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  networkButtonSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  label: { marginTop: 8, fontWeight: "600" },
  mono: { fontFamily: "Courier", fontSize: 13 },
  addressText: {
    fontFamily: "Courier",
    fontSize: 13,
    color: "#007AFF",
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  copyHint: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  balance: { fontSize: 28, fontWeight: "800" },
  row: { flexDirection: "row", gap: 12, marginTop: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  accountOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  accountOptionActive: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196f3",
  },
  accountOptionContent: {
    flex: 1,
  },
  accountOptionName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  accountOptionAddress: {
    fontSize: 12,
    fontFamily: "Courier",
    color: "#666",
  },
  accountOptionCheck: {
    fontSize: 20,
    color: "#2196f3",
    fontWeight: "bold",
  },
  tokenList: {
    marginTop: 8,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  tokenItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: "600",
  },
  tokenName: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  tokenBalance: {
    fontSize: 16,
    fontWeight: "500",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  loadingText: {
    color: "#666",
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
    padding: 16,
    fontStyle: "italic",
  },
  txList: {
    marginTop: 8,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  txItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  txHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  directionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  directionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  txType: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
  txBody: {
    marginBottom: 8,
  },
  txInfo: {
    gap: 4,
  },
  txValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  txTime: {
    fontSize: 12,
    color: "#666",
  },
  txHash: {
    fontSize: 11,
    fontFamily: "Courier",
    color: "#999",
  },
  loadMoreContainer: {
    marginTop: 16,
    alignItems: "center",
  },
});

