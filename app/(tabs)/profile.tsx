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
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

// 💡 IMPORTS CONTEXTS & TYPES
import { useAuth } from "../../context/AuthContext";
type Page = string;

// Định nghĩa types an toàn cho icons
type FeatherIconName = ComponentProps<typeof Feather>["name"];
type IoniconsName = ComponentProps<typeof Ionicons>["name"];

const COLORS = {
  bg: "#f8fafc",
  white: "#ffffff",
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate400: "#94a3b8",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  emerald500: "#10b981",
  emerald600: "#059669",
  emerald100: "#f0fff4",
  teal600: "#0d9488",
  amber600: "#d97706",
  amber300: "#fcd34d",
  amber400: "#fbbf24",
  red600: "#dc2626",
  red500: "#ef4444",
  blue600: "#2563eb",
  purple600: "#9333ea",
};

// --- Profile Logic ---
export function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // 💡 SỬ DỤNG ICON NAME VÀ COMPONENT TYPE RÕ RÀNG
  const menuItems = [
    // 1. Thông tin cá nhân (Feather)
    {
      iconName: "user" as FeatherIconName,
      label: "Thông tin cá nhân",
      route: "/edit-profile",
      color: COLORS.emerald600,
      IconComponent: Feather,
    },
    // 2. Địa chỉ giao hàng (Feather)
    {
      iconName: "map-pin" as FeatherIconName,
      label: "Địa chỉ giao hàng",
      route: "/address",
      color: COLORS.blue600,
      IconComponent: Feather,
    },
    // 3. Yêu thích (Ionicons)
    {
      iconName: "heart" as IoniconsName,
      label: "Yêu thích",
      route: "/favorites",
      color: COLORS.red600,
      IconComponent: Ionicons,
    },
    // 4. Ưu đãi của tôi (Feather)
    {
      iconName: "credit-card" as FeatherIconName,
      label: "Ưu đãi của tôi",
      route: "/vouchers",
      color: COLORS.amber600,
      IconComponent: Feather,
    },
    // 5. Thông báo (Feather)
    {
      iconName: "bell" as FeatherIconName,
      label: "Thông báo",
      route: "/notifications",
      color: COLORS.purple600,
      IconComponent: Feather,
    },
  ];

  const settingsItems = [
    {
      iconName: "settings" as FeatherIconName,
      label: "Cài đặt",
      route: "/settings",
      IconComponent: Feather,
    },
    {
      iconName: "help-circle" as FeatherIconName,
      label: "Trợ giúp & Hỗ trợ",
      route: "/help",
      IconComponent: Feather,
    },
    {
      iconName: "shield" as FeatherIconName,
      label: "Điều khoản & Chính sách",
      route: "/policy",
      IconComponent: Feather,
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      "Xác nhận Đăng xuất",
      "Bạn có chắc muốn đăng xuất khỏi tài khoản?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            // 💡 SỬA LỖI: Đặt hàm onPress là async
            try {
              await signOut(); // ✅ Gọi hàm async signOut
            } catch (e) {
              console.error("Logout failed:", e);
              Alert.alert("Lỗi", "Không thể đăng xuất.");
            }
          },
        },
      ]
    );
  };

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.fullContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Profile Card */}
        <LinearGradient
          colors={[COLORS.emerald500, COLORS.teal600]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={[styles.headerContent, { paddingTop: insets.top + 16 }]}>
            <View style={styles.profileCard}>
              <View style={styles.avatarWrapper}>
                {user?.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Feather name="user" size={40} color={COLORS.emerald600} />
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name}
                </Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>
            </View>

            {/* Membership Card */}
            <View style={styles.membershipCard}>
              <View style={styles.membershipRow}>
                <View style={styles.membershipIconText}>
                  <Feather name="award" size={20} color={COLORS.amber300} />
                  <Text style={styles.membershipLabel}>Hạng thành viên</Text>
                </View>
                <Text style={styles.membershipTier}>Vàng</Text>
              </View>
              <View style={styles.membershipStats}>
                <Text style={styles.membershipStatsLabel}>Điểm tích lũy</Text>
                <Text style={styles.membershipStatsValue}>2,450 điểm</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsWrapper}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.emerald600 }]}>
                12
              </Text>
              <Text style={styles.statLabel}>Đơn hàng</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.amber600 }]}>
                5
              </Text>
              <Text style={styles.statLabel}>Ưu đãi</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.ratingStat}>
                <Ionicons
                  name="star"
                  size={20}
                  color={COLORS.amber400}
                  style={styles.ratingStar}
                />
                <Text style={styles.statValue}>4.9</Text>
              </View>
              <Text style={styles.statLabel}>Đánh giá</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.sectionWrapper}>
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => {
              const IconComponent = item.IconComponent;

              return (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => item.route && handleNavigate(item.route)}
                  style={[
                    styles.menuButton,
                    index !== menuItems.length - 1 && styles.menuDivider,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuLeft}>
                    {/* 💡 SỬ DỤNG TÊN ICON ĐÃ ĐƯỢC ÉP KIỂU AN TOÀN */}
                    <IconComponent
                      name={item.iconName as any | IoniconsName}
                      size={20}
                      color={item.color}
                    />
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={COLORS.slate400}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Settings Items */}
        <View style={styles.sectionWrapper}>
          <View style={styles.menuCard}>
            {settingsItems.map((item, index) => {
              const IconComponent = Feather; // Tất cả settings items dùng Feather

              return (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => item.route && handleNavigate(item.route)}
                  style={[
                    styles.menuButton,
                    index !== settingsItems.length - 1 && styles.menuDivider,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuLeft}>
                    <IconComponent
                      name={item.iconName as FeatherIconName}
                      size={20}
                      color={COLORS.slate600}
                    />
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={COLORS.slate400}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutWrapper}>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
            activeOpacity={0.8}
          >
            <View style={styles.logoutButtonContent}>
              <Feather name="log-out" size={20} color={COLORS.red600} />
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>DrinkJoy Version 1.0.0</Text>
        </View>

        {/* Padding cuối cùng cho Bottom Nav */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

export default ProfilePage;

// -----------------------------------------------------------
// 💡 STYLE SHEET
// -----------------------------------------------------------

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: COLORS.slate50 },
  scrollContent: { paddingBottom: 0 },
  headerGradient: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {},
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.white,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%", resizeMode: "cover" },
  userInfo: { flex: 1 },
  userName: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: { color: COLORS.emerald100, fontSize: 14 },
  membershipCard: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 16,
  },
  membershipRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  membershipIconText: { flexDirection: "row", alignItems: "center", gap: 8 },
  membershipLabel: { color: COLORS.white, fontSize: 16 },
  membershipTier: { color: COLORS.amber300, fontWeight: "bold", fontSize: 16 },
  membershipStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 14,
  },
  membershipStatsLabel: { color: COLORS.emerald100, fontSize: 14 },
  membershipStatsValue: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
  },
  statsWrapper: { marginTop: -48, paddingHorizontal: 16, marginBottom: 24 },
  statsGrid: { flexDirection: "row", gap: 12, justifyContent: "space-between" },
  statItem: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statValue: { fontSize: 24, fontWeight: "bold" },
  statLabel: { color: COLORS.slate600, fontSize: 12 },
  ratingStat: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: 4,
  },
  ratingStar: { color: COLORS.amber400 },
  sectionWrapper: { paddingHorizontal: 16, marginBottom: 16 },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
  },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.slate100 },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuLabel: { color: COLORS.slate700, fontSize: 16 },
  logoutWrapper: { paddingHorizontal: 16 },
  logoutButton: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: "center",
  },
  logoutButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  logoutText: { color: COLORS.red600, fontSize: 16, fontWeight: "bold" },
  versionInfo: { alignItems: "center", marginTop: 24, paddingHorizontal: 16 },
  versionText: { color: COLORS.slate400, fontSize: 12 },
});
