import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// 💡 Cần import Header và useOrders từ đúng đường dẫn
import Toast from "react-native-toast-message";
import { Header } from "../../components/Header";
import { useAuth } from "../../context/AuthContext";
import {
  Order,
  fetchOrdersWithDetails,
  useOrders,
} from "../../context/OrderContext";

// --- Constants và Types ---
type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "delivering"
  | "completed"
  | "cancelled"
  | "awaiting_payment";

type FeatherIconName =
  | "clock"
  | "check-circle"
  | "package"
  | "truck"
  | "x-circle"
  | "shopping-bag"
  | "file-text"
  | "user";
const COLORS = {
  bg: "#f8fafc",
  white: "#ffffff",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  emerald50: "#f0fff4",
  emerald600: "#059669",
  emerald500: "#10b981",
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
  red50: "#fef2f2",
  pink: "#ec4899",
  pink50: "#fdf2f8",
};

// Map Lucide icons sang Feather/Ionicons
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
  }, // Clock -> Feather
  confirmed: {
    label: "Đã xác nhận",
    color: COLORS.blue600,
    bg: COLORS.blue50,
    icon: "check-circle",
  }, // CheckCircle -> Feather
  preparing: {
    label: "Đang chuẩn bị",
    color: COLORS.purple600,
    bg: COLORS.purple50,
    icon: "package",
  }, // Package -> Feather
  delivering: {
    label: "Đang giao",
    color: COLORS.emerald600,
    bg: COLORS.emerald50,
    icon: "truck",
  }, // Truck -> Feather
  completed: {
    label: "Hoàn thành",
    color: COLORS.green600,
    bg: COLORS.green50,
    icon: "check-circle",
  }, // CheckCircle -> Feather
  cancelled: {
    label: "Đã hủy",
    color: COLORS.red600,
    bg: COLORS.red50,
    icon: "x-circle",
  }, // XCircle -> Feather
  awaiting_payment: {
    label: "Chờ thanh toán",
    color: COLORS.pink,
    bg: COLORS.pink50,
    icon: "file-text",
  }, // FileText -> Feather
};

