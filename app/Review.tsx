import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// 💡 IMPORTS DỊCH VỤ VÀ CONTEXT
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { createReview, getOrderById } from "./services/baserowApi";

// -----------------------------------------------------------
// CẤU HÌNH MÀU SẮC (Đồng bộ với các trang khác)
// -----------------------------------------------------------
const COLORS = {
  bg: "#f8fafc",
  white: "#ffffff",
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  emerald500: "#10b981",
  emerald600: "#059669",
  teal600: "#0d9488",
  amber400: "#fbbf24",
  amber500: "#f59e0b",
  amber600: "#d97706",
  red500: "#ef4444",
};

// -----------------------------------------------------------
// COMPONENT RATING STARS (Dùng chung cho trang)
// -----------------------------------------------------------
const RatingStars = ({
  rating,
  onRate,
  size = "md",
}: {
  rating: number;
  onRate: (rating: number) => void;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeValue = size === "lg" ? 40 : size === "md" ? 32 : 24;

  return (
    <View style={styles.ratingStarsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onRate(star)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={star <= rating ? "star" : "star-outline"}
            size={sizeValue}
            color={star <= rating ? COLORS.amber400 : COLORS.slate300}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

// -----------------------------------------------------------
// MAIN COMPONENT: REVIEW PAGE
// -----------------------------------------------------------
export function ReviewPage() {
  const { orderId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // --- States ---
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State quản lý đánh giá cho từng sản phẩm
  // Key là productId, Value là object { rating, comment }
  const [reviewsData, setReviewsData] = useState<
    Record<number, { rating: number; comment: string }>
  >({});

  const headerHeight = 10 + insets.top;
  const pointsEarned = 100;

  // --- Effect: Lấy thông tin đơn hàng khi vào trang ---
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) {
        Alert.alert("Lỗi", "Không tìm thấy mã đơn hàng.");
        router.back();
        return;
      }

      try {
        setLoading(true);
        const response = await getOrderById(Number(orderId));
        console.log("DON HANG DANH GIA:", response);
        if (response.success && response.data) {
          setOrder(response.data);

          // Khởi tạo state đánh giá mặc định cho từng sản phẩm trong đơn hàng
          const initialReviews: Record<
            number,
            { rating: number; comment: string }
          > = {};
          response.data.orderDetail.forEach((item: any) => {
            const pId = item.productId;
            console.log("PRODUCT ID:", pId);
            if (pId) {
              initialReviews[pId] = { rating: 5, comment: "" };
            }
          });
          setReviewsData(initialReviews);
          console.log("CHI TIET SP DANH GIA:", initialReviews);
        } else {
          Alert.alert("Lỗi", "Không thể tải thông tin đơn hàng.");
          router.back();
        }
      } catch (error) {
        console.error("Fetch order error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  // --- Hàm cập nhật state cho từng sản phẩm ---
  const updateProductReview = (
    productId: number,
    field: "rating" | "comment",
    value: any
  ) => {
    setReviewsData((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
  };

  // --- Hàm gửi toàn bộ đánh giá lên Baserow ---
  const handleSubmitReview = async () => {
    if (!user || !order) return;

    try {
      setIsSubmitting(true);

      // Tạo danh sách các Promise gửi đánh giá cho từng sản phẩm
      const reviewPromises = order.orderDetail.map((item: any) => {
        const pId = item.productId;
        const review = reviewsData[pId];

        return createReview({
          rating: review?.rating || 5,
          comment: review?.comment || "Đánh giá tuyệt vời!",
          productId: pId,
          userId: user.id,
          is_edited: false,
        });
      });

      // Đợi tất cả API phản hồi
      const results = await Promise.all(reviewPromises);
      const allSuccess = results.every((r) => r.success);

      if (allSuccess) {
        Toast.show({
          type: "success",
          text1: "Cảm ơn bạn đã đánh giá!",
          text2: `Bạn nhận được +${pointsEarned} điểm thưởng`,
          visibilityTime: 2000,
        });

        // Quay lại trang trước sau khi hiện Toast
        setTimeout(() => {
          router.back();
        }, 2000);
      } else {
        Alert.alert(
          "Lỗi",
          "Gửi một số đánh giá không thành công, vui lòng thử lại."
        );
      }
    } catch (error) {
      console.error("Submit review error:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi gửi đánh giá.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Giao diện Loading ---
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.emerald600} />
        <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <Header
        title="Đánh giá đơn hàng"
        showBack={true}
        onBack={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: headerHeight }}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentPadding}>
          <Text style={styles.sectionTitle}>Bạn thấy món ăn thế nào?</Text>

          {/* LẶP QUA TẤT CẢ SẢN PHẨM TRONG ĐƠN HÀNG */}
          {order?.orderDetail?.map((item: any) => {
            const pId = item.productId;
            if (!pId) return null;

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.itemHeader}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemQty}>
                      Size: {item.size || "M"} • x{item.quantity}
                    </Text>
                    <RatingStars
                      rating={reviewsData[pId]?.rating || 5}
                      onRate={(rating) =>
                        updateProductReview(pId, "rating", rating)
                      }
                      size="sm"
                    />
                  </View>
                </View>

                <TextInput
                  value={reviewsData[pId]?.comment || ""}
                  onChangeText={(text) =>
                    updateProductReview(pId, "comment", text)
                  }
                  placeholder="Hãy chia sẻ cảm nhận của bạn về món này nhé..."
                  style={styles.reviewInput}
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            );
          })}

          {/* Rewards Card */}
          <View style={styles.rewardsCard}>
            <View style={styles.rewardsContent}>
              <View style={styles.rewardsIconWrapper}>
                <Text style={styles.rewardsEmoji}>🎁</Text>
              </View>
              <View style={styles.rewardsInfoText}>
                <Text style={styles.rewardsTitle}>Ưu đãi đánh giá</Text>
                <Text style={styles.rewardsSubtitle}>
                  +{pointsEarned} điểm sẽ được cộng vào tài khoản của bạn
                </Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmitReview}
            disabled={isSubmitting}
            style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
          >
            <LinearGradient
              colors={[COLORS.emerald500, COLORS.teal600]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Mọi đánh giá chân thành của bạn đều góp phần làm cửa hàng tốt hơn ❤️
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

export default ReviewPage;

// -----------------------------------------------------------
// STYLES
// -----------------------------------------------------------
const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: 40 },
  contentPadding: { paddingHorizontal: 16, paddingTop: 60 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.slate800,
    marginBottom: 16,
  },

  // --- Loading ---
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: COLORS.slate500 },

  // --- Product Card ---
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  itemHeader: { flexDirection: "row", gap: 12, marginBottom: 12 },
  itemImage: { width: 70, height: 70, borderRadius: 10, resizeMode: "cover" },
  itemInfo: { flex: 1, justifyContent: "center" },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.slate800,
    marginBottom: 2,
  },
  itemQty: { fontSize: 13, color: COLORS.slate500, marginBottom: 6 },

  // --- Rating Stars ---
  ratingStarsContainer: { flexDirection: "row", gap: 4 },

  // --- Input ---
  reviewInput: {
    backgroundColor: COLORS.slate50,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    color: COLORS.slate800,
    fontSize: 14,
    height: 80,
  },

  // --- Rewards ---
  rewardsCard: {
    backgroundColor: "rgba(255, 248, 225, 0.9)",
    borderWidth: 1,
    borderColor: COLORS.amber500,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  rewardsContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  rewardsIconWrapper: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.amber500,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  rewardsEmoji: { fontSize: 22 },
  rewardsInfoText: { flex: 1 },
  rewardsTitle: { fontWeight: "bold", fontSize: 15, color: COLORS.slate800 },
  rewardsSubtitle: { fontSize: 13, color: COLORS.amber600 },

  // --- Action Button ---
  submitButton: {
    height: 56,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  submitButtonText: { color: COLORS.white, fontSize: 17, fontWeight: "bold" },
  footerNote: { textAlign: "center", color: COLORS.slate400, fontSize: 12 },
});
