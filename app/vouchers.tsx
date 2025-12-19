import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard"; // 💡 Thư viện Clipboard RN
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message"; // 💡 Thư viện Toast RN
import { useCart } from "../context/CartContext";

// 💡 IMPORTS COMPONENTS & CONTEXTS
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext"; // ✅ IMPORT AUTH
import { getVouchers, VoucherRow } from "./services/baserowApi"; // ✅ IMPORT API VOUCHER

// --- Types & Data ---
type VoucherType = "percent" | "fixed" | "shipping"; // Kiểu dữ liệu Single Select
type Filter = "all" | "available" | "used" | "expiring";

// ✅ FIX: Sử dụng VoucherRow làm kiểu dữ liệu chính cho Client
interface Voucher extends VoucherRow {
  // Chuyển đổi từ số/chuỗi API sang string hiển thị
  displayDiscount: string;
}

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
  emerald500: "#10b981",
  emerald600: "#059669",
  emerald50: "#f0fff4",
  emerald100: "#d1fae5",
  teal600: "#0d9488",
  red500: "#ef4444",
  red50: "#fef2f2",
  amber400: "#fbbf24",
};
// -----------------------------------------------------------

interface VouchersPageProps {
  goBack: () => void; // Giả định navigateTo được truyền vào từ Layout cha
  navigateTo: (page: string) => void;
}

