import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { generateMnemonic, validateMnemonic } from "../crypto/evm";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  const [mnemonic, setMnemonic] = useState("");

  const onCreate = async () => {
    try {
      const m = generateMnemonic();
      setMnemonic(m);
      Alert.alert(
        "Wallet created",
        "Save your mnemonic safely! You'll set a PIN next.",
        [
          {
            text: "OK",
            onPress: () => {
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
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <Text style={styles.title}>EVM Wallet (Expo MVP)</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={onCreate}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Create New Wallet</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Or import seed phrase:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter 12/24-word mnemonic"
          value={mnemonic}
          onChangeText={setMnemonic}
          multiline
        />
        <TouchableOpacity
          style={styles.button}
          onPress={onImport}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Import Wallet</Text>
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
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, marginTop: 12 },
  label: { marginTop: 16, fontWeight: "600", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    minHeight: 90,
    backgroundColor: "#fff",
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
