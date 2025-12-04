import React, { ComponentProps } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Platform,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons"; // Sử dụng Feather
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
// 💡 IMPORTS COMPONENTS & CONTEXTS
import { Header } from "../components/Header";
import { useOrders, Order } from "../context/OrderContext";

// --- Types & Config ---
type Page = string;
type FeatherIconName = ComponentProps<typeof Feather>["name"];
type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "delivering"
  | "completed"
  | "cancelled";

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
  amber600: "#d97706",
  amber50: "#fffdf2",
  blue600: "#2563eb",
  blue50: "#eff6ff",
  purple600: "#9333ea",
  purple50: "#f5f3ff",
  green600: "#16a34a",
  green50: "#f0fff4",
  red600: "#dc2626",
  red500: "#ef4444",
  red50: "#fef2f2",
};

// Map Lucide icons sang Feather icons
const STATUS_CONFIG: {
  [key in OrderStatus]: {
    label: string;
    color: string;
    bg: string;
    icon: string;
  };
} = {
  pending: {
    label: "Chờ xác nhận",
    color: COLORS.amber600,
    bg: COLORS.amber50,
    icon: "clock",
  },
  confirmed: {
    label: "Đã xác nhận",
    color: COLORS.blue600,
    bg: COLORS.blue50,
    icon: "check-circle",
  },
  preparing: {
    label: "Đang chuẩn bị",
    color: COLORS.purple600,
    bg: COLORS.purple50,
    icon: "package",
  },
  delivering: {
    label: "Đang giao",
    color: COLORS.emerald600,
    bg: COLORS.emerald50,
    icon: "truck",
  },
  completed: {
    label: "Hoàn thành",
    color: COLORS.green600,
    bg: COLORS.green50,
    icon: "check-circle",
  },
  cancelled: {
    label: "Đã hủy",
    color: COLORS.red600,
    bg: COLORS.red50,
    icon: "x-circle",
  },
};

const PAYMENT_METHODS: { [key: string]: string } = {
  cash: "Tiền mặt",
  momo: "MoMo",
  zalopay: "ZaloPay",
  banking: "Chuyển khoản ngân hàng",
};

// -----------------------------------------------------------

interface OrderDetailPageProps {
  goBack: () => void;
}

