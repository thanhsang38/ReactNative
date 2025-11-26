import { Tabs } from 'expo-router';
import React from 'react';
import { ThemedText } from '@/components/themed-text';
import { HapticTab } from '@/components/haptic-tab';
// Đã loại bỏ IconSymbol, thay bằng Emoji trong title
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        // tabBarButton: HapticTab, // Tùy chọn, có thể bỏ comment nếu HapticTab có lỗi
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home ',
          tabBarIcon: ({ color, size }) => <ThemedText style={{ fontSize: size, color }}>🏠</ThemedText>,
        }}
      />
      

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn Hàng ',
          tabBarIcon: ({ color, size }) => <ThemedText style={{ fontSize: size, color }}>🧾</ThemedText>,
        }}
      />
   <Tabs.Screen
        name="profile"
        options={{
          title: 'Tôi 👤',
          tabBarIcon: ({ color, size }) => <ThemedText style={{ fontSize: size, color }}>👤</ThemedText>,
        }}
      />
     
    </Tabs>
  );
}