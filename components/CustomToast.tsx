// components/CustomToast.tsx

import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { BaseToast, BaseToastProps } from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

const COLORS = {
  white: "#ffffff",
  slate100: "#f1f5f9",
  emerald500: "#10b981",
  emerald600: "#059669",
  teal600: "#0d9488",
  slate800: "#1e293b",
};

// 💡 Định nghĩa Toast Component tùy chỉnh
const SuccessToast = (props: BaseToastProps) => (
  <View style={styles.base}>
    <LinearGradient
      colors={[COLORS.emerald600, COLORS.teal600]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBackground}
    >
      <View style={styles.contentContainer}>
        <Feather name="check-circle" size={20} color={COLORS.white} />
        <View style={styles.textContainer}>
          <Text style={styles.text1}>{props.text1}</Text>
          {props.text2 && <Text style={styles.text2}>{props.text2}</Text>}
        </View>
      </View>
    </LinearGradient>
  </View>
);

// 💡 Object cấu hình Toast tùy chỉnh
export const toastConfig = {
  success_custom: SuccessToast,
};

const styles = StyleSheet.create({
  base: {
    width: "90%",
    borderRadius: 12,
    overflow: "hidden",
    // Tăng shadow để nổi bật
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  gradientBackground: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  textContainer: {
    flex: 1,
  },
  text1: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 14,
  },
  text2: {
    color: COLORS.slate100,
    fontSize: 12,
    marginTop: 2,
  },
});
