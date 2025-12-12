// app/(tabs)/_layout.tsx (Code an toàn, không có hooks context)

import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#059669",
        headerShown: false, // Ẩn tiêu đề Stack
      }}
    >
      {/* Home */}
      <Tabs.Screen
        name="index" // Nếu file của bạn là index.tsx
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color }) => (
            <Feather name="home" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "Thực đơn",
          tabBarIcon: ({ color }) => (
            <Feather name="shopping-bag" color={color} size={24} />
          ),
        }}
      />
      {/* Orders */}
      <Tabs.Screen
        name="orders" // Nếu file của bạn là orders.tsx
        options={{
          title: "Đơn hàng",
          tabBarIcon: ({ color }) => (
            <Feather name="file-text" color={color} size={24} />
          ),
        }}
      />
      {/* Profile */}
      <Tabs.Screen
        name="profile" // Nếu file của bạn là profile.tsx
        options={{
          title: "Tài khoản",
          tabBarIcon: ({ color }) => (
            <Feather name="user" color={color} size={24} />
          ),
        }}
      />
      {/* Thêm các Tabs.Screen khác nếu cần */}
    </Tabs>
  );
}