export function VouchersPage({ goBack, navigateTo }: VouchersPageProps) {
  const { user } = useAuth(); // Lấy user ID
  const [allVouchers, setAllVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("available"); // Mặc định là Có thể dùng
  const insets = useSafeAreaInsets(); // 💡 HÀM TẢI DỮ LIỆU TỪ API
  const { setSelectedVoucher } = useCart();
  const router = useRouter();
  const fetchVouchers = async () => {
    if (!user || !user.id) return;

    setIsLoading(true);
    try {
      const result = await getVouchers(user.id);
      if (result.success && result.data) {
        const mappedVouchers: Voucher[] = result.data.map((v) => {
          let displayDiscount = "";
          if (v.type === "percent") {
            displayDiscount = `${v.discount}%`;
          } else if (v.type === "fixed") {
            displayDiscount = `${v.discount.toLocaleString("vi-VN")}đ`;
          } else if (v.type === "shipping") {
            displayDiscount = "Miễn phí Ship";
          }

          return { ...v, displayDiscount };
        });

        setAllVouchers(mappedVouchers);
      } else {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: result.message || "Không thể tải ưu đãi.",
          visibilityTime: 3000,
        });
      }
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Lỗi hệ thống",
        text2: "Lỗi mạng hoặc server.",
        visibilityTime: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchVouchers();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);
  const getDaysLeft = (expiry: Date) => {
    const diff = expiry.getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };
  const handleUseVoucher = (voucher: Voucher) => {
    // ✅ LƯU VOUCHER VÀO CART CONTEXT
    setSelectedVoucher({
      id: voucher.id,
      code: voucher.code,
      discount: voucher.discount,
      type: voucher.type,
      minOrder: voucher.minOrder,
      maxDiscount: voucher.maxDiscount ?? undefined,
    });

    Toast.show({
      type: "success",
      text1: "Đã áp dụng mã giảm giá",
      text2: voucher.code,
      visibilityTime: 1500,
    });
    router.replace("/cart");
  };

  // --- LOGIC LỌC VÀ HIỂN THỊ ---
  const filteredVouchers = allVouchers.filter((v) => {
    const daysLeft = getDaysLeft(new Date(v.expiry));
    const isExpiringSoon = daysLeft > 0 && daysLeft <= 3;

    if (filter === "all") return true;
    if (filter === "available") return !v.used && daysLeft > 0;
    if (filter === "used") return v.used;
    // Lọc theo sắp hết hạn
    if (filter === "expiring") return !v.used && isExpiringSoon;

    return true;
  });

  const copyCode = (code: string) => {
    // 💡 SỬ DỤNG Clipboard RN
    Clipboard.setStringAsync(code);
    setCopiedCode(code);
    Toast.show({
      type: "success",
      text1: "Đã sao chép mã",
      visibilityTime: 1500,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (date: Date) => {
    // Sửa lỗi toLocaleDateString trong RN
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const headerHeight = 50 + insets.top;

  return (
    <View style={styles.fullContainer}>
      <Header title="Ưu đãi của tôi" showBack={true} onBack={goBack} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: headerHeight }}
      >
        <View style={styles.contentPadding}>
          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {[
              { id: "all", label: "Tất cả" },
              { id: "available", label: "Có thể dùng" },
              { id: "expiring", label: "Sắp hết hạn" }, // ✅ THÊM FILTER MỚI
              { id: "used", label: "Đã dùng" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setFilter(tab.id as Filter)}
                style={styles.filterButtonContainer}
              >
                <View
                  style={[
                    styles.filterButton,
                    filter === tab.id
                      ? styles.filterActive
                      : styles.filterInactive,
                  ]}
                >
                  {/* 💡 Gradient Background cho nút active */}
                  {filter === tab.id && (
                    <LinearGradient
                      colors={[COLORS.emerald500, COLORS.teal600]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <Text
                    style={
                      filter === tab.id
                        ? styles.filterActiveText
                        : styles.filterInactiveText
                    }
                  >
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Vouchers List */}
          {isLoading && filteredVouchers.length === 0 ? (
            <View style={styles.emptyView}>
              <ActivityIndicator size="large" color={COLORS.emerald600} />
              <Text style={styles.emptySubtitle}>Đang tải ưu đãi...</Text>
            </View>
          ) : (
            <View style={styles.vouchersList}>
              {filteredVouchers.map((voucher) => {
                const daysLeft = getDaysLeft(new Date(voucher.expiry));
                const isExpiringSoon = daysLeft > 0 && daysLeft <= 3;
                const isUsed = voucher.used;

                return (
                  <View
                    key={voucher.id}
                    style={[
                      styles.voucherCard,
                      isUsed && styles.voucherUsedOpacity,
                    ]}
                  >
                    <View style={styles.voucherCardInner}>
                      {/* Voucher Header */}
                      <View style={styles.voucherHeader}>
                        <View style={styles.voucherTitleSection}>
                          <Feather
                            name="tag"
                            size={20}
                            color={COLORS.emerald600}
                          />
                          <Text style={styles.voucherTitle}>
                            {voucher.Name}
                          </Text>
                          {/* ✅ Dùng Name */}
                        </View>
                        <View style={styles.discountTag}>
                          <Text style={styles.discountText}>
                            {voucher.displayDiscount}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.voucherDescription}>
                        {voucher.description}
                      </Text>
                      {/* Voucher Details (Code & Expiry) */}
                      <View style={styles.voucherDetailsContainer}>
                        <View style={styles.voucherDetailsInner}>
                          {/* Code Copy */}
                          <View style={styles.codeContainer}>
                            <Text style={styles.codeLabel}>Mã giảm giá</Text>
                            <View style={styles.codeRow}>
                              <Text style={styles.codeValue}>
                                {voucher.code}
                              </Text>
                              <TouchableOpacity
                                onPress={() => copyCode(voucher.code)}
                                style={styles.copyButton}
                              >
                                <Feather
                                  name={
                                    copiedCode === voucher.code
                                      ? "check"
                                      : "copy"
                                  }
                                  size={16}
                                  color={
                                    copiedCode === voucher.code
                                      ? COLORS.emerald600
                                      : COLORS.slate600
                                  }
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                          {/* Conditions */}
                          <View style={styles.conditionsList}>
                            {voucher.minOrder > 0 && (
                              <Text style={styles.conditionText}>
                                • Đơn tối thiểu:{" "}
                                {Number(voucher.minOrder).toLocaleString(
                                  "vi-VN"
                                )}
                                đ
                              </Text>
                            )}
                            {voucher.maxDiscount && (
                              <Text style={styles.conditionText}>
                                • Giảm tối đa:{" "}
                                {Number(voucher.maxDiscount).toLocaleString(
                                  "vi-VN"
                                )}
                                đ
                              </Text>
                            )}
                            <View style={styles.expiryRow}>
                              <Text style={styles.expiryText}>
                                HSD: {formatDate(new Date(voucher.expiry))}
                                {/* ✅ SỬ DỤNG NEW DATE */}
                              </Text>
                              {isExpiringSoon && !isUsed && (
                                <View style={styles.expiringTag}>
                                  <Text style={styles.expiringText}>
                                    Còn {daysLeft} ngày
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      </View>
                      {/* Action Button */}
                      <View style={styles.actionButtonWrapper}>
                        {!isUsed ? (
                          <TouchableOpacity
                            style={styles.useButton}
                            onPress={() => handleUseVoucher(voucher)}
                          >
                            <LinearGradient
                              colors={[COLORS.emerald500, COLORS.teal600]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={StyleSheet.absoluteFill}
                            />
                            <Text style={styles.useButtonText}>
                              Sử dụng ngay
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.usedTag}>
                            <Text style={styles.usedTagText}>Đã sử dụng</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {/* Voucher Border Pattern */}
                    <View style={styles.borderPattern} />
                  </View>
                );
              })}
            </View>
          )}
          {/* Empty State */}
          {filteredVouchers.length === 0 && !isLoading && (
            <View style={styles.emptyView}>
              <View style={styles.emptyIconWrapper}>
                <Feather name="tag" size={64} color={COLORS.slate400} />
              </View>
              <Text style={styles.emptyTitle}>Không có ưu đãi nào</Text>
              <Text style={styles.emptySubtitle}>
                {filter === "used"
                  ? "Bạn chưa sử dụng ưu đãi nào"
                  : "Hãy quay lại sau để nhận ưu đãi mới"}
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
export default VouchersPage;

// -----------------------------------------------------------
// 💡 STYLE SHEET
// -----------------------------------------------------------

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: COLORS.bg },
  contentPadding: { paddingHorizontal: 16, paddingVertical: 16 }, // --- Filter Tabs ---
  filterScroll: { gap: 8, paddingBottom: 8, marginBottom: 16 },
  filterButtonContainer: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.slate200, // Đảm bảo có viền
  },
  filterButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
    backgroundColor: COLORS.white,
  },
  filterActive: { borderColor: COLORS.emerald600 },
  filterInactive: { borderColor: COLORS.slate200 },
  filterActiveText: {
    color: COLORS.white,
    fontWeight: "bold",
    zIndex: 1,
    fontSize: 14,
  },
  filterInactiveText: { color: COLORS.slate700, zIndex: 1, fontSize: 14 }, // --- Vouchers List ---
  vouchersList: { gap: 12 },
  voucherCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  voucherUsedOpacity: {
    opacity: 0.6,
  },
  voucherCardInner: {
    padding: 16,
  },
  voucherHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  voucherTitleSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    paddingRight: 12,
  },
  voucherTitle: { color: COLORS.slate800, fontWeight: "bold", fontSize: 16 },
  voucherDescription: {
    color: COLORS.slate600,
    fontSize: 14,
    marginBottom: 12,
  },
  discountTag: {
    backgroundColor: COLORS.emerald50, // FIX: Dùng màu nền cho tag
    color: COLORS.emerald600,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  discountText: {
    color: COLORS.emerald600,
    fontSize: 14,
    fontWeight: "bold",
  }, // --- Details and Code ---
  voucherDetailsContainer: {
    backgroundColor: COLORS.slate50, // bg-slate-50
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  voucherDetailsInner: {
    // space-y-3
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  codeLabel: {
    color: COLORS.slate600,
    fontSize: 14,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  codeValue: {
    color: COLORS.emerald600,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: "bold",
    fontSize: 14,
  },
  copyButton: {
    padding: 8,
    borderRadius: 8,
  },
  conditionsList: {
    gap: 4,
    color: COLORS.slate600,
    fontSize: 12,
  },
  conditionText: {
    color: COLORS.slate600,
    fontSize: 12,
  },
  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  expiryText: {
    fontSize: 12,
    color: COLORS.slate600,
  },
  expiringTag: {
    backgroundColor: COLORS.red50,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  expiringText: {
    color: COLORS.red500,
    fontSize: 12,
    fontWeight: "bold",
  }, // --- Actions ---
  actionButtonWrapper: {
    marginBottom: 8,
  },
  useButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  useButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
    zIndex: 1,
  },
  usedTag: {
    width: "100%",
    paddingVertical: 12,
    backgroundColor: COLORS.slate100,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  usedTagText: {
    color: COLORS.slate500,
    fontSize: 16,
    fontWeight: "bold",
  },
  borderPattern: {
    height: 8,
    backgroundColor: COLORS.emerald600, // Màu này nên được là LinearGradient riêng nếu cần chuyển màu
  }, // --- Empty State ---
  emptyView: {
    alignItems: "center",
    paddingVertical: 80,
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
  emptySubtitle: { color: COLORS.slate600, fontSize: 16 },
});
