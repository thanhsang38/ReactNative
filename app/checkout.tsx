import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  Platform,
  Alert, // Thêm Alert cho xử lý lỗi/xác nhận
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router"; // 💡 SỬ DỤNG ROUTER

// 💡 IMPORTS COMPONENTS & CONTEXTS
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useOrders } from "../context/OrderContext";

// --- Giả định Types & Constants ---
type Page = string;

const PAYMENT_METHODS = [
  { id: "cash", name: "Tiền mặt", icon: "💵" },
  { id: "momo", name: "MoMo", icon: "🟣" },
  { id: "zalopay", name: "ZaloPay", icon: "🔵" },
  { id: "banking", name: "Chuyển khoản", icon: "🏦" },
];

const COLORS = {
  bg: "#f8fafc",
  white: "#ffffff",
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  emerald50: "#f0fff4",
  emerald500: "#10b981",
  emerald600: "#059669",
  teal600: "#0d9488",
};
// -----------------------------------------------------------

interface CheckoutPageProps {
  // navigateTo đã bị loại bỏ, goBack được giữ lại
  goBack: () => void;
}

export function CheckoutPage({ goBack }: CheckoutPageProps) {
  const router = useRouter(); // Khởi tạo Router
  const { user } = useAuth();
  const { items, getTotalPrice, clearCart } = useCart();
  const { createOrder } = useOrders();
  const insets = useSafeAreaInsets();

  // --- State Khởi tạo ---
  const [address, setAddress] = useState("123 Nguyễn Huệ, Quận 1, TP.HCM");
  const [phone, setPhone] = useState(user?.phone || "0901234567");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [note, setNote] = useState("");

  const headerHeight = 50 + insets.top;
  const totalPrice = getTotalPrice();

  const handlePlaceOrder = () => {
    // 💡 Logic Xử lý Đặt hàng
    if (items.length === 0) {
      Alert.alert("Lỗi", "Giỏ hàng đang trống!");
      return;
    }

    // 1. Tạo đơn hàng
    createOrder({
      items: items,
      total: totalPrice,
      deliveryAddress: address,
      paymentMethod: paymentMethod,
      phone: phone,
      note: note,
      estimatedTime: "20-30 phút",
    });

    // 2. Xóa giỏ hàng
    clearCart();

    // 3. 💡 ĐIỀU HƯỚNG SỬ DỤNG ROUTER
    // Điều hướng tới Orders Tab và xóa màn hình Checkout khỏi Stack
    router.replace("/(tabs)/orders");
  };

  return (
    <View style={styles.fullContainer}>
      {/* 1. Header (Fixed/Absolute) */}
      <Header title="Thanh toán" showBack={true} onBack={goBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: headerHeight }}
      >
        <View style={styles.contentPadding}>
          {/* Delivery Address */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Feather name="map-pin" size={20} color={COLORS.emerald600} />
              <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/address")} // 💡 ROUTER: Chuyển đến màn hình Address
              style={styles.addressButton}
              activeOpacity={0.7}
            >
              <View style={styles.addressInfo}>
                <Text style={styles.addressName}>{user?.name}</Text>
                <Text style={styles.addressDetail}>{address}</Text>
                <Text style={styles.addressPhone}>{phone}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.slate400} />
            </TouchableOpacity>
          </View>

          {/* Order Items Preview (Preview Sản phẩm đã chọn) */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Sản phẩm đã chọn</Text>
            <View style={styles.itemsList}>
              {items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  {/* Ảnh sản phẩm (Dùng Image RN) */}
                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                  />
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemOptionsText}>
                      {item.size} • Đá {item.ice}% • Đường {item.sugar}%
                    </Text>
                  </View>
                  <View style={styles.itemPriceQty}>
                    <Text style={styles.itemQty}>x{item.quantity}</Text>
                    <Text style={styles.itemPrice}>
                      {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Feather name="credit-card" size={20} color={COLORS.emerald600} />
              <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            </View>
            <View style={styles.paymentMethodsGrid}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  onPress={() => setPaymentMethod(method.id)}
                  style={[
                    styles.paymentButton,
                    method.id === paymentMethod
                      ? styles.paymentActive
                      : styles.paymentInactive,
                  ]}
                >
                  <View style={styles.paymentLeft}>
                    <Text style={styles.paymentEmoji}>{method.icon}</Text>
                    <Text style={styles.paymentName}>{method.name}</Text>
                  </View>
                  {method.id === paymentMethod && (
                    <View style={styles.radioActiveOuter}>
                      <View style={styles.radioActiveInner} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Note */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Feather name="file-text" size={20} color={COLORS.emerald600} />
              <Text style={styles.sectionTitle}>Ghi chú cho người bán</Text>
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Ví dụ: Giao hàng trước 3h chiều..."
              style={styles.noteInput}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Chi tiết đơn hàng</Text>
            <View style={styles.summaryDetails}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tạm tính</Text>
                <Text style={styles.summaryValue}>
                  {totalPrice.toLocaleString("vi-VN")}đ
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
                <Text style={styles.summaryValueFree}>Miễn phí</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Giảm giá</Text>
                <Text style={styles.summaryValueFree}>0đ</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Tổng thanh toán</Text>
                <Text style={styles.summaryTotalPrice}>
                  {totalPrice.toLocaleString("vi-VN")}đ
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Padding Bù đắp cho Bottom Bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* 3. Bottom Bar (Fixed/Absolute) */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 16 }]}>
        <View style={styles.bottomBarInner}>
          <View style={styles.bottomBarSummary}>
            <Text style={styles.bottomBarLabel}>Tổng thanh toán</Text>
            <Text style={styles.bottomBarPrice}>
              {totalPrice.toLocaleString("vi-VN")}đ
            </Text>
          </View>
          <TouchableOpacity
            onPress={handlePlaceOrder}
            style={styles.placeOrderButton}
            disabled={items.length === 0}
          >
            <LinearGradient
              colors={[COLORS.emerald600, COLORS.teal600]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.placeOrderButtonBackground}
            />
            <Text style={styles.placeOrderButtonText}>Đặt hàng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
export default CheckoutPage;
// -----------------------------------------------------------
// 💡 STYLE SHEET
// -----------------------------------------------------------

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: COLORS.slate50 },
  contentPadding: { paddingHorizontal: 16, paddingVertical: 16 },
  // --- General Cards ---
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.slate800,
    fontSize: 16,
    fontWeight: "bold",
  },
  // --- Delivery Address ---
  addressButton: {
    padding: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    color: COLORS.slate700,
    marginBottom: 4,
    fontWeight: "500",
    fontSize: 16,
  },
  addressDetail: {
    color: COLORS.slate600,
    fontSize: 14,
    marginBottom: 8,
  },
  addressPhone: {
    color: COLORS.slate500,
    fontSize: 14,
  },
  // --- Order Items Preview ---
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  itemImage: {
    width: 64,
    height: 64,
    resizeMode: "cover",
    borderRadius: 8,
  },
  itemDetail: {
    flex: 1,
  },
  itemName: {
    color: COLORS.slate800,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  itemOptionsText: {
    color: COLORS.slate500,
    fontSize: 12,
  },
  itemPriceQty: {
    alignItems: "flex-end",
  },
  itemQty: {
    color: COLORS.slate700,
    fontSize: 14,
    marginBottom: 4,
  },
  itemPrice: {
    color: COLORS.emerald600,
    fontSize: 14,
    fontWeight: "500",
  },
  // --- Payment Method ---
  paymentMethodsGrid: {
    gap: 8,
  },
  paymentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentEmoji: {
    fontSize: 24,
  },
  paymentName: {
    color: COLORS.slate700,
    fontSize: 16,
  },
  paymentActive: {
    borderColor: COLORS.emerald500,
    backgroundColor: COLORS.emerald50,
  },
  paymentInactive: {
    borderColor: COLORS.slate200,
    backgroundColor: COLORS.white,
  },
  radioActiveOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 5,
    borderColor: COLORS.emerald500,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActiveInner: {
    width: 0,
    height: 0,
  },
  noteInput: {
    width: "100%",
    padding: 12,
    borderWidth: 2,
    borderColor: COLORS.slate200,
    borderRadius: 8,
    backgroundColor: COLORS.slate50,
    fontSize: 15,
    minHeight: 100, // rows=3
    textAlignVertical: "top",
  },
  // --- Summary ---
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    color: COLORS.slate800,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  summaryDetails: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    color: COLORS.slate600,
    fontSize: 14,
  },
  summaryValue: {
    color: COLORS.slate600,
    fontSize: 14,
  },
  summaryValueFree: {
    // Style cho phí vận chuyển/giảm giá
    color: COLORS.emerald600,
    fontSize: 14,
  },
  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    paddingTop: 8,
    marginTop: 8,
  },
  summaryTotalLabel: {
    color: COLORS.slate800,
    fontSize: 16,
    fontWeight: "bold",
  },
  summaryTotalPrice: {
    color: COLORS.emerald600,
    fontSize: 20,
    fontWeight: "bold",
  },
  // --- Bottom Bar ---
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 60,
  },
  bottomBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  bottomBarSummary: {
    flex: 1,
  },
  bottomBarLabel: { color: COLORS.slate600, fontSize: 14 },
  bottomBarPrice: {
    color: COLORS.emerald600,
    fontSize: 20,
    fontWeight: "bold",
  },
  placeOrderButton: {
    flex: 1.5,
    borderRadius: 12,
    overflow: "hidden",
    paddingVertical: 16,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.emerald500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  placeOrderButtonBackground: { ...StyleSheet.absoluteFillObject },
  placeOrderButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    zIndex: 1,
  },
});
