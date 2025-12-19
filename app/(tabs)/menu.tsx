import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router"; // 💡 IMPORT ROUTER
import React, { useCallback, useMemo, useState } from "react";
import {
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
import { useAuth } from "../../context/AuthContext";
import { FilterModal } from "../FilterModal"; // 💡 IMPORT MODAL LỌC
// --- Imports Logic Context ---
import Toast from "react-native-toast-message";
import { Header } from "../../components/Header"; // 💡 Component Header thực tế
import { CartItem, useCart } from "../../context/CartContext"; // 💡 Import CartItem type
import {
  CategoryRow,
  getCategories,
  getFavoriteProductIds,
  getProducts,
  ProductRow,
  updateFavoriteProductIds,
} from "../services/baserowApi";
// --------------------------------------------------

type Page = string;
interface FilterOptions {
  priceRange: number[];
  rating: number | null;
  sortBy: "popular" | "price-low" | "price-high" | "rating";
}
const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD") // tách dấu
    .replace(/[\u0300-\u036f]/g, "") // xóa dấu
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

const PaginationControls = ({
  currentPage,
  totalPages,
  goToPrev,
  goToNext,
  isLoading,
}: {
  currentPage: number;
  totalPages: number;
  goToPrev: () => void;
  goToNext: () => void;
  isLoading: boolean;
}) => {
  const isPrevDisabled = currentPage === 1 || isLoading;
  const isNextDisabled =
    currentPage === totalPages || totalPages === 0 || isLoading;

  return (
    <View style={paginationStyles.container}>
      <TouchableOpacity
        onPress={goToPrev}
        style={[
          paginationStyles.button,
          isPrevDisabled && paginationStyles.buttonDisabled,
        ]}
        disabled={isPrevDisabled}
      >
        <Feather
          name="chevron-left"
          size={24}
          color={isPrevDisabled ? COLORS.slate400 : COLORS.white}
        />
      </TouchableOpacity>

      <View style={paginationStyles.info}>
        <Text style={paginationStyles.pageText}>
          <Text style={paginationStyles.currentPageText}>{currentPage}</Text>
          <Text style={paginationStyles.totalPageText}> / {totalPages}</Text>
        </Text>
      </View>

      <TouchableOpacity
        onPress={goToNext}
        style={[
          paginationStyles.button,
          isNextDisabled && paginationStyles.buttonDisabled,
        ]}
        disabled={isNextDisabled}
      >
        <Feather
          name="chevron-right"
          size={24}
          color={isNextDisabled ? COLORS.slate400 : COLORS.white}
        />
      </TouchableOpacity>
    </View>
  );
};
const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 2;
const ITEMS_PER_PAGE = 8;
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

interface MenuPageProps {
  navigateTo: (page: Page, productId?: string) => void;
}

export function MenuPage({ navigateTo }: MenuPageProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteProductIds, setFavoriteProductIds] = useState<number[]>([]);
  const insets = useSafeAreaInsets();
  const headerHeight = 50 + insets.top;
  const [showFilterModal, setShowFilterModal] = useState(false); // 💡 STATE MODAL
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const DRINK_CATEGORIES_NORMALIZED = [
    "sinh_to",
    "ca_phe",
    "tra_sua",
    "tra_trai_cay",
  ];
  const [allProducts, setAllProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    // 💡 STATE FILTERS
    priceRange: [0, 1000000],
    rating: null,
    sortBy: "popular",
  });
  const { addToCart } = useCart();

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const favorites = user?.id ? await getFavoriteProductIds(user.id) : [];
      setFavoriteProductIds(favorites);
      const productResult = await getProducts(); // KHÔNG DÙNG PAGE/LIMIT Ở ĐÂY
      if (productResult.success && productResult.data) {
        setAllProducts(productResult.data); // Lưu toàn bộ data
      } else {
        setAllProducts([]);
        setError(productResult.message || "Không thể tải dữ liệu sản phẩm.");
        Toast.show({
          type: "error",
          text1: "Lỗi API",
          text2: productResult.message || "Kiểm tra ID bảng sản phẩm.",
          visibilityTime: 4000,
        });
      }

      // Fetch Categories (chỉ cần fetch 1 lần)
      const categoryResult = await getCategories();
      if (categoryResult.success && categoryResult.data) {
        setCategories(categoryResult.data);
      } else {
        console.error("Lỗi tải danh mục:", categoryResult.message);
      }
    } catch (e: any) {
      setError(e.message);
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
      fetchAllData();
    }, [fetchAllData])
  );
  const processedProducts = useMemo(() => {
    let filtered = allProducts;

    // 1. Lọc theo DANH MỤC ĐÃ CHỌN
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    // 2. Lọc theo TÌM KIẾM
    if (searchQuery.trim()) {
      const keyword = normalizeText(searchQuery);

      // ✅ bỏ từ rỗng
      const keywordWords = keyword
        .split(" ")
        .map((w) => w.trim())
        .filter(Boolean);

      filtered = filtered
        .map((product) => {
          const productText = normalizeText(
            `${product.name} ${product.description ?? ""}`
          );

          let score = 0;
          keywordWords.forEach((word) => {
            if (productText.includes(word)) {
              score += 1;
            }
          });

          return { ...product, __score: score };
        })
        .filter((p) => p.__score > 0)
        .sort((a, b) => b.__score - a.__score);
    }

    // 3. Lọc theo GIÁ & RATING (Tương tự logic FilterModal)
    filtered = filtered.filter((product) => {
      const matchesPrice =
        product.price >= filters.priceRange[0] &&
        product.price <= filters.priceRange[1];
      return matchesPrice;
    });

    // 4. Sắp xếp
    return [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        default:
          return 0;
      }
    });
  }, [allProducts, selectedCategory, searchQuery, filters]);

  const totalProductsFiltered = processedProducts.length;
  const totalPages = Math.ceil(totalProductsFiltered / ITEMS_PER_PAGE);

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
        fetchAllData();
      }
    } catch (e) {
      console.error("API update failed:", e);
      // Nếu thất bại, có thể chọn tải lại để đồng bộ lại
      fetchAllData();
    }
  };

  const displayedProducts = processedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1); // Luôn reset trang về 1
  };

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setShowFilterModal(false);
    setCurrentPage(1); // Reset về trang 1 khi áp dụng filter
  };
  const onAddToCart = (product: ProductRow) => {
    const isDrink = DRINK_CATEGORIES_NORMALIZED.includes(
      product.category ?? ""
    );

    const newItem: Omit<CartItem, "id"> = {
      productId: product.id.toString(),
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: 1,
      size: "M",
      ice: isDrink ? 75 : 0,
      sugar: isDrink ? 75 : 0,
      isDrink: isDrink,
    };
    addToCart(newItem); // ✅ Logic thêm vào giỏ hàng
  };

  const handleViewDetail = (productId: number) => {
    // Thay đổi type sang number
    // ✅ Điều hướng chi tiết sản phẩm
    router.push({
      pathname: "/product-detail",
      params: { id: productId.toString() }, // Chuyển ID sang string khi điều hướng
    } as any);
  };

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
                color="#94a3b8"
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
              const categoryFilterId =
                category.category_id || category.id.toString();
              const isActive = selectedCategory === categoryFilterId;
              const bgColor = isActive ? "transparent" : COLORS.white;
              const textColor = isActive ? COLORS.white : COLORS.slate700;

              return (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => handleSelectCategory(categoryFilterId)}
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
                    <Text style={{ fontSize: 16 }}>{category.image}</Text>
                    <Text style={[styles.categoryText, { color: textColor }]}>
                      {category.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Products Grid */}
          <FlatList
            data={displayedProducts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item: product }) => {
              const isFavorite = favoriteProductIds.includes(product.id);

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
                          e.stopPropagation?.();
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
                      {product.price > 30000 && (
                        <View style={styles.hotTag}>
                          <Text style={styles.hotTagText}>🔥 Hot</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.productDetails}>
                      <Text numberOfLines={2} style={styles.productName}>
                        {product.name}
                      </Text>
                      <Text style={styles.productDescription} numberOfLines={1}>
                        {product.description}
                      </Text>
                      {/* <View style={styles.ratingRow}>
                        <Ionicons
                          name="star"
                          size={14}
                          color={COLORS.amber400}
                        />
                      </View> */}
                      <View style={styles.productFooter}>
                        <Text style={styles.productPrice}>
                          {Number(product.price).toLocaleString("vi-VN")}đ
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

          {displayedProducts.length === 0 && (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsEmoji}>🔍</Text>
              <Text style={styles.noResultsText}>
                Không tìm thấy sản phẩm nào
              </Text>
            </View>
          )}
        </View>
        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            goToPrev={goToPrevPage}
            goToNext={goToNextPage}
            isLoading={isLoading}
          />
        )}
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
// 💡 PAGINATION STYLES
const paginationStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
  },
  button: {
    backgroundColor: COLORS.emerald500,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 10,
    shadowColor: COLORS.emerald500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: COLORS.slate200,
    shadowColor: "transparent",
    opacity: 0.7,
  },
  info: {
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  pageText: {
    fontSize: 16,
    color: COLORS.slate700,
    fontWeight: "500",
  },
  currentPageText: {
    color: COLORS.emerald600,
    fontWeight: "bold",
  },
  totalPageText: {
    color: COLORS.slate500,
  },
});
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
