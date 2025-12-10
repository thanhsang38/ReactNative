import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import React, { ComponentProps, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
// 💡 IMPORTS CONTEXTS & COMPONENTS
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import {
  updateUser,
  uploadFileToBaserow,
  UserRow,
} from "./services/baserowApi";
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

const GENDER_OPTIONS = [
  { value: "male", label: "Nam", icon: "👨" },
  { value: "female", label: "Nữ", icon: "👩" },
  { value: "other", label: "Khác", icon: "🧑" },
];
const getGenderValue = (genderData: any): "male" | "female" | "other" => {
  // 1. Nếu là Object Baserow (có thuộc tính 'value')
  if (genderData && typeof genderData === "object" && "value" in genderData) {
    return genderData.value.toLowerCase() as "male" | "female" | "other";
  }
  // 2. Nếu là chuỗi (ví dụ: đã được cập nhật hoặc là giá trị mặc định)
  if (
    typeof genderData === "string" &&
    ["male", "female", "other"].includes(genderData.toLowerCase())
  ) {
    return genderData.toLowerCase() as "male" | "female" | "other";
  }
  // 3. Giá trị fallback an toàn nhất
  return "other";
};
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
  const { user, updateUserContext } = useAuth();
  const router = useRouter();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || "");
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);
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
      gender: user ? getGenderValue(user.gender) : "other",
    },
  });
  const pickImage = async (source: "gallery" | "camera") => {
    let result;

    // Yêu cầu quyền truy cập
    const permissionResult =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Lỗi",
        "Cần quyền truy cập thư viện ảnh hoặc camera để thay đổi ảnh đại diện."
      );
      return;
    }

    setShowAvatarPicker(false); // Đóng modal chọn ảnh mock

    if (source === "gallery") {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    }

    if (!result.canceled) {
      // 💡 SỬ DỤNG URI ẢNH ĐƯỢC CHỌN TỪ ĐIỆN THOẠI
      setSelectedAvatar(result.assets[0].uri);
    }
  };
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
  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    // 💡 CHECK USER VÀ ID
    if (!user || !user.id) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Không tìm thấy ID người dùng để cập nhật.",
        visibilityTime: 3000,
      });
      return;
    }

    try {
      // 1. ✅ XỬ LÝ UPLOAD ẢNH NẾU LÀ URI CỤC BỘ MỚI
      setIsSaving(true);

      let avatarUrl = user?.avatar || "";
      // 🟦 Nếu user chọn avatar mới → upload lên Baserow
      if (selectedAvatar && selectedAvatar.startsWith("file://")) {
        console.log("📤 Uploading new avatar:", selectedAvatar);

        const uploadResult = await uploadFileToBaserow(selectedAvatar);

        avatarUrl = uploadResult.url; // Baserow trả về .url
        console.log("✅ Uploaded Avatar URL:", avatarUrl);
      }
      // 2. Chuẩn bị Payload cho API Baserow
      const payload: Partial<UserRow> = {
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim().toLowerCase(),

        // ✅ CẬP NHẬT AVATAR BẰNG PUBLIC URL
        avatar: avatarUrl,

        birthday: data.birthday || "",
        gender: data.gender || "other",
      }; // 3. Gọi API CẬP NHẬT HỒ SƠ
      console.log("📦 [UPDATE PAYLOAD]", payload);
      const result = await updateUser(user.id, payload as any);

      // 4. XỬ LÝ LỖI LOGIC/VALIDATION TỪ BASEROW API
      if (!result.success) {
        Toast.show({
          type: "error",
          text1: "Lỗi Cập nhật",
          text2: result.message,
          visibilityTime: 5000,
        });
        return;
      }

      // 5. Nếu thành công, cập nhật lại Context
      updateUserContext(result.data!);

      Toast.show({
        type: "success",
        text1: "Cập nhật thành công!",
        visibilityTime: 2000,
      });
      router.back();
    } catch (error: any) {
      console.error("UPDATE PROFILE CATCH ERROR:", error);
      Toast.show({
        type: "error",
        text1: "Lỗi Hệ Thống",
        text2: error.message || "Không thể kết nối đến máy chủ.",
        visibilityTime: 3000,
      });
    } finally {
      setIsSaving(false);
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
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                )}
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

            <View style={styles.imagePickerOptions}>
              {/* 1. NÚT CHỌN TỪ THƯ VIỆN */}
              <TouchableOpacity
                style={styles.pickerOptionButton}
                onPress={() => pickImage("gallery")}
              >
                <Feather name="image" size={24} color={COLORS.emerald600} />
                <Text style={styles.pickerOptionText}>Chọn từ thư viện</Text>
              </TouchableOpacity>
              {/* 2. NÚT CHỤP ẢNH MỚI */}
              <TouchableOpacity
                style={styles.pickerOptionButton}
                onPress={() => pickImage("camera")}
              >
                <Feather name="camera" size={24} color={COLORS.emerald600} />
                <Text style={styles.pickerOptionText}>Chụp ảnh mới</Text>
              </TouchableOpacity>
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
  imagePickerOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  pickerOptionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pickerOptionText: {
    color: COLORS.slate700,
    fontSize: 14,
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
