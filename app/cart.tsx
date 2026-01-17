import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// 💡 Sử dụng Feather và Ionicons để thay thế Lucide
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 💡 IMPORTS COMPONENTS & CONTEXTS
import * as Location from "expo-location";
import { Header } from "../components/Header"; // Component Header đã sửa
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext"; // Context Giỏ hàng
import { getAddresses } from "./services/baserowApi";
import { getOSRMDistance } from "./services/mapService";
// --- Giả định Types (Giữ nguyên) ---
type Page = string; // Để tương thích với navigateTo

// --- Constants ---

const COLORS = {
  bg: "#f8fafc", // slate-50
  white: "#ffffff",
  slate100: "#f1f5f9", // slate-100
  slate200: "#e2e8f0", // slate-200
  slate400: "#94a3b8", // slate-400
  slate500: "#64748b", // slate-500
  slate600: "#475569", // slate-600
  slate700: "#334155", // slate-700
  slate800: "#1e293b", // slate-800
  emerald500: "#10b981", // emerald-500
  emerald600: "#059669",
  teal600: "#0d9488", // teal-600
  red500: "#ef4444", // red-500
  amber100: "#fffbe6", // amber-100
};

interface CartPageProps {
  navigateTo: (page: Page) => void;
  goBack: () => void;
}

// -----------------------------------------------------------
// 💡 COMPONENT CHÍNH
// -----------------------------------------------------------

