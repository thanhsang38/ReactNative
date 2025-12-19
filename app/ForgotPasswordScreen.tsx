import emailjs from "@emailjs/browser";
import { Feather } from "@expo/vector-icons";
import CryptoJS from "crypto-js";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { findUserByEmail, updateUser } from "./services/baserowApi";
// --- Constants và Types ---

type Step = 1 | 2 | 3;

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

interface EmailFormData {
  email: string;
}

interface PasswordFormData {
  password: string;
  confirmPassword: string;
}

// Màu sắc (Đồng bộ với các file khác)
const COLORS = {
  primary: "#059669", // emerald-600
  secondary: "#14b8a6", // teal-500
  text: "#374151", // slate-700
  placeholder: "#94a3b8", // slate-400
  border: "#e2e8f0", // slate-200
  error: "#ef4444", // red-500
  background: "#f8fafc", // slate-50
  white: "#ffffff",
  bgGradientStart: "#f0fff4", // emerald-50
  bgGradientEnd: "#eff6ff", // blue-50
  slate800: "#1e293b",
  slate600: "#475569",
  slate500: "#64748b",
};

// Mock OTP
const OTP_LENGTH = 6;
const OTP_EXPIRE_MINUTES = 5;

// Hàm tạo OTP và tính thời gian hết hạn (Giữ nguyên)
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();
const getExpireISO = () =>
  new Date(Date.now() + OTP_EXPIRE_MINUTES * 60 * 1000).toISOString();