export function OrderDetailPage({ goBack }: OrderDetailPageProps) {
  const { id } = useLocalSearchParams();
  const orderId = id as string;
  const { getOrderById, cancelOrder } = useOrders();
  const order = getOrderById(orderId);
  console.log("Router ID received:", orderId);
  console.log("Order data found in Context:", order);
  const insets = useSafeAreaInsets();
  const router = useRouter(); // Sử dụng useRouter

  const headerHeight = 50 + insets.top;

  if (!order) {
    return <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>;
  }

  const statusInfo = STATUS_CONFIG[order.status];

  const formatDate = (date: Date) => {
    // Sửa lỗi toLocaleDateString trong RN
    return new Date(date).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCancelOrder = () => {
    Alert.alert("Xác nhận Hủy", "Bạn có chắc muốn hủy đơn hàng này?", [
      { text: "Không", style: "cancel" },
      {
        text: "Hủy Đơn",
        style: "destructive",
        onPress: () => {
          cancelOrder(order.id);
          goBack(); // Quay lại Orders list
        },
      },
    ]);
  };

  const handleRepurchase = () => {
    // Giả định logic mua lại (chuyển hướng tới Menu)
    router.push("/(tabs)/menu");
  };

  const handleRating = () => {
    // Giả định chuyển hướng tới màn hình Đánh giá

    router.push({
      pathname: "/Review", // Giả định tên route là /review.tsx
      params: { orderId: order.id }, // Truyền ID qua params
    } as any);
  };

  return (
    <View style={styles.fullContainer}>
      {/* 1. Header (Absolute position) */}
      <Header title={`Đơn hàng #${order.id}`} showBack={true} onBack={goBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: headerHeight }} // Bù đắp chiều cao Header
      >
        <View style={styles.contentPadding}>
          {/* Order Status */}
          <View style={styles.statusCard}>
            <View
              style={[styles.statusBanner, { backgroundColor: statusInfo.bg }]}
            >
              <View>
                <Text style={styles.statusSubtitle}>Trạng thái đơn hàng</Text>
                <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
                {order.estimatedTime &&
                  ["pending", "confirmed", "preparing", "delivering"].includes(
                    order.status
                  ) && (
                    <Text style={styles.estimatedTimeStatus}>
                      Dự kiến: {order.estimatedTime}
                    </Text>
                  )}
              </View>
              <Text style={styles.statusEmoji}>
                {order.status === "pending" && "⏳"}
                {order.status === "confirmed" && "✅"}
                {order.status === "preparing" && "👨‍🍳"}
                {order.status === "delivering" && "🚚"}
                {order.status === "completed" && "🎉"}
                {order.status === "cancelled" && "❌"}
              </Text>
            </View>
          </View>

          {/* Order Timeline */}
          {[
            "pending",
            "confirmed",
            "preparing",
            "delivering",
            "completed",
          ].includes(order.status) && (
            <View style={styles.card}>
              <Text style={styles.timelineTitle}>Tiến trình đơn hàng</Text>
              <View style={styles.timelineList}>
                {[
                  { status: "pending", label: "Đã đặt hàng", icon: "clock" },
                  {
                    status: "confirmed",
                    label: "Đã xác nhận",
                    icon: "check-circle",
                  },
                  {
                    status: "preparing",
                    label: "Đang chuẩn bị",
                    icon: "package",
                  },
                  {
                    status: "delivering",
                    label: "Đang giao hàng",
                    icon: "truck",
                  },
                  {
                    status: "completed",
                    label: "Đã hoàn thành",
                    icon: "check-circle",
                  },
                ].map((step, index) => {
                  const isCompleted =
                    [
                      "pending",
                      "confirmed",
                      "preparing",
                      "delivering",
                      "completed",
                    ].indexOf(order.status) >= index;
                  const isCurrent =
                    [
                      "pending",
                      "confirmed",
                      "preparing",
                      "delivering",
                      "completed",
                    ][index] === order.status;

                  return (
                    <View key={step.status} style={styles.timelineStep}>
                      <View
                        style={[
                          styles.stepIconWrapper,
                          isCompleted ? styles.stepActive : styles.stepInactive,
                          isCurrent && styles.stepCurrentRing,
                        ]}
                      >
                        <Feather
                          name={step.icon as FeatherIconName}
                          size={20}
                          color={isCompleted ? COLORS.white : COLORS.slate400}
                        />
                      </View>
                      <View style={styles.stepContent}>
                        <Text
                          style={[
                            styles.stepLabel,
                            isCompleted
                              ? styles.stepLabelActive
                              : styles.stepLabelInactive,
                          ]}
                        >
                          {step.label}
                        </Text>
                        {isCurrent && (
                          <Text style={styles.stepStatusText}>
                            Đang xử lý...
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Delivery Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Thông tin giao hàng</Text>
            <View style={styles.infoList}>
              <View style={styles.infoRow}>
                <Feather
                  name="map-pin"
                  size={20}
                  color={COLORS.emerald600}
                  style={styles.infoIcon}
                />
                <View>
                  <Text style={styles.infoLabel}>Địa chỉ</Text>
                  <Text style={styles.infoValue}>{order.deliveryAddress}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Feather
                  name="phone"
                  size={20}
                  color={COLORS.emerald600}
                  style={styles.infoIcon}
                />
                <View>
                  <Text style={styles.infoLabel}>Số điện thoại</Text>
                  <Text style={styles.infoValue}>{order.phone}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Feather
                  name="credit-card"
                  size={20}
                  color={COLORS.emerald600}
                  style={styles.infoIcon}
                />
                <View>
                  <Text style={styles.infoLabel}>Phương thức thanh toán</Text>
                  <Text style={styles.infoValue}>
                    {PAYMENT_METHODS[order.paymentMethod]}
                  </Text>
                </View>
              </View>
              {order.note && (
                <View style={styles.infoRow}>
                  <Feather
                    name="file-text"
                    size={20}
                    color={COLORS.emerald600}
                    style={styles.infoIcon}
                  />
                  <View>
                    <Text style={styles.infoLabel}>Ghi chú</Text>
                    <Text style={styles.infoValue}>{order.note}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Order Items */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Chi tiết đơn hàng</Text>
            <View style={styles.itemsDetailList}>
              {order.items.map((item, index) => (
                <View key={index} style={styles.itemDetailRow}>
                  <Image
                    source={{ uri: item.image }}
                    alt={item.name}
                    style={styles.itemDetailImage}
                  />
                  <View style={styles.itemDetailInfo}>
                    <Text style={styles.itemDetailName}>{item.name}</Text>
                    <View style={styles.itemDetailOptions}>
                      <Text style={styles.itemDetailOptionText}>
                        Size: {item.size} • Đá: {item.ice}% • Đường:{" "}
                        {item.sugar}%
                      </Text>
                      {item.toppings.length > 0 && (
                        <Text style={styles.itemDetailOptionText}>
                          Topping: {item.toppings.join(", ")}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.itemDetailPriceQty}>
                    <Text style={styles.itemDetailQty}>x{item.quantity}</Text>
                    <Text style={styles.itemDetailPrice}>
                      {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Order Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tổng kết đơn hàng</Text>
            <View style={styles.summaryDetails}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tạm tính</Text>
                <Text style={styles.summaryValue}>
                  {order.total.toLocaleString("vi-VN")}đ
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
                <Text style={styles.summaryValueFree}>Miễn phí</Text>
              </View>
              {order.discount && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Giảm giá</Text>
                  <Text style={styles.summaryValueDiscount}>
                    -{order.discount.toLocaleString("vi-VN")}đ
                  </Text>
                </View>
              )}
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Tổng thanh toán</Text>
                <Text style={styles.summaryTotalPrice}>
                  {order.total.toLocaleString("vi-VN")}đ
                </Text>
              </View>
            </View>
            <View style={styles.summaryFooter}>
              <Text style={styles.summaryDateText}>
                Đặt lúc: {formatDate(order.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Padding cho Bottom Actions */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Actions */}
      {["pending", "confirmed"].includes(order.status) && (
        <View
          style={[
            styles.bottomActionsContainer,
            { paddingBottom: insets.bottom || 16 },
          ]}
        >
          <TouchableOpacity
            onPress={handleCancelOrder}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
          </TouchableOpacity>
        </View>
      )}

      {order.status === "completed" && (
        <View
          style={[
            styles.bottomActionsContainer,
            { paddingBottom: insets.bottom || 16 },
          ]}
        >
          <View style={styles.completedActions}>
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={handleRating}
            >
              <Text style={styles.reviewButtonText}>Đánh giá</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.repurchaseButton}
              onPress={handleRepurchase}
            >
              <LinearGradient
                colors={[COLORS.emerald600, COLORS.teal600]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.repurchaseButtonText}>Mua lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
export default OrderDetailPage;
// -----------------------------------------------------------
// 💡 STYLE SHEET
// -----------------------------------------------------------

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  errorText: {
    padding: 20,
    color: COLORS.red500,
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  // --- General Card Styles ---
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    color: COLORS.slate800,
    fontWeight: "bold",
    marginBottom: 12,
    fontSize: 16,
  },
  // --- Order Status ---
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    // Màu nền sẽ được áp dụng inline
  },
  statusSubtitle: {
    color: COLORS.slate600,
    fontSize: 14,
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  estimatedTimeStatus: {
    color: COLORS.slate600,
    fontSize: 14,
    marginTop: 4,
  },
  statusEmoji: {
    fontSize: 32,
  },
  // --- Order Timeline ---
  timelineTitle: {
    color: COLORS.slate800,
    fontWeight: "bold",
    marginBottom: 16,
    fontSize: 16,
  },
  timelineList: {
    gap: 16, // space-y-4
  },
  timelineStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // gap-3
  },
  stepIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  stepActive: {
    backgroundColor: COLORS.emerald500,
    color: COLORS.white,
  },
  stepInactive: {
    backgroundColor: COLORS.slate200,
    color: COLORS.slate400,
  },
  stepCurrentRing: {
    borderWidth: 4,
    borderColor: COLORS.emerald500 + "30", // ring-4 ring-emerald-200
  },
  stepLabel: {
    fontSize: 16,
  },
  stepLabelActive: {
    color: COLORS.slate800,
    fontWeight: "500",
  },
  stepLabelInactive: {
    color: COLORS.slate400,
  },
  stepStatusText: {
    color: COLORS.emerald600,
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  // --- Delivery Info ---
  infoList: {
    gap: 12, // space-y-3
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12, // gap-3
  },
  infoIcon: {
    marginTop: 2,
  },
  infoLabel: {
    color: COLORS.slate700,
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    color: COLORS.slate600,
    fontSize: 14,
  },
  // --- Order Items Detail ---
  itemsDetailList: {
    gap: 12,
  },
  itemDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  itemDetailImage: {
    width: 64, // w-16
    height: 64, // h-16
    resizeMode: "cover",
    borderRadius: 8,
  },
  itemDetailInfo: {
    flex: 1,
  },
  itemDetailName: {
    color: COLORS.slate800,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  itemDetailOptions: {
    gap: 2, // space-y-0.5
  },
  itemDetailOptionText: {
    color: COLORS.slate500,
    fontSize: 12,
  },
  itemDetailPriceQty: {
    alignItems: "flex-end",
  },
  itemDetailQty: {
    color: COLORS.slate700,
    fontSize: 14,
    marginBottom: 4,
  },
  itemDetailPrice: {
    color: COLORS.emerald600,
    fontSize: 14,
    fontWeight: "500",
  },
  // --- Summary Footer ---
  summaryDetails: {
    gap: 8, // space-y-2
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

  summaryValueFree: { color: COLORS.emerald600, fontSize: 14 },
  summaryValueDiscount: {
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
    fontSize: 20, // text-xl
    fontWeight: "bold",
  },
  summaryFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
  },
  summaryDateText: {
    color: COLORS.slate600,
    fontSize: 12,
  },
  // --- Bottom Actions ---
  bottomActionsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    padding: 16,
    zIndex: 60,
  },
  cancelButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.red500,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  cancelButtonText: {
    color: COLORS.red500,
    fontSize: 16,
    fontWeight: "bold",
  },
  completedActions: {
    flexDirection: "row",
    gap: 12, // gap-3
  },
  reviewButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.emerald500,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  reviewButtonText: {
    color: COLORS.emerald600,
    fontSize: 16,
    fontWeight: "bold",
  },
  repurchaseButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    paddingVertical: 16,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  repurchaseButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    zIndex: 1,
  },
});
