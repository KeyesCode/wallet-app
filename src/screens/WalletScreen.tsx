import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { clearWallet } from "../crypto/vault";
import { deriveEvmWalletFromMnemonic } from "../crypto/evm";
import { useWallet } from "../context/WalletContext";
import { getAllTokens } from "../crypto/chains/evm/tokens";
import { fetchTokenBalances, TokenBalance } from "../crypto/chains/evm/erc20";

type Props = NativeStackScreenProps<RootStackParamList, "Wallet">;

export default function WalletScreen({ navigation }: Props) {
  const { mnemonic, setMnemonic } = useWallet();
  const [address, setAddress] = useState<string>("");
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const chainId = Number(process.env.EXPO_PUBLIC_EVM_CHAIN_ID ?? "11155111");

  useEffect(() => {
    if (!mnemonic) {
      // If mnemonic is not in memory, check if wallet exists and redirect to unlock
      navigation.replace("Unlock");
      return;
    }

    const w = deriveEvmWalletFromMnemonic(mnemonic, 0);
    w.getAddress().then(setAddress);
  }, [mnemonic, navigation]);

  const refresh = useCallback(async () => {
    if (!address) return;

    try {
      setRefreshing(true);
      const tokens = getAllTokens(chainId);
      const balances = await fetchTokenBalances(tokens, address);
      setTokenBalances(balances);
    } catch (e: any) {
      Alert.alert("Balance error", e.message ?? "Unknown error");
    } finally {
      setRefreshing(false);
    }
  }, [address, chainId]);

  useEffect(() => {
    if (address) refresh();
  }, [address, refresh]);

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
            setMnemonic(null);
            navigation.replace("Welcome");
          },
        },
      ]
    );
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
      <Text style={styles.title}>Wallet</Text>

      <Text style={styles.label}>Address</Text>
      <Text selectable style={styles.mono}>
        {address}
      </Text>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  label: { marginTop: 8, fontWeight: "600" },
  mono: { fontFamily: "Courier", fontSize: 13 },
  balance: { fontSize: 28, fontWeight: "800" },
  row: { flexDirection: "row", gap: 12, marginTop: 12 },
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
});

