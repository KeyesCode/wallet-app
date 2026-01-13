import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "../screens/WelcomeScreen";
import WalletScreen from "../screens/WalletScreen";
import SendScreen from "../screens/SendScreen";

export type RootStackParamList = {
  Welcome: undefined;
  Wallet: undefined;
  Send: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Send" component={SendScreen} />
    </Stack.Navigator>
  );
}

