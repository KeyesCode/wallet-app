import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { clearWallet } from "../crypto/vault";
import { deriveEvmWalletFromMnemonic, getNativeBalanceWei } from "../crypto/evm";
import { formatEther } from "ethers";
import { useWallet } from "../context/WalletContext";

type Props = NativeStackScreenProps<RootStackParamList, "Wallet">;

export default function WalletScreen({ navigation }: Props) {
  const { mnemonic, setMnemonic } = useWallet();
  const [address, setAddress] = useState<string>("");
  const [balance, setBalance] = useState<string>("0.0");

  useEffect(() => {
    if (!mnemonic) {
      // If mnemonic is not in memory, check if wallet exists and redirect to unlock
      navigation.replace("Unlock");
      return;
    }

    const w = deriveEvmWalletFromMnemonic(mnemonic, 0);
    w.getAddress().then(setAddress);
  }, [mnemonic, navigation]);

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

      <View style={{ marginTop: 24, gap: 12 }}>
        <Button
          title="Change PIN"
          onPress={() => navigation.navigate("ChangePin")}
        />
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