export function OrdersPage() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const headerHeight = 60 + insets.top;
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hasRealtimeUpdate, reloadOrders, realtimePayload } = useOrders();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const FILTER_TABS = [
    { id: "all", label: "Tất cả" },
    ...Object.keys(STATUS_CONFIG).map((key) => ({
      id: key,
      label: STATUS_CONFIG[key as OrderStatus].label,
    })),
  ];
  const STATUS_LABEL: Record<string, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    preparing: "Đang chuẩn bị",
    delivering: "Đang giao",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    awaiting_payment: "Chờ thanh toán",
  };

  const loadOrders = async () => {
    if (!user || !user.id) return;
    setIsLoading(true);
    try {
      // ✅ GỌI HÀM FETCH EXPORTED TỪ CONTEXT/API
      const fetchedOrders = await fetchOrdersWithDetails(user.id);
      console.log("ĐƠN HÀNG TẢI VỀ:", fetchedOrders);
      const sortedOrders = [...fetchedOrders].sort(
        (a, b) => Number(b.id) - Number(a.id) // mới → cũ
      );
      setOrders(sortedOrders);
    } catch (e) {
      console.error("LỖI TẢI ĐƠN HÀNG TRONG UI:", e);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      if (user && user.id) {
        loadOrders();
      } else {
        setOrders([]);
        setIsLoading(false);
      }
    }, [user?.id])
  );

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    return order.status === filter;
  });

  const handleNavigateToDetail = (orderId: string) => {
    // 💡 Dùng router.push để điều hướng đến màn hình chi tiết
    router.push({
      pathname: "/order-detail",
      params: { id: orderId },
    } as any);
  };

  const handleNavigateToMenu = () => {
    router.push("/(tabs)/menu");
  };
  useEffect(() => {
    if (!hasRealtimeUpdate) return;

    console.log("🔔 Realtime update detected → reload UI");

    if (hasRealtimeUpdate && realtimePayload) {
      Toast.show({
        type: "info",
        text1: `📦 Đơn #${realtimePayload.orderName}`,
        text2: `Trạng thái: ${
          STATUS_LABEL[realtimePayload.status] || realtimePayload.status
        }`,
        position: "top",
      });
    }
    const handleRealtime = async () => {
      await loadOrders(); // reload UI
      await reloadOrders(); // 🔥 reset realtime flag (QUAN TRỌNG)
    };

    handleRealtime();
  }, [hasRealtimeUpdate, realtimePayload]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Đang tải ứng dụng...</Text>
      </View>
    );
  }
  // -------------------------------------------------------------------
  // RENDER ITEM CARD
  // -------------------------------------------------------------------
  const renderOrderItem = ({ item: order }: { item: Order }) => {
    const statusInfo = STATUS_CONFIG[order.status];
    const StatusIcon = Feather; // Sử dụng Feather
    const isPaid =
      ["pending", "confirmed", "preparing", "delivering", "completed"].includes(
        String(order.status)
      ) && order.paymentMethod !== "cash";
    return (
      <TouchableOpacity
        key={order.id}
        onPress={() => handleNavigateToDetail(order.id)}
        style={styles.orderCard}
        activeOpacity={0.8}
      >
        {/* Order Header */}
        <View style={styles.orderHeaderRow}>
          <View style={styles.orderStatusWrapper}>
            <Text style={styles.orderIdText}>#{order.name}</Text>
            <View
              style={[styles.statusTag, { backgroundColor: statusInfo.bg }]}
            >
              <StatusIcon
                name={statusInfo.icon as FeatherIconName}
                size={16}
                color={statusInfo.color}
              />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>
        </View>
        {isPaid && (
          <View style={styles.paidRow}>
            <View style={styles.paidMiniTag}>
              <Feather name="check" size={10} color={COLORS.emerald600} />
              <Text style={styles.paidMiniText}>Đã thanh toán trực tuyến</Text>
            </View>
          </View>
        )}
        {/* Order Items Preview */}
        <View style={styles.itemsPreview}>
          {order.items.slice(0, 2).map((item, index) => (
            <View key={index} style={styles.itemPreviewRow}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemPreviewInfo}>
                <Text style={styles.itemPreviewName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemPreviewQty}>
                  {item.size} • x{item.quantity}
                </Text>
              </View>
              <Text style={styles.itemPreviewPrice}>
                {(item.price * item.quantity).toLocaleString("vi-VN")}đ
              </Text>
            </View>
          ))}
          {order.items.length > 2 && (
            <Text style={styles.moreItemsText}>
              +{order.items.length - 2} sản phẩm khác
            </Text>
          )}
        </View>
        {/* Order Footer */}
        <View style={styles.orderFooter}>
          <Text style={styles.totalLabel}>
            {isPaid ? "Đã trả trước:" : "Tổng cộng:"}
          </Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={[
                styles.totalPrice,
                isPaid && {
                  color: COLORS.slate500,
                  textDecorationLine: "line-through",
                  fontSize: 13,
                },
              ]}
            >
              {Number(order.total).toLocaleString("vi-VN")}đ
            </Text>
            {isPaid && (
              <Text style={styles.collectAmountText}>Cần thu: 0đ</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  // -------------------------------------------------------------------

  return (
    <View style={styles.safeAreaContainer}>
      {/* Header */}
      <Header title="Đơn hàng của tôi" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        // 💡 Bù đắp chiều cao Header cố định và thêm padding dưới cùng cho Tabs
        style={{ paddingTop: headerHeight }}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.contentPadding}>
          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {FILTER_TABS.map((tab) => {
              const isActive = filter === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setFilter(tab.id as any)}
                  style={styles.filterButtonContainer}
                >
                  <View
                    style={[
                      styles.filterButton,
                      isActive ? styles.filterActive : styles.filterInactive,
                    ]}
                  >
                    {isActive && (
                      <LinearGradient
                        colors={[COLORS.emerald500, COLORS.teal600]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    <Text
                      style={[
                        styles.filterActiveText,
                        { color: isActive ? COLORS.white : COLORS.slate700 },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyView}>
              <View style={styles.emptyIconWrapper}>
                <Feather name="package" size={64} color={COLORS.slate400} />
              </View>
              <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
              <Text style={styles.emptySubtitle}>
                Hãy đặt hàng để trải nghiệm dịch vụ của chúng tôi
              </Text>
              <TouchableOpacity
                onPress={handleNavigateToMenu}
                style={styles.exploreButton}
              >
                <LinearGradient
                  colors={[COLORS.emerald600, COLORS.teal600]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.exploreButtonText}>Khám phá thực đơn</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredOrders}
              keyExtractor={(item) => item.id}
              renderItem={renderOrderItem}
              scrollEnabled={false}
              contentContainerStyle={styles.ordersListContainer}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
export default OrdersPage;
// -----------------------------------------------------------
// 💡 STYLE SHEET
// -----------------------------------------------------------

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  contentPadding: {
    paddingHorizontal: 16,
  },
  // --- Filter Tabs ---
  filterScroll: {
    gap: 8,
    paddingBottom: 8,

    marginBottom: 10,
  },
  filterButtonContainer: {
    // Container mới để chứa hiệu ứng gradient
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButton: {
    borderRadius: 12,
    paddingHorizontal: 24, // px-6
    paddingVertical: 8, // py-2
    position: "relative",
    borderWidth: 1,
  },
  filterActive: {
    borderColor: COLORS.emerald600,
    overflow: "hidden",
    shadowColor: COLORS.emerald600,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  filterInactive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.slate200,
  },
  filterActiveText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  filterInactiveText: {
    color: COLORS.slate700,
  },
  // --- Empty State ---
  emptyView: {
    alignItems: "center",
    paddingVertical: 80, // py-20
    textAlign: "center",
  },
  emptyIconWrapper: {
    width: 128,
    height: 128,
    backgroundColor: COLORS.slate100,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    color: COLORS.slate800,
    fontSize: 20,
    marginBottom: 8,
    fontWeight: "bold",
  },
  emptySubtitle: {
    color: COLORS.slate600,
    marginBottom: 24,
    fontSize: 16,
  },
  exploreButton: {
    borderRadius: 12,
    overflow: "hidden",
    paddingHorizontal: 32,
    paddingVertical: 12,
    shadowColor: COLORS.emerald600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    minWidth: 200,
  },
  exploreButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  // --- Orders List ---
  ordersListContainer: {
    gap: 12, // space-y-3
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8, // Giảm margin lại tí vì có hàng paidRow ở dưới
    gap: 10,
  },
  orderStatusWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderIdText: {
    color: COLORS.slate800,
    fontWeight: "bold",
    flex: 1,
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
  },
  orderDateText: {
    color: COLORS.slate500,
    fontSize: 14,
  },
  // --- Items Preview ---
  itemsPreview: {
    gap: 8,
    marginBottom: 12,
  },
  itemPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemImage: {
    width: 48, // w-12
    height: 48,
    resizeMode: "cover",
    borderRadius: 8,
  },
  itemPreviewInfo: {
    flex: 1,
  },
  itemPreviewName: {
    color: COLORS.slate800,
    fontSize: 14,
    fontWeight: "500",
  },
  itemPreviewQty: {
    color: COLORS.slate500,
    fontSize: 12,
  },
  itemPreviewPrice: {
    color: COLORS.slate700,
    fontSize: 14,
  },
  moreItemsText: {
    color: COLORS.slate500,
    fontSize: 12,
    marginLeft: 16, // Khoảng cách giả lập pl-15
  },
  // --- Order Footer ---
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    marginTop: 8,
  },
  totalLabel: {
    color: COLORS.slate600,
    fontSize: 14,
  },
  totalPrice: {
    color: COLORS.emerald600,
    fontSize: 16,
    fontWeight: "bold",
  },
  estimatedTimeWrapper: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  estimatedTimeText: {
    color: COLORS.amber600,
    fontSize: 14,
    fontWeight: "500",
  },
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
  paidMiniTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.emerald50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 0.5,
    borderColor: COLORS.emerald600 + "20",
  },
  paidMiniText: {
    color: COLORS.emerald600,
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  collectAmountText: {
    color: COLORS.emerald600,
    fontSize: 16,
    fontWeight: "bold",
  },
  paidRow: {
    flexDirection: "row",
    marginBottom: 12, // Tạo khoảng cách với phần preview sản phẩm
  },
});