export function CartPage({ navigateTo, goBack }: CartPageProps) {
  const {
    items,
    updateQuantity,
    removeFromCart,
    getTotalPrice,
    selectedVoucher,
    setSelectedVoucher,
    getShippingFee,
    getDiscountAmount,
    getSubtotal,
    updateDistance,
    distance,
  } = useCart();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();
  // 💡 Chiều cao Header (cần thiết cho Layout)
  const headerHeight = 50 + insets.top;

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const shippingFee = getShippingFee(); // Lấy phí ship
  const finalTotal = getTotalPrice(); // Tổng cuối cùng sau giảm giá
  const [isShipLoading, setIsShipLoading] = React.useState(false);
  const [currentAddressId, setCurrentAddressId] = React.useState<number | null>(
    null
  );
  // Kiểm tra Free Shipping (để hiển thị)
  const isFreeShipping = shippingFee === 0;
  const isVoucherValid = React.useMemo(() => {
    if (!selectedVoucher) return true;

    // ❌ Không đạt đơn tối thiểu
    if (selectedVoucher.minOrder && subtotal < selectedVoucher.minOrder) {
      return false;
    }

    return true;
  }, [selectedVoucher, subtotal]);

  const voucherErrorMessage = React.useMemo(() => {
    if (!selectedVoucher) return "";

    if (selectedVoucher.minOrder && subtotal < selectedVoucher.minOrder) {
      return `Đơn hàng tối thiểu ${Number(
        selectedVoucher.minOrder
      ).toLocaleString("vi-VN")}đ để dùng mã này`;
    }

    return "";
  }, [selectedVoucher, subtotal]);

  useFocusEffect(
    React.useCallback(() => {
      const updateShippingByAddress = async () => {
        if (!user?.id) return;

        setIsShipLoading(true); // Luôn hiện loading để báo hiệu đang kiểm tra phí ship
        try {
          const result = await getAddresses(user.id);
          if (result.success && result.data && result.data.length > 0) {
            // Luôn lấy địa chỉ mặc định mới nhất trong Database
            const defaultAddr =
              result.data.find((a) => a.is_default) || result.data[0];

            if (defaultAddr) {
              // Chuyển địa chỉ chữ sang tọa độ
              const geo = await Location.geocodeAsync(defaultAddr.address);
              if (geo && geo.length > 0) {
                const km = await getOSRMDistance(
                  geo[0].latitude,
                  geo[0].longitude
                );

                // Cập nhật lại số km chuẩn của địa chỉ mặc định vào Context
                updateDistance(km);
                setCurrentAddressId(defaultAddr.id);
              }
            }
          }
        } catch (error) {
          console.error("Lỗi cập nhật phí ship:", error);
        } finally {
          setIsShipLoading(false);
        }
      };

      updateShippingByAddress();

      // 💡 Quan trọng: Cleanup function để reset trạng thái nếu cần
      return () => {};
    }, [user?.id]) // Bỏ currentAddressId khỏi dependency để nó luôn chạy khi focus
  );

  const handleCheckout = () => {
    if (items.length > 0) router.push("/checkout");
  };

  // --- TRẠNG THÁI GIỎ HÀNG TRỐNG ---
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Header title="Giỏ hàng" showBack={true} onBack={goBack} />

        <View style={styles.emptyContent}>
          <View style={styles.emptyIconWrapper}>
            <Feather name="shopping-bag" size={64} color={COLORS.slate400} />
          </View>
          <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
          <Text style={styles.emptySubtitle}>
            Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/menu")}
            style={styles.exploreButton}
          >
            <LinearGradient
              colors={[COLORS.emerald500, COLORS.teal600]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.exploreButtonText}>Khám phá thực đơn</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- TRẠNG THÁI GIỎ HÀNG ĐẦY ---
  return (
    <View style={styles.fullCartContainer}>
      {/* 1. Header (Fixed/Absolute) */}
      <Header title="Giỏ hàng" showBack={true} onBack={goBack} />

      {/* 2. Nội dung Cuộn */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ marginTop: headerHeight }}
      >
        <View style={styles.contentWrapper}>
          {/* Cart Items */}
          <View style={styles.itemsList}>
            {items.map((item) => {
              // ✅ LOGIC KIỂM TRA ĐỒ UỐNG: Nếu có giá trị Đá/Đường (khác 0), đó là đồ uống.
              // Nếu item.ice/item.sugar == 0, đó là đồ ăn (hoặc không chọn options)
              const isDrinkItem = item.isDrink;
              return (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemDetailsRow}>
                    {/* Ảnh sản phẩm */}
                    <Image
                      source={{ uri: item.image }}
                      style={styles.itemImage}
                    />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {/* Options */}

                      {/* ✅ FIX: LUÔN HIỂN THỊ SIZE (Size: M/L/S) */}

                      {/* ✅ CHỈ HIỂN THỊ ĐÁ VÀ ĐƯỜNG NẾU LÀ ĐỒ UỐNG */}
                      {isDrinkItem && (
                        <View style={styles.itemOptions}>
                          <Text style={styles.itemOptionText}>
                            Size: {item.size}
                          </Text>
                          <Text style={styles.itemOptionText}>
                            Đá: {item.ice}% • Đường: {item.sugar}%
                          </Text>
                        </View>
                      )}

                      {/* Price and Controls */}
                      <View style={styles.itemControlsRow}>
                        <Text style={styles.itemPrice}>
                          {Number(item.price).toLocaleString("vi-VN")}đ
                        </Text>
                        {/* Quantity Controls and Delete */}
                        <View style={styles.quantityControls}>
                          {/* Minus */}
                          <TouchableOpacity
                            onPress={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            style={styles.qtyButton}
                          >
                            <Feather
                              name="minus"
                              size={16}
                              color={COLORS.slate700}
                            />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}> {item.quantity} </Text>
                          {/* Plus */}
                          <TouchableOpacity
                            onPress={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            style={styles.qtyButton}
                          >
                            <Feather
                              name="plus"
                              size={16}
                              color={COLORS.slate700}
                            />
                          </TouchableOpacity>
                          {/* Delete Button */}
                          <TouchableOpacity
                            onPress={() => removeFromCart(item.id)}
                            style={styles.deleteButton}
                          >
                            <Feather
                              name="trash-2"
                              size={16}
                              color={COLORS.red500}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
          {/* Voucher Section */}
          <View style={styles.voucherSection}>
            <TouchableOpacity
              style={styles.voucherButton}
              onPress={() => router.push("/vouchers")}
            >
              <Text style={styles.voucherText}>🎟️ Mã giảm giá</Text>
              <Text style={styles.voucherLink}>
                {
                  selectedVoucher &&
                    (selectedVoucher.type === "percent"
                      ? `-${selectedVoucher.discount}%`
                      : `-${(
                          Number(selectedVoucher.discount) || 0
                        ).toLocaleString("vi-VN")}đ`) // Thêm Number() ở đây
                }
              </Text>
            </TouchableOpacity>
            {selectedVoucher && (
              <TouchableOpacity
                style={styles.removeVoucherButton}
                onPress={() => setSelectedVoucher(null)}
              >
                <Feather name="x" size={16} color={COLORS.red500} />
                <Text style={styles.removeVoucherText}>Hủy mã đã chọn</Text>
              </TouchableOpacity>
            )}
          </View>
          {selectedVoucher && !isVoucherValid && (
            <View style={styles.voucherWarning}>
              <Feather name="alert-circle" size={16} color={COLORS.red500} />
              <Text style={styles.voucherWarningText}>
                {voucherErrorMessage}
              </Text>
            </View>
          )}

          {/* Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Chi tiết thanh toán</Text>
            <View style={styles.summaryDetails}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Tạm tính (
                  {items.reduce((sum, item) => sum + item.quantity, 0)} món)
                </Text>
                <Text style={styles.summaryLabel}>
                  {subtotal.toLocaleString("vi-VN")}đ
                </Text>
              </View>
              {discountAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Giảm giá</Text>
                  <Text style={[styles.summaryLabel, { color: COLORS.red500 }]}>
                    -{discountAmount.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <View>
                  <Text style={styles.summaryLabel}>Phí giao hàng</Text>
                  {isShipLoading ? (
                    <Text style={{ fontSize: 11, color: COLORS.emerald600 }}>
                      Đang tính toán...
                    </Text>
                  ) : distance > 0 ? (
                    <Text style={{ fontSize: 11, color: COLORS.slate500 }}>
                      (Khoảng cách: {distance.toFixed(1)}km)
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 11, color: COLORS.red500 }}>
                      (Chưa chọn địa chỉ)
                    </Text>
                  )}
                </View>

                {isShipLoading ? (
                  <ActivityIndicator size="small" color={COLORS.emerald600} />
                ) : (
                  <Text
                    style={
                      isFreeShipping ? styles.summaryFree : styles.summaryLabel
                    }
                  >
                    {distance > 0
                      ? isFreeShipping
                        ? "Miễn phí"
                        : `${shippingFee.toLocaleString("vi-VN")}đ`
                      : "---"}
                  </Text>
                )}
              </View>
              <View style={styles.summaryTotalWrapper}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryTotalLabel}>Tổng cộng</Text>
                  <Text style={styles.summaryTotalPrice}>
                    {finalTotal.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Padding Bù đắp cho Bottom Bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 3. Bottom Bar (Fixed/Absolute) */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 16 }]}>
        <View style={styles.bottomBarInner}>
          <View>
            <Text style={styles.bottomBarLabel}>Tổng thanh toán</Text>
            <Text style={styles.bottomBarPrice}>
              {finalTotal.toLocaleString("vi-VN")}đ
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleCheckout}
            disabled={!isVoucherValid}
            style={[styles.checkoutButton, !isVoucherValid && { opacity: 0.5 }]}
          >
            <LinearGradient
              colors={[COLORS.emerald500, COLORS.teal600]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.checkoutButtonBackground}
            />
            <Text style={styles.checkoutButtonText}>Thanh toán</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
export default CartPage;

// -----------------------------------------------------------
// 💡 STYLE SHEET
// -----------------------------------------------------------

const styles = StyleSheet.create({
  // --- Global Containers ---
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  fullCartContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  contentWrapper: {
    padding: 16,
    paddingTop: 0,
  },
  // --- Empty Cart Styles ---
  emptyContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 80,
  },
  emptyIconWrapper: {
    width: 128, // w-32
    height: 128, // h-32
    backgroundColor: COLORS.slate100,
    borderRadius: 9999, // rounded-full
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24, // mb-6
  },
  emptyTitle: {
    color: COLORS.slate800,
    fontSize: 20, // text-xl
    marginBottom: 8,
    fontWeight: "bold",
  },
  emptySubtitle: {
    color: COLORS.slate600,
    textAlign: "center",
    marginBottom: 24,
    fontSize: 16,
  },
  exploreButton: {
    borderRadius: 12, // rounded-xl
    overflow: "hidden",
    paddingHorizontal: 32, // px-8
    paddingVertical: 12, // py-3
    position: "relative",
    minWidth: 200,
    shadowColor: COLORS.emerald500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  exploreButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    zIndex: 1,
  },
  // --- Cart Items List ---
  itemsList: {
    gap: 12, // space-y-3
    marginBottom: 24, // mb-6
  },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16, // rounded-2xl
    padding: 16, // p-4
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemDetailsRow: {
    flexDirection: "row",
    gap: 12, // gap-3
  },
  itemImage: {
    width: 96, // w-24
    height: 96, // h-24
    resizeMode: "cover",
    borderRadius: 8, // rounded-xl
  },
  itemInfo: {
    flex: 1,
    paddingRight: 4,
  },
  itemName: {
    color: COLORS.slate800,
    marginBottom: 4, // mb-1
    fontSize: 16,
    fontWeight: "600",
  },
  itemOptions: {
    gap: 2, // space-y-0.5
    marginBottom: 8, // mb-2
  },
  itemOptionText: {
    color: COLORS.slate500,
    fontSize: 12, // text-xs
  },
  itemPrice: {
    color: COLORS.emerald600,
    fontSize: 16,
    fontWeight: "600",
  },
  itemControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // gap-2
    backgroundColor: COLORS.slate100,
    borderRadius: 8, // rounded-lg
    padding: 4, // p-1
  },
  qtyButton: {
    padding: 4, // p-1
    borderRadius: 4,
  },
  qtyText: {
    color: COLORS.slate800,
    minWidth: 20,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
  deleteButton: {
    padding: 8, // p-2
    borderRadius: 8, // rounded-lg
    marginLeft: 8, // Thêm margin để tách khỏi quantity controls
  },
  // --- Voucher Section ---
  voucherSection: {
    marginBottom: 16, // mb-4
  },
  voucherButton: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  voucherLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // gap-3
  },
  voucherIconWrapper: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.amber100,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  voucherEmoji: {
    fontSize: 20,
  },
  voucherText: {
    color: COLORS.slate700,
    fontSize: 16,
  },
  voucherLink: {
    color: COLORS.emerald600,
    fontSize: 16,
  },
  // --- Summary Section ---
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryTitle: {
    color: COLORS.slate800,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  summaryDetails: {
    gap: 8, // space-y-2
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: {
    color: COLORS.slate600,
    fontSize: 14,
  },
  summaryFree: {
    color: COLORS.emerald600,
    fontSize: 14,
  },
  summaryTotalWrapper: {
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    paddingTop: 8,
    marginTop: 8,
  },
  summaryTotalLabel: {
    color: COLORS.slate800,
    fontSize: 14,
    fontWeight: "bold",
  },
  summaryTotalPrice: {
    color: COLORS.emerald600,
    fontSize: 16,
    fontWeight: "bold",
  },
  // --- Bottom Fixed Bar ---
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
  bottomBarLabel: {
    color: COLORS.slate600,
    fontSize: 14,
  },
  bottomBarPrice: {
    color: COLORS.emerald600,
    fontSize: 20,
    fontWeight: "bold",
  },
  checkoutButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    paddingVertical: 16,
    position: "relative",
    shadowColor: COLORS.emerald500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  checkoutButtonBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  checkoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    zIndex: 1,
  },
  removeVoucherButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 4,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.red500 + "50",
    backgroundColor: COLORS.red500 + "10",
  },
  removeVoucherText: {
    color: COLORS.red500,
    fontSize: 14,
    fontWeight: "500",
  },
  voucherWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.red500 + "10",
    borderWidth: 1,
    borderColor: COLORS.red500 + "40",
  },
  voucherWarningText: {
    color: COLORS.red500,
    fontSize: 13,
    flex: 1,
  },
});
