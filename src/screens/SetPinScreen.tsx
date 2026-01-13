import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { storeMnemonicWithPin } from "../crypto/vault";
import { useWallet } from "../context/WalletContext";

type Props = NativeStackScreenProps<RootStackParamList, "SetPin">;

export default function SetPinScreen({ navigation, route }: Props) {
  const { mnemonic } = route.params;
  const { setMnemonic } = useWallet();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSetting, setIsSetting] = useState(false);

  const onSetPin = async () => {
    if (pin.length < 4) {
      Alert.alert("Invalid PIN", "PIN must be at least 4 digits");
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert("PIN Mismatch", "PINs do not match");
      return;
    }

    try {
      setIsSetting(true);
      await storeMnemonicWithPin(mnemonic, pin);
      setMnemonic(mnemonic); // Store in memory
      Alert.alert("Success", "PIN set successfully");
      navigation.replace("Wallet");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to set PIN");
    } finally {
      setIsSetting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set PIN</Text>
      <Text style={styles.description}>
        Create a PIN to secure your wallet. You'll need this PIN to unlock your
        wallet.
      </Text>

      <Text style={styles.label}>Enter PIN (min 4 digits)</Text>
      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        placeholder="Enter PIN"
        keyboardType="numeric"
        secureTextEntry
        maxLength={20}
      />

      <Text style={styles.label}>Confirm PIN</Text>
      <TextInput
        style={styles.input}
        value={confirmPin}
        onChangeText={setConfirmPin}
        placeholder="Confirm PIN"
        keyboardType="numeric"
        secureTextEntry
        maxLength={20}
      />

      <Button
        title={isSetting ? "Setting PIN..." : "Set PIN"}
        onPress={onSetPin}
        disabled={isSetting || pin.length < 4 || pin !== confirmPin}
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
});

