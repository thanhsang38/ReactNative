import React from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router'; // THÊM: Import useRouter

const ACCENT_COLOR = '#0288D1';
const PRIMARY_COLOR = '#4FC3F7';

// Dữ liệu đơn hàng giả lập
const DUMMY_ORDERS = [
    { id: 'o1', date: '2025-11-25', status: 'Đã hoàn thành', total: 150000, items: ['Latte Hạnh Nhân', 'Trà Dâu Tây'] },
    { id: 'o2', date: '2025-11-24', status: 'Đang giao hàng', total: 205000, items: ['Smoothie Xoài', 'Espresso'] },
    { id: 'o3', date: '2025-11-23', status: 'Đã hủy', total: 80000, items: ['Trà Đào'] },
];

export default function OrdersScreen() {
    const router = useRouter(); // KHỞI TẠO ROUTER
    
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Đã hoàn thành': return '#4CAF50'; // Green
            case 'Đang giao hàng': return ACCENT_COLOR; // Blue
            case 'Đã hủy': return '#F44336'; // Red
            default: return '#9E9E9E';
        }
    };

    // THAY ĐỔI: Thêm hàm điều hướng
    const handleViewDetail = (orderId: string) => {
        // Điều hướng đến màn hình chi tiết đơn hàng (order-detail.tsx)
        // và truyền orderId qua params
        router.push({
            pathname: '/order-detail',
            params: { id: orderId }
        });
    };

    const renderItem = ({ item }: { item: typeof DUMMY_ORDERS[0] }) => (
        <ThemedView style={styles.orderCard}>
            <ThemedView style={styles.headerRow}>
                <ThemedText type="defaultSemiBold">Đơn hàng #{item.id}</ThemedText>
                <ThemedText style={{ color: getStatusColor(item.status), fontWeight: 'bold' }}>{item.status}</ThemedText>
            </ThemedView>
            
            <ThemedText style={styles.dateText}>Ngày đặt: {item.date}</ThemedText>
            
            <ThemedText style={styles.totalText}>Tổng cộng: 
                <ThemedText style={{ color: ACCENT_COLOR, fontWeight: 'bold' }}> {item.total.toLocaleString('vi-VN')} đ</ThemedText>
            </ThemedText>

            <ThemedText style={styles.itemsList} numberOfLines={1}>
                Sản phẩm: {item.items.join(', ')}
            </ThemedText>

            <TouchableOpacity 
                style={[styles.detailButton, { borderColor: ACCENT_COLOR }]}
                // THAY ĐỔI: Gọi hàm điều hướng
                onPress={() => handleViewDetail(item.id)}
            >
                <ThemedText style={{ color: ACCENT_COLOR }}>Xem Chi Tiết</ThemedText>
            </TouchableOpacity>
        </ThemedView>
    );

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.title}>Lịch Sử Đơn Hàng 🧾</ThemedText>
            
            <FlatList
                data={DUMMY_ORDERS}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={() => <ThemedText style={styles.emptyText}>Chưa có đơn hàng nào.</ThemedText>}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 15,
        paddingTop: 50,
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
    orderCard: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EFEFEF',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    dateText: {
        fontSize: 13,
        color: '#666',
        marginBottom: 5,
    },
    totalText: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 5,
    },
    itemsList: {
        fontSize: 14,
        color: '#888',
        marginBottom: 10,
    },
    detailButton: {
        marginTop: 10,
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    }
});