import React, { useState, useEffect, ComponentProps } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useForm, SubmitHandler, FieldValues } from "react-hook-form";
import { MaterialCommunityIcons, AntDesign, Feather } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";

// Lấy kiểu dữ liệu của prop 'name' từ component Feather
type FeatherIconName = ComponentProps<typeof Feather>["name"];

// Định nghĩa kiểu dữ liệu cho Form
interface RegisterFormData extends FieldValues {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

// Định nghĩa FieldName chỉ bao gồm các khóa kiểu chuỗi
type RegisterFieldName = Exclude<keyof RegisterFormData, number>;

// 💡 THÊM PROPS CHO COMPONENT
interface RegisterFormProps {
  onRegistrationSuccess: () => void;
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

// Component chính
export function RegisterForm({ onRegistrationSuccess }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const password = watch("password");

  useEffect(() => {
    // ... (Validation giữ nguyên)
    register("fullName", {
      required: "Họ và tên là bắt buộc",
      minLength: { value: 2, message: "Họ và tên phải có ít nhất 2 ký tự" },
      pattern: {
        value: /^[a-zA-ZÀ-ỹ\s]+$/,
        message: "Họ và tên chỉ được chứa chữ cái",
      },
    });
    register("phone", {
      required: "Số điện thoại là bắt buộc",
      pattern: {
        value: /^(0|\+84)[0-9]{9,10}$/,
        message: "Số điện thoại không hợp lệ",
      },
    });
    register("email", {
      required: "Email là bắt buộc",
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: "Email không hợp lệ",
      },
    });
    register("password", {
      required: "Mật khẩu là bắt buộc",
      minLength: { value: 8, message: "Mật khẩu phải có ít nhất 8 ký tự" },
      pattern: {
        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        message: "Mật khẩu phải có chữ hoa, chữ thường và số",
      },
    });
    register("confirmPassword", {
      required: "Vui lòng xác nhận mật khẩu",
      validate: (value) => value === password || "Mật khẩu không khớp",
    });
    register("agreeToTerms", {
      required: "Bạn phải đồng ý với điều khoản dịch vụ",
    });
  }, [register, password]);

  const onSubmit: SubmitHandler<RegisterFormData> = (data) => {
    console.log("Register data:", data);

    // 💡 SỬA ĐỔI CHÍNH: Gọi callback onSuccess sau khi Alert
    Alert.alert("Thông báo", "Đăng ký thành công!", [
      {
        text: "OK",
        onPress: onRegistrationSuccess, // Gọi prop callback để chuyển tab/màn hình
      },
    ]);
  };

  const renderPasswordField = (
    field: "password" | "confirmPassword",
    label: string,
    placeholder: string,
    isVisible: boolean,
    toggleVisibility: () => void
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[styles.inputWrapper, errors[field] && styles.inputWrapperError]}
      >
        <Feather
          name="lock"
          size={20}
          color={COLORS.placeholder}
          style={styles.icon}
        />
        <TextInput
          style={[styles.input, { paddingRight: 50 }]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          secureTextEntry={!isVisible}
          onChangeText={(text) =>
            setValue(field as RegisterFieldName, text, { shouldValidate: true })
          }
        />
        <TouchableOpacity style={styles.eyeButton} onPress={toggleVisibility}>
          <Feather
            name={isVisible ? "eye-off" : "eye"}
            size={20}
            color={COLORS.placeholder}
          />
        </TouchableOpacity>
      </View>
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]?.message}</Text>
      )}
    </View>
  );

  const renderTextInput = (
    field: RegisterFieldName,
    label: string,
    placeholder: string,
    iconName: FeatherIconName,
    keyboardType: "default" | "email-address" | "phone-pad" = "default"
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[styles.inputWrapper, errors[field] && styles.inputWrapperError]}
      >
        <Feather
          name={iconName}
          size={20}
          color={COLORS.placeholder}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          keyboardType={keyboardType}
          autoCapitalize={field === "email" ? "none" : "words"}
          onChangeText={(text) =>
            setValue(field as RegisterFieldName, text, { shouldValidate: true })
          }
        />
      </View>
      {errors.agreeToTerms && (
        <Text style={styles.errorText}>{errors.agreeToTerms.message}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Full Name Field */}
      {renderTextInput("fullName", "Họ và tên", "Nguyễn Văn A", "user")}

      {/* Phone Field */}
      {renderTextInput(
        "phone",
        "Số điện thoại",
        "0901234567",
        "phone",
        "phone-pad"
      )}

      {/* Email Field */}
      {renderTextInput(
        "email",
        "Email",
        "example@email.com",
        "mail",
        "email-address"
      )}

      {/* Password Field */}
      {renderPasswordField(
        "password",
        "Mật khẩu",
        "••••••••",
        showPassword,
        () => setShowPassword(!showPassword)
      )}

      {/* Confirm Password Field */}
      {renderPasswordField(
        "confirmPassword",
        "Xác nhận mật khẩu",
        "••••••••",
        showConfirmPassword,
        () => setShowConfirmPassword(!showConfirmPassword)
      )}

      {/* Terms Checkbox */}
      <View style={styles.fieldContainer}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() =>
            setValue("agreeToTerms", !watch("agreeToTerms"), {
              shouldValidate: true,
            })
          }
        >
          <Checkbox
            value={watch("agreeToTerms")}
            onValueChange={(value) =>
              setValue("agreeToTerms" as RegisterFieldName, value, {
                shouldValidate: true,
              })
            }
            color={COLORS.primary}
            style={styles.checkbox}
          />
          <Text style={styles.checkboxLabel}>
            Tôi đồng ý với{" "}
            <Text style={{ color: COLORS.primary }}>Điều khoản dịch vụ</Text> và{" "}
            <Text style={{ color: COLORS.primary }}>Chính sách bảo mật</Text>
          </Text>
        </TouchableOpacity>
        {errors.agreeToTerms && (
          <Text style={styles.errorText}>{errors.agreeToTerms.message}</Text>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, { marginTop: 10 }]}
        onPress={handleSubmit(onSubmit)}
      >
        <Text style={styles.submitButtonText}>Đăng ký ngay</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Hoặc đăng ký với</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social Register */}
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

// ... (Styles giữ nguyên)
const styles = StyleSheet.create({
  container: {
    padding: 0,
    backgroundColor: COLORS.background,
    width: "100%",
  },
  fieldContainer: {
    marginBottom: 20,
    width: "100%",
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
    width: "100%",
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  checkbox: {
    marginRight: 10,
    borderRadius: 4,
    width: 20,
    height: 20,
    marginTop: 2,
  },
  checkboxLabel: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
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
