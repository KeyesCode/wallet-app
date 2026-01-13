import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import WelcomeScreen from "../screens/WelcomeScreen";
import WalletScreen from "../screens/WalletScreen";
import SendScreen from "../screens/SendScreen";
import SetPinScreen from "../screens/SetPinScreen";
import UnlockScreen from "../screens/UnlockScreen";
import ChangePinScreen from "../screens/ChangePinScreen";
import { hasEncryptedMnemonic } from "../crypto/vault";

export type RootStackParamList = {
  Welcome: undefined;
  SetPin: { mnemonic: string };
  Unlock: undefined;
  Wallet: undefined;
  Send: undefined;
  ChangePin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList>("Welcome");

  useEffect(() => {
    (async () => {
      try {
        const hasEncrypted = await hasEncryptedMnemonic();
        setInitialRoute(hasEncrypted ? "Unlock" : "Welcome");
      } catch (e) {
        console.error("Error checking wallet state:", e);
        setInitialRoute("Welcome");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SetPin" component={SetPinScreen} />
      <Stack.Screen name="Unlock" component={UnlockScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Send" component={SendScreen} />
      <Stack.Screen name="ChangePin" component={ChangePinScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
