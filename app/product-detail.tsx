import { Feather, Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Header } from "../components/Header";
import { useCart } from "../context/CartContext";
import {
  getAllProductsForRelated,
  getProductById,
  ProductRow,
} from "./services/baserowApi";
// --- Dữ liệu Mock và Types (Sử dụng dữ liệu từ file gốc của bạn) ---

interface Review {
  id: string;
  productId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

// 💡 Dữ liệu Mock (Cần khớp với logic hiện tại)

const reviews: Review[] = [
  {
    id: "r1",
    productId: "34",
    userName: "Nguyễn Văn A",
    userAvatar: "https://i.pravatar.cc/150?img=1",
    rating: 5,
    comment: "Trà sữa rất ngon, đậm vị trà, trân châu mềm dẻo!",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 ngày trước
  },
  {
    id: "r2",
    productId: "34",
    userName: "Trần Thị B",
    userAvatar: "https://i.pravatar.cc/150?img=2",
    rating: 4,
    comment: "Ngon nhưng hơi ngọt, lần sau sẽ chọn ít đường hơn.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 ngày trước
  },
];

const SIZES = [
  { id: "S", name: "Nhỏ", price: 0 },
  { id: "M", name: "Vừa", price: 5000 },
  { id: "L", name: "Lớn", price: 10000 },
];

const DRINK_CATEGORIES = ["sinh_to", "ca_phe", "tra_sua", "tra_trai_cay"];

const COLORS = {
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
  amber400: "#fbbf24",
  red500: "#ef4444",
};

// -----------------------------------------------------------

export function ProductDetailPage() {
  const { id } = useLocalSearchParams();
  const productId = id as string;

  const { addToCart } = useCart();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [product, setProduct] = useState<ProductRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductRow[]>([]);
  // 💡 States
  const [size, setSize] = useState<"S" | "M" | "L">("M");
  const [ice, setIce] = useState(75); // Thay đổi 70 -> 75 để khớp với step 25
  const [sugar, setSugar] = useState(75); // Thay đổi 50 -> 75 để khớp với step 25
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        // API call: Chuyển string ID từ router sang number
        const data = await getProductById(Number(productId));
        if (data) {
          setProduct(data);
        } else {
          setFetchError("Sản phẩm không tồn tại.");
        }
      } catch (e: any) {
        setFetchError(e.message || "Lỗi khi tải dữ liệu sản phẩm.");
      } finally {
        setIsLoading(false);
      }
    };
    loadProduct();
  }, [productId]);

  useEffect(() => {
    // Chỉ chạy khi sản phẩm chính (product) được tải xong và có category
    if (!product || !product.category) return;

    const loadRelated = async () => {
      try {
        // Tải tất cả sản phẩm
        const allProducts = await getAllProductsForRelated();

        // Lọc Client-side theo category và loại bỏ sản phẩm hiện tại
        const filtered = allProducts
          .filter((p) => p.category === product.category && p.id !== product.id)
          .slice(0, 4); // Chỉ lấy 4 sản phẩm liên quan đầu tiên

        setRelatedProducts(filtered);
      } catch (e) {
        console.error("Error loading related products:", e);
        setRelatedProducts([]);
      } finally {
      }
    };

    loadRelated();
  }, [product]);
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };
  const isDrink = product
    ? DRINK_CATEGORIES.includes(product.category ?? "")
    : false;
  const calculatePrice = () => {
    if (!product) return 0;

    // ✅ FIX LỖI 1: Đảm bảo giá gốc là số
    let basePrice = Number(product.price);

    if (isDrink) {
      // ✅ FIX LỖI 2: Giá size cộng thêm
      const sizePrice = SIZES.find((s) => s.id === size)?.price || 0;
      basePrice += sizePrice;
    }

    return basePrice * quantity;
  };

  // 💡 Logic Thêm vào giỏ hàng
  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      productId: product.id.toString(),
      name: product.name,
      image: product.image,
      price: calculatePrice() / quantity, // Giá đơn vị
      quantity,
      size: isDrink ? size : "M", // Mặc định M cho món không phải đồ uống
      ice: isDrink ? ice : 0,
      sugar: isDrink ? sugar : 0,
      isDrink: isDrink,
    });
    handleGoBack();
  };

  // 💡 Logic Lấy dữ liệu liên quan
  const productReviews = reviews.filter((r) => r.productId === productId);

  // 💡 Logic Format Date
  const formatDate = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Hôm nay";
    if (days === 1) return "Hôm qua";
    if (days < 7) return `${days} ngày trước`;
    if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
    return `${Math.floor(days / 30)} tháng trước`;
  };

  const headerHeight = 50 + insets.top;
  const totalPrice = calculatePrice();
  if (!product) return;
  return (
    <View style={styles.fullContainer}>
      <Header title="" showBack={true} onBack={handleGoBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: headerHeight }}
      >
        {/* Product Image */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
          <LinearGradient
            colors={["transparent", "rgba(30, 41, 59, 0.6)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.imageGradientOverlay}
          >
            <View style={styles.ratingInfo}>
              <Ionicons name="star" size={20} color={COLORS.amber400} />
              {/* <Text style={styles.ratingText}>{product.rating}</Text>
              <Text style={styles.soldCountText}>
                ({product.soldCount} đã bán)
              </Text> */}
            </View>
          </LinearGradient>
        </View>

        <View style={styles.contentPadding}>
          {/* Product Info */}
          <View style={styles.infoCard}>
            <Text style={styles.productTitle}>{product.name}</Text>
            <Text style={styles.productDescription}>{product.description}</Text>
            <View style={styles.infoFooter}>
              <Text style={styles.productBasePrice}>
                {Number(product.price).toLocaleString("vi-VN")}đ
              </Text>
              <Text style={styles.productCategory}>{product.category}</Text>
            </View>
          </View>

          {/* Drink Options: Size, Ice, Sugar */}
          {isDrink && (
            <>
              {/* Size Selection */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Chọn size</Text>
                <View style={styles.sizeGrid}>
                  {SIZES.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setSize(s.id as "S" | "M" | "L")}
                      style={[
                        styles.sizeButton,
                        size === s.id ? styles.sizeActive : styles.sizeInactive,
                      ]}
                    >
                      <Text style={styles.sizeNameText}>{s.name}</Text>
                      {s.price > 0 && (
                        <Text
                          style={[
                            styles.sizePriceText,
                            size === s.id && styles.sizePriceActive,
                          ]}
                        >
                          +{s.price.toLocaleString()}đ
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Ice Level */}
              <View style={styles.card}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.cardTitle}>Lượng đá</Text>
                  <Text style={styles.sliderValueText}>{ice}%</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={25} // 💡 Sửa step
                  value={ice}
                  onValueChange={setIce}
                  minimumTrackTintColor={COLORS.emerald500}
                  maximumTrackTintColor={COLORS.slate200}
                  thumbTintColor={COLORS.emerald600}
                />
                <View style={styles.rangeLabelsQuartile}>
                  <Text style={styles.rangeLabelText}>Không đá</Text>
                  <Text style={styles.rangeLabelText}>Ít</Text>
                  <Text style={styles.rangeLabelText}>Vừa</Text>
                  <Text style={styles.rangeLabelText}>Nhiều</Text>
                </View>
              </View>

              {/* Sugar Level */}
              <View style={styles.card}>
                <View style={styles.sliderHeader}>
                  <Text style={styles.cardTitle}>Lượng đường</Text>
                  <Text style={styles.sliderValueText}>{sugar}%</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  step={25} // 💡 Sửa step
                  value={sugar}
                  onValueChange={setSugar}
                  minimumTrackTintColor={COLORS.emerald500}
                  maximumTrackTintColor={COLORS.slate200}
                  thumbTintColor={COLORS.emerald600}
                />
                <View style={styles.rangeLabelsQuartile}>
                  <Text style={styles.rangeLabelText}>Không đường</Text>
                  <Text style={styles.rangeLabelText}>Ít</Text>
                  <Text style={styles.rangeLabelText}>Vừa</Text>
                  <Text style={styles.rangeLabelText}>Nhiều</Text>
                </View>
              </View>
            </>
          )}

          {/* Note */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ghi chú</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={
                isDrink
                  ? "Ví dụ: Ít đá, nhiều đường..."
                  : "Ví dụ: Đóng gói riêng, không hành..."
              }
              style={styles.noteInput}
              multiline={true}
              numberOfLines={3}
            />
          </View>

          {/* Reviews Section */}
          {productReviews.length > 0 && (
            <View style={styles.card}>
              <View style={styles.reviewHeader}>
                <Text style={styles.cardTitle}>
                  Đánh giá ({productReviews.length})
                </Text>
                <View style={styles.ratingInfoSmall}>
                  <Ionicons name="star" size={16} color={COLORS.amber400} />
                  {/* <Text style={styles.ratingTextSmall}>{product.rating}</Text> */}
                </View>
              </View>

              <View style={styles.reviewsList}>
                {productReviews.slice(0, 3).map((review) => (
                  <View key={review.id} style={styles.reviewItem}>
                    <Image
                      source={{ uri: review.userAvatar }}
                      style={styles.userAvatar}
                    />
                    <View style={styles.reviewContent}>
                      <View style={styles.reviewMeta}>
                        <Text style={styles.userName}>{review.userName}</Text>
                        <Text style={styles.reviewDate}>
                          {formatDate(review.createdAt)}
                        </Text>
                      </View>
                      <View style={styles.reviewStars}>
                        {[...Array(5)].map((_, i) => (
                          <Ionicons
                            key={i}
                            name="star"
                            size={14}
                            color={
                              i < review.rating
                                ? COLORS.amber400
                                : COLORS.slate200
                            }
                          />
                        ))}
                      </View>
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.viewAllReviewsButton}>
                <Text style={styles.viewAllReviewsText}>
                  Xem tất cả đánh giá
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedProductsContainer}>
              <View style={styles.relatedHeader}>
                <Text style={styles.cardTitle}>Sản phẩm cùng loại</Text>
                <TouchableOpacity
                  onPress={() => router.replace("/(tabs)/menu")}
                >
                  <Text style={styles.viewAllText}>Xem tất cả</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.relatedGrid}>
                {relatedProducts.map((relatedProduct) => (
                  <TouchableOpacity
                    key={relatedProduct.id}
                    onPress={() =>
                      router.push({
                        pathname: "/product-detail",
                        params: { id: relatedProduct.id },
                      })
                    }
                    style={styles.relatedProductCard}
                  >
                    <Image
                      source={{ uri: relatedProduct.image }}
                      style={styles.relatedProductImage}
                    />
                    <View style={styles.relatedProductInfo}>
                      <Text style={styles.relatedProductName} numberOfLines={2}>
                        {relatedProduct.name}
                      </Text>
                      <View style={styles.ratingInfoSmall}>
                        <Ionicons
                          name="star"
                          size={12}
                          color={COLORS.amber400}
                        />
                      </View>
                      <Text style={styles.relatedPriceText}>
                        {relatedProduct.price.toLocaleString("vi-VN")}đ
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Padding cho Bottom Bar */}
        <View style={{ height: 170 }} />
      </ScrollView>

      {/* 3. Bottom Bar (Fixed/Absolute) */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 16 }]}>
        <View style={styles.bottomBarInner}>
          {/* Quantity Controls */}
          <View style={styles.quantityControls}>
            <TouchableOpacity
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              style={styles.qtyControlButton}
            >
              <Feather name="minus" size={20} color={COLORS.slate700} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity
              onPress={() => setQuantity(quantity + 1)}
              style={styles.qtyControlButton}
            >
              <Feather name="plus" size={20} color={COLORS.slate700} />
            </TouchableOpacity>
          </View>

          {/* Add to Cart Button */}
          <TouchableOpacity
            onPress={handleAddToCart}
            style={styles.addToCartButton}
          >
            <LinearGradient
              colors={[COLORS.emerald500, COLORS.teal600]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.addToCartContent}>
              <Text style={styles.addToCartText}>Thêm vào giỏ</Text>
              <Text style={styles.addToCartPrice}>
                {Number(totalPrice).toLocaleString("vi-VN")}đ
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
export default ProductDetailPage;

// -----------------------------------------------------------
// 💡 STYLE SHEET (Cập nhật để hỗ trợ Reviews, Related Products và Slider mới)
// -----------------------------------------------------------

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: COLORS.slate50 },
  errorText: {
    padding: 20,
    color: COLORS.red500,
    textAlign: "center",
    fontSize: 16,
  },
  contentPadding: { paddingHorizontal: 16, paddingVertical: 16 },
  imageWrapper: { position: "relative", height: 320 },
  productImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imageGradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    padding: 16,
    justifyContent: "flex-end",
  },
  ratingInfo: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { color: COLORS.white, fontWeight: "bold", fontSize: 16 },
  soldCountText: { color: "rgba(255, 255, 255, 0.8)", fontSize: 14 },
  infoCard: {
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
  productTitle: {
    color: COLORS.slate800,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  productDescription: {
    color: COLORS.slate600,
    fontSize: 14,
    marginBottom: 12,
  },
  infoFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productBasePrice: {
    color: COLORS.emerald600,
    fontSize: 20,
    fontWeight: "bold",
  },
  productCategory: {
    color: COLORS.emerald600,
    fontSize: 14,
    backgroundColor: COLORS.emerald50,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: "500",
  },
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
  sizeGrid: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  sizeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
  },
  sizeActive: {
    borderColor: COLORS.emerald500,
    backgroundColor: COLORS.emerald50,
  },
  sizeInactive: { borderColor: COLORS.slate200, backgroundColor: COLORS.white },
  sizeNameText: { fontSize: 14, color: COLORS.slate700, fontWeight: "500" },
  sizePriceText: { fontSize: 12, color: COLORS.slate500, marginTop: 2 },
  sizePriceActive: { color: COLORS.emerald600, fontWeight: "600" }, // New style for active price

  sliderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sliderValueText: {
    color: COLORS.emerald600,
    fontWeight: "600",
    fontSize: 16,
  },
  slider: { height: 40, width: "100%" },
  rangeLabelsQuartile: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8, // Điều chỉnh để căn giữa với các điểm step 0, 25, 50, 75, 100
  },
  rangeLabelText: { fontSize: 12, color: COLORS.slate500 },

  // --- Styles for Reviews ---
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ratingInfoSmall: { flexDirection: "row", alignItems: "center", gap: 2 },
  ratingTextSmall: { color: COLORS.slate800, fontWeight: "600", fontSize: 14 },
  reviewsList: { gap: 16 },
  reviewItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
    // Loại bỏ border cho item cuối cùng
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: COLORS.slate200,
  },
  reviewContent: { flex: 1 },
  reviewMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: { color: COLORS.slate800, fontSize: 14, fontWeight: "500" },
  reviewDate: { color: COLORS.slate400, fontSize: 12 },
  reviewStars: { flexDirection: "row", gap: 2, marginBottom: 4 },
  reviewComment: { color: COLORS.slate600, fontSize: 14 },
  viewAllReviewsButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: COLORS.slate200,
    borderRadius: 8,
    alignItems: "center",
  },
  viewAllReviewsText: {
    color: COLORS.slate700,
    fontSize: 14,
    fontWeight: "500",
  },

  // --- Styles for Related Products ---
  relatedProductsContainer: { marginBottom: 16 },
  relatedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllText: { color: COLORS.emerald600, fontSize: 14, fontWeight: "500" },
  relatedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  relatedProductCard: {
    width: "48.5%", // Khoảng 2 cột, chừa gap
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  relatedProductImage: { width: "100%", height: 120, resizeMode: "cover" },
  relatedProductInfo: { padding: 12 },
  relatedProductName: {
    color: COLORS.slate800,
    fontSize: 14,
    marginBottom: 4,
    fontWeight: "500",
  },
  relatedRatingText: { color: COLORS.slate600, fontSize: 12 },
  relatedSoldCountText: { color: COLORS.slate400, fontSize: 12 },
  relatedPriceText: {
    color: COLORS.emerald600,
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
  },

  // --- Styles for Note ---
  noteInput: {
    width: "100%",
    padding: 12,
    borderWidth: 2,
    borderColor: COLORS.slate200,
    borderRadius: 8,
    backgroundColor: COLORS.slate50,
    fontSize: 15,
    textAlignVertical: "top",
  },

  // --- Bottom Bar ---
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    paddingHorizontal: 16,
    paddingVertical: 16,
    zIndex: 60,
  },
  bottomBarInner: { flexDirection: "row", alignItems: "center", gap: 16 },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.slate100,
    borderRadius: 12,
    padding: 4,
  },
  qtyControlButton: { padding: 8, borderRadius: 8 },
  qtyText: {
    color: COLORS.slate800,
    minWidth: 24,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  addToCartButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    paddingVertical: 16,
    position: "relative",
    shadowColor: COLORS.emerald500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  addToCartContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 1,
  },
  addToCartText: { color: COLORS.white, fontSize: 16, fontWeight: "bold" },
  addToCartPrice: { color: COLORS.white, fontSize: 16, fontWeight: "bold" },
});
