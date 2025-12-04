import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard"; // 💡 Thư viện Clipboard RN
import Toast from "react-native-toast-message"; // 💡 Thư viện Toast RN

// 💡 IMPORTS COMPONENTS & CONTEXTS
import { Header } from "../components/Header";

// --- Types & Data ---
type VoucherType = "percent" | "fixed" | "shipping";

interface Voucher {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  minOrder: number;
  maxDiscount?: number;
  expiry: Date;
  type: VoucherType;
  used: boolean;
}

const VOUCHERS: Voucher[] = [
  // Dữ liệu Mock
  {
    id: "1",
    code: "WELCOME30",
    title: "Giảm 30% đơn đầu tiên",
    description: "Áp dụng cho khách hàng mới",
    discount: "30%",
    minOrder: 0,
    maxDiscount: 50000,
    expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    type: "percent",
    used: false,
  },
  {
    id: "2",
    code: "FREESHIP",
    title: "Miễn phí vận chuyển",
    description: "Đơn từ 100k",
    discount: "Free ship",
    minOrder: 100000,
    expiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    type: "shipping",
    used: false,
  },
  {
    id: "3",
    code: "FLASH50",
    title: "Giảm 50K",
    description: "Cho đơn từ 200k",
    discount: "50,000đ",
    minOrder: 200000,
    expiry: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    type: "fixed",
    used: false,
  },
  {
    id: "4",
    code: "USED_CODE",
    title: "Giảm 20%",
    description: "Áp dụng 14h-16h hàng ngày",
    discount: "20%",
    minOrder: 50000,
    maxDiscount: 30000,
    expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    type: "percent",
    used: true,
  },
  {
    id: "5",
    code: "MEMBER15",
    title: "Ưu đãi thành viên",
    description: "Giảm 15% mọi đơn hàng",
    discount: "15%",
    minOrder: 0,
    maxDiscount: 40000,
    expiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    type: "percent",
    used: false,
  },
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
  emerald500: "#10b981",
  emerald600: "#059669",
  emerald50: "#f0fff4",
  emerald100: "#d1fae5",
  teal600: "#0d9488",
  red500: "#ef4444",
  red50: "#fef2f2",
};
// -----------------------------------------------------------

interface VouchersPageProps {
  goBack: () => void;
  // Giả định navigateTo được truyền vào từ Layout cha
  navigateTo: (page: string) => void;
}

export function VouchersPage({ goBack, navigateTo }: VouchersPageProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "available" | "used">("all");
  const insets = useSafeAreaInsets();

  const filteredVouchers = VOUCHERS.filter((v) => {
    if (filter === "all") return true;
    if (filter === "available") return !v.used;
    if (filter === "used") return v.used;
    return true;
  });

  const copyCode = (code: string) => {
    // 💡 SỬA LỖI: Dùng Clipboard RN thay vì navigator.clipboard
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

  const getDaysLeft = (expiry: Date) => {
    const diff = expiry.getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
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
              { id: "used", label: "Đã dùng" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setFilter(tab.id as any)}
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
          <View style={styles.vouchersList}>
            {filteredVouchers.map((voucher) => {
              const daysLeft = getDaysLeft(voucher.expiry);
              const isExpiringSoon = daysLeft <= 3;
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
                        <Text style={styles.voucherTitle}>{voucher.title}</Text>
                      </View>
                      <View style={styles.discountTag}>
                        <Text style={styles.discountText}>
                          {voucher.discount}
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
                            <Text style={styles.codeValue}>{voucher.code}</Text>
                            <TouchableOpacity
                              onPress={() => copyCode(voucher.code)}
                              style={styles.copyButton}
                            >
                              <Feather
                                name={
                                  copiedCode === voucher.code ? "check" : "copy"
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
                              {voucher.minOrder.toLocaleString("vi-VN")}đ
                            </Text>
                          )}
                          {voucher.maxDiscount && (
                            <Text style={styles.conditionText}>
                              • Giảm tối đa:{" "}
                              {voucher.maxDiscount.toLocaleString("vi-VN")}đ
                            </Text>
                          )}
                          <View style={styles.expiryRow}>
                            <Text style={styles.expiryText}>
                              HSD: {formatDate(voucher.expiry)}
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
                        <TouchableOpacity style={styles.useButton}>
                          <LinearGradient
                            colors={[COLORS.emerald500, COLORS.teal600]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                          />
                          <Text style={styles.useButtonText}>Sử dụng ngay</Text>
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

          {/* Empty State */}
          {filteredVouchers.length === 0 && (
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
  contentPadding: { paddingHorizontal: 16, paddingVertical: 16 },
  // --- Filter Tabs ---
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
  filterInactiveText: { color: COLORS.slate700, zIndex: 1, fontSize: 14 },
  // --- Vouchers List ---
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
    backgroundColor: COLORS.emerald50,
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
  },
  // --- Details and Code ---
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
  },
  // --- Actions ---
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
    backgroundColor: COLORS.emerald600,
    // Màu này nên được là LinearGradient riêng nếu cần chuyển màu
  },
  // --- Empty State ---
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
