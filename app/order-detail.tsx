import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { ComponentProps } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
// 💡 IMPORTS COMPONENTS & CONTEXTS
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { CartItem, useCart } from "../context/CartContext";
import { useOrders } from "../context/OrderContext";
import { getOrderById } from "./services/baserowApi";
// --- Types & Config ---
type Page = string;
const SHIPPING_FEE_DEFAULT = 20000;
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
  const orderId = id;
  const { cancelOrder } = useOrders();
  console.log("Router ID received:", orderId);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const headerHeight = 10 + insets.top;

  const [order, setOrder] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        const data = await getOrderById(Number(orderId));
        console.log("Fetched Order Data:", data);

        if (data.success) {
          setOrder(data.data);
        } else {
          Alert.alert("Lỗi", "Không tải được thông tin đơn hàng");
        }
      } catch (error) {
        console.error("Error loading order:", error);
        Alert.alert("Lỗi", "Có lỗi xảy ra khi tải thông tin đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <View style={styles.fullContainer}>
        <Header title="Đơn hàng" showBack={true} onBack={goBack} />
        <View style={styles.loadingContainer}>
          <Text>Đang tải...</Text>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.fullContainer}>
        <Header title="Đơn hàng" showBack={true} onBack={goBack} />
        <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>
      </View>
    );
  }
  const handleRepurchase = () => {
    if (!order || !order.orderDetail || order.orderDetail.length === 0) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không có sản phẩm nào để mua lại.",
        visibilityTime: 2000,
      });
      return;
    }

    let itemsAddedCount = 0;

    // ✅ LẶP QUA TẤT CẢ CÁC MỤC TRONG ĐƠN HÀNG VÀ THÊM VÀO GIỎ
    order.orderDetail.forEach((item: any) => {
      if (item.product && item.quantity > 0) {
        const productData = item.product;

        // Chuẩn bị CartItem Payload (Sử dụng các giá trị từ order detail)
        const itemToAdd: Omit<CartItem, "id"> = {
          productId: productData.id.toString(),
          name: productData.name || "Sản phẩm",
          image: productData.image || "https://placehold.co/64x64",
          price: parseFloat(item.price) || 0,
          quantity: parseInt(item.quantity) || 1,

          // Lấy các options từ order detail
          size: (item.size || "M") as "S" | "M" | "L",
          ice: item.ice || 0,
          sugar: item.sugar || 0,
          isDrink: item.is_drink || false,
        };

        addToCart(itemToAdd);
        itemsAddedCount += itemToAdd.quantity;
      }
    });

    if (itemsAddedCount > 0) {
      Toast.show({
        type: "success",
        text1: "Đã thêm vào giỏ hàng",
        text2: `Đã thêm ${itemsAddedCount} sản phẩm từ đơn hàng này.`,
        visibilityTime: 2000,
      });
      // ✅ CHUYỂN HƯỚNG SANG TRANG GIỎ HÀNG
      router.push("/cart");
    } else {
      Toast.show({
        type: "info",
        text1: "Thông báo",
        text2: "Không có sản phẩm hợp lệ để thêm.",
        visibilityTime: 2000,
      });
    }
  };
  // Xử lý trạng thái từ API (có thể là object hoặc string)
  const statusValue =
    typeof order.status === "object" ? order.status.value : order.status;
  const statusInfo =
    STATUS_CONFIG[statusValue as OrderStatus] || STATUS_CONFIG.pending;

  const formatDate = () => {
    // Nếu không có createdAt, tạo từ order name hoặc dùng thời gian hiện tại
    const orderName = order.name || "";
    const match = orderName.match(/ORD-(\d{8})/);

    if (match) {
      const dateStr = match[1];
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${day}/${month}/${year}`;
    }

    return new Date().toLocaleDateString("vi-VN");
  };

  // Tính tổng tiền từ orderDetail
  const calculateSubtotal = () => {
    if (!order.orderDetail || !Array.isArray(order.orderDetail)) {
      return 0;
    }

    return order.orderDetail.reduce((sum: number, item: any) => {
      const itemTotal = parseFloat(item.total) || 0;
      return sum + itemTotal;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const finalAmount = parseFloat(order.amount) || subtotal;
  const hasShippingVoucher = order.voucher?.name
    ?.toLowerCase()
    .includes("ship");
  const shippingFeeCharged = hasShippingVoucher ? 0 : SHIPPING_FEE_DEFAULT;
  const discountAmount = Math.max(
    0,
    subtotal - (finalAmount - shippingFeeCharged)
  );
  const finalTotal = finalAmount; // Tổng cuối cùng đã tính toán
  const handleCancelOrder = () => {
    Alert.alert("Xác nhận Hủy", "Bạn có chắc muốn hủy đơn hàng này?", [
      { text: "Không", style: "cancel" },
      {
        text: "Hủy Đơn",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelOrder(order.id); // ⬅️ CHỜ API + CONTEXT UPDATE
            router.back(); // ⬅️ QUAY LẠI SAU KHI XONG
          } catch (e) {
            Toast.show({
              type: "error",
              text1: "Lỗi",
              text2: "Không thể hủy đơn hàng.",
            });
          }
        },
      },
    ]);
  };

  const handleRating = () => {
    router.push({
      pathname: "/Review",
      params: { orderId: order.id },
    } as any);
  };

  return (
    <View style={styles.fullContainer}>
      {/* 1. Header */}
      <Header
        title={`Đơn hàng ${order.name}`}
        showBack={true}
        onBack={goBack}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: headerHeight }}
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
              </View>
              <Text style={styles.statusEmoji}>
                {statusValue === "pending" && "⏳"}
                {statusValue === "confirmed" && "✅"}
                {statusValue === "preparing" && "👨‍🍳"}
                {statusValue === "delivering" && "🚚"}
                {statusValue === "completed" && "🎉"}
                {statusValue === "cancelled" && "❌"}
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
          ].includes(statusValue) && (
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
                  const stepOrder = [
                    "pending",
                    "confirmed",
                    "preparing",
                    "delivering",
                    "completed",
                  ];
                  const currentIndex = stepOrder.indexOf(statusValue);
                  const isCompleted = currentIndex >= index;
                  const isCurrent = step.status === statusValue;

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
                  <Text style={styles.infoValue}>
                    {order.address?.value || "Đang cập nhật"}
                  </Text>
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
                  <Text style={styles.infoValue}>{user?.phone || "N/A"}</Text>
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
                    {PAYMENT_METHODS[order.method] ||
                      order.method ||
                      "Tiền mặt"}
                  </Text>
                </View>
              </View>
              {order.notes && (
                <View style={styles.infoRow}>
                  <Feather
                    name="file-text"
                    size={20}
                    color={COLORS.emerald600}
                    style={styles.infoIcon}
                  />
                  <View>
                    <Text style={styles.infoLabel}>Ghi chú</Text>
                    <Text style={styles.infoValue}>{order.notes}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Order Items */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Chi tiết đơn hàng</Text>
            <View style={styles.itemsDetailList}>
              {order.orderDetail?.map((item: any, index: number) => {
                const price = parseFloat(item.price) || 0;
                const quantity = parseInt(item.quantity) || 1;
                const itemTotal = price * quantity;

                return (
                  <View key={item.id || index} style={styles.itemDetailRow}>
                    <Image
                      source={{ uri: item.product?.image }}
                      alt={item.product?.image}
                      style={styles.itemDetailImage}
                    />
                    <View style={styles.itemDetailInfo}>
                      <Text style={styles.itemDetailName}>
                        {item.product?.name || `Sản phẩm ${index + 1}`}
                      </Text>
                      {item.is_drink && (
                        <View style={styles.itemDetailOptions}>
                          <Text style={styles.itemDetailOptionText}>
                            Size: {item.size || "M"} • Đá: {item.ice || "0"}% •
                            Đường: {item.sugar || "0"}%
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.itemDetailPriceQty}>
                      <Text style={styles.itemDetailQty}>x{quantity}</Text>
                      <Text style={styles.itemDetailPrice}>
                        {itemTotal.toLocaleString("vi-VN")}đ
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Order Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tổng kết đơn hàng</Text>
            <View style={styles.summaryDetails}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tạm tính</Text>
                <Text style={styles.summaryValue}>
                  {subtotal.toLocaleString("vi-VN")}đ
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phí vận chuyển</Text>

                <Text
                  style={
                    shippingFeeCharged === 0
                      ? styles.summaryValueFree
                      : styles.summaryValue
                  }
                >
                  {shippingFeeCharged === 0
                    ? "Miễn phí"
                    : shippingFeeCharged.toLocaleString("vi-VN") + "đ"}
                  {/* ✅ PHÍ VẬN CHUYỂN */}
                </Text>
              </View>

              {discountAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Giảm giá</Text>
                  <Text style={styles.summaryValueDiscount}>
                    -{discountAmount.toLocaleString("vi-VN")}đ
                    {/* ✅ GIẢM GIÁ */}
                  </Text>
                </View>
              )}
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Tổng thanh toán</Text>
                <Text style={styles.summaryTotalPrice}>
                  {finalTotal.toLocaleString("vi-VN")}đ
                </Text>
              </View>
            </View>
            <View style={styles.summaryFooter}>
              <Text style={styles.summaryDateText}>
                Mã đơn hàng: {order.name || `ORD-${order.id}`}
              </Text>
              <Text style={styles.summaryDateText}>
                Ngày đặt: {formatDate()}
              </Text>
            </View>
          </View>
        </View>

        {/* Padding cho Bottom Actions */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Actions */}
      {["pending", "confirmed"].includes(statusValue) && (
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

      {statusValue === "completed" && (
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
    paddingVertical: 70,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bg,
  },
});