export function ForgotPasswordScreen({
  onBack,
  onSuccess,
}: ForgotPasswordScreenProps) {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");

  const [otpValue, setOtpValue] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const emailForm = useForm<EmailFormData>({
    // ✅ FIX: Xác thực email khi người dùng rời khỏi input
    mode: "onBlur",
  });
  const passwordForm = useForm<PasswordFormData>({
    // ✅ FIX: Xác thực mật khẩu khi người dùng rời khỏi input
    mode: "onBlur",
  });
  const insets = useSafeAreaInsets();

  const singleOtpRef = useRef<TextInput | null>(null);

  // --- Effects ---

  // Countdown timer effect (Giữ nguyên)
  useEffect(() => {
    let id: number | null = null;
    if (countdown > 0) {
      id = setInterval(
        () => setCountdown((c) => c - 1),
        1000
      ) as unknown as number;
    }
    return () => {
      if (id !== null) clearInterval(id);
    };
  }, [countdown]);

  // --- Handlers ---

  const handleEmailSubmit: SubmitHandler<EmailFormData> = async (data) => {
    try {
      const userCheck = await findUserByEmail(data.email);

      if (!userCheck.success) {
        Toast.show({
          type: "error",
          text1: "Lỗi API",
          text2: userCheck.message || "Lỗi kiểm tra email.",
          visibilityTime: 3000,
        });
        return;
      }
      if (!userCheck.data) {
        // Báo lỗi rõ ràng rằng tài khoản không tồn tại
        Toast.show({
          type: "custom",
          text1: "Lỗi",
          text2: "Tài khoản email này không tồn tại.",
          visibilityTime: 3000,
          props: { variant: "error" },
        });
        return;
      }
      const otp = generateOTP();
      const expiredAt = getExpireISO();

      // 1️⃣ Lưu OTP vào Baserow (Giữ nguyên)
      await fetch(
        "https://api.baserow.io/api/database/rows/table/772052/?user_field_names=true",
        {
          method: "POST",
          headers: {
            Authorization: "Token 78WCfXpbSExuHx3YTJ2CfO2rnMSSCosd",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.email,
            otp,
            expired_at: expiredAt,
            used: false,
          }),
        }
      );

      // 2️⃣ Gửi email OTP (Giữ nguyên)
      await emailjs.send(
        "service_hc4sso2",
        "template_0scq2zf",
        {
          to_email: data.email,
          otp,
        },
        "W5jQbZRRjkKMjG4t_"
      );

      setEmail(data.email);
      setStep(2);
      setCountdown(60);
      setOtpValue(""); // Reset giá trị OTP cũ

      Toast.show({
        type: "success",
        text1: "Mã OTP đã được gửi về email",
      });

      // ✅ Focus vào thanh input OTP duy nhất
      setTimeout(() => singleOtpRef.current?.focus(), 300);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Gửi OTP thất bại",
      });
    }
  };

  // ✅ Thay thế handleOtpChange cũ bằng hàm mới cho input đơn
  const handleOtpInput = (text: string) => {
    // Chỉ chấp nhận 6 chữ số
    const cleanedText = text.replace(/[^0-9]/g, "");
    setOtpValue(cleanedText);

    // Nếu đủ 6 ký tự thì tự động hoàn tất
    if (cleanedText.length === OTP_LENGTH) {
      handleOtpComplete(cleanedText);
    }
  };

  const handleOtpComplete = async (value: string) => {
    // Không cần Keyboard.dismiss vì không gặp vấn đề nhảy focus nữa
    setIsVerifying(true);

    try {
      // 1️⃣ Lấy dữ liệu OTP từ Baserow (Giữ nguyên)
      const res = await fetch(
        `https://api.baserow.io/api/database/rows/table/772052/?user_field_names=true
            &filter__email__equal=${email}
            &filter__otp__equal=${value}
            &filter__used__equal=false`,
        {
          headers: {
            Authorization: "Token 78WCfXpbSExuHx3YTJ2CfO2rnMSSCosd",
          },
        }
      );
      console.log("Fetching URL:", res);
      const data = await res.json();
      console.log("Baserow Response Data:", data);
      if (!data.results || data.results.length === 0) {
        // ✅ Dùng console.error để dễ thấy hơn
        console.error(
          "Lỗi: Không tìm thấy bản ghi OTP hợp lệ (hoặc đã dùng/hết hạn)."
        );
        throw new Error("OTP_INVALID_OR_NOT_FOUND");
      }

      const record = data.results[0];
      if (new Date(record.expired_at) < new Date()) {
        console.error("Lỗi: Mã OTP đã hết hạn dựa trên client time.");
        throw new Error("OTP_EXPIRED");
      }

      // 2️⃣ Đánh dấu OTP đã dùng
      await fetch(
        `https://api.baserow.io/api/database/rows/table/772052/${record.id}/?user_field_names=true`,
        {
          method: "PATCH",
          headers: {
            Authorization: "Token 78WCfXpbSExuHx3YTJ2CfO2rnMSSCosd",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ used: true }),
        }
      );

      Toast.show({
        type: "success",
        text1: "Xác thực OTP thành công",
      });

      setStep(3);
    } catch (e) {
      // Xử lý lỗi cụ thể
      const errorText = e instanceof Error ? e.message : "UNKNOWN_ERROR";
      let text2 = "OTP sai hoặc đã hết hạn";

      if (errorText.includes("OTP_EXPIRED")) {
        text2 = "Mã OTP đã hết hạn. Vui lòng gửi lại.";
      }

      Toast.show({
        type: "error",
        text1: "Lỗi xác thực",
        text2: text2,
      });
      setOtpValue(""); // Reset input
      singleOtpRef.current?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePasswordSubmit: SubmitHandler<PasswordFormData> = async (
    data
  ) => {
    // Kiểm tra không khớp được thực hiện bởi validation rule, nhưng ta giữ kiểm tra thủ công cho Toast
    if (data.password !== data.confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Mật khẩu xác nhận không khớp!",
      });
      return;
    }

    try {
      // 1. TÌM USER ID THEO EMAIL (DÙNG HÀM CỦA BẠN)
      const userCheck = await findUserByEmail(email);

      if (!userCheck.success || !userCheck.data) {
        // Trường hợp này không nên xảy ra vì đã kiểm tra ở Bước 1
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: "Không tìm thấy tài khoản để đặt lại mật khẩu.",
        });
        return;
      }

      // Lấy ID người dùng (đã được tìm thấy bằng email hợp lệ)
      const userId = userCheck.data.id;

      // 2. HASH MẬT KHẨU MỚI
      const hashedPassword = CryptoJS.SHA256(data.password).toString();

      // 3. CẬP NHẬT MẬT KHẨU TRONG BASEROW (DÙNG HÀM CỦA BẠN)
      const updateResult = await updateUser(
        userId,
        { password_hash: hashedPassword } as any // Ép kiểu vì updateUser không biết về password_hash
      );

      if (!updateResult.success) {
        Toast.show({
          type: "error",
          text1: "Lỗi Cập nhật",
          text2: updateResult.message || "Không thể cập nhật mật khẩu.",
        });
        return;
      }

      Toast.show({ type: "success", text1: "Đặt lại mật khẩu thành công!" });

      setTimeout(() => {
        router.push("/App"); // Chuyển về trang đăng nhập
      }, 1500);
    } catch (e) {
      console.error("PASSWORD RESET FAILED:", e);
      Toast.show({
        type: "error",
        text1: "Lỗi Hệ Thống",
        text2: "Không thể cập nhật mật khẩu. Vui lòng thử lại.",
      });
    }
  };

  const handleResendOtp = async () => {
    if (countdown !== 0) return;
    try {
      const otp = generateOTP();
      const expiredAt = getExpireISO();
      setOtpValue(""); // Reset giá trị OTP cũ

      // 1️⃣ Lưu OTP vào Baserow (Giữ nguyên)
      await fetch(
        "https://api.baserow.io/api/database/rows/table/772052/?user_field_names=true",
        {
          method: "POST",
          headers: {
            Authorization: `Token 78WCfXpbSExuHx3YTJ2CfO2rnMSSCosd`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            otp,
            expired_at: expiredAt,
            used: false,
          }),
        }
      );

      // 2️⃣ Gửi email OTP (Giữ nguyên)
      await emailjs.send(
        "service_hc4sso2",
        "template_0scq2zf",
        {
          to_email: email,
          otp,
        },
        "W5jQbZRRjkKMjG4t_"
      );

      setCountdown(60);
      Toast.show({ type: "success", text1: "OTP mới đã được gửi" });
      singleOtpRef.current?.focus(); // Focus lại input
    } catch {
      Toast.show({ type: "error", text1: "Gửi lại OTP thất bại" });
    }
  };

  const handleBackStep = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else router.replace("/App");
  };

  // --- Render Steps ---

  const renderStep1 = () => (
    <View key="step1" style={styles.cardContent}>
      <View style={styles.headerIconWrapper}>
        <View style={styles.headerIconBg}>
          <Feather name="mail" style={styles.headerIcon} size={32} />
        </View>
      </View>
      <Text style={styles.title}>Quên mật khẩu?</Text>
      <Text style={styles.subtitle}>
        Nhập email của bạn để nhận mã xác thực
      </Text>

      <Controller
        control={emailForm.control}
        name="email"
        rules={{
          required: "Email là bắt buộc",
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: "Email không hợp lệ",
          },
        }}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Email</Text>
            <View
              style={[styles.inputWrapper, error && styles.inputErrorWrapper]}
            >
              <Feather
                name="mail"
                style={styles.inputIcon}
                size={20}
                color={COLORS.placeholder}
              />
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={onChange}
                value={value}
              />
            </View>
            {error && <Text style={styles.errorText}>{error.message}</Text>}
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.submitButton}
        onPress={emailForm.handleSubmit(handleEmailSubmit)}
      >
        <Text style={styles.submitButtonText}>Gửi mã OTP</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View key="step2" style={styles.cardContent}>
      <View style={styles.headerIconWrapper}>
        <View style={styles.headerIconBg}>
          <Feather name="shield" style={styles.headerIcon} size={32} />
        </View>
      </View>
      <Text style={styles.title}>Nhập mã OTP</Text>
      <Text style={styles.subtitle}>
        Mã xác thực đã được gửi đến:
        <Text style={styles.subtitleHighlight}>{email}</Text>
      </Text>

      {/* ✅ THAY THẾ OTP INPUT BẰNG THANH INPUT DUY NHẤT */}
      <View style={styles.otpSingleContainer}>
        <TextInput
          ref={singleOtpRef}
          style={styles.otpSingleInput}
          placeholder={`Nhập ${OTP_LENGTH} chữ số`}
          placeholderTextColor={COLORS.placeholder}
          value={otpValue}
          onChangeText={handleOtpInput}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          editable={!isVerifying}
        />
      </View>
      {/* KẾT THÚC THAY THẾ */}

      <View style={styles.resendContainer}>
        {isVerifying ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : countdown > 0 ? (
          <Text style={styles.resendText}>
            Gửi lại mã sau
            <Text style={styles.countdownText}>{countdown}s</Text>
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResendOtp}>
            <Text style={styles.resendButtonText}>Gửi lại mã OTP</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.backStepButton}
        onPress={() => setStep(1)}
      >
        <Text style={styles.backStepButtonText}>Thay đổi email</Text>
      </TouchableOpacity>

      {/* Nút kiểm tra thủ công, phòng trường hợp tự động không hoạt động */}
      <TouchableOpacity
        style={[styles.submitButton, { marginTop: 20 }]}
        onPress={() =>
          otpValue.length === OTP_LENGTH && handleOtpComplete(otpValue)
        }
        disabled={otpValue.length !== OTP_LENGTH || isVerifying}
      >
        <Text style={styles.submitButtonText}>Xác nhận</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View key="step3" style={styles.cardContent}>
      <View style={styles.headerIconWrapper}>
        <View style={styles.headerIconBg}>
          <Feather name="lock" style={styles.headerIcon} size={32} />
        </View>
      </View>
      <Text style={styles.title}>Tạo mật khẩu mới</Text>
      <Text style={styles.subtitle}>Mật khẩu mới </Text>

      <View style={styles.formSpace}>
        <Controller
          control={passwordForm.control}
          name="password"
          rules={{
            required: "Mật khẩu là bắt buộc",
            // ✅ FIX: RÀNG BUỘC MỚI: minLength 8, Chữ hoa, chữ thường, số
            minLength: {
              value: 8,
              message: "Mật khẩu phải có ít nhất 8 ký tự",
            },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              message: "Phải chứa chữ hoa, chữ thường và số",
            },
          }}
          render={({
            field: { onChange, value, onBlur },
            fieldState: { error },
          }) => (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Mật khẩu mới</Text>
              <View
                style={[styles.inputWrapper, error && styles.inputErrorWrapper]}
              >
                <Feather
                  name="lock"
                  style={styles.inputIcon}
                  size={20}
                  color={COLORS.placeholder}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.placeholder}
                  secureTextEntry={!showPassword}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={COLORS.placeholder}
                  />
                </TouchableOpacity>
              </View>
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={passwordForm.control}
          name="confirmPassword"
          rules={{
            required: "Xác nhận mật khẩu là bắt buộc",
            validate: (value) =>
              value === passwordForm.watch("password") || "Mật khẩu không khớp",
          }}
          render={({
            field: { onChange, value, onBlur },
            fieldState: { error },
          }) => (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Xác nhận mật khẩu</Text>
              <View
                style={[styles.inputWrapper, error && styles.inputErrorWrapper]}
              >
                <Feather
                  name="lock"
                  style={styles.inputIcon}
                  size={20}
                  color={COLORS.placeholder}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.placeholder}
                  secureTextEntry={!showConfirmPassword}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Feather
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color={COLORS.placeholder}
                  />
                </TouchableOpacity>
              </View>
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={passwordForm.handleSubmit(handlePasswordSubmit)}
      >
        <Text style={styles.submitButtonText}>Đặt lại mật khẩu</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.fullScreen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackStep} style={styles.backButton}>
          <Feather name="arrow-left" style={styles.backIcon} size={24} />
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
      {/* Main content */}
      <View style={styles.mainContent}>
        <View style={styles.maxWidthContainer}>
          {/* Progress bar */}
          <View style={styles.progressBarWrapper}>
            <View style={styles.progressBarSteps}>
              {[1, 2, 3].map((num, index) => (
                <React.Fragment key={num}>
                  <View style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepCircle,
                        step >= num
                          ? styles.stepCircleActive
                          : styles.stepCircleInactive,
                      ]}
                    >
                      {step > num ? (
                        <Feather name="check" size={18} color={COLORS.white} />
                      ) : (
                        <Text style={styles.stepCircleText}>{num}</Text>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.stepLabelText,
                        step === num && styles.stepLabelActiveText,
                      ]}
                    >
                      {num === 1
                        ? "Email"
                        : num === 2
                        ? "Xác thực OTP"
                        : "Mật khẩu mới"}
                    </Text>
                  </View>

                  {index < 2 && (
                    <View
                      style={[
                        styles.stepLine,
                        step > num
                          ? styles.stepLineActive
                          : styles.stepLineInactive,
                      ]}
                    />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
          {/* Card */}
          <View style={styles.card}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </View>
        </View>
      </View>
    </View>
  );
}
export default ForgotPasswordScreen;

// --- Styles ---

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 20,
    backgroundColor: COLORS.white,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  backIcon: {
    color: COLORS.text,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  maxWidthContainer: {
    width: "100%",
    maxWidth: 448, // max-w-md
  },

  // --- Progress Bar Styles (Giữ nguyên) ---
  progressBarWrapper: {
    marginBottom: 32,
  },
  progressBarSteps: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepItem: {
    alignItems: "center",
    width: 80,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleText: {
    color: COLORS.text,
    fontWeight: "bold",
  },
  stepLine: {
    height: 4,
    width: 60,
    borderRadius: 2,
    marginHorizontal: 6,
  },
  stepLabelText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.placeholder,
    textAlign: "center",
  },
  stepLabelActiveText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary, // Gradient mô phỏng
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  stepCircleInactive: {
    backgroundColor: COLORS.border,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary, // Gradient mô phỏng
  },
  stepLineInactive: {
    backgroundColor: COLORS.border,
  },

  // --- Card Styles (Giữ nguyên) ---
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  cardContent: {
    alignItems: "center",
    width: "100%",
  },
  headerIconWrapper: {
    alignItems: "center",
    marginBottom: 32,
  },
  headerIconBg: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary, // Gradient mô phỏng
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  headerIcon: {
    color: COLORS.white,
  },
  title: {
    color: COLORS.slate800,
    fontSize: 24,
    marginBottom: 8,
    fontWeight: "bold",
  },
  subtitle: {
    color: COLORS.slate600,
    textAlign: "center",
    marginBottom: 24,
  },
  subtitleHighlight: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  // --- Form Elements (Giữ nguyên) ---
  formSpace: {
    width: "100%",
    marginBottom: 20,
  },
  fieldContainer: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    color: COLORS.text,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    width: "100%",
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    zIndex: 1,
  },
  input: {
    width: "100%",
    paddingLeft: 48,
    paddingRight: 48,
    paddingVertical: 16,
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.text,
    height: 56,
  },
  inputErrorWrapper: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.error + "10",
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 4,
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    zIndex: 1,
    padding: 8,
  },
  submitButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    marginTop: 10,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },

  // --- OTP Styles ĐÃ SỬA ---
  otpSingleContainer: {
    width: "100%",
    marginBottom: 24,
    alignItems: "center",
  },
  otpSingleInput: {
    width: "80%", // Giảm bớt chiều rộng một chút
    height: 56,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20, // Kích thước lớn hơn
    fontWeight: "bold",
    color: COLORS.slate800,
    backgroundColor: COLORS.background, // Dùng màu background cho input
    paddingHorizontal: 16,
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.slate600,
  },
  countdownText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  resendButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  backStepButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  backStepButtonText: {
    fontSize: 14,
    color: COLORS.slate600,
    textAlign: "center",
  },
});
