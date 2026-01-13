import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { sendEth } from "../crypto/evm";
import { useWallet } from "../context/WalletContext";

type Props = NativeStackScreenProps<RootStackParamList, "Send">;

export default function SendScreen({ navigation }: Props) {
  const { mnemonic, activeAccountIndex, activeChainId, activeNetwork } = useWallet();
  const [to, setTo] = useState("");
  const [amountEth, setAmountEth] = useState("0.001");
  const [sending, setSending] = useState(false);

  const onSend = async () => {
    if (!mnemonic) {
      Alert.alert("Error", "Wallet not unlocked");
      navigation.replace("Unlock");
      return;
    }

    if (!activeNetwork) {
      Alert.alert("Error", "No active network selected");
      return;
    }

    try {
      setSending(true);
      const txHash = await sendEth({
        mnemonic,
        to: to.trim(),
        amountEth: amountEth.trim(),
        chainId: activeChainId,
        rpcUrl: activeNetwork.rpcUrl,
        accountIndex: activeAccountIndex,
      });
      Alert.alert("Sent!", `Tx: ${txHash}`);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Send failed", e.message ?? "Unknown error");
    } finally {
      setSending(false);
    }
  };

  const nativeSymbol = activeNetwork?.nativeSymbol || "ETH";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send {nativeSymbol}</Text>

      <Text style={styles.label}>To</Text>
      <TextInput
        style={styles.input}
        value={to}
        onChangeText={setTo}
        placeholder="0x..."
        autoCapitalize="none"
      />

      <Text style={styles.label}>Amount ({nativeSymbol})</Text>
      <TextInput
        style={styles.input}
        value={amountEth}
        onChangeText={setAmountEth}
        keyboardType="decimal-pad"
      />

      <Button title={sending ? "Sending..." : "Send"} onPress={onSend} disabled={sending} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: "700" },
  label: { marginTop: 8, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
  },
});

