import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { changePin } from "../crypto/vault";

type Props = NativeStackScreenProps<RootStackParamList, "ChangePin">;

export default function ChangePinScreen({ navigation }: Props) {
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  const onChangePin = async () => {
    if (oldPin.length < 4 || newPin.length < 4) {
      Alert.alert("Invalid PIN", "PIN must be at least 4 digits");
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert("PIN Mismatch", "New PINs do not match");
      return;
    }

    if (oldPin === newPin) {
      Alert.alert("Invalid", "New PIN must be different from old PIN");
      return;
    }

    try {
      setIsChanging(true);
      const success = await changePin(oldPin, newPin);

      if (!success) {
        Alert.alert("Error", "Incorrect old PIN");
        setOldPin("");
        return;
      }

      Alert.alert("Success", "PIN changed successfully", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to change PIN");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change PIN</Text>
      <Text style={styles.description}>
        Enter your current PIN and choose a new one
      </Text>

      <Text style={styles.label}>Current PIN</Text>
      <TextInput
        style={styles.input}
        value={oldPin}
        onChangeText={setOldPin}
        placeholder="Enter current PIN"
        keyboardType="numeric"
        secureTextEntry
        maxLength={20}
      />

      <Text style={styles.label}>New PIN (min 4 digits)</Text>
      <TextInput
        style={styles.input}
        value={newPin}
        onChangeText={setNewPin}
        placeholder="Enter new PIN"
        keyboardType="numeric"
        secureTextEntry
        maxLength={20}
      />

      <Text style={styles.label}>Confirm New PIN</Text>
      <TextInput
        style={styles.input}
        value={confirmPin}
        onChangeText={setConfirmPin}
        placeholder="Confirm new PIN"
        keyboardType="numeric"
        secureTextEntry
        maxLength={20}
      />

      <Button
        title={isChanging ? "Changing..." : "Change PIN"}
        onPress={onChangePin}
        disabled={
          isChanging ||
          oldPin.length < 4 ||
          newPin.length < 4 ||
          newPin !== confirmPin
        }
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

