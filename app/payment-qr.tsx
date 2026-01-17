import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "../context/AuthContext";
import { updatePaymentMethodToCash } from "./services/baserowApi";
import { listenOrderUpdates } from "./services/orderRealtime";

const { width } = Dimensions.get("window");

const COLORS = {
  emerald600: "#059669",
  slate800: "#1e293b",
  slate600: "#475569",
  white: "#ffffff",
  bg: "#f8fafc",
  amber50: "#fffbeb",
  amber700: "#b45309",
  red600: "#dc2626",
};

export default function PaymentQRPage() {
  const router = useRouter();
  const { orderId, total } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const description = `DH${orderId}`;
  const cleanTotal = Math.floor(Number(total));
  const qrUrl = `https://qr.sepay.vn/img?bank=MB&acc=0398617329&template=compact&amount=${cleanTotal}&des=${description}&t=${Date.now()}`;

  useEffect(() => {
    if (!orderId || !user?.id) return;

    const stopListening = listenOrderUpdates(Number(user.id), (data) => {
      const isCorrectOrder = String(data.orderId) === String(orderId);
      const isProcessed =
        data.status === "pending" || data.status === "completed";

      if (isCorrectOrder && isProcessed) {
        router.replace("/(tabs)/orders");
      }
    });

    return () => {
      if (stopListening) stopListening();
    };
  }, [orderId, user?.id]);

  // 💡 HÀM XỬ LÝ KHI KHÁCH MUỐN THOÁT
  const handleGoBack = () => {
    Alert.alert(
      "Xác nhận thoát",
      "Nếu bạn đã chuyển khoản, vui lòng đợi trong giây lát. Bạn vẫn muốn quay lại chứ?",
      [
        { text: "Ở lại", style: "cancel" },
        {
          text: "Thoát",
          onPress: () =>
            router.replace({
              pathname: "/order-detail",
              params: { id: orderId },
            }),
        },
      ]
    );
  };
  const handleChangeToCash = async () => {
    setLoading(true);
    // Gọi hàm API vừa viết
    const result = await updatePaymentMethodToCash(Number(orderId));

    if (result.success) {
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã chuyển sang thanh toán tiền mặt.",
      });
      // Đưa khách về trang chi tiết đơn hàng
      router.replace({
        pathname: "/order-detail",
        params: { id: orderId },
      });
    } else {
      Alert.alert("Lỗi", result.message);
      setLoading(false);
    }
  };
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 💡 NÚT BACK Ở GÓC TRÊN */}
      <TouchableOpacity style={styles.backHeader} onPress={handleGoBack}>
        <Feather name="arrow-left" size={24} color={COLORS.slate800} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Thanh toán đơn hàng</Text>
        <Text style={styles.subtitle}>
          Hệ thống sẽ tự động xác nhận khi bạn hoàn tất chuyển khoản
        </Text>
      </View>

      <View style={styles.qrCard}>
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.emerald600} />
          </View>
        )}
        <Image
          source={{
            uri: qrUrl,
            method: "GET",
            headers: { Pragma: "no-cache" },
          }}
          style={styles.qrImage}
          onLoadEnd={() => setLoading(false)}
        />

        <View style={styles.divider} />

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số tiền</Text>
            <Text style={styles.amountText}>
              {Number(total).toLocaleString("vi-VN")}đ
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nội dung</Text>
            <Text style={styles.descText}>{description}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statusBox}>
        <ActivityIndicator size="small" color={COLORS.emerald600} />
        <Text style={styles.statusText}>Đang chờ xác nhận thanh toán...</Text>
      </View>

      {/* 💡 NÚT THAY ĐỔI PHƯƠNG THỨC */}
      <TouchableOpacity
        style={styles.changeMethodButton}
        onPress={handleChangeToCash}
      >
        <Text style={styles.changeMethodText}>
          Thanh toán bằng Tiền mặt khi nhận hàng
        </Text>
      </TouchableOpacity>

      <View style={styles.warningBox}>
        <Feather name="alert-triangle" size={20} color={COLORS.amber700} />
        <View style={{ flex: 1 }}>
          <Text style={styles.warningText}>
            Vui lòng{" "}
            <Text style={{ fontWeight: "bold" }}>không thay đổi nội dung</Text>{" "}
            chuyển khoản để đơn hàng được duyệt tự động.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, alignItems: "center", paddingTop: 40 },
  backHeader: { alignSelf: "flex-start", marginBottom: 20, padding: 5 },
  header: { alignItems: "center", marginBottom: 25 },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.slate800 },
  subtitle: {
    fontSize: 14,
    color: COLORS.slate600,
    textAlign: "center",
    marginTop: 5,
  },
  qrCard: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 24,
    width: "100%",
    alignItems: "center",
    elevation: 4,
  },
  qrImage: { width: width * 0.65, height: width * 0.65, resizeMode: "contain" },
  loaderContainer: { position: "absolute", top: 100 },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 20,
  },
  infoBox: { width: "100%", gap: 10 },
  infoRow: { flexDirection: "row", justifyContent: "space-between" },
  infoLabel: { color: COLORS.slate600 },
  amountText: { fontSize: 18, fontWeight: "bold", color: COLORS.emerald600 },
  descText: { fontSize: 18, fontWeight: "bold", color: COLORS.slate800 },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    gap: 10,
  },
  statusText: { color: COLORS.slate600, fontStyle: "italic" },
  changeMethodButton: { marginTop: 15, padding: 10 },
  changeMethodText: {
    color: COLORS.emerald600,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  warningBox: {
    flexDirection: "row",
    backgroundColor: COLORS.amber50,
    padding: 15,
    borderRadius: 12,
    marginTop: 25,
    gap: 10,
  },
  warningText: { fontSize: 13, color: "#92400e", lineHeight: 18 },
});
