import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCart } from "../context/CartContext";

type Page = string;

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showCart?: boolean;
  onBack?: () => void;
  // Loại bỏ navigateTo vì đã dùng useRouter.push/router.back()
}

const COLORS = {
  white: "#ffffff",
  slate200: "#e2e8f0",
  slate700: "#334155",
  slate800: "#1e293b",
  emerald600: "#059669",
};

export function Header({ title, showBack, showCart, onBack }: HeaderProps) {
  const router = useRouter();
  const { getTotalItems } = useCart();
  const cartCount = getTotalItems();
  const insets = useSafeAreaInsets();

  const headerHeight = 50 + insets.top;

  // 💡 HÀM XỬ LÝ QUAY LẠI TỔNG HỢP
  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          height: headerHeight,
        },
      ]}
    >
      <View style={styles.innerContent}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity
              onPress={handleGoBack}
              style={styles.backButton}
              activeOpacity={0.8}
            >
              <Feather name="arrow-left" size={24} color={COLORS.slate700} />
            </TouchableOpacity>
          )}
          {/* 💡 Tiêu đề */}
          <Text
            style={[styles.titleText, !showBack && styles.titleNoBack]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        {/* Nút Giỏ hàng */}
        {showCart && (
          <TouchableOpacity
            onPress={() => router.push("/cart")} // Dùng router trực tiếp
            style={styles.cartButton}
            activeOpacity={0.8}
          >
            <Feather name="shopping-cart" size={24} color={COLORS.slate700} />

            {/* Badge Giỏ hàng */}
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {cartCount > 99 ? "99+" : cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// -----------------------------------------------------------
// STYLE SHEET (Đã tối ưu hóa Flexbox)
// -----------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
    zIndex: 40,
    paddingHorizontal: 16,
    justifyContent: "flex-end",
  },
  innerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
    width: "100%",
    height: 50,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    // 💡 GIỮ GAP: Đây là khoảng cách giữa nút Back và Tiêu đề
    gap: 12,
    flex: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  titleText: {
    fontSize: 18,
    color: COLORS.slate800,
    fontWeight: "600",
    flexShrink: 1,
  },
  // 💡 STYLE MỚI: Nếu không có nút Back, ta cần đẩy tiêu đề vào sát mép trái (tính cả padding 16px của container)
  titleNoBack: {
    // Để tiêu đề không bị padding của leftSection ảnh hưởng
    // Nếu leftSection không có nút Back, thì Tiêu đề sẽ bị căn giữa
    marginLeft: 10, // Bù đắp cho gap 12px
    paddingLeft: 0,
  },
  cartButton: {
    padding: 8,
    borderRadius: 8,
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.emerald600,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
    lineHeight: 20,
  },
});
