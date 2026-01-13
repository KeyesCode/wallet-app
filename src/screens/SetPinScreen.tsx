import React, { useState } from "react";
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { storeMnemonicWithPin } from "../crypto/vault";
import { useWallet } from "../context/WalletContext";
import { initializeWalletMetadata } from "../services/walletMetadata";

type Props = NativeStackScreenProps<RootStackParamList, "SetPin">;

export default function SetPinScreen({ navigation, route }: Props) {
  const { mnemonic } = route.params;
  const { setMnemonic } = useWallet();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSetting, setIsSetting] = useState(false);

  const onSetPin = async () => {
    console.log("SetPinScreen: onSetPin called", { pinLength: pin.length, confirmPinLength: confirmPin.length });
    
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
      console.log("SetPinScreen: Storing mnemonic with PIN...");
      await storeMnemonicWithPin(mnemonic, pin);
      console.log("SetPinScreen: Initializing wallet metadata...");
      // Initialize wallet metadata with first account
      await initializeWalletMetadata(mnemonic);
      setMnemonic(mnemonic); // Store in memory
      console.log("SetPinScreen: Success, navigating to Wallet");
      Alert.alert("Success", "PIN set successfully", [
        {
          text: "OK",
          onPress: () => navigation.replace("Wallet"),
        },
      ]);
    } catch (e: any) {
      console.error("SetPinScreen: Error setting PIN", e);
      Alert.alert("Error", e.message ?? "Failed to set PIN");
    } finally {
      setIsSetting(false);
    }
  };

  const isDisabled = isSetting || pin.length < 4 || pin !== confirmPin;
  
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
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
          onChangeText={(text) => {
            console.log("SetPinScreen: PIN changed", text.length);
            setPin(text);
          }}
          placeholder="Enter PIN"
          keyboardType="numeric"
          secureTextEntry
          maxLength={20}
        />

        <Text style={styles.label}>Confirm PIN</Text>
        <TextInput
          style={styles.input}
          value={confirmPin}
          onChangeText={(text) => {
            console.log("SetPinScreen: Confirm PIN changed", text.length);
            setConfirmPin(text);
          }}
          placeholder="Confirm PIN"
          keyboardType="numeric"
          secureTextEntry
          maxLength={20}
        />

        <TouchableOpacity
          style={[styles.button, isDisabled && styles.buttonDisabled]}
          onPress={onSetPin}
          disabled={isDisabled}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>
            {isSetting ? "Setting PIN..." : "Set PIN"}
          </Text>
        </TouchableOpacity>
        
        {isDisabled && (
          <Text style={styles.hint}>
            {pin.length < 4
              ? "PIN must be at least 4 digits"
              : pin !== confirmPin
              ? "PINs do not match"
              : ""}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: { 
    flex: 1, 
    padding: 16, 
    justifyContent: "center" 
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  description: { marginBottom: 24, color: "#666", lineHeight: 20 },
  label: { marginTop: 12, fontWeight: "600", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    marginTop: 8,
    color: "#666",
    fontSize: 12,
    textAlign: "center",
  },
});

