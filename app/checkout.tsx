import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router"; // 💡 SỬ DỤNG ROUTER
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { AddressRow, getAddresses, OrderCartItem } from "./services/baserowApi";
// 💡 IMPORTS COMPONENTS & CONTEXTS
import * as Location from "expo-location";
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { CreateOrderInput, useOrders } from "../context/OrderContext";
import { getOSRMDistance } from "./services/mapService";

// --- Giả định Types & Constants ---
type Page = string;
interface DefaultAddress {
  id: number;
  addressText: string;
  phone: string;
}
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
  red500: "#ef4444",
};
// -----------------------------------------------------------

interface CheckoutPageProps {
  // navigateTo đã bị loại bỏ, goBack được giữ lại
  goBack: () => void;
}

export function CheckoutPage({ goBack }: CheckoutPageProps) {
  const router = useRouter(); // Khởi tạo Router
  const { user } = useAuth();
  const {
    items,
    getSubtotal,
    getDiscountAmount,
    getTotalPrice,
    clearCart,
    selectedVoucher,
    getShippingFee, // 💡 Lấy hàm tính phí ship
    updateDistance, // 💡 Lấy hàm cập nhật khoảng cách
    distance,
  } = useCart();
  const { createOrder } = useOrders();
  const insets = useSafeAreaInsets();

  // --- State Khởi tạo ---
  const [defaultAddress, setDefaultAddress] = useState<DefaultAddress | null>(
    null,
  );
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<AddressRow[]>(
    [],
  );

  const headerHeight = 10 + insets.top;
  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const totalPrice = getTotalPrice(); // Tổng cuối cùng sau giảm giá

  const fetchDefaultAddress = async () => {
    if (!user || !user.id) return;

    setIsAddressLoading(true);
    try {
      const result = await getAddresses(user.id);
      if (result.success && result.data && result.data.length > 0) {
        // ✅ LƯU TRỮ TẤT CẢ ĐỊA CHỈ
        setAvailableAddresses(result.data); // Sắp xếp để tìm địa chỉ mặc định hoặc địa chỉ cũ nhất (ID nhỏ nhất)

        const sortedAddresses = result.data.sort((a, b) => {
          if (a.is_default !== b.is_default) {
            return a.is_default ? -1 : 1; // Mặc định lên đầu
          }
          return a.id - b.id; // Nếu không có mặc định, lấy ID nhỏ nhất
        });

        const defaultAddr = sortedAddresses[0];
        if (defaultAddr) {
          // Thực hiện y hệt bước Geocoding + OSRM ở trên để có phí ship ngay khi mở trang
          const geo = await Location.geocodeAsync(defaultAddr.address);
          if (geo.length > 0) {
            const km = await getOSRMDistance(geo[0].latitude, geo[0].longitude);
            updateDistance(km);
          }
        }
        setDefaultAddress({
          id: defaultAddr.id,
          addressText: defaultAddr.address,
          phone: user.phone || "N/A",
        });
      } else {
        setDefaultAddress(null); // Không có địa chỉ nào
        setAvailableAddresses([]);
      }
    } catch (e) {
      console.error("Error fetching default address:", e);
      Toast.show({
        type: "error",
        text1: "Lỗi tải địa chỉ",
        text2: "Vui lòng kiểm tra lại trang Địa chỉ.",
        visibilityTime: 3000,
      });
    } finally {
      setIsAddressLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchDefaultAddress();
      }
    }, [user?.id]),
  );

  const handleAddressSelect = async (selectedAddr: AddressRow) => {
    if (!user) return;

    // 1. Cập nhật UI ngay lập tức
    setDefaultAddress({
      id: selectedAddr.id,
      addressText: selectedAddr.address,
      phone: user.phone || "N/A",
    });
    setShowAddressModal(false);

    // 2. Tính toán phí ship cho địa chỉ mới
    try {
      // Chuyển địa chỉ chữ thành tọa độ (Geocoding)
      const geo = await Location.geocodeAsync(selectedAddr.address);
      if (geo.length > 0) {
        const { latitude, longitude } = geo[0];

        // Tính khoảng cách đường bộ bằng OSRM
        const km = await getOSRMDistance(latitude, longitude);

        // Cập nhật vào CartContext để tự tính phí ship mới
        updateDistance(km);
        Toast.show({
          type: "success",
          text1: "Đã cập nhật phí ship",
          text2: `Khoảng cách: ${km.toFixed(1)} km`,
        });
      }
    } catch (error) {
      console.error("Không thể tính phí ship cho địa chỉ này:", error);
    }
  };
  const handleNavigateToAddAddress = () => {
    setShowAddressModal(false);
    router.push("/address");
  };
  const handlePlaceOrder = async () => {
    console.log("🚀 [CHECKPOINT] Bắt đầu nhấn đặt hàng");

    if (items.length === 0) {
      console.log("❌ Lỗi: Giỏ hàng trống");
      Alert.alert("Lỗi", "Giỏ hàng đang trống!");
      return;
    }
    if (!defaultAddress) {
      console.log("❌ Lỗi: Chưa chọn địa chỉ");
      Alert.alert("Lỗi", "Vui lòng chọn địa chỉ giao hàng trước khi đặt.");
      return;
    }

    console.log("💳 Phương thức thanh toán đã chọn:", paymentMethod);
    setIsPlacingOrder(true);

    const apiItems: OrderCartItem[] = items.map((item) => ({
      productId: item.productId,
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      ice: item.ice,
      sugar: item.sugar,
      isDrink: item.isDrink,
    }));

    const orderInput: CreateOrderInput = {
      items: apiItems,
      total: totalPrice,
      deliveryAddressId: defaultAddress.id,
      paymentMethod: paymentMethod,
      deliveryAddressText: defaultAddress.addressText,
      note: note,
      voucherId: selectedVoucher?.id,
    };

    console.log(
      "📦 Dữ liệu đơn hàng gửi lên API:",
      JSON.stringify(orderInput, null, 2),
    );

    try {
      console.log("📡 Đang gọi API createOrder...");
      const result = await createOrder(orderInput);

      console.log("✅ Kết quả trả về từ API:", JSON.stringify(result, null, 2));

      if (result && result.success && result.data) {
        const newOrderId = result.data.id;
        console.log("🆔 Đơn hàng đã tạo thành công với ID:", newOrderId);

        clearCart();
        console.log("🛒 Đã xóa giỏ hàng");

        // KIỂM TRA ĐIỀU KIỆN CHUYỂN TRANG
        if (paymentMethod === "banking") {
          console.log("➡️ Đang chuyển hướng sang trang QR...");
          router.push({
            pathname: "/payment-qr",
            params: {
              orderId: newOrderId.toString(), // Ép kiểu sang string để an toàn
              total: totalPrice.toString(),
            },
          });
        } else {
          console.log(
            "➡️ Đang chuyển hướng về trang Orders (Tiền mặt/Khác)...",
          );
          router.replace("/(tabs)/orders");
        }
      } else {
        console.log(
          "⚠️ API trả về success: false hoặc không có data. Message:",
          result?.message,
        );
        router.replace("/(tabs)/orders");
      }
    } catch (e) {
      console.error("🔥 LỖI NGHIÊM TRỌNG TRONG TRY-CATCH:", e);
      Alert.alert("Lỗi", "Không thể đặt hàng. Vui lòng thử lại.");
    } finally {
      setIsPlacingOrder(false);
      console.log("🏁 Kết thúc quá trình xử lý đặt hàng");
    }
  };
  const isBusy = isAddressLoading || isPlacingOrder;
  const renderAddressModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showAddressModal}
      onRequestClose={() => setShowAddressModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn Địa chỉ Giao hàng</Text>
            <TouchableOpacity onPress={() => setShowAddressModal(false)}>
              <Feather name="x" size={24} color={COLORS.slate700} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            {availableAddresses.length === 0 ? (
              <Text style={styles.emptyAddressText}>
                Bạn chưa có địa chỉ nào được lưu.
              </Text>
            ) : (
              availableAddresses.map((addr, index) => {
                const isSelected = addr.id === defaultAddress?.id;
                return (
                  <TouchableOpacity
                    key={addr.id}
                    style={[
                      styles.addressOption,
                      isSelected && styles.addressOptionSelected,
                    ]}
                    onPress={() => handleAddressSelect(addr)}
                  >
                    <Feather
                      name={isSelected ? "check-circle" : "circle"}
                      size={20}
                      color={isSelected ? COLORS.emerald600 : COLORS.slate400}
                    />
                    <View style={styles.addressOptionInfo}>
                      <Text style={styles.addressOptionText}>
                        {addr.address}
                      </Text>
                      <Text style={styles.addressOptionType}>
                        {addr.is_default && "Mặc định"}
                        {addr.is_default
                          ? ` | Loại: ${addr.type}`
                          : `Loại: ${addr.type}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.addAddressButton}
            onPress={handleNavigateToAddAddress}
          >
            <Feather name="plus-circle" size={18} color={COLORS.white} />
            <Text style={styles.addAddressButtonText}>Thêm địa chỉ mới</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  return (
    <View style={styles.fullContainer}>
      {/* 1. Header (Fixed/Absolute) */}
      <Header title="Thanh toán" showBack={true} onBack={goBack} />
      {renderAddressModal()}
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
              onPress={() => setShowAddressModal(true)}
              style={styles.addressButton}
              activeOpacity={0.7}
              disabled={isAddressLoading}
            >
              <View style={styles.addressInfo}>
                {isAddressLoading ? (
                  <ActivityIndicator size="small" color={COLORS.slate500} />
                ) : defaultAddress ? (
                  <>
                    <Text style={styles.addressName}>{user?.name}</Text>
                    <Text style={styles.addressDetail}>
                      {defaultAddress.addressText}
                    </Text>
                    <Text style={styles.addressPhone}>
                      {defaultAddress.phone}
                    </Text>
                  </>
                ) : (
                  <Text
                    style={[styles.addressDetail, { color: COLORS.red500 }]}
                  >
                    Chưa có địa chỉ mặc định. Nhấn để thêm.
                  </Text>
                )}
              </View>
              <Feather name="chevron-right" size={20} color={COLORS.slate400} />
            </TouchableOpacity>
          </View>

          {/* Order Items Preview (Preview Sản phẩm đã chọn) */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Sản phẩm đã chọn</Text>
            <View style={styles.itemsList}>
              {items.map((item) => {
                // ✅ FIX: SỬ DỤNG CỜ isDrink TỪ CART ITEM
                const isDrinkItem = item.isDrink;

                return (
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
                      {/* ✅ FIX: LUÔN HIỆN SIZE, CHỈ HIỆN ĐÁ/ĐƯỜNG KHI LÀ ĐỒ UỐNG */}
                      <Text style={styles.itemOptionsText}>
                        {isDrinkItem &&
                          ` Size: ${item.size} • Đá ${item.ice}% • Đường ${item.sugar}%`}
                      </Text>
                    </View>
                    <View style={styles.itemPriceQty}>
                      <Text style={styles.itemQty}>x{item.quantity}</Text>
                      <Text style={styles.itemPrice}>
                        {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                      </Text>
                    </View>
                  </View>
                );
              })}
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
                  {subtotal.toLocaleString("vi-VN")}đ
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
                  {distance > 0 && (
                    <Text style={{ fontSize: 11, color: COLORS.slate500 }}>
                      ({distance.toFixed(1)} km)
                    </Text>
                  )}
                </View>

                <Text
                  style={
                    getShippingFee() === 0
                      ? styles.summaryValueFree
                      : styles.summaryValue
                  }
                >
                  {getShippingFee() === 0
                    ? "Miễn phí"
                    : `${getShippingFee().toLocaleString("vi-VN")}đ`}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Giảm giá</Text>
                <Text style={styles.summaryValueDiscount}>
                  - {discountAmount.toLocaleString("vi-VN")}đ
                  {/* ✅ SỬ DỤNG DISCOUNT AMOUNT */}
                </Text>
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
  contentPadding: { paddingHorizontal: 16, paddingVertical: 60 },
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    paddingTop: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.slate800,
  },
  emptyAddressText: {
    textAlign: "center",
    paddingVertical: 30,
    color: COLORS.slate500,
    fontSize: 15,
  },
  addressOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
    gap: 12,
  },
  addressOptionSelected: {
    backgroundColor: COLORS.emerald50,
  },
  addressOptionInfo: {
    flex: 1,
  },
  addressOptionText: {
    fontSize: 16,
    color: COLORS.slate800,
    fontWeight: "500",
  },
  addressOptionType: {
    fontSize: 12,
    color: COLORS.slate500,
    marginTop: 2,
  },
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.emerald600,
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    gap: 8,
  },
  addAddressButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  summaryValueDiscount: {
    // ✅ MỚI: Style cho giảm giá
    color: COLORS.red500,
    fontSize: 14,
    fontWeight: "600",
  },
});
