import React, { useState, ComponentProps } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { useForm, SubmitHandler } from "react-hook-form";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
// 💡 IMPORTS CONTEXTS & COMPONENTS
import { useAuth, User } from "../context/AuthContext";
import { Header } from "../components/Header";
import { useRouter } from "expo-router";
// --- Types & Data ---
type FeatherIconName = ComponentProps<typeof Feather>["name"];
type Page = string; // Dùng cho navigateTo

interface EditProfilePageProps {
  goBack: () => void;
}

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  birthday?: string;
  gender?: "male" | "female" | "other";
}

const AVATAR_OPTIONS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
  "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200",
];

const GENDER_OPTIONS = [
  { value: "male", label: "Nam", icon: "👨" },
  { value: "female", label: "Nữ", icon: "👩" },
  { value: "other", label: "Khác", icon: "🧑" },
];

const COLORS = {
  white: "#ffffff",
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate400: "#94a3b8",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  emerald50: "#f0fff4",
  emerald500: "#10b981",
  emerald600: "#059669",
  red500: "#ef4444",
  teal600: "#0d9488",
  red50: "#fef2f2",
};

// -----------------------------------------------------------

export function EditProfilePage({ goBack }: EditProfilePageProps) {
  // 💡 SỬA LỖI: Chỉ dùng user và signIn từ useAuth
  const { user, signIn } = useAuth();
  const router = useRouter();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || "");
  const insets = useSafeAreaInsets();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState(
    user?.birthday ? new Date(user.birthday) : new Date()
  );
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      birthday: undefined, // Đặt giá trị ban đầu là undefined nếu không có
      gender: user?.gender || "male",
    },
  });

  // Đăng ký các trường đầu vào cho react-hook-form
  React.useEffect(() => {
    register("name", {
      required: "Họ và tên là bắt buộc",
      minLength: { value: 2, message: "Họ và tên phải có ít nhất 2 ký tự" },
    });
    register("email", {
      required: "Email là bắt buộc",
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: "Email không hợp lệ",
      },
    });
    register("phone", {
      required: "Số điện thoại là bắt buộc",
      pattern: {
        value: /^(0|\+84)[0-9]{9,10}$/,
        message: "Số điện thoại không hợp lệ",
      },
    });
    register("birthday");
    register("gender");
  }, [register]);

  const watchedGender = watch("gender");
  const onDateChange = (event: any, selectedDate: Date | undefined) => {
    // Ẩn picker nếu là Android hoặc nếu người dùng chọn xong trên iOS
    if (Platform.OS === "android" || event.type === "set") {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      setDateValue(selectedDate);
      // Format ngày sang chuỗi YYYY-MM-DD để lưu (Chuẩn HTML date)
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setValue("birthday", formattedDate, { shouldValidate: true });
    }
  };
  // 💡 HÀM XỬ LÝ LƯU (SỬ DỤNG signIn)
  const onSubmit = async (data: ProfileFormData) => {
    // 1. Tạo đối tượng user đã được cập nhật
    const updatedUser: User = {
      ...user!, // Dùng user hiện tại (ID, token, etc.)
      name: data.name,
      email: data.email,
      phone: data.phone,
      avatar: selectedAvatar,
      // Thêm các trường mới
      birthday: dateValue.toISOString().split("T")[0],
      gender: data.gender,
    };

    try {
      await signIn(updatedUser); // 2. Gọi signIn để lưu và cập nhật Context

      Toast.show({
        type: "success",
        text1: "Cập nhật thành công!",
        visibilityTime: 2000,
      });
      router.back();
    } catch (error) {
      console.log("UPDATE PROFILE ERROR:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không thể lưu thông tin.",
        visibilityTime: 3000,
      });
    }
  };

  const renderError = (field: keyof ProfileFormData) =>
    errors[field] ? (
      <Text style={styles.errorText}>{errors[field]?.message}</Text>
    ) : null;

  return (
    <View style={styles.fullContainer}>
      <Header title="Thông tin cá nhân" showBack={true} onBack={goBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: 50 + insets.top }}
      >
        <View style={styles.contentPadding}>
          <View style={styles.formSection}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarCircle}>
                  {selectedAvatar ? (
                    <Image
                      source={{ uri: selectedAvatar }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Feather name="user" size={48} color={COLORS.slate400} />
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setShowAvatarPicker(true)}
                  style={styles.cameraButton}
                >
                  <Feather name="camera" size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setShowAvatarPicker(true)}
                style={styles.changeAvatarButton}
              >
                <Text style={styles.changeAvatarText}>
                  Thay đổi ảnh đại diện
                </Text>
              </TouchableOpacity>
            </View>

            {/* 💡 FORM WRAPPER */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Thông tin cá nhân</Text>

              {/* Name */}
              <View style={styles.formField}>
                <Text style={styles.label}>
                  Họ và tên <Text style={styles.requiredText}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Feather
                    name="user"
                    size={20}
                    color={COLORS.slate400}
                    style={styles.icon}
                  />
                  <TextInput
                    // 💡 SỬ DỤNG onChangeText VÀ setValue (Chuẩn RN + hook-form)
                    onChangeText={(text) =>
                      setValue("name", text, { shouldValidate: true })
                    }
                    defaultValue={user?.name}
                    placeholder="Nguyễn Văn A"
                    style={[styles.input, errors.name && styles.inputError]}
                  />
                </View>
                {renderError("name")}
              </View>

              {/* Email */}
              <View style={styles.formField}>
                <Text style={styles.label}>
                  Email <Text style={styles.requiredText}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Feather
                    name="mail"
                    size={20}
                    color={COLORS.slate400}
                    style={styles.icon}
                  />
                  <TextInput
                    onChangeText={(text) =>
                      setValue("email", text, { shouldValidate: true })
                    }
                    defaultValue={user?.email}
                    placeholder="example@email.com"
                    keyboardType="email-address"
                    style={[styles.input, errors.email && styles.inputError]}
                  />
                </View>
                {renderError("email")}
              </View>

              {/* Phone */}
              <View style={styles.formField}>
                <Text style={styles.label}>
                  Số điện thoại <Text style={styles.requiredText}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Feather
                    name="phone"
                    size={20}
                    color={COLORS.slate400}
                    style={styles.icon}
                  />
                  <TextInput
                    onChangeText={(text) =>
                      setValue("phone", text, { shouldValidate: true })
                    }
                    defaultValue={user?.phone}
                    placeholder="0901234567"
                    keyboardType="phone-pad"
                    style={[styles.input, errors.phone && styles.inputError]}
                  />
                </View>
                {renderError("phone")}
              </View>

              {/* Birthday */}
              <View style={styles.formField}>
                <Text style={styles.label}>Ngày sinh</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)} // ✅ Toàn bộ vùng này là nút
                  style={styles.inputWrapper}
                >
                  {/* 1. Icon Calendar bên trái (Giữ nguyên) */}
                  <Feather
                    name="calendar"
                    size={20}
                    color={COLORS.slate400}
                    style={styles.icon}
                  />

                  {/* 2. Trường TextInput (Hiển thị ngày đã chọn) */}
                  <TextInput
                    editable={false}
                    value={dateValue.toLocaleDateString("vi-VN")}
                    placeholder={"Chọn ngày sinh"}
                    style={styles.input}
                  />

                  {/* 3. 💡 ICON KÍCH HOẠT BÊN PHẢI (New) */}
                  <Feather
                    name="chevron-down" // Dùng icon mũi tên xuống để tượng trưng cho dropdown/picker
                    size={20}
                    color={COLORS.slate400}
                    style={styles.rightIcon}
                  />
                </TouchableOpacity>
              </View>

              {/* Gender */}
              <View style={styles.genderField}>
                <Text style={styles.label}>Giới tính</Text>
                <View style={styles.genderGrid}>
                  {GENDER_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() =>
                        setValue(
                          "gender",
                          option.value as "male" | "female" | "other"
                        )
                      }
                      style={[
                        styles.genderButton,
                        watchedGender === option.value && styles.genderActive,
                      ]}
                    >
                      <Text style={styles.genderEmoji}>{option.icon}</Text>
                      <Text style={styles.genderLabel}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Additional Information */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Thông tin bổ sung</Text>
              <View style={styles.additionalInfoRow}>
                <Text style={styles.additionalLabel}>Ngôn ngữ</Text>
                <Text style={styles.additionalValue}>Tiếng Việt</Text>
              </View>
              <View style={styles.additionalInfoRow}>
                <Text style={styles.additionalLabel}>Đơn vị tiền tệ</Text>
                <Text style={styles.additionalValue}>VNĐ</Text>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              style={styles.saveButton}
            >
              {/* 💡 GRADIENT BUTTON (Thực hiện trực tiếp trong RN) */}
              <LinearGradient
                colors={[COLORS.emerald500, COLORS.teal600]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonBackground}
              >
                <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Info Note */}
            <Text style={styles.infoNote}>
              Thông tin của bạn được bảo mật và chỉ được sử dụng để cải thiện
              trải nghiệm mua sắm
            </Text>
          </View>
        </View>

        {/* Padding cuối cùng */}
        <View style={{ height: 100 }} />
      </ScrollView>
      {showDatePicker && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
      {/* Avatar Picker Modal */}
      <Modal
        visible={showAvatarPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAvatarPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn ảnh đại diện</Text>
            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map((avatar, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setSelectedAvatar(avatar);
                    setShowAvatarPicker(false);
                  }}
                  style={[
                    styles.avatarOptionButton,
                    selectedAvatar === avatar && styles.avatarSelectedRing,
                  ]}
                >
                  <Image
                    source={{ uri: avatar }}
                    style={styles.avatarImageOption}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setShowAvatarPicker(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default EditProfilePage;

// -----------------------------------------------------------
// 💡 STYLE SHEET (Giữ nguyên)
// -----------------------------------------------------------

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: COLORS.slate50 },
  contentPadding: { paddingHorizontal: 16, paddingVertical: 16 },
  formSection: { gap: 16 },
  // --- Avatar Section ---
  avatarSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: "center",
  },
  avatarContainer: { position: "relative", marginBottom: 16 },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 9999,
    overflow: "hidden",
    backgroundColor: COLORS.slate100,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%", resizeMode: "cover" },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    padding: 8,
    backgroundColor: COLORS.emerald500,
    borderRadius: 9999,
    shadowColor: COLORS.emerald500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
  },
  changeAvatarButton: {},
  changeAvatarText: { color: COLORS.emerald600, fontSize: 14 },
  // --- Form Fields ---
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rightIcon: {
    position: "absolute",
    right: 16, // Đẩy icon ra sát mép phải
    zIndex: 1,
  },
  infoCardTitle: {
    color: COLORS.slate800,
    fontWeight: "bold",
    marginBottom: 16,
    fontSize: 16,
  },
  formField: { marginBottom: 16 },
  label: {
    color: COLORS.slate700,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  requiredText: { color: COLORS.red500 },
  inputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  icon: { position: "absolute", left: 16, zIndex: 1 },
  input: {
    width: "100%",
    paddingLeft: 48,
    paddingRight: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: COLORS.slate50,
    borderColor: COLORS.slate200,
    fontSize: 16,
    color: COLORS.slate800,
  },
  inputError: { borderColor: COLORS.red500, backgroundColor: COLORS.red50 },
  errorText: { color: COLORS.red500, fontSize: 12, marginTop: 4 },
  // --- Gender Radios ---
  genderField: { marginBottom: 16 },
  genderGrid: { flexDirection: "row", gap: 8, justifyContent: "space-between" },
  genderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    position: "relative",
    overflow: "hidden",
  },
  genderActive: {
    borderColor: COLORS.emerald500,
    backgroundColor: COLORS.emerald50,
  },
  genderEmoji: { fontSize: 20 },
  genderLabel: { fontSize: 14, color: COLORS.slate700 },
  // --- Additional Info ---
  additionalInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  additionalLabel: { color: COLORS.slate600, fontSize: 14 },
  additionalValue: { color: COLORS.emerald600, fontSize: 14 },
  // --- Save Button ---
  saveButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: COLORS.emerald500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 16,
  },
  saveButtonBackground: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },
  infoNote: {
    color: COLORS.slate600,
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  // --- Modal Picker ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    color: COLORS.slate800,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
    justifyContent: "center",
  },
  avatarOptionButton: {
    width: 80,
    height: 80,
    borderRadius: 9999,
    overflow: "hidden",
    position: "relative",
    borderWidth: 4,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImageOption: { width: "100%", height: "100%", resizeMode: "cover" },
  avatarSelectedRing: { borderColor: COLORS.emerald500 },
  modalCloseButton: {
    width: "100%",
    paddingVertical: 12,
    backgroundColor: COLORS.slate100,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  modalCloseButtonText: {
    color: COLORS.slate700,
    fontSize: 16,
    fontWeight: "500",
  },
});
