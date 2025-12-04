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
import { useRouter } from "expo-router"; // 💡 IMPORT ROUTER
import { FilterModal } from "../FilterModal"; // 💡 IMPORT MODAL LỌC

// --- Imports Logic Context ---
import { useAuth } from "../../context/AuthContext";
import { useCart, CartItem } from "../../context/CartContext"; // 💡 Import CartItem type
import { Header } from "../../components/Header"; // 💡 Component Header thực tế
// --------------------------------------------------

type AntDesignName = ComponentProps<typeof AntDesign>["name"];
type Page = string;
interface FilterOptions {
  priceRange: number[];
  rating: number | null;
  sortBy: "popular" | "price-low" | "price-high" | "rating";
}
interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  soldCount: number;
  image: string;
  popular: boolean;
  category: string;
  description: string;
}
interface Category {
  id: string;
  name: string;
  icon: string;
}

// --- Dữ liệu Mock ---
const categories: Category[] = [
  { id: "all", name: "Tất cả", icon: "✨" },
  { id: "ts", name: "Trà sữa", icon: "🧋" },
  { id: "cf", name: "Cà phê", icon: "☕" },
  { id: "tc", name: "Trái cây", icon: "🍹" },
  { id: "st", name: "Sinh tố", icon: "🥤" },
];
const products: Product[] = [
  {
    id: "p1",
    name: "Trà Sữa Trân Châu Hoàng Gia",
    price: 55000,
    rating: 4.8,
    soldCount: 300,
    image: "https://images.unsplash.com/photo-1670468642364-6cacadfb7bb0?w=400",
    popular: true,
    category: "ts",
    description: "Trà sữa thơm béo, trân châu dai ngon.",
  },
  {
    id: "p2",
    name: "Cà Phê Muối",
    price: 40000,
    rating: 4.9,
    soldCount: 250,
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400",
    popular: true,
    category: "cf",
    description: "Vị mặn độc đáo của lớp kem muối.",
  },
  {
    id: "p3",
    name: "Trà Dâu Tươi",
    price: 60000,
    rating: 4.5,
    soldCount: 180,
    image: "https://images.unsplash.com/photo-1645467148762-6d7fd24d7acf?w=400",
    popular: false,
    category: "tc",
    description: "Dâu tươi mát lạnh, giải nhiệt mùa hè.",
  },
  {
    id: "p4",
    name: "Sữa Tươi Trân Châu Đường Đen",
    price: 50000,
    rating: 4.7,
    soldCount: 220,
    image: "https://via.placeholder.com/150/f0f9ff",
    popular: false,
    category: "ts",
    description: "Sữa tươi thanh mát, đường đen ngọt nhẹ.",
  },
  {
    id: "p5",
    name: "Sinh Tố Bơ",
    price: 65000,
    rating: 4.9,
    soldCount: 150,
    image: "https://images.unsplash.com/photo-1625480499375-27220a672237?w=400",
    popular: true,
    category: "st",
    description: "Sinh tố bơ sánh mịn, mát lạnh.",
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

interface MenuPageProps {
  navigateTo: (page: Page, productId?: string) => void;
}

export function MenuPage({ navigateTo }: MenuPageProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const insets = useSafeAreaInsets();
  const headerHeight = 50 + insets.top;
  const [showFilterModal, setShowFilterModal] = useState(false); // 💡 STATE MODAL
  const [filters, setFilters] = useState<FilterOptions>({
    // 💡 STATE FILTERS
    priceRange: [0, 1000000],
    rating: null,
    sortBy: "popular",
  });
  const { addToCart } = useCart();

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const onAddToCart = (product: Product) => {
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
    addToCart(newItem); // ✅ Logic thêm vào giỏ hàng
  };

  const handleViewDetail = (productId: string) => {
    // ✅ Điều hướng chi tiết sản phẩm
    router.push({
      pathname: "/product-detail",
      params: { id: productId },
    } as any);
  };
  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setShowFilterModal(false);
  };
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };
  let currentFilteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesPrice =
      product.price >= filters.priceRange[0] &&
      product.price <= filters.priceRange[1];
    const matchesRating = !filters.rating || product.rating >= filters.rating;

    return matchesCategory && matchesSearch && matchesPrice && matchesRating;
  });

  // Sort products
  currentFilteredProducts = [...currentFilteredProducts].sort((a, b) => {
    switch (filters.sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      case "popular":
        return b.soldCount - a.soldCount;
      default:
        return 0;
    }
  });
  return (
    <View style={styles.container}>
      {/* 💡 HEADER (Fixed/Absolute) */}
      <Header title="Thực đơn" showCart={true} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 💡 NỘI DUNG CHÍNH: ÁP DỤNG MARGIN TOP để bù đắp Header */}
        <View style={[styles.contentPadding, { marginTop: headerHeight }]}>
          {/* Search and Filter */}
          <View style={styles.searchFilterContainer}>
            <View style={styles.searchInputWrapper}>
              <Feather
                name="search"
                size={20}
                color={COLORS.slate400}
                style={styles.searchIcon}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Tìm kiếm đồ uống..."
                placeholderTextColor={COLORS.slate400}
                style={styles.searchInput}
              />
            </View>
            <TouchableOpacity
              onPress={() => setShowFilterModal(true)} // 💡 MỞ MODAL LỌC
              style={styles.filterButton}
            >
              <Feather name="filter" size={24} color={COLORS.slate700} />
              {/* 💡 FILTER BADGE */}
              {(filters.rating ||
                filters.priceRange[0] > 0 ||
                filters.priceRange[1] < 1000000) && (
                <View style={styles.filterBadge} />
              )}
            </TouchableOpacity>
          </View>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {categories.map((category) => {
              const isActive = selectedCategory === category.id;
              const bgColor = isActive ? "transparent" : COLORS.white;
              const textColor = isActive ? COLORS.white : COLORS.slate700;

              return (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: bgColor,
                      borderColor: isActive
                        ? COLORS.emerald500
                        : COLORS.slate200,
                    },
                  ]}
                >
                  {isActive && (
                    <LinearGradient
                      colors={[COLORS.emerald500, COLORS.teal600]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.categoryActiveBackground}
                    />
                  )}
                  <View style={styles.categoryContent}>
                    <Text style={{ fontSize: 16 }}>{category.icon}</Text>
                    <Text style={[styles.categoryText, { color: textColor }]}>
                      {" "}
                      {category.name}{" "}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Products Grid */}
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={({ item: product }) => {
              const isFavorite = favorites.includes(product.id);
              const heartIconName = isFavorite ? "heart" : "heart-outline";

              return (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => handleViewDetail(product.id)} // ✅ DÙNG HÀM VIEW DETAIL
                  style={styles.productCard}
                  activeOpacity={0.9}
                >
                  <View style={styles.productCardInner}>
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
                          name={heartIconName as "heart"}
                          size={20}
                          color={isFavorite ? COLORS.red500 : COLORS.slate400}
                        />
                      </TouchableOpacity>
                      {product.popular && (
                        <View style={styles.hotTag}>
                          <Text style={styles.hotTagText}>🔥 Hot</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.productDetails}>
                      <Text numberOfLines={2} style={styles.productName}>
                        {" "}
                        {product.name}{" "}
                      </Text>
                      <Text style={styles.productDescription} numberOfLines={1}>
                        {" "}
                        {product.description}{" "}
                      </Text>
                      <View style={styles.ratingRow}>
                        <Ionicons
                          name="star"
                          size={14}
                          color={COLORS.amber400}
                        />
                        <Text style={styles.ratingText}>
                          {" "}
                          {product.rating}{" "}
                        </Text>
                        <Text style={styles.soldCountText}>
                          {" "}
                          ({product.soldCount}){" "}
                        </Text>
                      </View>
                      <View style={styles.productFooter}>
                        <Text style={styles.productPrice}>
                          {" "}
                          {product.price.toLocaleString("vi-VN")}đ{" "}
                        </Text>
                        <TouchableOpacity
                          onPress={() => onAddToCart(product)} // ✅ GỌI HÀM ADD TO CART THẬT
                          style={styles.addButton}
                        >
                          <Text style={styles.addButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.productRow}
            contentContainerStyle={styles.productsGrid}
          />

          {filteredProducts.length === 0 && (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsEmoji}>🔍</Text>
              <Text style={styles.noResultsText}>
                Không tìm thấy sản phẩm nào
              </Text>
            </View>
          )}
        </View>

        {/* Padding cuối cùng cho ScrollView */}
        <View style={{ height: 40 }} />
      </ScrollView>
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />
    </View>
  );
}

