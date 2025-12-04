import React, { useState, ComponentProps } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Dimensions,
  Image,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider"; // Import Slider cho thanh trượt
import { useLocalSearchParams, useRouter } from "expo-router";

import { Header } from "../components/Header"; // Component Header
import { useCart, CartItem } from "../context/CartContext"; // Context Giỏ hàng

// --- Dữ liệu Mock và Types ---
type Page = string;

interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  soldCount: number;
  image: string;
  category: string;
  description: string;
  toppings: string[];
}

const products: Product[] = [
  // 💡 Dữ liệu Mock (Phải khớp với ID bạn đang truyền từ Home/Menu, ví dụ: id: '1')
  {
    id: "product-detail",
    name: "Trà Sữa Đặc Biệt",
    price: 50000,
    rating: 4.8,
    soldCount: 350,
    image: "https://images.unsplash.com/photo-1670468642364-6cacadfb7bb0?w=400",
    category: "Trà sữa",
    description:
      "Trà sữa thơm ngon, béo ngậy, trân châu dai ngon, vị trà đậm đà.",
    toppings: ["Trân châu", "Kem cheese", "Pudding", "Thạch dừa"],
  },
  {
    id: "1",
    name: "Trà Sữa Đặc Biệt",
    price: 50000,
    rating: 4.8,
    soldCount: 350,
    image: "https://images.unsplash.com/photo-1670468642364-6cacadfb7bb0?w=400",
    category: "Trà sữa",
    description: "Trà sữa thơm ngon, béo ngậy, vị trà đậm đà.",
    toppings: ["Trân châu", "Kem cheese", "Pudding", "Thạch dừa"],
  },
];

const SIZES = [
  { id: "S", name: "Nhỏ", price: 0 },
  { id: "M", name: "Vừa", price: 5000 },
  { id: "L", name: "Lớn", price: 10000 },
];
const TOPPINGS_PRICES: { [key: string]: number } = {
  "Trân châu": 8000,
  "Thạch dừa": 6000,
  Pudding: 8000,
  "Kem cheese": 10000,
  "Shot espresso": 10000,
  "Kem whipping": 8000,
  "Hạt chia": 5000,
  "Nha đam": 6000,
  "Topping dâu": 8000,
  "Kem vani": 8000,
  "Pudding matcha": 10000,
  "Hạt điều": 8000,
};

