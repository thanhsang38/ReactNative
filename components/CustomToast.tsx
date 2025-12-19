import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { BaseToastProps } from "react-native-toast-message";

type Variant = "success" | "error";

const COLORS = {
  successFrom: "#10b981",
  successTo: "#0d9488",

  errorFrom: "#ef4444",
  errorTo: "#b91c1c",

  white: "#ffffff",
  subText: "rgba(255,255,255,0.85)",
};
type CustomToastProps = BaseToastProps & {
  // 👇 runtime CÓ, TS không biết → mình khai báo
  props: {
    variant: Variant;
  };
};
const CustomToast = (rawProps: BaseToastProps) => {
  const props = rawProps as CustomToastProps; // 👈 ÉP KIỂU 1 LẦN DUY NHẤT

  const isError = props.props?.variant === "error";
  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutDown.duration(200)}
      style={styles.wrapper}
    >
      <LinearGradient
        colors={
          isError
            ? [COLORS.errorFrom, COLORS.errorTo]
            : [COLORS.successFrom, COLORS.successTo]
        }
        style={styles.container}
      >
        <View
          style={[
            styles.icon,
            { backgroundColor: isError ? "#fff1f2" : "#ecfdf5" },
          ]}
        >
          <Feather
            name={isError ? "x" : "check"}
            size={18}
            color={isError ? COLORS.errorFrom : COLORS.successFrom}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{props.text1}</Text>
          {props.text2 && <Text style={styles.message}>{props.text2}</Text>}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export const toastConfig = {
  custom: CustomToast,
};

const styles = StyleSheet.create({
  wrapper: {
    width: "92%",
    borderRadius: 16,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
  },

  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
  },

  iconSuccess: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  iconError: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff1f2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  textContainer: {
    flex: 1,
  },

  title: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },

  message: {
    color: COLORS.subText,
    fontSize: 13,
    marginTop: 2,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
});
