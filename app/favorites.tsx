import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router"; // Cần thêm import này
import React, { ComponentProps, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// 💡 IMPORTS CONTEXTS & API
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { CartItem, useCart } from "../context/CartContext";
import {
  getFavoriteProductsByUser,
  ProductRow,
  updateFavoriteProductIds,
} from "./services/baserowApi"; // ✅ IMPORT API FAVORITES

// --- Types & Data ---
type Page = string;
type IoniconsName = ComponentProps<typeof Ionicons>["name"];
const normalizeText = (text: any): string => {
  if (!text) return "";

  let value = "";

  // Baserow link row / select
  if (typeof text === "object") {
    if (Array.isArray(text)) {
      value = text[0]?.value || text[0]?.name || "";
    } else {
      value = text.value || text.name || "";
    }
  } else {
    value = text;
  }

  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // ✅ bỏ dấu
    .replace(/đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_"); // ✅ space → _
};

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 2; // 16px padding * 2 + 4px gap

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
  teal600: "#0d9488",
  red500: "#ef4444",
  amber400: "#fbbf24",
};

// ✅ MẢNG DANH MỤC ĐỒ UỐNG ĐÃ CHUẨN HÓA (Dùng để kiểm tra loại sản phẩm)
const DRINK_CATEGORIES_NORMALIZED = [
  "sinh_to",
  "ca_phe",
  "tra_sua",
  "tra_trai_cay",
];

// -----------------------------------------------------------

interface FavoritesPageProps {
  // 💡 navigateTo được thay thế bằng useRouter
  goBack: () => void;
}

export function FavoritesPage({ goBack }: FavoritesPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const insets = useSafeAreaInsets(); // ✅ STATES DỮ LIỆU THẬT

  const [favoriteProductIds, setFavoriteProductIds] = useState<number[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<ProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const headerHeight = 50 + insets.top;

  // --------------------------------------------------
  // ✅ LOGIC FETCH VÀ ĐỒNG BỘ FAVORITES
  // --------------------------------------------------
  const loadFavorites = async () => {
    if (!user || !user.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Tải các ID yêu thích từ cột User
      const products = await getFavoriteProductsByUser(user.id);
      setFavoriteProducts(products);
      const ids = products.map((p) => p.id);
      setFavoriteProductIds(ids);
    } catch (e) {
      console.error("Lỗi tải mục yêu thích:", e);
      Toast.show({
        type: "error",
        text1: "Lỗi tải",
        text2: "Không thể tải danh sách yêu thích.",
        visibilityTime: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [user?.id]);

  // --------------------------------------------------
  // ✅ HÀM TOGGLE FAVORITE (GỌI API UPDATE)
  // --------------------------------------------------
  const toggleFavorite = async (productId: number) => {
    if (!user || !user.id || isLoading) return;

    const productIdNum = Number(productId);
    const isCurrentlyFavorite = favoriteProductIds.includes(productIdNum);

    let newIds: number[];

    if (isCurrentlyFavorite) {
      // Xóa khỏi danh sách
      newIds = favoriteProductIds.filter((id) => id !== productIdNum);
    } else {
      // Thêm vào danh sách
      newIds = [...favoriteProductIds, productIdNum];
    }

    // Tối ưu hóa UI: Cập nhật UI ngay lập tức
    setFavoriteProductIds(newIds);
    setFavoriteProducts(
      newIds.length > 0
        ? favoriteProducts.filter((p) => newIds.includes(p.id))
        : []
    );

    try {
      // Gọi API cập nhật cột Favorites trên bảng User
      const result = await updateFavoriteProductIds(user.id, newIds);

      if (result.success) {
        Toast.show({
          type: "success",
          text1: isCurrentlyFavorite ? "Đã xóa" : "Đã thêm",
          text2: isCurrentlyFavorite
            ? "Đã xóa khỏi mục yêu thích"
            : "Đã thêm vào mục yêu thích",
          visibilityTime: 1500,
        });
      } else {
        // Nếu API thất bại, tải lại trạng thái gốc để đồng bộ hóa
        loadFavorites();
        Toast.show({
          type: "error",
          text1: "Lỗi đồng bộ",
          text2: result.message || "Không thể cập nhật yêu thích.",
          visibilityTime: 3000,
        });
      }
    } catch (e) {
      console.error("API update failed:", e);
      loadFavorites(); // Tải lại nếu có lỗi mạng/hệ thống
    }
  };

  // --------------------------------------------------
  // ✅ HÀM ADD TO CART (SỬ DỤNG DỮ LIỆU THẬT)
  // --------------------------------------------------
  const handleAddToCart = (product: ProductRow) => {
    const productIdString = product.id.toString();

    const normalizedCategory = normalizeText(product.category ?? "");

    const isDrink = DRINK_CATEGORIES_NORMALIZED.includes(normalizedCategory);
    console.log("RAW category:", product.category);
    console.log("Normalized:", normalizeText(product.category));

    const newItem: Omit<CartItem, "id"> = {
      productId: productIdString,
      name: product.name,
      image: product.image, // ✅ Dùng product.image
      price: product.price,
      quantity: 1,
      size: "M",
      ice: isDrink ? 75 : 0,
      sugar: isDrink ? 75 : 0,
      isDrink: isDrink,
    };
    addToCart(newItem);
    Toast.show({
      type: "success",
      text1: "Đã thêm vào giỏ",
      text2: `${product.name}`,
      visibilityTime: 1500,
    });
  }; // 💡 HÀM ĐIỀU HƯỚNG SỬ DỤNG ROUTER

  const handleNavigate = (path: string, id?: string) => {
    router.push(
      id ? ({ pathname: path, params: { id } } as any) : (path as any)
    );
  };

  // --------------------------------------------------
  // ✅ RENDER LOADING/EMPTY STATES
  // --------------------------------------------------
  if (isLoading) {
    return (
      <View
        style={[
          styles.fullContainer,
          styles.loadingContainer,
          { paddingTop: headerHeight },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.emerald600} />
        <Text style={styles.loadingText}>Đang tải mục yêu thích...</Text>
      </View>
    );
  }

  if (favoriteProducts.length === 0) {
    return (
      <View style={styles.fullContainer}>
        <Header title="Yêu thích" showBack={true} onBack={goBack} />
        <View style={[styles.emptyContent, { paddingTop: headerHeight }]}>
          <View style={styles.emptyIconWrapper}>
            <Ionicons name="heart" size={64} color={COLORS.slate400} />
          </View>
          <Text style={styles.emptyTitle}>Chưa có sản phẩm yêu thích</Text>
          <Text style={styles.emptySubtitle}>
            Thêm sản phẩm yêu thích để dễ dàng tìm lại sau này
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/menu")}
            style={styles.exploreButton}
          >
            <LinearGradient
              colors={[COLORS.emerald500, COLORS.teal600]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.exploreButtonText}>Khám phá thực đơn</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.fullContainer}>
      <Header title="Yêu thích" showBack={true} onBack={goBack} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: headerHeight }} // Bù đắp Header
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentPadding}>
          <Text style={styles.countText}>
            {favoriteProducts.length} sản phẩm yêu thích
          </Text>
          {/* Products Grid */}
          <FlatList
            data={favoriteProducts}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.productRow}
            renderItem={({ item: product }) => {
              const isFavorite = favoriteProductIds.includes(product.id);

              // --- LOGIC TÍNH TOÁN GIÁ & GIẢM GIÁ ---
              const price = Number(product.price) || 0;
              const salePrice = Number(product.salePrice) || 0;
              const hasSale = salePrice > 0 && salePrice < price;

              const displayPrice = hasSale ? salePrice : price;
              const discountPercent = hasSale
                ? Math.round(((price - salePrice) / price) * 100)
                : 0;

              return (
                <TouchableOpacity
                  key={product.id}
                  onPress={() =>
                    handleNavigate("product-detail", product.id.toString())
                  }
                  style={styles.productCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.productImageWrapper}>
                    <Image
                      source={{ uri: product.image }}
                      style={styles.productImage}
                    />

                    {/* Badge Stack (Sale + Hot) */}
                    <View style={styles.badgeStack}>
                      {hasSale && (
                        <View style={styles.saleBadge}>
                          <Text style={styles.badgeText}>
                            -{discountPercent}%
                          </Text>
                        </View>
                      )}
                      {/* Tag Hot: Dựa trên giá hoặc logic tùy chọn của bạn */}
                      {price > 30000 && (
                        <View style={styles.hotBadge}>
                          <Text style={styles.badgeText}>🔥 Hot</Text>
                        </View>
                      )}
                    </View>

                    {/* Favorite Button */}
                    <TouchableOpacity
                      onPress={() => toggleFavorite(product.id)}
                      style={styles.favoriteButton}
                    >
                      <Ionicons
                        name={isFavorite ? "heart" : "heart-outline"}
                        size={20}
                        color={isFavorite ? COLORS.red500 : COLORS.slate400}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Product Details */}
                  <View style={styles.productDetails}>
                    <Text numberOfLines={2} style={styles.productName}>
                      {product.name}
                    </Text>

                    <View style={styles.productFooter}>
                      <View>
                        <Text style={styles.productPrice}>
                          {displayPrice.toLocaleString("vi-VN")}đ
                        </Text>
                        {hasSale && (
                          <Text style={styles.originalPriceSmall}>
                            {price.toLocaleString("vi-VN")}đ
                          </Text>
                        )}
                      </View>

                      <TouchableOpacity
                        onPress={() => handleAddToCart(product)}
                        style={styles.addButton}
                      >
                        <Text style={styles.addButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.productsGrid}
          />
        </View>
        {/* Padding cuối cùng */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

export default FavoritesPage;

// -----------------------------------------------------------
// 💡 STYLE SHEET
// -----------------------------------------------------------

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: 0 }, // Đảm bảo chiếm toàn bộ không gian
  contentPadding: { paddingHorizontal: 16, paddingTop: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.slate700,
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
  emptySubtitle: {
    color: COLORS.slate600,
    marginBottom: 24,
    fontSize: 16,
    textAlign: "center",
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
    textAlign: "center",
    zIndex: 1,
  }, // --- Product Grid ---

  countText: { color: COLORS.slate600, fontSize: 14, marginBottom: 16 },
  productsGrid: {
    paddingBottom: 40,
    gap: 16,
    justifyContent: "space-between",
  },
  productRow: {
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 16,
  },
  productCard: {
    width: ITEM_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    overflow: "hidden",
  },
  productImageWrapper: { position: "relative", height: 160 },
  productImage: { width: "100%", height: "100%", resizeMode: "cover" },

  hotTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: COLORS.amber400,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 10,
  },
  hotTagText: { color: COLORS.white, fontSize: 12, fontWeight: "bold" },
  productDetails: { padding: 12 },
  productName: {
    color: COLORS.slate800,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    minHeight: 32,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  ratingStar: { color: COLORS.amber400 },
  ratingTextSmall: { fontSize: 12, color: COLORS.slate600 },
  soldCountText: { fontSize: 12, color: COLORS.slate400 },

  productPrice: { color: COLORS.emerald600, fontWeight: "bold", fontSize: 16 },
  addButton: {
    padding: 6,
    backgroundColor: COLORS.emerald500,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 18,
  },
  emptyContent: {
    // ✅ ADDED: Fix style bị thiếu
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 16,
  },

  // --- Điều chỉnh lại Footer để giá nằm dọc khi có giảm giá ---
  productFooter: {
    flexDirection: "row",
    alignItems: "flex-end", // Căn theo đáy nút "+"
    justifyContent: "space-between",
    marginTop: 4,
  },

  // Nút Favorite cần zIndex cao hơn badge
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)", // Hơi trong suốt cho đẹp
    borderRadius: 9999,
    zIndex: 20,
    elevation: 2,
  },
  badgeStack: {
    position: "absolute",
    top: 8,
    left: 8,
    gap: 4,
    zIndex: 10,
  },
  saleBadge: {
    backgroundColor: COLORS.red500,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hotBadge: {
    backgroundColor: COLORS.amber400,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },

  // --- Giá gốc gạch ngang ---
  originalPriceSmall: {
    fontSize: 11,
    color: COLORS.slate400,
    textDecorationLine: "line-through",
    marginTop: 2,
  },
});