const COLORS = {
  white: "#ffffff",
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
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

interface ProductDetailPageProps {
  // ❌ XÓA productId khỏi props (Vì đã dùng useLocalSearchParams)
  navigateTo: (page: Page) => void;
  goBack: () => void;
}

export function ProductDetailPage({ goBack }: ProductDetailPageProps) {
  // 💡 LẤY ID TỪ URL EXPO ROUTER
  const { id } = useLocalSearchParams();
  const productId = id as string;

  // 💡 TÌM SẢN PHẨM: Dùng ID từ Router (hoặc mock nếu không tìm thấy)
  const product = products.find((p) => p.id === productId) || products[0];

  const { addToCart } = useCart();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [size, setSize] = useState<"S" | "M" | "L">("M");
  const [ice, setIce] = useState(70);
  const [sugar, setSugar] = useState(50);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback nếu không có màn hình nào để quay lại (ví dụ: mở trực tiếp)
      router.replace("/(tabs)");
    }
  };
  if (!product) {
    return <Text style={styles.errorText}>Không tìm thấy sản phẩm</Text>;
  }

  const toggleTopping = (topping: string) => {
    setSelectedToppings((prev) =>
      prev.includes(topping)
        ? prev.filter((t) => t !== topping)
        : [...prev, topping]
    );
  };

  const calculatePrice = () => {
    const sizePrice = SIZES.find((s) => s.id === size)?.price || 0;
    const toppingsPrice = selectedToppings.reduce(
      (sum, t) => sum + (TOPPINGS_PRICES[t] || 0),
      0
    );
    return (product.price + sizePrice + toppingsPrice) * quantity;
  };

  const handleAddToCart = () => {
    // 💡 Logic Add To Cart
    addToCart({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: calculatePrice() / quantity,
      quantity,
      size,
      ice,
      sugar,
      toppings: selectedToppings,
    });
    handleGoBack();
  };

  const headerHeight = 50 + insets.top;
  const totalPrice = calculatePrice();

  return (
    <View style={styles.fullContainer}>
      {/* 1. Header (Absolute) */}
      <Header title="" showBack={true} onBack={handleGoBack} />

      {/* 2. Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: headerHeight }}
      >
        {/* Product Image */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
          <LinearGradient
            // 💡 SỬA LỖI GRADIENT: Đảm bảo phần tối nằm ở dưới cùng
            colors={["transparent", "rgba(30, 41, 59, 0.6)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.imageGradientOverlay}
          >
            <View style={styles.ratingInfo}>
              <Ionicons name="star" size={20} color={COLORS.amber400} />
              <Text style={styles.ratingText}>{product.rating}</Text>
              <Text style={styles.soldCountText}>
                ({product.soldCount} đã bán)
              </Text>
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
                {product.price.toLocaleString("vi-VN")}đ
              </Text>
              <Text style={styles.productCategory}>{product.category}</Text>
            </View>
          </View>

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
                    <Text style={styles.sizePriceText}>
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
            {/* 💡 SLIDER THỰC TẾ */}
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              step={10}
              value={ice}
              onValueChange={setIce}
              minimumTrackTintColor={COLORS.emerald500}
              maximumTrackTintColor={COLORS.slate200}
              thumbTintColor={COLORS.emerald600}
            />
            <View style={styles.rangeLabels}>
              <Text style={styles.rangeLabelText}>Không đá</Text>
              <Text style={styles.rangeLabelText}>Bình thường</Text>
              <Text style={styles.rangeLabelText}>Nhiều đá</Text>
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
              step={10}
              value={sugar}
              onValueChange={setSugar}
              minimumTrackTintColor={COLORS.emerald500}
              maximumTrackTintColor={COLORS.slate200}
              thumbTintColor={COLORS.emerald600}
            />
            <View style={styles.rangeLabels}>
              <Text style={styles.rangeLabelText}>Không đường</Text>
              <Text style={styles.rangeLabelText}>Bình thường</Text>
              <Text style={styles.rangeLabelText}>Nhiều đường</Text>
            </View>
          </View>

          {/* Toppings */}
          {product.toppings && product.toppings.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Topping (tùy chọn)</Text>
              <View style={styles.toppingsList}>
                {product.toppings.map((topping) => (
                  <TouchableOpacity
                    key={topping}
                    onPress={() => toggleTopping(topping)}
                    style={[
                      styles.toppingButton,
                      selectedToppings.includes(topping)
                        ? styles.toppingActive
                        : styles.toppingInactive,
                    ]}
                  >
                    <Text style={styles.toppingName}>{topping}</Text>
                    <Text style={styles.toppingPrice}>
                      +{TOPPINGS_PRICES[topping]?.toLocaleString() || 0}đ
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Note */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ghi chú</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Ví dụ: Ít đá, nhiều đường..."
              style={styles.noteInput}
              multiline={true}
              numberOfLines={3}
            />
          </View>
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
                {totalPrice.toLocaleString("vi-VN")}đ
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
// 💡 STYLE SHEET (Giữ nguyên)
// -----------------------------------------------------------

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: COLORS.slate50 },
  errorText: { padding: 20, color: COLORS.red500 },
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
  productCategory: { color: COLORS.slate500, fontSize: 14 },
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
  rangeLabels: { flexDirection: "row", justifyContent: "space-between" },
  rangeLabelText: { fontSize: 12, color: COLORS.slate500 },
  toppingsList: { gap: 8 },
  toppingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  toppingActive: {
    borderColor: COLORS.emerald500,
    backgroundColor: COLORS.emerald50,
  },
  toppingInactive: { borderColor: COLORS.slate200 },
  toppingName: { color: COLORS.slate700, fontSize: 15 },
  toppingPrice: { color: COLORS.emerald600, fontSize: 15, fontWeight: "600" },
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
    borderRadius: 8,
    padding: 8,
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
