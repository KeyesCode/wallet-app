import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { sendEth } from "../crypto/evm";
import { useWallet } from "../context/WalletContext";

type Props = NativeStackScreenProps<RootStackParamList, "Send">;

export default function SendScreen({ navigation }: Props) {
  const { mnemonic, activeAccountIndex, activeChainId, activeNetwork, activeCustomRpcUrl } = useWallet();
  const [to, setTo] = useState("");
  const [amountEth, setAmountEth] = useState("0.001");
  const [sending, setSending] = useState(false);

  const onSend = async () => {
    console.log("[SendScreen] onSend called");
    
    if (!mnemonic) {
      console.log("[SendScreen] Error: Wallet not unlocked");
      Alert.alert("Error", "Wallet not unlocked");
      navigation.replace("Unlock");
      return;
    }

    if (!activeNetwork) {
      console.log("[SendScreen] Error: No active network selected");
      Alert.alert("Error", "No active network selected");
      return;
    }

    const toAddress = to.trim();
    const amount = amountEth.trim();

    if (!toAddress) {
      console.log("[SendScreen] Error: No recipient address");
      Alert.alert("Error", "Please enter a recipient address");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      console.log("[SendScreen] Error: Invalid amount");
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    console.log("[SendScreen] Starting send transaction", {
      to: toAddress,
      amount,
      chainId: activeChainId,
      rpcUrl: activeNetwork.rpcUrl,
      accountIndex: activeAccountIndex,
    });

    try {
      setSending(true);
      const txHash = await sendEth({
        mnemonic,
        to: toAddress,
        amountEth: amount,
        chainId: activeChainId,
        customRpcUrl: activeCustomRpcUrl,
        accountIndex: activeAccountIndex,
      });
      console.log("[SendScreen] Transaction successful:", txHash);
      Alert.alert("Sent!", `Tx: ${txHash}`);
      navigation.goBack();
    } catch (e: any) {
      console.error("[SendScreen] Send failed:", e);
      Alert.alert("Send failed", e.message ?? "Unknown error");
    } finally {
      setSending(false);
      console.log("[SendScreen] Send operation completed");
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

