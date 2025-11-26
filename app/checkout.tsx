import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';

const ACCENT_COLOR = '#0288D1';
const PRIMARY_COLOR = '#4FC3F7';

interface CartItem {
    id: string;
    name: string;
    basePrice: number;
    quantity: number;
    imagePlaceholder: string;
}

// Dữ liệu giả lập
const DUMMY_USER = {
    name: "Nguyễn Văn A",
    phone: "090xxxx999",
    address: "123 Đường Bán Nước, Quận 1, TP HCM",
};
const PAYMENT_METHODS = [
    { id: '1', name: 'Thanh toán khi nhận hàng (COD)' },
    { id: '2', name: 'Chuyển khoản Ngân hàng' },
    { id: '3', name: 'Thẻ tín dụng/ghi nợ (Visa/Master)' },
];

export default function CheckoutScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedPayment, setSelectedPayment] = useState(PAYMENT_METHODS[0].id);
    const totalAmount = parseFloat(params.total as string || '0');

    useEffect(() => {
        if (params.cartData) {
            try {
                setCartItems(JSON.parse(params.cartData as string));
            } catch (e) {
                console.error("Failed to parse cart data:", e);
                Alert.alert("Lỗi", "Không thể tải dữ liệu giỏ hàng.");
            }
        }
    }, [params.cartData]);

    const handleConfirmOrder = () => {
        if (cartItems.length === 0) return;

        // Logic thực tế: Gửi đơn hàng lên Firestore
        Alert.alert(
            "Xác nhận", 
            `Đơn hàng trị giá ${totalAmount.toLocaleString('vi-VN')} đ sẽ được thanh toán qua ${PAYMENT_METHODS.find(p => p.id === selectedPayment)?.name}.`,
            [
                { text: "Hủy", style: 'cancel' },
                { text: "Đặt hàng", onPress: () => {
                    Alert.alert("Thành công", "Đơn hàng đã được đặt và đang được xử lý!");
                    // Điều hướng về Home (hoặc Orders)
                    router.replace('/orders'); 
                }},
            ]
        );
    };
    
    // Tính tổng phụ và phí
    const subtotal = cartItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
    const shippingFee = subtotal > 100000 ? 0 : 15000;
    const finalTotal = subtotal + shippingFee;

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Xác Nhận Đơn Hàng' }} />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* 1. THÔNG TIN NGƯỜI DÙNG & ĐỊA CHỈ */}
                <ThemedText style={styles.sectionHeader}>Thông Tin Nhận Hàng</ThemedText>
                <ThemedView style={styles.card}>
                    <ThemedText type="defaultSemiBold">{DUMMY_USER.name} - {DUMMY_USER.phone}</ThemedText>
                    <ThemedText style={styles.addressText}>{DUMMY_USER.address}</ThemedText>
                    <TouchableOpacity onPress={() => Alert.alert("Chức năng", "Mở màn hình chọn địa chỉ")}>
                        <ThemedText style={[styles.linkText, { color: ACCENT_COLOR }]}>Thay đổi</ThemedText>
                    </TouchableOpacity>
                </ThemedView>

                {/* 2. CHI TIẾT SẢN PHẨM */}
                <ThemedText style={styles.sectionHeader}>Chi Tiết Đơn Hàng ({cartItems.length} món)</ThemedText>
                <ThemedView style={styles.card}>
                    {cartItems.map((item, index) => (
                        <ThemedView key={index} style={styles.itemRow}>
                            <ThemedText style={styles.itemQty}>{item.quantity}x</ThemedText>
                            <ThemedText style={styles.itemPlaceholder}>{item.imagePlaceholder}</ThemedText>
                            <ThemedText style={styles.itemName} numberOfLines={1}>{item.name}</ThemedText>
                            <ThemedText style={styles.itemPrice}>{(item.basePrice * item.quantity).toLocaleString('vi-VN')} đ</ThemedText>
                        </ThemedView>
                    ))}
                </ThemedView>

                {/* 3. PHƯƠNG THỨC THANH TOÁN */}
                <ThemedText style={styles.sectionHeader}>Phương Thức Thanh Toán</ThemedText>
                <ThemedView style={styles.card}>
                    {PAYMENT_METHODS.map(method => (
                        <TouchableOpacity 
                            key={method.id} 
                            style={styles.paymentRow}
                            onPress={() => setSelectedPayment(method.id)}
                        >
                            <ThemedText style={styles.paymentName}>{method.name}</ThemedText>
                            <ThemedView style={[styles.radio, selectedPayment === method.id && { backgroundColor: ACCENT_COLOR }]} />
                        </TouchableOpacity>
                    ))}
                </ThemedView>
                
                {/* 4. TỔNG KẾT ĐƠN HÀNG */}
                <ThemedText style={styles.sectionHeader}>Tổng Kết</ThemedText>
                <ThemedView style={styles.card}>
                    <ThemedView style={styles.priceRow}>
                        <ThemedText>Tổng tiền hàng:</ThemedText>
                        <ThemedText>{subtotal.toLocaleString('vi-VN')} đ</ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.priceRow}>
                        <ThemedText>Phí vận chuyển:</ThemedText>
                        <ThemedText style={{ color: shippingFee === 0 ? '#4CAF50' : '#F44336' }}>
                            {shippingFee === 0 ? 'Miễn phí' : shippingFee.toLocaleString('vi-VN') + ' đ'}
                        </ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.finalTotalRow}>
                        <ThemedText type="subtitle">CẦN THANH TOÁN</ThemedText>
                        <ThemedText type="title" style={{ color: ACCENT_COLOR }}>{finalTotal.toLocaleString('vi-VN')} đ</ThemedText>
                    </ThemedView>
                </ThemedView>
            </ScrollView>

            {/* Footer - Nút Xác nhận */}
            <ThemedView style={styles.footer}>
                <ThemedText type="subtitle">Tổng ({cartItems.length} món):</ThemedText>
                <TouchableOpacity 
                    style={[styles.confirmButton, { backgroundColor: ACCENT_COLOR }]}
                    onPress={handleConfirmOrder}
                >
                    <ThemedText style={styles.confirmButtonText}>Xác Nhận & Đặt Hàng</ThemedText>
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
    scrollContent: {
        paddingBottom: 100, // Để chừa chỗ cho footer
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
        marginHorizontal: 15,
        color: ACCENT_COLOR,
    },
    card: {
        borderRadius: 10,
        marginHorizontal: 15,
        padding: 15,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#EFEFEF',
    },
    // --- User Info ---
    addressText: {
        color: '#666',
        marginTop: 5,
        marginBottom: 10,
    },
    linkText: {
        fontSize: 14,
        alignSelf: 'flex-start',
    },
    // --- Item Rows ---
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F7F7F7',
    },
    itemQty: {
        fontSize: 14,
        fontWeight: 'bold',
        width: 30,
        marginRight: 10,
    },
    itemPlaceholder: {
        fontSize: 20,
        marginRight: 10,
    },
    itemName: {
        flex: 1,
        fontSize: 15,
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    // --- Payment Method ---
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F7F7F7',
    },
    paymentName: {
        fontSize: 16,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#999',
    },
    // --- Total & Footer ---
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
    },
    finalTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 10,
        marginTop: 10,
        borderTopWidth: 2,
        borderColor: ACCENT_COLOR + '50',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderTopWidth: 1,
        borderColor: '#EFEFEF',
        backgroundColor: '#FFFFFF',
    },
    confirmButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});