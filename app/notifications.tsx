import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions,
  Image,
  Alert,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { ComponentProps } from "react"; // 💡 IMPORT ComponentProps

// 💡 IMPORTS COMPONENT HEADER
import { Header } from "../components/Header";

// --- Types & Data ---
type NotificationType = "order" | "promo" | "review" | "reward";
// 💡 SỬA LỖI TYPE: Dùng ComponentProps chuẩn
type FeatherIconName = ComponentProps<typeof Feather>["name"];

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

interface NotificationsPageProps {
  goBack: () => void;
}

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
  emerald500: "#10b981",
  emerald600: "#059669",
  emerald100: "#f0fff4",
  emerald50: "#f0fff4",
  amber600: "#d97706",
  amber500: "#f59e0b",
  blue600: "#2563eb",
  blue100: "#eff6ff",
  purple600: "#9333ea",
  purple100: "#f5f3ff",
  green600: "#16a34a",
  green100: "#f0fff4",
};

// Map Lucide icons sang Feather
const NOTIFICATION_TYPES: {
  [key in NotificationType]: {
    iconName: FeatherIconName;
    color: string;
    bg: string;
  };
} = {
  order: {
    iconName: "package",
    color: COLORS.emerald600,
    bg: COLORS.emerald100,
  },
  promo: {
    iconName: "bookmark",
    color: COLORS.amber600,
    bg: COLORS.amber500 + "30",
  },
  review: { iconName: "star", color: COLORS.blue600, bg: COLORS.blue100 },
  reward: { iconName: "gift", color: COLORS.purple600, bg: COLORS.purple100 },
};

const NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "order",
    title: "Đơn hàng đã được giao",
    message:
      "Đơn hàng #ORD001 đã được giao thành công. Cảm ơn bạn đã mua hàng!",
    time: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
  },
  {
    id: "2",
    type: "promo",
    title: "Ưu đãi đặc biệt dành cho bạn!",
    message: "Giảm 30% cho tất cả đồ uống. Áp dụng từ 14h-16h hôm nay.",
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
  },
  {
    id: "3",
    type: "order",
    title: "Đơn hàng đang được chuẩn bị",
    message:
      "Đơn hàng #ORD002 đang được chuẩn bị. Dự kiến giao trong 20-30 phút.",
    time: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: "4",
    type: "reward",
    title: "Chúc mừng! Bạn nhận được 100 điểm",
    message: "Bạn đã nhận được 100 điểm thưởng từ đơn hàng gần đây.",
    time: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: "5",
    type: "promo",
    title: "Miễn phí ship cho đơn từ 100K",
    message:
      "Nhập mã FREESHIP để miễn phí vận chuyển. Có hiệu lực đến hết tuần.",
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: "6",
    type: "review",
    title: "Đánh giá đơn hàng của bạn",
    message: "Hãy cho chúng tôi biết trải nghiệm của bạn về đơn hàng #ORD001",
    time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    read: true,
  },
];

export function NotificationsPage({ goBack }: NotificationsPageProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = 50 + insets.top;
  const router = useRouter();

  const formatTime = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

  // 💡 HÀM ĐIỀU HƯỚNG VÀ HIỂN THỊ TOAST
  const handleNotificationPress = (notification: Notification) => {
    // 1. Hiển thị Toast với nội dung thông báo
    Toast.show({
      type: "success", // Có thể dùng type 'success_custom' nếu bạn đã tạo
      text1: notification.title,
      text2: notification.message,
      position: "top",
      visibilityTime: 3000,
    });

    // 2. Logic điều hướng
    if (notification.type === "order" || notification.type === "review") {
      const orderIdMatch = notification.message.match(/#(\w+)/);
      const orderId = orderIdMatch ? orderIdMatch[1] : notification.id;

      router.push({
        pathname: "/order-detail",
        params: { id: orderId },
      } as any);
    } else {
      // Ví dụ: Điều hướng đến trang ưu đãi
      router.push("/vouchers" as any);
    }
  };

  const renderNotificationItem = (notification: Notification) => {
    const typeInfo = NOTIFICATION_TYPES[notification.type];
    const Icon = Feather;

    return (
      <TouchableOpacity
        key={notification.id}
        onPress={() => handleNotificationPress(notification)}
        style={[
          styles.notificationCard,
          !notification.read && styles.notificationUnreadRing,
        ]}
        activeOpacity={0.8}
      >
        <View style={styles.notificationInner}>
          {/* Icon Wrapper */}
          <View style={[styles.iconWrapper, { backgroundColor: typeInfo.bg }]}>
            <Icon name={typeInfo.iconName} size={24} color={typeInfo.color} />
          </View>

          <View style={styles.notificationContent}>
            {/* Title and Dot */}
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.notificationTitle,
                  !notification.read && styles.titleUnread,
                ]}
                numberOfLines={1}
              >
                {notification.title}
              </Text>
              {!notification.read && <View style={styles.unreadDot} />}
            </View>

            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTime(notification.time)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.fullContainer}>
      <Header title="Thông báo" showBack={true} onBack={goBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: headerHeight }}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentPadding}>
          {/* Unread Count */}
          {unreadCount > 0 && (
            <View style={styles.unreadBanner}>
              <Text style={styles.unreadText}>
                Bạn có {unreadCount} thông báo chưa đọc
              </Text>
            </View>
          )}

          {/* Notifications List */}
          <View style={styles.notificationsList}>
            {NOTIFICATIONS.map(renderNotificationItem)}
          </View>

          {/* Empty State */}
          {NOTIFICATIONS.length === 0 && (
            <View style={styles.emptyView}>
              <View style={styles.emptyIconWrapper}>
                <Feather name="bell" size={64} color={COLORS.slate400} />
              </View>
              <Text style={styles.emptyTitle}>Không có thông báo</Text>
              <Text style={styles.emptySubtitle}>
                Bạn chưa có thông báo nào
              </Text>
            </View>
          )}
        </View>

        {/* Padding cuối cùng */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
export default NotificationsPage;

// -----------------------------------------------------------
// 💡 STYLE SHEET
// -----------------------------------------------------------

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: 0 },
  contentPadding: { paddingHorizontal: 16, paddingTop: 16 },
  // --- Unread Banner ---
  unreadBanner: {
    backgroundColor: COLORS.emerald50,
    borderWidth: 1,
    borderColor: COLORS.emerald600 + "30",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  unreadText: {
    color: COLORS.emerald600,
    fontSize: 14,
    textAlign: "center",
  },
  // --- Notifications List ---
  notificationsList: { gap: 8 },
  notificationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationUnreadRing: {
    borderWidth: 2,
    borderColor: COLORS.emerald600 + "30",
  },
  notificationInner: { flexDirection: "row", gap: 12 },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notificationContent: { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  notificationTitle: {
    color: COLORS.slate800,
    fontSize: 14,
    fontWeight: "500",
    flexShrink: 1,
    marginRight: 8,
  },
  titleUnread: { fontWeight: "bold" },
  unreadDot: {
    width: 8,
    height: 8,
    backgroundColor: COLORS.emerald500,
    borderRadius: 9999,
    flexShrink: 0,
    marginTop: 4,
  },
  notificationMessage: {
    color: COLORS.slate600,
    fontSize: 14,
    marginBottom: 4,
  },
  notificationTime: { color: COLORS.slate400, fontSize: 12 },
  // --- Empty State ---
  emptyView: { alignItems: "center", paddingVertical: 80, textAlign: "center" },
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
  emptySubtitle: { color: COLORS.slate600, fontSize: 14 },
});
