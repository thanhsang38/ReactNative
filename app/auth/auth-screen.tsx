import React, { useState } from 'react';
import { 
    StyleSheet, TextInput, TouchableOpacity, Image, Dimensions, 
    ImageBackground, SafeAreaView, ScrollView, Alert // Import Alert
} from 'react-native';
import { BlurView } from 'expo-blur'; 
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router'; // Import useRouter để điều hướng

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Màu chủ đạo cho app bán nước uống (Giữ nguyên)
const PRIMARY_COLOR = '#4FC3F7'; // xanh ngọc mát lạnh
const ACCENT_COLOR = '#0288D1';  // xanh dương đậm

// Chiều rộng Card
const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

// Component Tab/Toggle
const ToggleButton = ({ active, onPress, title }: { active: boolean, onPress: () => void, title: string }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.toggleButton,
                active ? { backgroundColor: PRIMARY_COLOR } : styles.toggleInactive,
            ]}
        >
            <ThemedText 
                style={[
                    styles.toggleText, 
                    active ? { color: '#fff' } : { color: PRIMARY_COLOR }
                ]}
            >
                {title}
            </ThemedText>
        </TouchableOpacity>
    );
};

// Component Form Đăng nhập
const LoginForm = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = () => {
        setError('');
        if (!email || !password) {
            setError('Vui lòng điền đầy đủ Email và Mật khẩu.');
            return;
        }
        
        // --- LOGIC XÁC THỰC GIẢ LẬP ---
        if (email === 'sang@gmail.com' && password === '123456') {
            Alert.alert('Thành công', 'Đăng nhập thành công! Chuyển hướng đến trang chủ.');
            // Đăng nhập thành công: Chuyển đến Trang chủ
            router.replace('/(tabs)'); 
        } else {
            setError('Sai Email hoặc Mật khẩu. Vui lòng thử lại.');
        }
    };

    return (
        <>
            <ThemedText style={[styles.title, styles.whiteText, { fontFamily: Fonts.rounded }]}>Đăng Nhập</ThemedText>
            
            {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

            <TextInput
                style={[styles.input, styles.inputStyle]}
                placeholder="Email"
                placeholderTextColor="#FFFFFFCC"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={[styles.input, styles.inputStyle]}
                placeholder="Mật khẩu"
                placeholderTextColor="#FFFFFFCC"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TouchableOpacity style={[styles.button, { backgroundColor: ACCENT_COLOR }]} onPress={handleLogin}>
                <ThemedText style={styles.buttonText}>Đăng Nhập</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.forgotPassword}>
                <ThemedText type="default" style={[styles.whiteText, { fontSize: 14, textDecorationLine: 'underline' }]}>Quên mật khẩu?</ThemedText>
            </TouchableOpacity>
        </>
    );
};

// Component Form Đăng ký
// THAY ĐỔI: Nhận prop onRegistrationSuccess
const RegisterForm = ({ onRegistrationSuccess }: { onRegistrationSuccess: () => void }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleRegister = () => {
        setError('');
        if (!username || !email || !password || !confirmPassword) {
            setError('Vui lòng điền đầy đủ các trường.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }
        
        // ĐĂNG KÝ THÀNH CÔNG: Gọi callback để chuyển trạng thái về Login
        onRegistrationSuccess();
    };

    return (
        <>
            <ThemedText style={[styles.title, styles.whiteText, { fontFamily: Fonts.rounded }]}>Đăng Ký</ThemedText>

            {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

            <TextInput
                style={[styles.input, styles.inputStyle]}
                placeholder="Tên đăng nhập"
                placeholderTextColor="#FFFFFFCC"
                value={username}
                onChangeText={setUsername}
            />
            <TextInput
                style={[styles.input, styles.inputStyle]}
                placeholder="Email"
                placeholderTextColor="#FFFFFFCC"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={[styles.input, styles.inputStyle]}
                placeholder="Mật khẩu"
                placeholderTextColor="#FFFFFFCC"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TextInput
                style={[styles.input, styles.inputStyle]}
                placeholder="Xác nhận mật khẩu"
                placeholderTextColor="#FFFFFFCC"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />
            <TouchableOpacity style={[styles.button, { backgroundColor: ACCENT_COLOR }]} onPress={handleRegister}>
                <ThemedText style={styles.buttonText}>Đăng Ký</ThemedText>
            </TouchableOpacity>
        </>
    );
};

// Màn hình chính
export default function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);

    const handleRegistrationSuccess = () => {
        // Đã sửa: Hiện thông báo và chuyển về form Login
        Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập bằng tài khoản vừa tạo.');
        setIsLogin(true); // Chuyển về form Login
    };

    const cardBgColor = 'rgba(0,0,0,0.75)'; 
    const inputBgColor = 'rgba(255,255,255,0.1)'; 
    const inputBorderColor = 'rgba(255,255,255,0.3)';

    return (
        <ImageBackground
            source={require('@/assets/images/icon.png')} 
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <BlurView intensity={60} tint={'dark'} style={StyleSheet.absoluteFill}> 
                
                <SafeAreaView style={styles.safeArea}>
                    
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <ThemedView style={[styles.card, { backgroundColor: cardBgColor }]}>
                            
                            {/* Logo: Dùng tintColor để đảm bảo logo là màu trắng nổi bật */}
                            <Image
                                source={require('@/assets/images/icon.png')}
                                style={[styles.logo]} 
                                resizeMode="contain"
                            />

                            {/* Thanh Toggle (Tab nhỏ) */}
                            <ThemedView style={[styles.toggleContainer, { 
                                borderColor: 'rgba(255,255,255,0.3)',
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            }]}>
                                <ToggleButton 
                                    title="Đăng Nhập" 
                                    active={isLogin} 
                                    onPress={() => setIsLogin(true)} 
                                />
                                <ToggleButton 
                                    title="Đăng Ký" 
                                    active={!isLogin} 
                                    onPress={() => setIsLogin(false)} 
                                />
                            </ThemedView>

                            {/* Hiển thị Form tương ứng */}
                            {/* THAY ĐỔI: Truyền prop onRegistrationSuccess */}
                            {isLogin ? <LoginForm /> : <RegisterForm onRegistrationSuccess={handleRegistrationSuccess} />}
                            
                        </ThemedView>
                    </ScrollView>
                </SafeAreaView>
                
                <StatusBar style="light" />
            </BlurView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    whiteText: {
        color: '#fff',
    },
    errorText: {
        color: '#FFD700', // Màu vàng cảnh báo
        marginBottom: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1, 
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    card: {
        width: CARD_WIDTH,
        maxWidth: 400,
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 15,
    },
    toggleContainer: {
        flexDirection: 'row',
        width: '100%',
        marginBottom: 30,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleInactive: {
        backgroundColor: 'transparent',
    },
    toggleText: {
        fontSize: 16,
        fontWeight: '600',
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 50,
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    inputStyle: { // Style gộp lại cho dễ quản lý
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: '#fff',
        borderColor: 'rgba(255,255,255,0.3)',
        borderWidth: 1,
    },
    button: {
        width: '100%',
        height: 55,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        paddingVertical: 5,
    }
});