import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import { toastConfig } from "../components/CustomToast";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { OrderProvider } from "../context/OrderContext";
export const unstable_settings = {};

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
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Đang tải ứng dụng...</Text>
      </View>
    );
  }

  const userIsLoggedIn = !!user;

  if (!userIsLoggedIn) {
    return (
      <Stack>
        <Stack.Screen name="IntroScreen" options={{ headerShown: false }} />
        {/* 1. Màn hình Auth (App.tsx) */}
        <Stack.Screen name="App" options={{ headerShown: false }} />

        {/* 2. 💡 SỬA LỖI: Chỉ cần khai báo NHÓM TABS một lần */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* 3. Khai báo các route Stack độc lập (Giữ nguyên) */}
        <Stack.Screen
          name="order-detail"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="product-detail"
          options={{ presentation: "card", headerShown: false }}
        />
        <Stack.Screen
          name="checkout"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="address"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="vouchers"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="favorites"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="Review"
          options={{ presentation: "modal", headerShown: false }}
        />

        <Stack.Screen
          name="notifications"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
        <Stack.Screen
          name="cart" // 👈 Tên file của bạn (giả sử là cart.tsx)
          options={{
            presentation: "modal", // Thường dùng cho các màn hình tạm thời
            headerShown: false, // 💡 ẨN HEADER STACK (Tiêu đề trên cùng)
          }}
        />
      </Stack>
    );
  } // 3. Authenticated Flow: Đã đăng nhập

  return (
    <Stack>
      {/* 💡 Màn hình chính là NHÓM TABS */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* Auth Screen (Ẩn trong luồng đã đăng nhập) */}
      <Stack.Screen name="App" options={{ headerShown: false }} />
      {/* Các route chi tiết/modal (Giữ nguyên) */}
      <Stack.Screen
        name="order-detail"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="product-detail"
        options={{ presentation: "card", headerShown: false }}
      />
      <Stack.Screen
        name="checkout"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="address"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="vouchers"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="favorites"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="Review"
        options={{ presentation: "modal", headerShown: false }}
      />

      <Stack.Screen
        name="notifications"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="modal"
        options={{ presentation: "modal", title: "Modal" }}
      />
      <Stack.Screen
        name="cart" // 👈 Tên file của bạn (giả sử là cart.tsx)
        options={{
          presentation: "modal", // Thường dùng cho các màn hình tạm thời
          headerShown: false, // 💡 ẨN HEADER STACK (Tiêu đề trên cùng)
        }}
      />
    </Stack>
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
