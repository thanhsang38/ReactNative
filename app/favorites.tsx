import React, { useState, ComponentProps } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
  Image,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

// 💡 IMPORTS COMPONENTS & CONTEXTS (Giả định)
import { Header } from "../components/Header";
import { useCart } from "../context/CartContext";
// import { products } from '../data/products'; // Dữ liệu sản phẩm mock

// --- Types & Data ---
type Page = string;
type IoniconsName = ComponentProps<typeof Ionicons>["name"];

interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  soldCount: number;
  image: string;
  popular: boolean;
}

// 💡 Dữ liệu sản phẩm giả định (Mock Data)
const products: Product[] = [
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
    id: "3",
    name: "Trà Đào Cam Sả",
    price: 50000,
    rating: 4.2,
    soldCount: 80,
    image: "https://images.unsplash.com/photo-1645467148762-6d7fd24d7acf?w=400",
    popular: true,
  },
  {
    id: "7",
    name: "Cà phê Muối",
    price: 35000,
    rating: 4.8,
    soldCount: 300,
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400",
    popular: false,
  },
  {
    id: "8",
    name: "Sinh tố Xoài",
    price: 60000,
    rating: 4.9,
    soldCount: 250,
    image: "https://images.unsplash.com/photo-1625480499375-27220a672237?w=400",
    popular: true,
  },
];

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

// -----------------------------------------------------------

interface FavoritesPageProps {
  // 💡 navigateTo được thay thế bằng useRouter
  goBack: () => void;
}

export function FavoritesPage({ goBack }: FavoritesPageProps) {
  const router = useRouter();
  // Mock favorites - in real app this would be persisted
  const [favorites, setFavorites] = useState<string[]>(["1", "3", "7"]);
  const insets = useSafeAreaInsets();

  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // 💡 HÀM ĐIỀU HƯỚNG SỬ DỤNG ROUTER
  const handleNavigate = (path: string, id?: string) => {
    router.push(
      id ? ({ pathname: path, params: { id } } as any) : (path as any)
    );
  };

  const headerHeight = 50 + insets.top;

  return (
    <View style={styles.fullContainer}>
      <Header title="Yêu thích" showBack={true} onBack={goBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: headerHeight }} // Bù đắp Header
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentPadding}>
          {favoriteProducts.length === 0 ? (
            /* Empty State */
            <View style={styles.emptyView}>
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
          ) : (
            <>
              <Text style={styles.countText}>
                {favoriteProducts.length} sản phẩm yêu thích
              </Text>

              {/* Products Grid */}
              <FlatList
                data={favoriteProducts}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.productRow}
                renderItem={({ item: product }) => {
                  const isFavorite = favorites.includes(product.id);
                  const heartIconName = isFavorite ? "heart" : "heart-outline"; // Ionicons
                  const starIconName = "star"; // Ionicons

                  return (
                    <TouchableOpacity
                      key={product.id}
                      onPress={() =>
                        handleNavigate("product-detail", product.id)
                      }
                      style={styles.productCard}
                      activeOpacity={0.8}
                    >
                      <View style={styles.productImageWrapper}>
                        <Image
                          source={{ uri: product.image }}
                          style={styles.productImage}
                        />

                        {/* Favorite Button */}
                        <TouchableOpacity
                          onPress={(e) => {
                            // @ts-ignore e.stopPropagation();
                            toggleFavorite(product.id);
                          }}
                          style={styles.favoriteButton}
                        >
                          <Ionicons
                            name={heartIconName as IoniconsName}
                            size={20}
                            color={isFavorite ? COLORS.red500 : COLORS.slate400}
                          />
                        </TouchableOpacity>

                        {/* Hot Tag */}
                        {product.popular && (
                          <View style={styles.hotTag}>
                            <Text style={styles.hotTagText}>🔥 Hot</Text>
                          </View>
                        )}
                      </View>

                      {/* Product Details */}
                      <View style={styles.productDetails}>
                        <Text numberOfLines={2} style={styles.productName}>
                          {product.name}
                        </Text>
                        <View style={styles.ratingRow}>
                          <Ionicons
                            name={starIconName as IoniconsName}
                            size={16}
                            color={COLORS.amber400}
                            style={styles.ratingStar}
                          />
                          <Text style={styles.ratingTextSmall}>
                            {product.rating}
                          </Text>
                          <Text style={styles.soldCountText}>
                            ({product.soldCount})
                          </Text>
                        </View>

                        <View style={styles.productFooter}>
                          <Text style={styles.productPrice}>
                            {product.price.toLocaleString("vi-VN")}đ
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleNavigate("cart")} // Giả định nút thêm vào giỏ
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
            </>
          )}
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

  // --- Empty State ---
  emptyView: {
    alignItems: "center",
    paddingVertical: 80,
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
  },

  // --- Product Grid ---
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
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 8,
    backgroundColor: COLORS.white,
    borderRadius: 9999,
    zIndex: 10,
  },
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
  productFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
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
});
