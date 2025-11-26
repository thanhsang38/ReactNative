import React, { useState } from 'react'; // Thêm useState
import { 
    StyleSheet, FlatList, ScrollView, TouchableOpacity, Dimensions, 
    TextInput, Alert // Thêm Alert
} from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router'; // Thêm useRouter

// Màu chủ đạo từ AuthScreen
const PRIMARY_COLOR = '#4FC3F7'; // Xanh ngọc mát lạnh
const ACCENT_COLOR = '#0288D1';  // Xanh dương đậm

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 60) / 2; // Kích thước card sản phẩm

// --- Dữ liệu giả lập ---
const CATEGORIES = [
    { id: '1', name: 'Coffee', imagePlaceholder: '☕' },
    { id: '2', name: 'Trà Trái Cây', imagePlaceholder: '🍹' },
    { id: '3', name: 'Sinh Tố', imagePlaceholder: '🥤' },
    { id: '4', name: 'Đá Xay', imagePlaceholder: '🧊' },
    { id: '5', name: 'Đồ Ăn Vặt', imagePlaceholder: '🍩' },
];

const FEATURED_PRODUCTS = [
    { id: 'p1', name: 'Trà Dâu Tây Nhiệt Đới', price: '65.000đ', rating: 4.8, imagePlaceholder: '🍓', basePrice: 65000 },
    { id: 'p2', name: 'Latte Hạnh Nhân', price: '50.000đ', rating: 4.7, imagePlaceholder: '🥛', basePrice: 50000 },
    { id: 'p3', name: 'Smoothie Xoài', price: '70.000đ', rating: 4.9, imagePlaceholder: '🥭', basePrice: 70000 },
    { id: 'p4', name: 'Espresso Lạnh', price: '45.000đ', rating: 4.5, imagePlaceholder: '☕', basePrice: 45000 },
    { id: 'p5', name: 'Trà Đào Cam Sả', price: '55.000đ', rating: 4.6, imagePlaceholder: '🍑', basePrice: 55000 },
];

// --- Components Con ---

// 1. Component hiển thị danh mục
const CategoryItem = ({ item }: { item: typeof CATEGORIES[0] }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const accentColor = isDark ? PRIMARY_COLOR : ACCENT_COLOR;
    const itemBg = isDark ? Colors.dark.background : '#F0F0F0'; 

    return (
        <TouchableOpacity style={[styles.categoryItem, { backgroundColor: itemBg, borderColor: accentColor }]}>
            <ThemedText style={{ fontSize: 20 }}>{item.imagePlaceholder}</ThemedText>
            <ThemedText style={styles.categoryText}>{item.name}</ThemedText>
        </TouchableOpacity>
    );
};

// 2. Component Card Sản phẩm
// THAY ĐỔI: Nhận prop onAddToCart và onViewDetail
const ProductCard = ({ item, onAddToCart, onViewDetail }: { 
    item: typeof FEATURED_PRODUCTS[0], 
    onAddToCart: (product: typeof FEATURED_PRODUCTS[0]) => void,
    onViewDetail: (productId: string) => void
}) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const cardBg = isDark ? Colors.dark.background : '#FFFFFF'; 
    const accentColor = ACCENT_COLOR;

    return (
        <ThemedView style={[styles.productCard, { backgroundColor: cardBg }]}>
            {/* THAY ĐỔI LỚN: Gắn onViewDetail vào TouchableOpacity chính */}
            <TouchableOpacity style={styles.productTouchable} onPress={() => onViewDetail(item.id)}>
                {/* Ảnh/Icon sản phẩm */}
                <ThemedView style={[styles.productImageContainer, { backgroundColor: PRIMARY_COLOR + '20' }]}>
                    <ThemedText style={{ fontSize: 40, color: accentColor }}>{item.imagePlaceholder}</ThemedText>
                </ThemedView>

                {/* Tên và Rating */}
                <ThemedText numberOfLines={2} style={styles.productName}>{item.name}</ThemedText>
                <ThemedView style={styles.ratingBox}>
                    <ThemedText style={styles.ratingStar}>⭐</ThemedText> 
                    <ThemedText style={styles.ratingText}>{item.rating}</ThemedText>
                </ThemedView>

                {/* Giá và nút Mua */}
                <ThemedView style={styles.productFooter}>
                    <ThemedText type="subtitle" style={{ color: ACCENT_COLOR, fontWeight: 'bold' }}>{item.price}</ThemedText>
                    
                    {/* THAY ĐỔI: Thêm sự kiện onPress cho nút + để ngăn chặn lan truyền*/}
                    <TouchableOpacity 
                        style={[styles.addButton, { backgroundColor: accentColor }]} 
                        onPress={(e) => {
                            e.stopPropagation(); // QUAN TRỌNG: Ngăn chặn nhấn nút '+' kích hoạt onViewDetail
                            onAddToCart(item);
                        }}
                    >
                        <ThemedText style={styles.addButtonText}>+</ThemedText>
                    </TouchableOpacity>
                </ThemedView>

            </TouchableOpacity>
        </ThemedView>
    );
};


