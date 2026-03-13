import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DisclaimerScreen from "../components/DisclaimerScreen";

const DISCLAIMER_KEY = "disclaimerAccepted";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DISCLAIMER_KEY).then((value) => {
      setAccepted(value === "true");
      setIsReady(true);
    });
  }, []);

  const handleAccept = async () => {
    await AsyncStorage.setItem(DISCLAIMER_KEY, "true");
    setAccepted(true);
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#4C6FFF" />
      </View>
    );
  }

  if (!accepted) {
    return <DisclaimerScreen onAccept={handleAccept} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="legal" options={{ headerShown: false }} />
    </Stack>
  );
}