export default MenuPage;
// ... (STYLESHEET)
// -----------------------------------------------------------
// 💡 STYLE SHEET
// -----------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  contentPadding: { paddingHorizontal: 16 },
  // --- Header Mock Styles (Giữ để không gây lỗi style) ---
  header: {
    // Style này không còn được dùng nhưng giữ để tránh lỗi style sheet
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.slate800 },
  // --------------------------------------------------------
  // --- Search & Filter ---
  searchFilterContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    marginTop: 16,
  },
  searchInputWrapper: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
  },
  searchIcon: { position: "absolute", left: 16 },
  searchInput: {
    width: "100%",
    paddingLeft: 48,
    paddingRight: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    fontSize: 16,
    color: COLORS.slate800,
  },
  filterButton: {
    padding: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },

  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    backgroundColor: COLORS.emerald500,
    borderRadius: 9999,
  },
  // --- Categories ---
  categoriesScroll: { gap: 8, paddingBottom: 8, marginBottom: 24 },
  categoryButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryActiveBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  categoryContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 1,
  },
  categoryText: { fontSize: 14, fontWeight: "500" },
  // --- Products Grid ---
  productsGrid: { paddingBottom: 24 },
  productRow: { justifyContent: "space-between", marginBottom: 16 },
  productCard: {
    width: ITEM_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  productCardInner: {},
  productImageWrapper: { position: "relative", height: 160 },
  productImage: { width: "100%", height: "100%", resizeMode: "cover" },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 9999,
  },
  hotTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: COLORS.amber400,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  productDescription: {
    color: COLORS.slate500,
    fontSize: 12,
    marginBottom: 8,
    minHeight: 18,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  ratingText: { fontSize: 12, color: COLORS.slate600, fontWeight: "600" },
  soldCountText: { fontSize: 12, color: COLORS.slate400 },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: { color: COLORS.emerald500, fontWeight: "bold", fontSize: 16 },
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
  // --- No Results ---
  noResultsContainer: { alignItems: "center", paddingVertical: 48 },
  noResultsEmoji: { fontSize: 48, marginBottom: 16 },
  noResultsText: { color: COLORS.slate600, fontSize: 16 },
});
