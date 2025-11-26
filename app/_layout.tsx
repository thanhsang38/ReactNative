import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

// Loại bỏ import useColorScheme vì chúng ta không cần phát hiện chủ đề hệ thống nữa.
// import { useColorScheme } from '@/hooks/use-color-scheme'; 

export const unstable_settings = {}; 

export default function RootLayout() {
  // KHÔNG cần gọi useColorScheme() nữa

  return (
    // THAY ĐỔI LỚN: Cố định giá trị ThemeProvider là DefaultTheme (Light Mode)
    <ThemeProvider value={DefaultTheme}> 
      <Stack>
        {/* Route Auth gộp */}
        <Stack.Screen name="auth/auth-screen" options={{ headerShown: false }} /> 
        <Stack.Screen name="order-detail" options={{ presentation: 'modal', title: 'Chi Tiết Đơn Hàng' }} />
        <Stack.Screen name="product-detail" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="checkout" options={{ presentation: 'modal', title: 'Thanh Toán' }} />
        {/* Các màn hình chính (Tabs) và Modal */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      {/* Giữ auto, nhưng vì theme là sáng, thanh trạng thái sẽ tự chọn màu phù hợp */}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}