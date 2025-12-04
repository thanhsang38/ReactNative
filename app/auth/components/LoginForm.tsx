import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useForm, SubmitHandler } from "react-hook-form";
import { MaterialCommunityIcons, AntDesign } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";

// Định nghĩa kiểu dữ liệu cho Form
interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

// Màu sắc và hằng số
const COLORS = {
  primary: "#059669",
  secondary: "#14b8a6",
  text: "#374151",
  placeholder: "#9ca3af",
  border: "#e5e7eb",
  error: "#ef4444",
  background: "#fff",
};

// Component chính
export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter(); // 💡 KHỞI TẠO ROUTER

  type LoginFormFieldName = "email" | "password" | "rememberMe";

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

  React.useEffect(() => {
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
        value: 6,
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      },
    });
    register("rememberMe");
  }, [register]);

  const onSubmit: SubmitHandler<LoginFormData> = (data) => {
    console.log("Login data:", data);

    // 💡 ĐIỀU HƯỚNG SAU KHI ĐĂNG NHẬP THÀNH CÔNG
    Toast.show({
      type: "success_custom", // ✅ Dùng loại Toast Custom của bạn
      text1: "Đăng nhập thành công!",
      text2: `Chào mừng ${data.email} trở lại.`,
      visibilityTime: 1500,
    });

    // 💡 2. ĐIỀU HƯỚNG SAU KHI TOAST CHẠY (thường không cần setTimeout vì Toast không chặn)
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      {/* Email Field */}
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
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(text) =>
              setValue("email", text, { shouldValidate: true })
            }
          />
        </View>
        {errors.email && (
          <Text style={styles.errorText}>{errors.email.message}</Text>
        )}
      </View>

      {/* Password Field */}
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
            onChangeText={(text) =>
              setValue("password", text, { shouldValidate: true })
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

      {/* Remember Me & Forgot Password */}
      <View style={styles.checkboxRow}>
        <View style={styles.checkboxContainer}>
          <Checkbox
            value={rememberMeValue}
            onValueChange={(value) =>
              setValue("rememberMe", value, { shouldValidate: true })
            }
            color={COLORS.primary}
            style={styles.checkbox}
          />
          <Text style={styles.checkboxLabel}>Ghi nhớ</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit(onSubmit)}
      >
        <Text style={styles.submitButtonText}>Đăng nhập</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Hoặc đăng nhập với</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social Login */}
      <View style={styles.socialButtonsContainer}>
        <TouchableOpacity style={styles.socialButton}>
          <AntDesign name="google" size={24} color="#DB4437" />
          <Text style={styles.socialButtonText}>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <MaterialCommunityIcons name="facebook" size={24} color="#1877F2" />
          <Text style={styles.socialButtonText}>Facebook</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Định nghĩa Styles (Giữ nguyên)
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
    justifyContent: "space-between",
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
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    width: "auto",
    paddingHorizontal: 16,
    fontSize: 14,
    color: COLORS.placeholder,
    backgroundColor: COLORS.background,
  },
  socialButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  socialButtonText: {
    marginLeft: 10,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },
});
