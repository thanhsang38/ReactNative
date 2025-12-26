import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router"; // Cần thêm import này
import React, { ComponentProps, useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
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
// --- Imports Logic Context ---
import { useAuth } from "../../context/AuthContext";
import { CartItem, useCart } from "../../context/CartContext";
import {
  CategoryRow,
  getCategories,
  getFavoriteProductIds,
  getProducts,
  ProductRow,
  updateFavoriteProductIds,
} from "../services/baserowApi";
// --------------------------------------------------
type AntDesignName = ComponentProps<typeof AntDesign>["name"];

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 2;
const DRINK_CATEGORIES_NORMALIZED = [
  "sinh_to",
  "ca_phe",
  "tra_sua",
  "tra_trai_cay",
];
const COLORS = {
  bg: "#f8fafc",
  white: "#ffffff",
  slate200: "#e2e8f0",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  emerald400: "#34d399",
  emerald500: "#10b981",
  emerald600: "#059669",
  teal600: "#0d9488",
  red500: "#ef4444",
  amber400: "#fbbf24",
};

// 💡 LOẠI BỎ PROPS navigateTo KHỎI HomeRoute
export function HomeRoute() {
  // <Redirect href="/(tabs)/orders" />;
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, getTotalItems } = useCart();
  const insets = useSafeAreaInsets();

  const [favoriteProductIds, setFavoriteProductIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [allProducts, setAllProducts] = useState<ProductRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cartCount = getTotalItems();

  const fetchHomeData = useCallback(async () => {
    try {
      setIsLoading(true);
      const favorites = user?.id ? await getFavoriteProductIds(user.id) : [];
      setFavoriteProductIds(favorites);
      // 1. Fetch Categories (Giới hạn 4 danh mục + 'Tất cả')
      const categoryResult = await getCategories();
      if (categoryResult.success && categoryResult.data) {
        const filteredCategories = categoryResult.data
          .filter((cat) => cat.category_id !== "all")
          .slice(0, 4);
        setCategories(filteredCategories);
      }

      // 2. Fetch Popular Products (Giới hạn 4 sản phẩm)
      // Gọi getProducts với limit = 4 và page = 1
      const productResult = await getProducts();
      if (productResult.success && productResult.data) {
        setAllProducts(productResult.data);
      } else {
        Toast.show({
          type: "error",
          text1: "Lỗi API",
          text2: productResult.message || "Lỗi tải sản phẩm.",
          visibilityTime: 4000,
        });
      }
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Lỗi hệ thống",
        text2: e.message,
        visibilityTime: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchHomeData();
    }, [fetchHomeData])
  );

  const toggleFavorite = async (productId: number) => {
    if (!user || !user.id) {
      Toast.show({
        type: "info",
        text1: "Thông báo",
        text2: "Vui lòng đăng nhập để thêm yêu thích.",
        visibilityTime: 2000,
      });
      return;
    }

    const isCurrentlyFavorite = favoriteProductIds.includes(productId);
    let newIds: number[];

    if (isCurrentlyFavorite) {
      newIds = favoriteProductIds.filter((id) => id !== productId);
    } else {
      newIds = [...favoriteProductIds, productId];
    }

    // Tối ưu hóa UI: Cập nhật UI ngay lập tức
    setFavoriteProductIds(newIds);

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
        Toast.show({
          type: "error",
          text1: "Lỗi đồng bộ",
          text2: result.message || "Không thể cập nhật yêu thích.",
          visibilityTime: 3000,
        });
        // Nếu API thất bại, tải lại trạng thái gốc để đồng bộ hóa
        fetchHomeData();
      }
    } catch (e) {
      console.error("API update failed:", e);
      // Nếu thất bại, có thể chọn tải lại để đồng bộ lại
      fetchHomeData();
    }
  };

  const popularProducts = allProducts.slice(0, 4);
  const handleAddToCart = (product: ProductRow) => {
    const isDrink = DRINK_CATEGORIES_NORMALIZED.includes(
      product.category ?? ""
    );
    const finalPrice =
      product.salePrice && Number(product.salePrice) > 0
        ? Number(product.salePrice)
        : Number(product.price);
    const newItem: Omit<CartItem, "id"> = {
      productId: product.id.toString(),
      name: product.name,
      image: product.image, // ✅ Dùng image_url từ ProductRow
      price: finalPrice,
      quantity: 1,
      size: "M",
      ice: isDrink ? 75 : 0,
      sugar: isDrink ? 75 : 0,
      isDrink: isDrink,
    };
    addToCart(newItem);
  };

  if (isLoading && allProducts.length === 0) {
    return (
      <View style={[styles.fullContainer, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.emerald600} />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }
  return (
    <View style={styles.fullContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <LinearGradient
          colors={["#059669", "#14b8a6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Xin chào,</Text>
              <Text style={styles.userName}>{user?.name || "Khách hàng"}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/cart")} // ✅ DÙNG ROUTER TRỰC TIẾP
              style={styles.cartButton}
            >
              <Feather name="shopping-cart" size={24} color="white" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <Feather
              name="search"
              size={20}
              color="#94a3b8"
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Tìm kiếm đồ uống..."
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
              onPressIn={() => router.push("/(tabs)/menu")}
            />
          </View>
        </LinearGradient>

        {/* Promo Banner */}
        <View style={styles.promoBannerWrapper}>
          <LinearGradient
            colors={["#fcd34d", "#fb923c"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promoBanner}
          >
            <View style={styles.promoContent}>
              <View>
                <Text style={styles.promoSubtitle}>Ưu đãi đặc biệt</Text>
                <Text style={styles.promoTitle}>Giảm 30% cho đơn đầu tiên</Text>
                <TouchableOpacity style={styles.promoButton}>
                  <Text style={styles.promoButtonText}>Đặt ngay</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.promoEmoji}>🎉</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Categories */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Danh mục</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/menu")}>
              <Text style={styles.sectionLink}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.categoryContainerFlex}>
            {categories.map((catRow) => {
              const displayLabel = catRow.name;
              const path = (catRow.category_id = "/(tabs)/menu"); // Tạm thời dẫn đến Menu chung

              return (
                <TouchableOpacity
                  key={catRow.id}
                  onPress={() => router.push(path)}
                  style={styles.categoryItemFlex}
                >
                  <Text style={styles.categoryEmoji}>{catRow.image}</Text>
                  <Text style={styles.categoryLabel}>{displayLabel} </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Popular Products */}
        <View style={styles.sectionContainer}>
          <View style={styles.popularHeader}>
            <Feather name="trending-up" size={20} color="#059669" />
            <Text style={styles.sectionTitle}>Được yêu thích nhất</Text>
          </View>
          <FlatList
            data={popularProducts}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.productRow}
            renderItem={({ item: product }) => {
              const isFavorite = favoriteProductIds.includes(product.id);
              const hasSale =
                product.salePrice && Number(product.salePrice) > 0;

              const displayPrice = hasSale
                ? Number(product.salePrice)
                : Number(product.price);
              const discountPercent = hasSale
                ? Math.round(
                    (1 - Number(product.salePrice) / Number(product.price)) *
                      100
                  )
                : 0;

              return (
                <TouchableOpacity
                  key={product.id}
                  onPress={() =>
                    router.push({
                      pathname: "/product-detail",
                      params: { id: product.id },
                    })
                  }
                  style={styles.productCard}
                  activeOpacity={0.8}
                >
                  {/* Image & Favorite Button */}
                  <View style={styles.badgeStack}>
                    {product.salePrice && (
                      <View style={styles.saleBadge}>
                        <Text style={styles.badgeText}>
                          -{discountPercent}%
                        </Text>
                      </View>
                    )}

                    {product.price > 30000 && (
                      <View style={styles.hotBadge}>
                        <Text style={styles.badgeText}>🔥 Hot</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.productImageWrapper}>
                    <Image
                      source={{ uri: product.image }}
                      style={styles.productImage}
                    />
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation?.();
                        toggleFavorite(product.id);
                      }}
                      style={styles.favoriteButton}
                    >
                      <Ionicons
                        name={isFavorite ? "heart" : "heart-outline"}
                        size={20}
                        color={isFavorite ? "#ef4444" : "#94a3b8"}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Product Details */}
                  <View style={styles.productDetails}>
                    <Text numberOfLines={2} style={styles.productNameSmall}>
                      {product.name}
                    </Text>

                    <View style={styles.priceContainer}>
                      <View>
                        {/* Giá chính */}
                        <Text style={styles.productPrice}>
                          {displayPrice.toLocaleString("vi-VN")}đ
                        </Text>

                        {/* Giá gốc gạch ngang */}
                        {hasSale && (
                          <Text style={styles.originalPriceSmall}>
                            {Number(product.price).toLocaleString("vi-VN")}đ
                          </Text>
                        )}
                      </View>

                      {/* Nút thêm */}
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
          />
        </View>

        {/* Special Offers */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Ưu đãi đặc biệt</Text>
          <View style={styles.offerList}>
            {/* Offer 1: Buy 2 Get 1 */}
            <LinearGradient
              colors={["#a855f7", "#ec4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.offerCard}
            >
              <View style={styles.offerTextContent}>
                <Text style={styles.offerSubtitle}>Mua 2 tặng 1</Text>
                <Text style={styles.offerTitle}>Tất cả Trà sữa</Text>
                <Text style={styles.offerTime}>Áp dụng từ 14h - 16h</Text>
              </View>
              <Text style={styles.offerEmoji}>🎁</Text>
            </LinearGradient>

            {/* Offer 2: Free Ship */}
            <LinearGradient
              colors={["#3b82f6", "#06b6d4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.offerCard}
            >
              <View style={styles.offerTextContent}>
                <Text style={styles.offerSubtitle}>Miễn phí ship</Text>
                <Text style={styles.offerTitle}>Đơn từ 100k</Text>
                <Text style={styles.offerTime}>Trong bán kính 5km</Text>
              </View>
              <Text style={styles.offerEmoji}>🚚</Text>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default HomeRoute;
// ... (STYLESHEET)
const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: "#f8fafc" },
  headerGradient: {
    paddingHorizontal: 16,
    paddingBottom: 96,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  welcomeText: { color: "#f0f9ff", fontSize: 14 },
  userName: { color: "white", fontSize: 20, fontWeight: "600" },
  cartButton: {
    position: "relative",
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 9999,
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    lineHeight: 20,
  },
  searchBarContainer: { position: "relative" },
  searchIcon: {
    position: "absolute",
    left: 16,
    top: "50%",
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  searchInput: {
    width: "100%",
    paddingLeft: 48,
    paddingRight: 16,
    paddingVertical: 16,
    backgroundColor: "white",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    fontSize: 16,
  },
  promoBannerWrapper: {
    marginTop: -64,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  promoBanner: {
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  promoContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  promoSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    marginBottom: 4,
  },
  promoTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  promoButton: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  promoButtonText: { color: "#fb923c", fontSize: 14, fontWeight: "600" },
  promoEmoji: { fontSize: 48 },
  sectionContainer: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  popularHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1e293b" },
  sectionLink: { color: "#059669", fontSize: 14 },
  categoryContainerFlex: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  categoryItemFlex: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    alignItems: "center",
    width: (width - 2 * 16 - 3 * 12) / 4,
    marginBottom: 12,
  },
  categoryEmoji: { fontSize: 24, marginBottom: 8 },
  categoryLabel: { fontSize: 12, color: "#475569", textAlign: "center" },
  productRow: { justifyContent: "space-between", marginBottom: 16, gap: 16 },
  productCard: {
    width: ITEM_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  productImageWrapper: { position: "relative" },
  productImage: { width: "100%", height: 160, resizeMode: "cover" },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 9999,
  },
  productDetails: { padding: 12 },
  productNameSmall: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slate800,
    marginBottom: 4,
    minHeight: 32,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  ratingTextSmall: { fontSize: 12, color: COLORS.slate600 },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: { fontSize: 14, fontWeight: "bold", color: COLORS.emerald500 },
  offerList: { gap: 12 },
  offerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    color: "white",
  },
  offerTextContent: { flexShrink: 1 },
  offerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 4,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  offerTime: { fontSize: 12, color: "rgba(255, 255, 255, 0.75)" },
  offerEmoji: { fontSize: 40 },
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  originalPriceSmall: {
    fontSize: 10,
    color: COLORS.slate400,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: COLORS.red500,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 10, // ✅
  },
  discountText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  badgeStack: {
    position: "absolute",
    top: 8,
    left: 8,
    gap: 4, // ⭐ QUAN TRỌNG: tạo khoảng cách giữa badge
    zIndex: 10,
  },

  saleBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  hotBadge: {
    backgroundColor: "#fbbf24",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});
