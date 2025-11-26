import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';

const ACCENT_COLOR = '#0288D1';

interface ProfileItemProps {
    title: string;
    value?: string;
    onPress?: () => void;
    isButton?: boolean;
}

// Component hiển thị một mục thông tin
const ProfileItem = ({ title, value, onPress, isButton = false }: ProfileItemProps) => (
    <TouchableOpacity 
        style={[styles.itemContainer, isButton && styles.buttonItem]} 
        onPress={onPress} 
        disabled={!onPress}
    >
        <ThemedText style={styles.itemTitle}>{title}</ThemedText>
        {value && <ThemedText style={styles.itemValue}>{value}</ThemedText>}
        {isButton && <ThemedText style={{ color: ACCENT_COLOR, fontWeight: 'bold' }}>Tiếp theo &gt;</ThemedText>}
    </TouchableOpacity>
);

export default function ProfileScreen() {
    
    // Dữ liệu giả lập
    const USER_DATA = {
        name: "Nguyễn Văn A",
        email: "user@drinkshop.com",
        phone: "090xxxx999",
        address: "123 Đường Bán Nước, Quận 1, HCM",
    };

    const handleLogout = () => {
        // Logic đăng xuất thực tế sẽ xóa token và điều hướng về /auth
        Alert.alert(
            "Xác nhận Đăng xuất",
            "Bạn có chắc chắn muốn đăng xuất?",
            [
                { text: "Hủy", style: 'cancel' },
                { text: "Đăng xuất", style: 'destructive', onPress: () => {
                    // router.replace('/auth/auth-screen'); 
                    Alert.alert("Thông báo", "Đã đăng xuất (Logic điều hướng bị giả lập)");
                }},
            ]
        );
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                
                <ThemedText type="title" style={styles.title}>Thông Tin Cá Nhân 👤</ThemedText>
                
                {/* Khu vực Thông tin cơ bản */}
                <ThemedText style={styles.sectionHeader}>Thông Tin Tài Khoản</ThemedText>
                <ThemedView style={styles.card}>
                    <ProfileItem title="Họ và Tên" value={USER_DATA.name} />
                    <ProfileItem title="Email" value={USER_DATA.email} />
                    <ProfileItem title="Số điện thoại" value={USER_DATA.phone} />
                </ThemedView>

                {/* Khu vực Địa chỉ */}
                <ThemedText style={styles.sectionHeader}>Địa Chỉ Giao Hàng</ThemedText>
                <ThemedView style={styles.card}>
                    <ProfileItem 
                        title="Địa chỉ chính" 
                        value={USER_DATA.address} 
                        onPress={() => Alert.alert("Địa chỉ", "Mở màn hình quản lý địa chỉ")}
                        isButton
                    />
                </ThemedView>

                {/* Khu vực Cài đặt & Hỗ trợ */}
                <ThemedText style={styles.sectionHeader}>Cài Đặt & Hỗ Trợ</ThemedText>
                <ThemedView style={styles.card}>
                    <ProfileItem title="Lịch sử đơn hàng" onPress={() => Alert.alert("Điều hướng", "Chuyển đến tab Đơn hàng")} isButton />
                    <ProfileItem title="Đổi mật khẩu" onPress={() => Alert.alert("Chức năng", "Mở màn hình đổi mật khẩu")} isButton />
                    <ProfileItem title="Phản hồi & Hỗ trợ" onPress={() => Alert.alert("Chức năng", "Mở màn hình hỗ trợ")} isButton />
                </ThemedView>

                {/* Nút Đăng xuất */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <ThemedText style={styles.logoutText}>Đăng Xuất</ThemedText>
                </TouchableOpacity>

            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 15,
        paddingTop: 50,
        backgroundColor: Colors.light.background,
    },
    title: {
        marginBottom: 20,
        textAlign: 'center',
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        color: ACCENT_COLOR,
    },
    card: {
        borderRadius: 10,
        marginBottom: 10,
        paddingHorizontal: 15,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    buttonItem: {
        // Tùy chỉnh cho mục có nút nhấn
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    itemValue: {
        fontSize: 16,
        color: '#666',
    },
    logoutButton: {
        marginTop: 30,
        marginBottom: 50,
        padding: 15,
        borderRadius: 10,
        backgroundColor: '#F44336', // Màu đỏ nổi bật
        alignItems: 'center',
    },
    logoutText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    }
});