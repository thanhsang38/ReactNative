import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Slider from "@react-native-community/slider";

// --- Interfaces và Constants ---
const { width } = Dimensions.get("window");

// 💡 INTERFACE NÀY PHẢI KHỚP VỚI CÁI DÙNG TRONG MenuPage.tsx
export interface FilterOptions {
  priceRange: number[];
  rating: number | null;
  sortBy: "popular" | "price-low" | "price-high" | "rating";
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

const RATING_OPTIONS = [4.5, 4.0, 3.5];
const SORT_OPTIONS = [
  { id: "popular", label: "Phổ biến nhất" },
  { id: "rating", label: "Đánh giá cao nhất" },
  { id: "price-low", label: "Giá thấp nhất" },
  { id: "price-high", label: "Giá cao nhất" },
];

const MIN_PRICE = 0;
const MAX_PRICE = 1000000;

// Màu sắc
const COLORS = {
  white: "#ffffff",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate400: "#94a3b8",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  emerald500: "#10b981",
  teal600: "#0d9488",
  red500: "#ef4444",
  amber400: "#fbbf24",
  emerald600: "#059669",
};

// -----------------------------------------------------------

export function FilterModal({
  isOpen,
  onClose,
  onApply,
  currentFilters,
}: FilterModalProps) {
  const [tempPriceRange, setTempPriceRange] = useState(
    currentFilters.priceRange
  );
  const [tempRating, setTempRating] = useState(currentFilters.rating);
  const [tempSortBy, setTempSortBy] = useState(currentFilters.sortBy);

  // 💡 Đồng bộ hóa state tạm thời khi modal mở/đóng
  React.useEffect(() => {
    setTempPriceRange(currentFilters.priceRange);
    setTempRating(currentFilters.rating);
    setTempSortBy(currentFilters.sortBy);
  }, [isOpen]);

  const handleClearFilters = () => {
    setTempPriceRange([MIN_PRICE, MAX_PRICE]);
    setTempRating(null);
    setTempSortBy("popular");
  };

  const handleApply = () => {
    onApply({
      priceRange: tempPriceRange,
      rating: tempRating,
      sortBy: tempSortBy,
    });
    onClose();
  };

  // Logic hiển thị giá trị slider (chỉ lấy giá trị cao nhất cho slider đơn)
  const displayPrice = tempPriceRange[1].toLocaleString("vi-VN");

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Bộ lọc & Sắp xếp</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={COLORS.slate700} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Price Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Phạm vi giá</Text>
              <View style={styles.priceRangeDisplay}>
                <Text style={styles.priceRangeText}>Dưới {displayPrice}đ</Text>
              </View>

              {/* ⚠️ CHÚ Ý: Cần Slider hỗ trợ Single Value/Range. Dùng Slider đơn giản cho RN */}
              <Slider
                style={styles.slider}
                minimumValue={MIN_PRICE}
                maximumValue={MAX_PRICE}
                step={10000}
                value={tempPriceRange[1]} // Dùng giá trị MAX để mô phỏng 'dưới'
                onValueChange={(value) => setTempPriceRange([MIN_PRICE, value])}
                minimumTrackTintColor={COLORS.emerald500}
                maximumTrackTintColor={COLORS.slate200}
                thumbTintColor={COLORS.emerald600}
              />
              <View style={styles.rangeLabels}>
                <Text style={styles.rangeLabelText}>
                  {MIN_PRICE.toLocaleString()}đ
                </Text>
                <Text style={styles.rangeLabelText}>
                  Trên {MAX_PRICE.toLocaleString()}đ
                </Text>
              </View>
            </View>

            {/* Rating Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Đánh giá tối thiểu</Text>
              <View style={styles.ratingGrid}>
                {RATING_OPTIONS.map((rating) => {
                  const isActive = tempRating === rating;
                  return (
                    <TouchableOpacity
                      key={rating}
                      onPress={() => setTempRating(isActive ? null : rating)}
                      style={[
                        styles.ratingButton,
                        isActive && styles.ratingButtonActive,
                      ]}
                    >
                      <Ionicons
                        name="star"
                        size={16}
                        color={isActive ? COLORS.white : COLORS.amber400}
                      />
                      <Text
                        style={[
                          styles.ratingText,
                          { color: isActive ? COLORS.white : COLORS.slate700 },
                        ]}
                      >
                        {rating}+
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Sort By */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sắp xếp theo</Text>
              <View style={styles.sortOptionsList}>
                {SORT_OPTIONS.map((option) => {
                  const isActive = tempSortBy === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => setTempSortBy(option.id as any)}
                      style={styles.sortButton}
                    >
                      <Text style={styles.sortLabel}>{option.label}</Text>
                      {isActive && (
                        <View style={styles.radioCheck}>
                          <Feather
                            name="check"
                            size={16}
                            color={COLORS.emerald600}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Bottom Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              onPress={handleClearFilters}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>Xóa lọc</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleApply} style={styles.applyButton}>
              <LinearGradient
                colors={[COLORS.emerald500, COLORS.teal600]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.applyButtonText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// -----------------------------------------------------------
// 💡 STYLE SHEET
// -----------------------------------------------------------

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: "100%",
    maxHeight: Dimensions.get("window").height * 0.85, // Giới hạn chiều cao
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.slate800,
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.slate800,
    marginBottom: 12,
  },
  // --- Price Range ---
  priceRangeDisplay: {
    alignItems: "center",
    marginBottom: 8,
  },
  priceRangeText: {
    fontSize: 18,
    color: COLORS.emerald600,
    fontWeight: "bold",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -10,
  },
  rangeLabelText: {
    fontSize: 12,
    color: COLORS.slate600,
  },
  // --- Rating Filter ---
  ratingGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  ratingButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    gap: 4,
  },
  ratingButtonActive: {
    backgroundColor: COLORS.amber400, // Thay thế cho fill-amber-400
    borderColor: COLORS.amber400,
    shadowColor: COLORS.amber400,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  ratingText: {
    fontSize: 14,
  },
  // --- Sort By ---
  sortOptionsList: {
    gap: 8,
  },
  sortButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  sortLabel: {
    fontSize: 16,
    color: COLORS.slate700,
  },
  radioCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderColor: COLORS.emerald600,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  // --- Action Bar ---
  actionBar: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    gap: 16,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    color: COLORS.slate700,
    fontSize: 16,
    fontWeight: "bold",
  },
  applyButton: {
    flex: 2,
    borderRadius: 12,
    overflow: "hidden",
    paddingVertical: 16,
    position: "relative",
    shadowColor: COLORS.emerald500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    alignItems: "center",
  },
  applyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    zIndex: 1,
  },
});
