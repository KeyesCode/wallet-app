import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
      console.log("UnlockScreen: Starting unlock process...");
      console.log(
        "UnlockScreen: Loading mnemonic (this may take a few seconds due to PBKDF2)..."
      );

      const startTime = Date.now();
      const mnemonic = await loadMnemonicWithPin(pin);
      const duration = Date.now() - startTime;
      console.log(`UnlockScreen: Load mnemonic completed in ${duration}ms`);

      if (!mnemonic) {
        console.log("UnlockScreen: Incorrect PIN");
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
      console.log("UnlockScreen: PIN correct, unlocking wallet...");
      setMnemonic(mnemonic);
      setAttempts(0);
      navigation.replace("Wallet");
    } catch (e: any) {
      console.error("UnlockScreen: Error unlocking wallet", e);
      Alert.alert("Error", e.message ?? "Failed to unlock wallet");
    } finally {
      setIsUnlocking(false);
    }
  };

  const isDisabled = isUnlocking || pin.length < 4;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Unlock Wallet</Text>
        <Text style={styles.description}>
          Enter your PIN to access your wallet
        </Text>

        <Text style={styles.label}>PIN</Text>
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={(text) => {
            console.log("UnlockScreen: PIN changed", text.length);
            setPin(text);
          }}
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

        {isUnlocking && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>
              Decrypting wallet... This may take a few seconds.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, isDisabled && styles.buttonDisabled]}
          onPress={onUnlock}
          disabled={isDisabled}
          activeOpacity={0.7}
        >
          {isUnlocking ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator
                size="small"
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.buttonText}>Unlocking...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Unlock</Text>
          )}
        </TouchableOpacity>
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
    justifyContent: "center",
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
  warning: {
    color: "#b00020",
    fontSize: 14,
    marginTop: 8,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 12,
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
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
