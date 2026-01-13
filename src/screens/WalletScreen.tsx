import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { loadMnemonic, clearWallet } from "../crypto/vault";
import { deriveEvmWalletFromMnemonic, getNativeBalanceWei } from "../crypto/evm";
import { formatEther } from "ethers";

type Props = NativeStackScreenProps<RootStackParamList, "Wallet">;

export default function WalletScreen({ navigation }: Props) {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [address, setAddress] = useState<string>("");
  const [balance, setBalance] = useState<string>("0.0");

  useEffect(() => {
    (async () => {
      const m = await loadMnemonic();
      if (!m) {
        navigation.replace("Welcome");
        return;
      }
      setMnemonic(m);
      const w = deriveEvmWalletFromMnemonic(m, 0);
      setAddress(await w.getAddress());
    })();
  }, [navigation]);

  const refresh = async () => {
    try {
      if (!address) return;
      const wei = await getNativeBalanceWei(address);
      setBalance(formatEther(wei));
    } catch (e: any) {
      Alert.alert("Balance error", e.message ?? "Unknown error");
    }
  };

  useEffect(() => {
    if (address) refresh();
  }, [address]);

  const onReset = async () => {
    await clearWallet();
    navigation.replace("Welcome");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet</Text>

      <Text style={styles.label}>Address</Text>
      <Text selectable style={styles.mono}>{address}</Text>

      <Text style={styles.label}>Balance (ETH)</Text>
      <Text style={styles.balance}>{balance}</Text>

      <View style={styles.row}>
        <Button title="Refresh" onPress={refresh} />
        <Button title="Send" onPress={() => navigation.navigate("Send")} />
      </View>

      <View style={{ marginTop: 24 }}>
        <Button title="Reset Wallet" color="#b00020" onPress={onReset} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: "700" },
  label: { marginTop: 8, fontWeight: "600" },
  mono: { fontFamily: "Courier", fontSize: 13 },
  balance: { fontSize: 28, fontWeight: "800" },
  row: { flexDirection: "row", gap: 12, marginTop: 12 },
});

