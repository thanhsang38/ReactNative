import React, { useState, useEffect } from 'react'; 
import { 
    StyleSheet, FlatList, TouchableOpacity, Dimensions, Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router'; // Import hooks Expo Router
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Màu chủ đạo
const ACCENT_COLOR = '#0288D1';
const PRIMARY_COLOR = '#4FC3F7';

interface CartItem {
    id: string;
    name: string;
    price: string;
    basePrice: number;
    quantity: number;
    imagePlaceholder: string;
}

export default function CartScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    
    // Tính tổng tiền
    const totalAmount = cartItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);

    // Lấy dữ liệu giỏ hàng từ Home Screen
    useEffect(() => {
        if (params.cartData) {
            try {
                const rawData = JSON.parse(params.cartData as string);
                
                // Nhóm các mục giống nhau và tính số lượng
                const groupedItems: { [id: string]: CartItem } = {};
                rawData.forEach((item: any) => {
                    // Kiểm tra và khởi tạo price string
                    if (!item.price) {
                        item.price = item.basePrice.toLocaleString('vi-VN') + ' đ';
                    }
                    
                    if (groupedItems[item.id]) {
                        groupedItems[item.id].quantity += 1;
                    } else {
                        groupedItems[item.id] = { ...item, quantity: 1 };
                    }
                });
                setCartItems(Object.values(groupedItems));
            } catch (e) {
                console.error("Failed to parse cart data:", e);
            }
        }
    }, [params.cartData]);

    const handleQuantityChange = (id: string, newQuantity: number) => {
        setCartItems(prevItems => {
            const updatedItems = prevItems.map(item =>
                item.id === id ? { ...item, quantity: newQuantity } : item
            ).filter(item => item.quantity > 0);
            return updatedItems;
        });
    };

    const handlePlaceOrder = () => {
        if (cartItems.length === 0) {
            Alert.alert("Thông báo", "Giỏ hàng của bạn đang trống!");
            return;
        }

        // THAY ĐỔI: Điều hướng đến màn hình Checkout và truyền dữ liệu
        // Dữ liệu được truyền đến app/checkout.tsx
        router.push({
            pathname: '/checkout',
            params: { 
                cartData: JSON.stringify(cartItems),
                total: totalAmount.toString() // Truyền tổng tiền để tính lại phí vận chuyển ở màn hình Checkout
            }
        });
    };

    const renderItem = ({ item }: { item: CartItem }) => (
        <ThemedView style={styles.cartItem}>
            <ThemedText style={{ fontSize: 30, marginRight: 15 }}>{item.imagePlaceholder}</ThemedText>
            
            <ThemedView style={styles.itemDetails}>
                <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.name}</ThemedText>
                <ThemedText style={{ color: ACCENT_COLOR }}>{(item.basePrice * item.quantity).toLocaleString('vi-VN')} đ</ThemedText>
            </ThemedView>

            <ThemedView style={styles.quantityControl}>
                <TouchableOpacity 
                    style={styles.qtyButton} 
                    onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
                >
                    <ThemedText style={styles.qtyButtonText}>-</ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.qtyText}>{item.quantity}</ThemedText>
                <TouchableOpacity 
                    style={styles.qtyButton} 
                    onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
                >
                    <ThemedText style={styles.qtyButtonText}>+</ThemedText>
                </TouchableOpacity>
            </ThemedView>
        </ThemedView>
    );

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.title}>Giỏ Hàng Của Bạn 🛒</ThemedText>
            
            {cartItems.length === 0 ? (
                <ThemedText style={styles.emptyText}>Giỏ hàng đang trống.</ThemedText>
            ) : (
                <FlatList
                    data={cartItems}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}

            <ThemedView style={styles.footer}>
                <ThemedView style={styles.totalRow}>
                    <ThemedText type="subtitle">Tổng cộng:</ThemedText>
                    <ThemedText type="title" style={{ color: ACCENT_COLOR }}>
                        {totalAmount.toLocaleString('vi-VN')} đ
                    </ThemedText>
                </ThemedView>

                <TouchableOpacity 
                    style={[styles.checkoutButton, { backgroundColor: ACCENT_COLOR }]}
                    onPress={handlePlaceOrder}
                >
                    <ThemedText style={styles.checkoutButtonText}>Đặt Hàng</ThemedText>
                </TouchableOpacity>
            </ThemedView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 15,
        paddingTop: 50,
        backgroundColor: '#FFFFFF', // Buộc Light Mode
    },
    title: {
        marginBottom: 20,
        textAlign: 'center',
    },
    list: {
        paddingBottom: 20,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
    },
    // --- Cart Item Style ---
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        backgroundColor: '#FFFFFF', // Nền sáng
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    itemDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0E0E0',
        borderRadius: 20,
        marginLeft: 15,
        overflow: 'hidden',
    },
    qtyButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: PRIMARY_COLOR,
    },
    qtyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    qtyText: {
        paddingHorizontal: 12,
        fontWeight: 'bold',
    },
    // --- Footer & Checkout ---
    footer: {
        paddingVertical: 20,
        borderTopWidth: 1,
        borderColor: '#E0E0E0',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        alignItems: 'center',
    },
    checkoutButton: {
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: ACCENT_COLOR,
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 3,
    },
    checkoutButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    }
});