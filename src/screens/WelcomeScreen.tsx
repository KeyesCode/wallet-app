import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { generateMnemonic, validateMnemonic } from "../crypto/evm";
import { storeMnemonic } from "../crypto/vault";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export default function WelcomeScreen({ navigation }: Props) {
  const [mnemonic, setMnemonic] = useState("");

  const onCreate = async () => {
    const m = generateMnemonic();
    setMnemonic(m);
    await storeMnemonic(m);
    Alert.alert("Wallet created", "Mnemonic stored (encrypted). Save it safely!");
    navigation.replace("Wallet");
  };

  const onImport = async () => {
    const m = mnemonic.trim().toLowerCase();
    if (!validateMnemonic(m)) {
      Alert.alert("Invalid mnemonic", "Check spelling and word order.");
      return;
    }
    await storeMnemonic(m);
    navigation.replace("Wallet");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EVM Wallet (Expo MVP)</Text>

      <Button title="Create New Wallet" onPress={onCreate} />

      <Text style={styles.label}>Or import seed phrase:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter 12/24-word mnemonic"
        value={mnemonic}
        onChangeText={setMnemonic}
        multiline
      />
      <Button title="Import Wallet" onPress={onImport} />
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
});

