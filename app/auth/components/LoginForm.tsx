import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Checkbox from "expo-checkbox";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

// IMPORT AUTH
import { useAuth } from "../../../context/AuthContext";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const COLORS = {
  primary: "#059669",
  secondary: "#14b8a6",
  text: "#374151",
  placeholder: "#9ca3af",
  border: "#e5e7eb",
  error: "#ef4444",
  background: "#fff",
};

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const { signIn, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMeValue = watch("rememberMe");

  // ============================================================
  // 🔥 LOAD EMAIL + PASSWORD IF SAVED
  // ============================================================
  useEffect(() => {
    const loadSavedLogin = async () => {
      try {
        const saved = await AsyncStorage.getItem("saved_login");
        if (saved) {
          const parsed = JSON.parse(saved);
          setValue("email", parsed.email);
          setValue("password", parsed.password);
          setValue("rememberMe", true);
        }
      } catch (err) {
        console.log("LOAD LOGIN ERROR", err);
      }
    };

    loadSavedLogin();
  }, []);

  // ============================================================
  // REGISTER INPUTS
  // ============================================================
  useEffect(() => {
    register("email", {
      required: "Email là bắt buộc",
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: "Email không hợp lệ",
      },
    });
    register("password", {
      required: "Mật khẩu là bắt buộc",
      minLength: {
        value: 8,
        message: "Mật khẩu phải có ít nhất 8 ký tự",
      },
    });
    register("rememberMe");
  }, [register]);

  // ============================================================
  // SUBMIT
  // ============================================================
  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setIsSubmitting(true);

    try {
      // 🔥 Gọi API đăng nhập từ AuthContext
      await signIn(data.email, data.password);

      // 🔥 Nếu rememberMe = true → lưu login
      if (data.rememberMe) {
        await AsyncStorage.setItem(
          "saved_login",
          JSON.stringify({
            email: data.email,
            password: data.password,
          })
        );
      } else {
        await AsyncStorage.removeItem("saved_login");
      }

      Toast.show({
        type: "success_custom",
        text1: "Đăng nhập thành công!",
        text2: "Chào mừng tới Drink Xann.",
      });

      setTimeout(() => {
        router.replace("/(tabs)");
      }, 800);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Đăng nhập thất bại!",
        text2: error.message || "Lỗi không xác định.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isButtonDisabled = isSubmitting || isLoading;

  // ============================================================
  // UI
  // ============================================================
  return (
    <View style={styles.container}>
      {/* EMAIL */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Email</Text>

        <View
          style={[
            styles.inputWrapper,
            errors.email && styles.inputWrapperError,
          ]}
        >
          <MaterialCommunityIcons
            name="email-outline"
            size={20}
            color={COLORS.placeholder}
            style={styles.icon}
          />

          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            placeholderTextColor={COLORS.placeholder}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={(t) => setValue("email", t, { shouldValidate: true })}
          />
        </View>

        {errors.email && (
          <Text style={styles.errorText}>{errors.email.message}</Text>
        )}
      </View>

      {/* PASSWORD */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Mật khẩu</Text>

        <View
          style={[
            styles.inputWrapper,
            errors.password && styles.inputWrapperError,
          ]}
        >
          <MaterialCommunityIcons
            name="lock-outline"
            size={20}
            color={COLORS.placeholder}
            style={styles.icon}
          />

          <TextInput
            style={[styles.input, { paddingRight: 50 }]}
            placeholder="••••••••"
            placeholderTextColor={COLORS.placeholder}
            secureTextEntry={!showPassword}
            onChangeText={(t) =>
              setValue("password", t, { shouldValidate: true })
            }
          />

          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <MaterialCommunityIcons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={COLORS.placeholder}
            />
          </TouchableOpacity>
        </View>

        {errors.password && (
          <Text style={styles.errorText}>{errors.password.message}</Text>
        )}
      </View>

      {/* REMEMBER ME */}
      <View style={styles.checkboxRow}>
        <View style={styles.checkboxContainer}>
          <Checkbox
            value={rememberMeValue}
            onValueChange={(val) =>
              setValue("rememberMe", val, { shouldValidate: true })
            }
            color={COLORS.primary}
            style={styles.checkbox}
          />
          <Text style={styles.checkboxLabel}>Ghi nhớ</Text>
        </View>
      </View>

      {/* SUBMIT */}
      <TouchableOpacity
        style={[styles.submitButton, isButtonDisabled && { opacity: 0.6 }]}
        onPress={handleSubmit(onSubmit)}
        disabled={isButtonDisabled}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitButtonText}>Đăng nhập</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ============================
// STYLES (KHÔNG ĐỔI)
// ============================
const styles = StyleSheet.create({
  container: {
    padding: 0,
    backgroundColor: COLORS.background,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    paddingVertical: Platform.OS === "ios" ? 14 : 0,
    paddingHorizontal: 10,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
    backgroundColor: "#fee2e24d",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    height: Platform.OS === "android" ? 50 : undefined,
  },
  eyeButton: {
    padding: 10,
    position: "absolute",
    right: 5,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 4,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    marginRight: 8,
    borderRadius: 4,
    width: 20,
    height: 20,
  },
  checkboxLabel: {
    color: COLORS.text,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 8,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
