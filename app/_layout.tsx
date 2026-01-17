import AsyncStorage from "@react-native-async-storage/async-storage";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet } from "react-native";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import { ChatbotFAB } from "../components/ChatbotFAB";
import { toastConfig } from "../components/CustomToast";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { OrderProvider } from "../context/OrderContext";
import { useNotificationListener } from "./services/useNotificationListener";
export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <AuthProvider>
        <CartProvider>
          <OrderProvider>
            <RootLayoutContent />
          </OrderProvider>
        </CartProvider>
      </AuthProvider>

      <StatusBar style="auto" />
      <Toast config={toastConfig} />
    </ThemeProvider>
  );
}

function RootLayoutContent() {
  const { user, isLoading, isHydrated } = useAuth();
  const [hasSeenIntro, setHasSeenIntro] = React.useState<boolean | null>(null);
  const router = useRouter();

  const segments = useSegments();
  const isUserAuthenticated = !!user;
  const shouldShowFab = isUserAuthenticated && segments[0] === "(tabs)";
  useNotificationListener(user?.id);

  React.useEffect(() => {
    const loadIntroState = async () => {
      const seen = await AsyncStorage.getItem("hasSeenIntro");
      setHasSeenIntro(seen === "true");
    };
    loadIntroState();
  }, []);
  // React.useEffect(() => {
  //   const resetIntroForDemo = async () => {
  //     // ❗ XÓA CỜ INTRO
  //     await AsyncStorage.removeItem("hasSeenIntro");

  //     // ❗ Ép intro hiển thị lại
  //     setHasSeenIntro(false);
  //   };

  //   resetIntroForDemo();
  // }, []);

  React.useEffect(() => {
    if (hasSeenIntro === null) return; // chưa load intro
    if (isLoading) return; // chưa load auth

    const isLoggedIn = !!user;

    if (!hasSeenIntro) {
      router.replace("/IntroScreen");
      return;
    }

    if (!isLoggedIn) {
      router.replace("/App");
      return;
    }

    router.replace("/(tabs)");
  }, [hasSeenIntro, isLoading, user]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* 🔥 Mặn modal / pages chung (cả logged-in và logged-out đều dùng được nếu cần) */}

        <Stack.Screen name="address" options={{ presentation: "modal" }} />
        <Stack.Screen name="order-detail" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="product-detail"
          options={{ presentation: "card" }}
        />
        <Stack.Screen name="checkout" options={{ presentation: "modal" }} />
        <Stack.Screen name="vouchers" options={{ presentation: "modal" }} />
        <Stack.Screen name="favorites" options={{ presentation: "modal" }} />
        <Stack.Screen name="edit-profile" options={{ presentation: "modal" }} />
        <Stack.Screen name="Review" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="ChatbotScreen"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="ForgotPasswordScreen"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="notifications"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="support-chat" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="cart"
          options={{
            presentation: "modal",
          }}
        />

        {/* Nếu muốn tạo 1 modal chung */}
      </Stack>
      {shouldShowFab && <ChatbotFAB bottomOffset={100} />}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
});
