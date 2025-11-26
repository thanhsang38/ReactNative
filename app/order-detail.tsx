import React from 'react';
import { StyleSheet, ScrollView, FlatList, Alert, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

const ACCENT_COLOR = '#0288D1';

// Dữ liệu giả lập chi tiết đơn hàng
const DUMMY_DETAIL = {
    orderId: 'o1',
    date: '2025-11-25',
    status: 'Đã hoàn thành',
    total: 150000,
    shippingFee: 15000,
    discount: 5000,
    items: [
        { name: 'Latte Hạnh Nhân (L)', price: 55000, qty: 2, placeholder: '🥛' },
        { name: 'Trà Dâu Tây (M)', price: 40000, qty: 1, placeholder: '🍓' },
    ],
    address: '123 Đường Bán Nước, Quận 1, HCM',
};

// Component hiển thị một sản phẩm trong đơn hàng
const OrderItemRow = ({ item }: { item: typeof DUMMY_DETAIL.items[0] }) => (
    <ThemedView style={styles.itemRow}>
        <ThemedText style={styles.itemQty}>{item.qty}x</ThemedText>
        <ThemedText style={styles.itemPlaceholder}>{item.placeholder}</ThemedText>
        <ThemedText style={styles.itemName}>{item.name}</ThemedText>
        <ThemedText style={styles.itemPrice}>{(item.price * item.qty).toLocaleString('vi-VN')} đ</ThemedText>
    </ThemedView>
);

export default function OrderDetailScreen() {
    const params = useLocalSearchParams();
    const orderId = params.id || DUMMY_DETAIL.orderId;

    // Cần phải có Stack.Screen trong file _layout.tsx gốc để màn hình này hiển thị đúng header
    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: `Đơn hàng #${orderId}` }} />
            <ScrollView showsVerticalScrollIndicator={false}>
                
                {/* 1. Trạng thái Đơn hàng */}
                <ThemedView style={[styles.card, styles.statusCard, { backgroundColor: ACCENT_COLOR }]}>
                    <ThemedText style={styles.statusTitle}>Trạng Thái:</ThemedText>
                    <ThemedText style={styles.statusValue}>{DUMMY_DETAIL.status}</ThemedText>
                    <ThemedText style={styles.dateText}>Ngày đặt: {DUMMY_DETAIL.date}</ThemedText>
                </ThemedView>

                {/* 2. Chi tiết Sản phẩm */}
                <ThemedText style={styles.sectionHeader}>Sản Phẩm Đã Đặt</ThemedText>
                <ThemedView style={styles.card}>
                    {DUMMY_DETAIL.items.map((item, index) => (
                        <OrderItemRow key={index} item={item} />
                    ))}
                </ThemedView>

                {/* 3. Địa chỉ và Thanh toán */}
                <ThemedText style={styles.sectionHeader}>Thông Tin Giao Hàng & Thanh Toán</ThemedText>
                <ThemedView style={styles.card}>
                    <ThemedText style={styles.infoTitle}>Địa chỉ nhận hàng:</ThemedText>
                    <ThemedText style={styles.infoValue}>{DUMMY_DETAIL.address}</ThemedText>
                    
                    <ThemedView style={styles.priceRow}>
                        <ThemedText>Tổng tiền hàng:</ThemedText>
                        <ThemedText>{(DUMMY_DETAIL.total - DUMMY_DETAIL.shippingFee + DUMMY_DETAIL.discount).toLocaleString('vi-VN')} đ</ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.priceRow}>
                        <ThemedText>Phí vận chuyển:</ThemedText>
                        <ThemedText>{DUMMY_DETAIL.shippingFee.toLocaleString('vi-VN')} đ</ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.priceRow}>
                        <ThemedText>Mã giảm giá:</ThemedText>
                        <ThemedText style={{ color: '#F44336' }}>- {DUMMY_DETAIL.discount.toLocaleString('vi-VN')} đ</ThemedText>
                    </ThemedView>
                    
                    <ThemedView style={styles.finalTotalRow}>
                        <ThemedText type="subtitle">TỔNG CỘNG</ThemedText>
                        <ThemedText type="title" style={{ color: ACCENT_COLOR }}>{DUMMY_DETAIL.total.toLocaleString('vi-VN')} đ</ThemedText>
                    </ThemedView>
                </ThemedView>

                <TouchableOpacity style={styles.reorderButton} onPress={() => Alert.alert("Đặt lại", "Mở giỏ hàng với các món này")}>
                    <ThemedText style={styles.reorderText}>Đặt Lại Đơn Hàng</ThemedText>
                </TouchableOpacity>

            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    card: {
        borderRadius: 10,
        marginBottom: 10,
        marginHorizontal: 15,
        padding: 15,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 10,
        marginHorizontal: 15,
    },
    // --- Status Card ---
    statusCard: {
        alignItems: 'center',
        paddingVertical: 30,
        marginTop: 15,
        backgroundColor: ACCENT_COLOR,
    },
    statusTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    statusValue: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: 'bold',
        marginVertical: 5,
    },
    dateText: {
        color: '#FFFFFF',
        fontSize: 14,
    },
    // --- Item Rows ---
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    itemQty: {
        fontSize: 14,
        fontWeight: 'bold',
        width: 30,
    },
    itemPlaceholder: {
        fontSize: 20,
        marginHorizontal: 10,
    },
    itemName: {
        flex: 1,
        fontSize: 15,
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    // --- Price & Address ---
    infoTitle: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
    infoValue: {
        color: '#666',
        marginBottom: 15,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#F7F7F7',
    },
    finalTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 10,
        marginTop: 10,
        borderTopWidth: 2,
        borderColor: ACCENT_COLOR + '50',
    },
    reorderButton: {
        marginHorizontal: 15,
        marginTop: 20,
        marginBottom: 50,
        padding: 15,
        borderRadius: 10,
        backgroundColor: ACCENT_COLOR,
        alignItems: 'center',
    },
    reorderText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    }
});