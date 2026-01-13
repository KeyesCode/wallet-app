import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { loadMnemonic } from "../crypto/vault";
import { sendEth } from "../crypto/evm";

type Props = NativeStackScreenProps<RootStackParamList, "Send">;

export default function SendScreen({ navigation }: Props) {
  const [to, setTo] = useState("");
  const [amountEth, setAmountEth] = useState("0.001");
  const [sending, setSending] = useState(false);

  const chainId = Number(process.env.EXPO_PUBLIC_EVM_CHAIN_ID ?? "11155111");

  const onSend = async () => {
    try {
      setSending(true);
      const mnemonic = await loadMnemonic();
      if (!mnemonic) {
        navigation.replace("Welcome");
        return;
      }
      const txHash = await sendEth({
        mnemonic,
        to: to.trim(),
        amountEth: amountEth.trim(),
        chainId,
      });
      Alert.alert("Sent!", `Tx: ${txHash}`);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Send failed", e.message ?? "Unknown error");
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send ETH</Text>

      <Text style={styles.label}>To</Text>
      <TextInput
        style={styles.input}
        value={to}
        onChangeText={setTo}
        placeholder="0x..."
        autoCapitalize="none"
      />

      <Text style={styles.label}>Amount (ETH)</Text>
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

