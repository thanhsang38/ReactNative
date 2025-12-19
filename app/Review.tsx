import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
// 💡 IMPORTS COMPONENTS & CONTEXTS
import { Header } from "../components/Header";
// ⚠️ Giả định CartItem structure từ Context
interface CartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size: string;
  ice: number;
  sugar: number;
}

// --- Dữ liệu Mock và Constants ---
interface ReviewPageProps {
  goBack: () => void;
}

// // Giả định order data (dùng để render)
// const mockOrder: Order = {
//   id: "ORD001",
//   items: [
//     {
//       id: "1",
//       productId: "1",
//       name: "Trà Sữa Trân Châu",
//       image:
//         "https://images.unsplash.com/photo-1645467148762-6d7fd24d7acf?w=400",
//       price: 50000,
//       quantity: 2,
//       size: "L",
//       ice: 70,
//       sugar: 50,

//     },
//     {
//       id: "2",
//       productId: "2",
//       name: "Cà Phê Muối",
//       image:
//         "https://images.unsplash.com/photo-1645467148762-6d7fd24d7acf?w=400",
//       price: 40000,
//       quantity: 1,
//       size: "M",
//       ice: 100,
//       sugar: 50,

//     },
//   ],
//   total: 140000,
//   status: "completed",
//   createdAt: new Date(),
//   deliveryAddress: "123 Huệ",
//   paymentMethod: "cash",
//   phone: "123",
// };

const COLORS = {
  bg: "#f8fafc",
  white: "#ffffff",
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate600: "#475569",
  slate700: "#334155",
  slate500: "#64748b",
  slate800: "#1e293b",
  emerald500: "#10b981",
  emerald600: "#059669",
  teal600: "#0d9488",
  amber400: "#fbbf24",
  amber50: "#fffdf2",
  amber500: "#f59e0b",
  amber600: "#d97706",
  red500: "#ef4444",
  red600: "#dc2626",
};

// -----------------------------------------------------------

// 💡 COMPONENT STAR RATING (React Native)
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
          style={styles.starButton}
        >
          <Ionicons
            name={star <= rating ? "star" : "star-outline"} // Ionicons tô đầy/viền
            size={sizeValue}
            color={star <= rating ? COLORS.amber400 : COLORS.slate300}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

