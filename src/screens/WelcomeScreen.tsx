import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { generateMnemonic, validateMnemonic } from "../crypto/evm";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  const [mnemonic, setMnemonic] = useState("");

  const onCreate = async () => {
    console.log("onCreate called");
    try {
      console.log("Generating mnemonic...");
      const m = generateMnemonic();
      console.log("Mnemonic generated:", m.substring(0, 20) + "...");
      setMnemonic(m);
      Alert.alert(
        "Wallet created",
        "Save your mnemonic safely! You'll set a PIN next.",
        [
          {
            text: "OK",
            onPress: () => {
              console.log("Navigating to SetPin");
              navigation.navigate("SetPin", { mnemonic: m });
            },
          },
        ]
      );
    } catch (e: any) {
      console.error("Error creating wallet:", e);
      Alert.alert("Error", e?.message || "Failed to create wallet");
    }
  };

  const onImport = async () => {
    const m = mnemonic.trim().toLowerCase();
    if (!validateMnemonic(m)) {
      Alert.alert("Invalid mnemonic", "Check spelling and word order.");
      return;
    }
    navigation.navigate("SetPin", { mnemonic: m });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EVM Wallet (Expo MVP)</Text>

      <Pressable style={styles.button} onPress={onCreate}>
        <Text style={styles.buttonText}>Create New Wallet</Text>
      </Pressable>

      <Text style={styles.label}>Or import seed phrase:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter 12/24-word mnemonic"
        value={mnemonic}
        onChangeText={setMnemonic}
        multiline
      />
      <Pressable style={styles.button} onPress={onImport}>
        <Text style={styles.buttonText}>Import Wallet</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  label: { marginTop: 12, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    minHeight: 90,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
