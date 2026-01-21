import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LoginForm } from "./auth/components/LoginForm";
import { RegisterForm } from "./auth/components/RegisterForm";

// Định nghĩa màu sắc (Theo Tailwind)
const COLORS = {
  BG_START: "#f8fafc",
  BG_MID: "#fff7ed",
  BG_END: "#f0fff4",
  PRIMARY: "#059669",
  SECONDARY: "#14b8a6",
  ACCENT_EMERALD: "#a7f3d0",
  ACCENT_AMBER: "#fde68a",
  ACCENT_TEAL: "#99f6e4",
  TEXT_DARK: "#1e293b",
  TEXT_MEDIUM: "#475569",
  BORDER_LIGHT: "rgba(255, 255, 255, 0.5)",
};

const ToggleButtonWithGradient = ({
  title,
  isActive,
  onPress,
}: {
  title: string;
  isActive: boolean;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.toggleButtonContainer}>
      {isActive ? (
        <LinearGradient
          colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeGradientButton}
        >
          <Text style={styles.activeButtonText}>{title}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.inactiveToggleButton}>
          <Text style={styles.inactiveButtonText}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// -----------------------------------------------------------
// 💡 CẬP NHẬT: STYLE SHEET CHÍNH
// -----------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundContainer: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    // Nếu nội dung quá ngắn, nó sẽ ở giữa. Nếu nội dung dài, nó sẽ cuộn từ đầu.
  },
  decorativeElements: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    pointerEvents: "none",
  },
  blurCircle: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.3,
  },
  blurCircleTopLeft: {
    top: 50,
    left: 10,
    width: 256,
    height: 256,
  },
  blurCircleBottomRight: {
    bottom: 50,
    right: 10,
    width: 288,
    height: 288,
  },
  blurCircleCenter: {
    top: "50%",
    left: "50%",
    width: 320,
    height: 320,
    transform: [{ translateX: -160 }, { translateY: -160 }],
  },
  mainContentWrapper: {
    // 💡 SỬA: ScrollView phải chiếm toàn bộ không gian ngang còn lại của container cha
    flex: 1,
  },
  // 💡 STYLE MỚI: Container giới hạn chiều rộng bên trong ScrollView
  contentCardWrapper: {
    width: "100%",
    maxWidth: 448, // Giữ giới hạn maxWidth
    zIndex: 10,
    paddingHorizontal: 10, // Thêm padding nhỏ để nội dung không chạm mép màn hình (chỉ áp dụng khi màn hình nhỏ hơn 448)
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  title: {
    color: COLORS.TEXT_DARK,
    fontSize: 28,
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.TEXT_MEDIUM,
    fontSize: 16,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  toggleTabsContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 6,
    marginBottom: 32,
  },
  toggleButtonContainer: {
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  activeGradientButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  inactiveToggleButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  activeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  inactiveButtonText: {
    color: COLORS.TEXT_MEDIUM,
    fontSize: 16,
    fontWeight: "600",
  },
  formsContainer: {},
  footer: {
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    color: COLORS.TEXT_MEDIUM,
    fontSize: 14,
    textAlign: "center",
  },
  footerLinkContainer: {
    marginTop: 4,
  },
  footerLink: {
    textDecorationLine: "underline",
    color: COLORS.PRIMARY,
  },
});

// -----------------------------------------------------------
// 💡 CẬP NHẬT: COMPONENT CHÍNH SỬ DỤNG STYLE MỚI
// -----------------------------------------------------------

export function AppFinal() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <LinearGradient
      colors={[COLORS.BG_START, COLORS.BG_MID, COLORS.BG_END]}
      style={styles.backgroundContainer}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.decorativeElements}>
          <View
            style={[
              styles.blurCircle,
              styles.blurCircleTopLeft,
              { backgroundColor: COLORS.ACCENT_EMERALD },
            ]}
          />
          <View
            style={[
              styles.blurCircle,
              styles.blurCircleBottomRight,
              { backgroundColor: COLORS.ACCENT_AMBER },
            ]}
          />
          <View
            style={[
              styles.blurCircle,
              styles.blurCircleCenter,
              { backgroundColor: COLORS.ACCENT_TEAL },
            ]}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          style={styles.mainContentWrapper}
          showsVerticalScrollIndicator={false}
        >
          {/* 💡 SỬA LỖI: Bọc nội dung Card bằng contentCardWrapper để giới hạn maxWidth và chiếm 100% */}
          <View style={styles.contentCardWrapper}>
            {/* Logo and Title */}
            <View style={styles.header}>
              <LinearGradient
                colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoContainer}
              >
                <Feather name="coffee" size={40} color="white" />
              </LinearGradient>
              <Text style={styles.title}>Drink Xann</Text>
              <Text style={styles.subtitle}>
                Thưởng thức từng giọt hương vị
              </Text>
            </View>

            {/* Main Card */}
            <View style={styles.card}>
              {/* Toggle Tabs */}
              <View style={styles.toggleTabsContainer}>
                <ToggleButtonWithGradient
                  title="Đăng nhập"
                  isActive={isLogin}
                  onPress={() => setIsLogin(true)}
                />
                <ToggleButtonWithGradient
                  title="Đăng ký"
                  isActive={!isLogin}
                  onPress={() => setIsLogin(false)}
                />
              </View>

              {/* Forms */}
              <View style={styles.formsContainer}>
                {isLogin ? (
                  <LoginForm />
                ) : (
                  <RegisterForm
                    onRegistrationSuccess={() => setIsLogin(true)} // 💡 Thêm dòng này!
                  />
                )}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Bằng cách tiếp tục, bạn đồng ý với
              </Text>
              <View style={styles.footerLinkContainer}>
                <Text style={styles.footerText}>
                  <Text style={styles.footerLink}>Điều khoản dịch vụ</Text> và
                  <Text style={styles.footerLink}>Chính sách bảo mật</Text>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default AppFinal;
