import React, { useState, ComponentProps } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons, AntDesign } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router"; // Cần thêm import này

// --- Imports Logic Context ---
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { CartItem } from "../../context/CartContext";
// --------------------------------------------------

type AntDesignName = ComponentProps<typeof AntDesign>["name"];

// ❌ ĐÃ XÓA type Page và HomePageProps

interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  soldCount: number;
  image: string;
  popular: boolean;
}

const products: Product[] = [
  // ... (Dữ liệu sản phẩm giữ nguyên)
  {
    id: "1",
    name: "Trà sữa Trân Châu",
    price: 45000,
    rating: 4.5,
    soldCount: 120,
    image: "https://images.unsplash.com/photo-1670468642364-6cacadfb7bb0?w=400",
    popular: true,
  },
  {
    id: "2",
    name: "Cà phê Đen Đá",
    price: 30000,
    rating: 4.8,
    soldCount: 350,
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400",
    popular: true,
  },
  {
    id: "3",
    name: "Trà Đào Cam Sả",
    price: 50000,
    rating: 4.2,
    soldCount: 80,
    image: "https://images.unsplash.com/photo-1645467148762-6d7fd24d7acf?w=400",
    popular: true,
  },
  {
    id: "4",
    name: "Smoothie Xoài",
    price: 65000,
    rating: 4.9,
    soldCount: 200,
    image: "https://images.unsplash.com/photo-1625480499375-27220a672237?w=400",
    popular: true,
  },
  {
    id: "5",
    name: "Trà Xanh Matcha",
    price: 40000,
    rating: 4.4,
    soldCount: 150,
    image: "https://via.placeholder.com/150/8b5cf6",
    popular: true,
  },
  {
    id: "6",
    name: "Sữa Tươi Trân Châu",
    price: 55000,
    rating: 4.6,
    soldCount: 180,
    image: "https://via.placeholder.com/150/ec4899",
    popular: true,
  },
];

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 2;

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
  teal600: "#0d9488",
  red500: "#ef4444",
  amber400: "#fbbf24",
};

// 💡 LOẠI BỎ PROPS navigateTo KHỎI HomeRoute
export function HomeRoute() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, getTotalItems } = useCart();
  const insets = useSafeAreaInsets();

  const [favorites, setFavorites] = useState<string[]>([]);
  const popularProducts = products.filter((p) => p.popular).slice(0, 6);

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const cartCount = getTotalItems();
  const headerHeight = 50 + insets.top;

  const handleAddToCart = (product: Product) => {
    const newItem: Omit<CartItem, "id"> = {
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: 1,
      size: "M",
      ice: 100,
      sugar: 100,
      toppings: [],
    };
    addToCart(newItem);
  };

  // 💡 HÀM ĐIỀU HƯỚNG SỬ DỤNG ROUTER
  const handleNavigate = (path: string, id?: string) => {
    // 💡 Ép kiểu an toàn (as any) để Router chấp nhận đường dẫn đã xây dựng
    router.push(
      id ? ({ pathname: path, params: { id } } as any) : (path as any)
    );
  };

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
            {["🧋 Trà sữa", "☕ Cà phê", "🍹 Trái cây", "🥤 Sinh tố"].map(
              (cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => router.push("/(tabs)/menu")} // ✅ DÙNG ROUTER TRỰC TIẾP
                  style={styles.categoryItemFlex}
                >
                  <Text style={styles.categoryEmoji}>{cat.split(" ")[0]}</Text>
                  <Text style={styles.categoryLabel}>
                    {cat.split(" ").slice(1).join(" ")}
                  </Text>
                </TouchableOpacity>
              )
            )}
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
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.productRow}
            renderItem={({ item: product }) => (
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
                <View style={styles.productImageWrapper}>
                  <Image
                    source={{ uri: product.image }}
                    style={styles.productImage}
                  />
                  <TouchableOpacity
                    onPress={(e) => {
                      // @ts-ignore e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                    style={styles.favoriteButton}
                  >
                    <Ionicons
                      name={
                        favorites.includes(product.id)
                          ? "heart"
                          : "heart-outline"
                      }
                      size={20}
                      color={
                        favorites.includes(product.id) ? "#ef4444" : "#94a3b8"
                      }
                    />
                  </TouchableOpacity>
                </View>

                {/* Product Details */}
                <View style={styles.productDetails}>
                  <Text numberOfLines={2} style={styles.productNameSmall}>
                    {" "}
                    {product.name}{" "}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons
                      name="star"
                      size={16}
                      color="#fbbf24"
                      style={{ top: 1 }}
                    />
                    <Text style={styles.ratingTextSmall}>
                      {" "}
                      {product.rating} ({product.soldCount}){" "}
                    </Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.productPrice}>
                      {" "}
                      {product.price.toLocaleString("vi-VN")}đ{" "}
                    </Text>
                    {/* NÚT THÊM VÀO GIỎ HÀNG */}
                    <TouchableOpacity
                      onPress={() => handleAddToCart(product)} // ✅ GỌI ADD TO CART
                      style={styles.addButton}
                    >
                      <Text style={styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            )}
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
});
