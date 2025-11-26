import React, { useState } from 'react';
import { 
    StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, FlatList
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'; // THÊM useRouter
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme'; // Dù không dùng nhưng giữ lại

const ACCENT_COLOR = '#0288D1';
const PRIMARY_COLOR = '#4FC3F7';
const { width } = Dimensions.get('window');

// --- Dữ liệu giả lập ---
const ALL_PRODUCTS = [
    { id: 'p1', name: 'Trà Dâu Tây Nhiệt Đới', price: '65.000đ', rating: 4.8, imagePlaceholder: '🍓', basePrice: 65000, categoryId: '2', description: 'Món trà trái cây được yêu thích nhất, kết hợp vị dâu tươi và các loại quả nhiệt đới, mang lại cảm giác sảng khoái tối đa.' },
    { id: 'p2', name: 'Latte Hạnh Nhân', price: '50.000đ', rating: 4.7, imagePlaceholder: '🥛', basePrice: 50000, categoryId: '1', description: 'Cà phê Espresso đậm đà pha với sữa hạnh nhân thơm béo, ít đường, phù hợp cho người ăn chay và những ai thích vị cà phê nhẹ nhàng.' },
    { id: 'p3', name: 'Smoothie Xoài', price: '70.000đ', rating: 4.9, imagePlaceholder: '🥭', basePrice: 70000, categoryId: '3', description: 'Smoothie mát lạnh làm từ xoài tươi nguyên chất, kết hợp với sữa chua và một chút mật ong. Vị ngọt tự nhiên, giàu vitamin.' },
    { id: 'p4', name: 'Espresso Lạnh', price: '45.000đ', rating: 4.5, imagePlaceholder: '☕', basePrice: 45000, categoryId: '1', description: 'Espresso nguyên chất được ủ lạnh, phục vụ cùng đá. Vị đắng mạnh mẽ, lý tưởng để bắt đầu một ngày mới đầy năng lượng.' },
    { id: 'p5', name: 'Trà Đào Cam Sả', price: '55.000đ', rating: 4.6, imagePlaceholder: '🍑', basePrice: 55000, categoryId: '2', description: 'Trà đen thơm lừng kết hợp với đào tươi, cam và sả. Hương vị chua ngọt cân bằng, giải khát tuyệt vời.' },
];

const ProductCardItem = ({ item }: { item: typeof ALL_PRODUCTS[0] }) => {
    // Component Card sản phẩm đơn giản để dùng trong danh sách liên quan
    return (
        <TouchableOpacity style={styles.relatedCard} onPress={() => Alert.alert('Điều hướng', `Chuyển đến chi tiết: ${item.name}`)}>
            <ThemedText style={{ fontSize: 24, marginRight: 10 }}>{item.imagePlaceholder}</ThemedText>
            <ThemedText style={styles.relatedName} numberOfLines={1}>{item.name}</ThemedText>
            <ThemedText style={{ color: ACCENT_COLOR, fontWeight: 'bold' }}>{item.price}</ThemedText>
        </TouchableOpacity>
    );
};

export default function ProductDetailScreen() {
    const router = useRouter(); // Khởi tạo router
    const params = useLocalSearchParams();
    const productId = params.id as string;
    
    // Tìm sản phẩm hiện tại
    const product = ALL_PRODUCTS.find(p => p.id === productId) || ALL_PRODUCTS[0]; 
    
    // Tìm các sản phẩm liên quan (cùng category, nhưng không phải chính nó)
    const relatedProducts = ALL_PRODUCTS.filter(
        p => p.categoryId === product.categoryId && p.id !== productId
    );

    const [quantity, setQuantity] = useState(1);
    const totalAmount = product.basePrice * quantity;

    const handleAddToCart = () => {
        Alert.alert(
            "Thêm vào Giỏ hàng", 
            `Đã thêm ${quantity} x ${product.name} vào giỏ hàng. Tổng tiền: ${totalAmount.toLocaleString('vi-VN')} đ`
        );
        // Logic thực tế: Gửi dữ liệu giỏ hàng lên Firestore
    };
    
    // Nút quay lại tùy chỉnh (nếu header bị ẩn)
    const handleGoBack = () => {
        router.back();
    };

    return (
        <ThemedView style={styles.container}>
            {/* THAY ĐỔI: Đảm bảo headerShown không bị tắt trong _layout.tsx
               và tùy chỉnh title. */}
            <Stack.Screen options={{ 
                title: product.name, 
                headerTitleStyle: { fontWeight: 'bold' },
                // Thường thì nút quay lại sẽ tự động có, nhưng nếu bị tắt, 
                // chúng ta sẽ bật lại bằng cách không tắt Header trong Root Layout.
                // Nếu bạn muốn nút tùy chỉnh, bạn có thể thêm:
                // headerLeft: () => (
                //    <TouchableOpacity onPress={handleGoBack} style={{ marginLeft: 10 }}>
                //        <ThemedText style={{fontSize: 24, color: ACCENT_COLOR }}>&#x25C0;</ThemedText> 
                //    </TouchableOpacity>
                // )
            }} />
            
            <ScrollView showsVerticalScrollIndicator={false}>
                
                {/* Khu vực Ảnh/Icon chính */}
                <ThemedView style={styles.headerImageContainer}>
                    <ThemedText style={{ fontSize: 100, color: ACCENT_COLOR }}>{product.imagePlaceholder}</ThemedText>
                </ThemedView>

                {/* Chi tiết Sản phẩm */}
                <ThemedView style={styles.detailsContainer}>
                    <ThemedText type="title" style={styles.productTitle}>{product.name}</ThemedText>
                    
                    <ThemedView style={styles.ratingRow}>
                        <ThemedText style={styles.ratingStar}>⭐</ThemedText> 
                        <ThemedText style={styles.ratingText}>{product.rating} / 5.0 (150 đánh giá)</ThemedText>
                    </ThemedView>
                    
                    <ThemedText style={styles.descriptionHeader}>Mô tả</ThemedText>
                    <ThemedText style={styles.descriptionText}>{product.description}</ThemedText>
                    
                    {/* Tùy chọn (Size, Đường, Đá) - Giả lập */}
                    <ThemedText style={styles.descriptionHeader}>Tùy chọn</ThemedText>
                    <ThemedText style={styles.infoText}>Size M (Mặc định)</ThemedText>
                    <ThemedText style={styles.infoText}>Đường 100% | Đá 70%</ThemedText>

                </ThemedView>
                
                {/* Sản phẩm Liên quan */}
                <ThemedText style={styles.sectionHeader}>Sản Phẩm Liên Quan</ThemedText>
                <FlatList
                    data={relatedProducts}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <ProductCardItem item={item} />}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.relatedList}
                />

            </ScrollView>

            {/* Footer - Nút Thêm vào Giỏ hàng */}
            <ThemedView style={styles.footer}>
                <ThemedView style={styles.quantityControl}>
                    <TouchableOpacity 
                        style={styles.qtyButton} 
                        onPress={() => setQuantity(q => Math.max(1, q - 1))}
                    >
                        <ThemedText style={styles.qtyButtonText}>-</ThemedText>
                    </TouchableOpacity>
                    <ThemedText style={styles.qtyText}>{quantity}</ThemedText>
                    <TouchableOpacity 
                        style={styles.qtyButton} 
                        onPress={() => setQuantity(q => q + 1)}
                    >
                        <ThemedText style={styles.qtyButtonText}>+</ThemedText>
                    </TouchableOpacity>
                </ThemedView>

                <TouchableOpacity 
                    style={[styles.addButtonFooter, { backgroundColor: ACCENT_COLOR }]}
                    onPress={handleAddToCart}
                >
                    <ThemedText style={styles.totalPriceText}>
                        {(totalAmount).toLocaleString('vi-VN')} đ
                    </ThemedText>
                    <ThemedText style={styles.addButtonFooterText}>Thêm vào Giỏ hàng</ThemedText>
                </TouchableOpacity>
            </ThemedView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    // --- Header & Details ---
    headerImageContainer: {
        width: '100%',
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: PRIMARY_COLOR + '20',
    },
    detailsContainer: {
        padding: 20,
        backgroundColor: Colors.light.background,
    },
    productTitle: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    ratingStar: {
        fontSize: 16,
        marginRight: 5,
    },
    ratingText: {
        color: '#999',
        fontSize: 14,
    },
    descriptionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 5,
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#555',
    },
    infoText: {
        fontSize: 14,
        color: '#777',
        marginLeft: 10,
    },
    // --- Related Products ---
    sectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 15,
    },
    relatedList: {
        paddingHorizontal: 20,
        gap: 15,
        paddingBottom: 20,
    },
    relatedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#F0F0F0',
        width: width * 0.7,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    relatedName: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        fontWeight: '600',
    },
    // --- Footer ---
    footer: {
        flexDirection: 'row',
        padding: 15,
        borderTopWidth: 1,
        borderColor: '#EFEFEF',
        backgroundColor: Colors.light.background,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0E0E0',
        borderRadius: 10,
        overflow: 'hidden',
    },
    qtyButton: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: PRIMARY_COLOR,
    },
    qtyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    qtyText: {
        paddingHorizontal: 15,
        fontWeight: 'bold',
        fontSize: 16,
    },
    addButtonFooter: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    totalPriceText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 10,
    },
    addButtonFooterText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});