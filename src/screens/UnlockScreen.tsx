import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { loadMnemonicWithPin } from "../crypto/vault";
import { useWallet } from "../context/WalletContext";

type Props = NativeStackScreenProps<RootStackParamList, "Unlock">;

export default function UnlockScreen({ navigation }: Props) {
  const { setMnemonic } = useWallet();
  const [pin, setPin] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 5;

  const onUnlock = async () => {
    if (pin.length < 4) {
      Alert.alert("Invalid PIN", "Please enter your PIN");
      return;
    }

    try {
      setIsUnlocking(true);
      const mnemonic = await loadMnemonicWithPin(pin);

      if (!mnemonic) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPin("");

        if (newAttempts >= MAX_ATTEMPTS) {
          Alert.alert(
            "Too Many Attempts",
            "Please restart the app and try again."
          );
          return;
        }

        Alert.alert(
          "Incorrect PIN",
          `Wrong PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`
        );
        return;
      }

      // Success - unlock wallet
      setMnemonic(mnemonic);
      setAttempts(0);
      navigation.replace("Wallet");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to unlock wallet");
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unlock Wallet</Text>
      <Text style={styles.description}>
        Enter your PIN to access your wallet
      </Text>

      <Text style={styles.label}>PIN</Text>
      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        placeholder="Enter PIN"
        keyboardType="numeric"
        secureTextEntry
        maxLength={20}
        autoFocus
      />

      {attempts > 0 && (
        <Text style={styles.warning}>
          {MAX_ATTEMPTS - attempts} attempts remaining
        </Text>
      )}

      <Button
        title={isUnlocking ? "Unlocking..." : "Unlock"}
        onPress={onUnlock}
        disabled={isUnlocking || pin.length < 4}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  description: { marginBottom: 24, color: "#666", lineHeight: 20 },
  label: { marginTop: 12, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  warning: {
    color: "#b00020",
    fontSize: 14,
    marginTop: -8,
  },
});

