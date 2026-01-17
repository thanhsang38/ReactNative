import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// -------------------- TYPES --------------------
export interface FilterOptions {
  priceRange: number[];
  rating: number | null;
  sortBy: "popular" | "price-low" | "price-high" | "rating";
  isSale: boolean; // 💡 Mới: Lọc món đang giảm giá
  isHot: boolean;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

// -------------------- CONSTANTS --------------------
const MIN_PRICE = 0;
const MAX_PRICE = 1_000_000;

const SORT_OPTIONS = [
  { id: "popular", label: "Phổ biến nhất" },
  { id: "price-low", label: "Giá thấp nhất" },
  { id: "price-high", label: "Giá cao nhất" },
];

// -------------------- COLORS --------------------
const COLORS = {
  white: "#ffffff",
  slate200: "#e2e8f0",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  emerald500: "#10b981",
  emerald600: "#059669",
  teal600: "#0d9488",
};

// =================================================
export function FilterModal({
  isOpen,
  onClose,
  onApply,
  currentFilters,
}: FilterModalProps) {
  const [minPrice, setMinPrice] = useState<string>(
    String(currentFilters.priceRange[0])
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    String(currentFilters.priceRange[1])
  );
  const [tempIsSale, setTempIsSale] = useState(currentFilters.isSale);
  const [tempIsHot, setTempIsHot] = useState(currentFilters.isHot);
  const [tempSortBy, setTempSortBy] = useState(currentFilters.sortBy);

  useEffect(() => {
    setMinPrice(String(currentFilters.priceRange[0]));
    setMaxPrice(String(currentFilters.priceRange[1]));

    setTempSortBy(currentFilters.sortBy);
  }, [isOpen]);

  // -------------------- HANDLERS --------------------
  const handleApply = () => {
    const min = minPrice === "" ? MIN_PRICE : Number(minPrice);
    const max = maxPrice === "" ? MAX_PRICE : Number(maxPrice);

    if (isNaN(min) || isNaN(max)) {
      Alert.alert("Lỗi", "Giá không hợp lệ");
      return;
    }

    if (min < 0 || max < 0) {
      Alert.alert("Lỗi", "Giá không được âm");
      return;
    }

    if (min > max) {
      Alert.alert("Lỗi", "Giá từ không được lớn hơn giá đến");
      return;
    }

    if (max > MAX_PRICE) {
      Alert.alert("Lỗi", "Giá vượt quá giới hạn cho phép");
      return;
    }

    onApply({
      priceRange: [min, max],
      rating: null,
      sortBy: tempSortBy,
      isSale: tempIsSale,
      isHot: tempIsHot,
    });

    onClose();
  };

  const handleClearFilters = () => {
    onApply({
      priceRange: [MIN_PRICE, MAX_PRICE],
      rating: null,
      sortBy: "popular",
      isSale: false,
      isHot: false,
    });
    onClose();
  };

  // -------------------- RENDER --------------------
  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Bộ lọc & Sắp xếp</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={COLORS.slate700} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* PRICE FILTER */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Phạm vi giá</Text>

              <View style={styles.priceInputRow}>
                <View style={styles.priceInputBox}>
                  <Text style={styles.priceLabel}>Từ</Text>
                  <TextInput
                    style={styles.priceInput}
                    keyboardType="number-pad"
                    value={minPrice.toString()}
                    onChangeText={(t) => {
                      const value = t.replace(/\D/g, "");
                      setMinPrice(value);
                    }}
                    placeholder="0"
                  />
                </View>

                <Text style={styles.priceSeparator}>—</Text>

                <View style={styles.priceInputBox}>
                  <Text style={styles.priceLabel}>Đến</Text>
                  <TextInput
                    style={styles.priceInput}
                    keyboardType="number-pad"
                    value={maxPrice.toString()}
                    onChangeText={(t) => {
                      const value = t.replace(/\D/g, "");
                      setMaxPrice(value);
                    }}
                    placeholder={MAX_PRICE.toString()}
                  />
                </View>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trạng thái sản phẩm</Text>
              <View style={styles.tagWrapper}>
                <TouchableOpacity
                  style={[styles.tagItem, tempIsSale && styles.activeTag]}
                  onPress={() => setTempIsSale(!tempIsSale)}
                >
                  <Text
                    style={[styles.tagLabel, tempIsSale && styles.activeText]}
                  >
                    🏷️ Đang giảm giá
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tagItem, tempIsHot && styles.activeTag]}
                  onPress={() => setTempIsHot(!tempIsHot)}
                >
                  <Text
                    style={[styles.tagLabel, tempIsHot && styles.activeText]}
                  >
                    🔥 Món bán chạy
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* SORT */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sắp xếp theo</Text>
              {SORT_OPTIONS.map((opt) => {
                const active = tempSortBy === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={styles.sortItem}
                    onPress={() => setTempSortBy(opt.id as any)}
                  >
                    <Text style={styles.sortLabel}>{opt.label}</Text>
                    {active && (
                      <Feather
                        name="check"
                        size={18}
                        color={COLORS.emerald600}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* ACTION BAR */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearFilters}
            >
              <Text style={styles.clearText}>Xóa lọc</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <LinearGradient
                colors={[COLORS.emerald500, COLORS.teal600]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.applyText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default FilterModal;

// =================================================
// STYLES
// =================================================
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: Dimensions.get("window").height * 0.85,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.slate800,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.slate800,
    marginBottom: 12,
  },

  // PRICE INPUT
  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceInputBox: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.slate600,
    marginBottom: 4,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.slate800,
  },
  priceSeparator: {
    marginHorizontal: 12,
    fontSize: 18,
    color: COLORS.slate600,
  },

  // SORT
  sortItem: {
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  sortLabel: {
    fontSize: 16,
    color: COLORS.slate700,
  },

  // ACTION
  actionBar: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
  },
  clearButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  clearText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.slate700,
  },
  applyButton: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    overflow: "hidden",
  },
  applyText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    zIndex: 1,
  },
  tagWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tagItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f1f5f9", // Mặc định là slate-100
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  activeTag: {
    backgroundColor: COLORS.emerald500, // Đổi màu nền khi được chọn
    borderColor: COLORS.emerald500,
  },
  tagLabel: {
    fontSize: 14,
    color: COLORS.slate700,
    fontWeight: "500",
  },
  activeText: {
    color: COLORS.white, // Đổi màu chữ sang trắng khi được chọn
  },

  // Style cho modal footer/action bar nếu bạn chưa có GAP
});
