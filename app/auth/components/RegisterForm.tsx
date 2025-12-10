import { AntDesign, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import React, { ComponentProps, useEffect, useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message"; // 💡 IMPORT Toast

// 💡 IMPORT HÀM REGISTER API
import { registerUser } from "../../services/baserowApi"; // ⚠️ Đảm bảo đúng đường dẫn

// Lấy kiểu dữ liệu của prop 'name' từ component Feather
type FeatherIconName = ComponentProps<typeof Feather>["name"];

// Định nghĩa kiểu dữ liệu cho Form
interface RegisterFormData extends FieldValues {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  birthday?: string | null;
  gender?: "male" | "female" | "other" | null;
  address?: string | null;
  avatar?: string | null;
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // 💡 STATE QUẢN LÝ LOADING
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
      // Đặt giá trị mặc định cho các trường ẩn
      birthday: "",
      gender: "other", // Giữ lại giá trị hợp lệ cho Single Select
      address: "",
      avatar: "",
    },
  });

  const password = watch("password");

  useEffect(() => {
    // ... (Validation giữ nguyên)
    register("name", {
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
    register("birthday");
    register("gender");
    register("address");
    register("avatar");
  }, [register, password]); // 💡 HÀM SUBMIT VÀ GỌI API

  // Hàm Helper để loại bỏ null/undefined/chuỗi rỗng khỏi Payload
  const cleanupPayload = (data: RegisterFormData) => {
    const cleaned: Record<string, any> = {};
    for (const key in data) {
      const value = data[key as RegisterFieldName];

      // Bỏ qua các trường xác nhận mật khẩu và đồng ý điều khoản
      if (key === "confirmPassword" || key === "agreeToTerms") continue;

      let cleanedValue = value;
      if (typeof value === "string") {
        cleanedValue = value.trim();
      }

      // ✅ FIX: Chỉ giữ lại các giá trị KHÔNG phải null, undefined, HOẶC CHUỖI RỖNG
      // Đây là cách duy nhất để tránh lỗi 400 của Baserow với các cột Date/URL/Address trống.
      if (
        cleanedValue !== null &&
        cleanedValue !== undefined &&
        cleanedValue !== ""
      ) {
        cleaned[key] = cleanedValue;
      }
    }
    return cleaned;
  };

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    console.log("📤 BẮT ĐẦU ĐĂNG KÝ");
    console.log("➡ Email nhập:", data.email);

    if (!data.agreeToTerms) {
      Toast.show({
        type: "error",
        text1: "Lỗi Đăng ký",
        text2: "Vui lòng đồng ý với Điều khoản dịch vụ.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const finalPayload = cleanupPayload(data);

      console.log("📦 Payload gửi lên Baserow:", finalPayload);

      const res = await registerUser(finalPayload);

      console.log("🔍 KẾT QUẢ ĐĂNG KÝ:", res);

      // ⭐⭐⭐⭐ FIX QUAN TRỌNG ⭐⭐⭐⭐
      if (!res.success) {
        Toast.show({
          type: "error",
          text1: "Đăng ký thất bại!",
          text2: res.message || "Email đã được sử dụng.",
        });
        return; // 👉 DỪNG LẠI, KHÔNG CHẠY TIẾP
      }

      // ⭐ Nếu đến đây -> success = true thật sự
      Toast.show({
        type: "success",
        text1: "Đăng ký thành công!",
        text2: "Bây giờ bạn có thể đăng nhập.",
      });

      setTimeout(() => {
        onRegistrationSuccess();
      }, 200);
    } catch (err) {
      console.log("❌ LỖI API:", err);
      Toast.show({
        type: "error",
        text1: "Đăng ký thất bại!",
        text2: "Lỗi hệ thống.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isButtonDisabled = isSubmitting;

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
      {renderTextInput("name", "Họ và tên", "Nguyễn Văn A", "user")}

      {renderTextInput(
        "phone",
        "Số điện thoại",
        "0901234567",
        "phone",
        "phone-pad"
      )}

      {renderTextInput(
        "email",
        "Email",
        "example@email.com",
        "mail",
        "email-address"
      )}

      {renderPasswordField(
        "password",
        "Mật khẩu",
        "••••••••",
        showPassword,
        () => setShowPassword(!showPassword)
      )}

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
            Tôi đồng ý với
            <Text style={{ color: COLORS.primary }}>Điều khoản dịch vụ</Text> và
            <Text style={{ color: COLORS.primary }}>Chính sách bảo mật</Text>
          </Text>
        </TouchableOpacity>
        {errors.agreeToTerms && (
          <Text style={styles.errorText}>{errors.agreeToTerms.message}</Text>
        )}
      </View>
      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          { marginTop: 10 },
          isButtonDisabled && { opacity: 0.7 }, // Vô hiệu hóa/Làm mờ nút
        ]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitButtonText}>Đăng ký ngay</Text>
        )}
      </TouchableOpacity>
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Hoặc đăng ký với</Text>
        <View style={styles.dividerLine} />
      </View>

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