// --- Màn hình chính ---
export default function HomeScreen() {
    const router = useRouter(); // Khởi tạo router
    const [cartItems, setCartItems] = useState<typeof FEATURED_PRODUCTS>([]); // Quản lý giỏ hàng tạm thời
    
    // Logic thêm vào giỏ hàng
    const handleAddToCart = (product: typeof FEATURED_PRODUCTS[0]) => {
        setCartItems(prevItems => [...prevItems, product]);
        Alert.alert("Thông báo", `${product.name} đã được thêm vào giỏ hàng!`);
    };
    
    // Logic xem chi tiết sản phẩm
    const handleViewDetail = (productId: string) => {
        router.push({
            pathname: '/product-detail',
            params: { id: productId }
        });
    };

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const inputBg = isDark ? '#2B2B2B' : '#F0F0F0';
    const inputColor = isDark ? Colors.dark.text : Colors.light.text;

    return (
        // THAY ĐỔI: Buộc màu nền Light Mode cho container chính
        <ThemedView style={[styles.container, { backgroundColor: Colors.light.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                
                {/* 1. HEADER & SEARCH BAR */}
                <ThemedView style={styles.header}>
                    <ThemedText type="title" style={styles.headerTitle}>Chào Buổi Sáng!</ThemedText>
                    <ThemedView style={styles.headerIcons}>
                        <ThemedText style={{ fontSize: 28, color: ACCENT_COLOR }}>👤</ThemedText>
                        
                        {/* THAY ĐỔI: Nút Giỏ hàng có badge và điều hướng */}
                        <TouchableOpacity onPress={() => router.push({ pathname: '/cart', params: { cartData: JSON.stringify(cartItems) } })}>
                            <ThemedText style={{ fontSize: 28, color: ACCENT_COLOR }}>🛒</ThemedText>
                            {cartItems.length > 0 && (
                                <ThemedView style={styles.cartBadge}>
                                    <ThemedText style={styles.cartBadgeText}>{cartItems.length}</ThemedText>
                                </ThemedView>
                            )}
                        </TouchableOpacity>
                    </ThemedView>
                </ThemedView>

                <ThemedView style={styles.searchContainer}>
                    <ThemedText style={{ fontSize: 20, color: inputColor + '80', marginRight: 10 }}>🔍</ThemedText>
                    <TextInput
                        placeholder="Tìm kiếm trà, cà phê..."
                        placeholderTextColor={inputColor + '80'}
                        style={[styles.searchInput, { backgroundColor: inputBg, color: inputColor }]}
                    />
                </ThemedView>

                {/* 2. CATEGORIES (Horizontal Scroll) */}
                <ThemedText style={styles.sectionHeader}>Danh Mục Nổi Bật</ThemedText>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScroll}
                >
                    {CATEGORIES.map(item => (
                        <CategoryItem key={item.id} item={item} />
                    ))}
                </ScrollView>


                {/* 3. FEATURED PRODUCTS (Vertical Grid) */}
                <ThemedText style={styles.sectionHeader}>Đề Xuất Hôm Nay</ThemedText>
                <FlatList
                    data={FEATURED_PRODUCTS}
                    keyExtractor={(item) => item.id}
                    // THAY ĐỔI: Truyền cả hai hàm onAddToCart và handleViewDetail
                    renderItem={({ item }) => (
                        <ProductCard 
                            item={item} 
                            onAddToCart={handleAddToCart} 
                            onViewDetail={handleViewDetail} // TRUYỀN HÀM XEM CHI TIẾT
                        />
                    )}
                    numColumns={2}
                    scrollEnabled={false} 
                    columnWrapperStyle={styles.row}
                />

            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 15,
        paddingTop: 50,
    },
    // --- Header & Search ---
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: 'transparent',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 15,
        backgroundColor: 'transparent',
    },
    cartBadge: {
        position: 'absolute',
        right: -8,
        top: -8,
        backgroundColor: 'red',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        borderRadius: 12,
        marginBottom: 25,
        height: 50,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    searchInput: {
        flex: 1,
        height: '100%',
        borderRadius: 12,
        paddingHorizontal: 10,
        fontSize: 16,
    },
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 15,
    },
    // --- Categories ---
    categoryScroll: {
        marginBottom: 25,
        gap: 10,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#DDD',
        marginRight: 10,
    },
    categoryText: {
        marginLeft: 8,
        fontSize: 14,
    },
    // --- Products ---
    row: {
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    productCard: {
        width: ITEM_SIZE,
        borderRadius: 15,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    productTouchable: {
        alignItems: 'center',
    },
    productImageContainer: {
        width: '100%',
        height: ITEM_SIZE * 0.8,
        borderRadius: 12,
        marginBottom: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'left',
        width: '100%',
        height: 38,
        marginBottom: 5,
    },
    ratingBox: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
        backgroundColor: 'transparent',
    },
    ratingStar: { // Style mới cho Emoji ngôi sao
        fontSize: 12,
    },
    ratingText: {
        fontSize: 12,
        color: '#FFC700',
    },
    productFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        backgroundColor: 'transparent',
    },
    addButton: {
        padding: 8,
        borderRadius: 10,
    },
    addButtonText: { // Style mới cho dấu +
        color: '#fff',
        fontSize: 18,
        lineHeight: 18,
        fontWeight: 'bold',
    }
});