export function ReviewPage({ goBack }: ReviewPageProps) {
  const { orderId } = useLocalSearchParams(); // ✅ LẤY ID TỪ URL
  const orderIdString = orderId as string; // Đảm bảo kiểu string

  // const { getOrderById } = useOrders();
  // Sử dụng orderIdString để lấy dữ liệu thực, hoặc dùng mock nếu không có ID
  const order = "getOrderById(orderIdString)";

  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [reviews, setReviews] = useState<{ [key: string]: string }>({});
  const [overallRating, setOverallRating] = useState(5);
  const [overallReview, setOverallReview] = useState("");
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const headerHeight = 50 + insets.top;
  const pointsEarned = 100;

  if (!order) {
    return <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>;
  }

  const handleSubmitReview = () => {
    // 💡 LOGIC TOAST VÀ GO BACK
    Toast.show({
      type: "success", // ✅ Tên loại tùy chỉnh
      text1: "Cảm ơn bạn đã đánh giá!",
      text2: `Bạn nhận được +${pointsEarned} điểm`,
      position: "top",
    });
    setTimeout(() => {
      router.back();
    }, 500);
  };

  // 💡 Render thông báo Overall Rating
  const getOverallMessage = () => {
    if (overallRating === 5) return "Tuyệt vời! ⭐";
    if (overallRating === 4) return "Rất tốt! 👍";
    if (overallRating === 3) return "Bình thường 😊";
    if (overallRating === 2) return "Có thể cải thiện 🤔";
    if (overallRating === 1) return "Chưa tốt 😔";
    return "";
  };

  return (
    <View style={styles.fullContainer}>
      <Header title="Đánh giá đơn hàng" showBack={true} onBack={goBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: headerHeight }}
      >
        <View style={styles.contentPadding}>
          {/* Overall Rating */}
          <View style={styles.cardCenter}>
            <Text style={styles.overallTitle}>
              Bạn cảm thấy thế nào về đơn hàng này?
            </Text>
            <View style={styles.overallRatingContainer}>
              <RatingStars
                rating={overallRating}
                onRate={setOverallRating}
                size="lg"
              />
            </View>
            <Text style={styles.overallMessage}>{getOverallMessage()}</Text>
          </View>

          {/* Review Each Product */}
          {/* <View style={styles.card}>
            <Text style={styles.productReviewTitle}>Đánh giá sản phẩm</Text>
            <View style={styles.reviewsList}>
              {order.items.map((item) => (
                <View key={item.id} style={styles.reviewItem}>
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
                        {item.size} • x{item.quantity}
                      </Text>
                      <RatingStars
                        rating={ratings[item.id] || 5}
                        onRate={(rating) =>
                          setRatings({ ...ratings, [item.id]: rating })
                        }
                        size="sm"
                      />
                    </View>
                  </View>
                  <TextInput
                    value={reviews[item.id] || ""}
                    onChangeText={(text) =>
                      setReviews({ ...reviews, [item.id]: text })
                    }
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                    style={styles.reviewInput}
                    multiline={true}
                    numberOfLines={2}
                    textAlignVertical="top"
                  />
                </View>
              ))}
            </View>
          </View> */}

          {/* Overall Review */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nhận xét chung</Text>
            <TextInput
              value={overallReview}
              onChangeText={setOverallReview}
              placeholder="Chia sẻ trải nghiệm tổng thể của bạn về đơn hàng, dịch vụ giao hàng..."
              style={styles.overallReviewInput}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Upload Photos */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Thêm hình ảnh (không bắt buộc)</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoUploadScroll}
            >
              <TouchableOpacity style={styles.uploadButton}>
                <Feather name="camera" size={24} color={COLORS.slate400} />
                <Text style={styles.uploadButtonText}>Thêm ảnh</Text>
              </TouchableOpacity>
              {/* Thêm các ảnh đã chọn ở đây nếu có */}
            </ScrollView>
          </View>

          {/* Rewards Info */}
          <View style={styles.rewardsCard}>
            <View style={styles.rewardsContent}>
              <View style={styles.rewardsIconWrapper}>
                <Text style={styles.rewardsEmoji}>🎁</Text>
              </View>
              <View style={styles.rewardsInfoText}>
                <Text style={styles.rewardsTitle}>
                  Nhận thưởng khi đánh giá
                </Text>
                <Text style={styles.rewardsSubtitle}>
                  +{pointsEarned} điểm sẽ được cộng vào tài khoản
                </Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmitReview}
            style={styles.submitButton}
          >
            <LinearGradient
              colors={[COLORS.emerald500, COLORS.teal600]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Đánh giá của bạn sẽ giúp chúng tôi cải thiện chất lượng dịch vụ
          </Text>
        </View>

        {/* Padding cuối cùng */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
export default ReviewPage;
// -----------------------------------------------------------
// 💡 STYLE SHEET
// -----------------------------------------------------------

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: COLORS.slate50 },
  errorText: { padding: 20, color: COLORS.red500 },
  contentPadding: { paddingHorizontal: 16, paddingTop: 16 },

  // --- General Cards & Titles ---
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
  // --- Overall Rating ---
  cardCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24, // py-6
  },
  overallTitle: {
    color: COLORS.slate800,
    fontSize: 18,
    marginBottom: 12, // mb-3
    fontWeight: "500",
  },
  overallRatingContainer: {
    marginBottom: 16, // mb-4
  },
  overallMessage: {
    color: COLORS.slate600,
    fontSize: 14,
  },
  // --- Rating Stars Component Styles ---
  ratingStarsContainer: {
    flexDirection: "row",
    gap: 4, // gap-1
  },
  starButton: {
    // transition-transform hover:scale-110
  },
  // --- Review Item List ---
  productReviewTitle: {
    color: COLORS.slate800,
    fontWeight: "bold",
    marginBottom: 16,
    fontSize: 16,
  },
  reviewsList: {
    gap: 16, // space-y-4
  },
  reviewItem: {
    paddingBottom: 16, // pb-4
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100, // border-slate-100
  },
  itemHeader: {
    flexDirection: "row",
    gap: 12, // gap-3
    marginBottom: 12,
  },
  itemImage: {
    width: 64, // w-16
    height: 64, // h-16
    resizeMode: "cover",
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: COLORS.slate800,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemQty: {
    color: COLORS.slate500,
    fontSize: 12,
    marginBottom: 8,
  },
  reviewInput: {
    width: "100%",
    padding: 12,
    borderWidth: 2,
    borderColor: COLORS.slate200,
    borderRadius: 8,
    backgroundColor: "rgba(241, 245, 249, 0.5)", // bg-slate-50/50
    fontSize: 14,
    textAlignVertical: "top",
  },
  // --- Overall Review Input ---
  overallReviewInput: {
    width: "100%",
    padding: 16, // p-4
    borderWidth: 2,
    borderColor: COLORS.slate200,
    borderRadius: 12, // rounded-xl
    backgroundColor: "rgba(241, 245, 249, 0.5)", // bg-slate-50/50
    fontSize: 16,
    textAlignVertical: "top",
  },
  // --- Upload Photos ---
  photoUploadScroll: {
    flexDirection: "row",
    gap: 12, // gap-3
    paddingBottom: 8, // pb-2
  },
  uploadButton: {
    width: 96, // w-24
    height: 96, // h-24
    flexShrink: 0,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.slate300, // border-slate-300
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    color: COLORS.slate400,
    fontSize: 12,
    marginTop: 4,
  },
  // --- Rewards Info ---
  rewardsCard: {
    backgroundColor: "rgba(255, 248, 225, 0.7)", // from-amber-50
    borderWidth: 1,
    borderColor: COLORS.amber400, // border-amber-200
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  rewardsContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rewardsIconWrapper: {
    width: 48, // w-12
    height: 48,
    backgroundColor: COLORS.amber400,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  rewardsEmoji: {
    fontSize: 24,
  },
  rewardsInfoText: {
    flex: 1,
  },
  rewardsTitle: {
    color: COLORS.slate800,
    fontWeight: "bold",
    fontSize: 16,
  },
  rewardsSubtitle: {
    color: COLORS.amber600,
    fontSize: 14,
  },
  // --- Submit Button ---
  submitButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: COLORS.emerald500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  submitButtonBackground: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  footerNote: {
    color: COLORS.slate500,
    fontSize: 12,
    textAlign: "center",
  },
});
