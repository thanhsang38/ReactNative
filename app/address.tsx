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
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useForm, SubmitHandler } from "react-hook-form"; // 💡 IMPORT useForm
import { LinearGradient } from "expo-linear-gradient"; // Cần LinearGradient cho nút Submit

// 💡 IMPORTS COMPONENTS & CONTEXTS
import { Header } from "../components/Header";

// --- Types & Data ---
type FeatherIconName = ComponentProps<typeof Feather>["name"];

interface AddressPageProps {
  goBack: () => void;
  navigateTo: (page: string) => void;
}

interface Address {
  id: string;
  type: "home" | "work" | "other";
  name: string;
  phone: string;
  address: string;
  isDefault: boolean;
}

interface AddressFormData {
  name: string;
  phone: string;
  address: string;
  type: "home" | "work" | "other";
}

const ADDRESS_TYPES: {
  [key: string]: { label: string; iconName: FeatherIconName; color: string };
} = {
  home: { label: "Nhà riêng", iconName: "home", color: "#059669" },
  work: { label: "Văn phòng", iconName: "briefcase", color: "#2563eb" },
  other: { label: "Khác", iconName: "map-pin", color: "#9333ea" },
};

const COLORS = {
  bg: "#f8fafc",
  white: "#ffffff",
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate400: "#94a3b8",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  emerald50: "#f0fff4",
  emerald100: "#d1fae5",
  emerald500: "#10b981",
  emerald600: "#059669",
  red50: "#fef2f2",
  red500: "#ef4444",
  red600: "#dc2626",
  teal600: "#0d9488",
};

// -----------------------------------------------------------

export function AddressPage({ goBack, navigateTo }: AddressPageProps) {
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "1",
      type: "home",
      name: "Nguyễn Văn A",
      phone: "0901234567",
      address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
      isDefault: true,
    },
    {
      id: "2",
      type: "work",
      name: "Nguyễn Văn A",
      phone: "0901234567",
      address: "456 Lê Lợi, Quận 1, TP.HCM",
      isDefault: false,
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const insets = useSafeAreaInsets();

  // 💡 FORM HOOKS
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddressFormData>({ defaultValues: { type: "home" } });

  // 💡 HÀM TOAST
  const showSuccessToast = (message: string) => {
    Toast.show({
      type: "success_custom",
      text1: "Địa chỉ",
      text2: message,
      position: "top",
      visibilityTime: 2000,
    });
  };

  const deleteAddress = (id: string) => {
    Alert.alert("Xác nhận Xóa", "Bạn có chắc muốn xóa địa chỉ này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          setAddresses((prev) => prev.filter((addr) => addr.id !== id));
          showSuccessToast("Đã xóa địa chỉ");
        },
      },
    ]);
  };

  const setDefaultAddress = (id: string) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
    showSuccessToast("Đã đặt làm địa chỉ mặc định");
  };

  // 💡 HÀM THÊM ĐỊA CHỈ MỚI
  const handleAddAddress: SubmitHandler<AddressFormData> = (data) => {
    const newAddress: Address = {
      id: String(Date.now()), // Dùng timestamp làm ID mới
      type: data.type,
      name: data.name,
      phone: data.phone,
      address: data.address,
      isDefault: false,
    };
    setAddresses((prev) => [newAddress, ...prev]);
    reset();
    setShowAddForm(false);
    showSuccessToast("Đã thêm địa chỉ mới");
  };

  // Đăng ký fields cho Form
  React.useEffect(() => {
    register("name", { required: "Vui lòng nhập họ tên" });
    register("phone", {
      required: "Vui lòng nhập số điện thoại",
      pattern: {
        value: /^(0|\+84)[0-9]{9,10}$/,
        message: "Số điện thoại không hợp lệ",
      },
    });
    register("address", { required: "Vui lòng nhập địa chỉ" });
    register("type");
  }, [register]);

  const watchedAddressType = watch("type");
  const renderError = (field: keyof AddressFormData) =>
    errors[field] ? (
      <Text style={styles.errorText}>{errors[field]?.message}</Text>
    ) : null;

  const headerHeight = 50 + insets.top;

  return (
    <View style={styles.fullContainer}>
      <Header title="Địa chỉ giao hàng" showBack={true} onBack={goBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: headerHeight }}
      >
        <View style={styles.contentPadding}>
          {/* Add New Address Button */}
          {!showAddForm && (
            <TouchableOpacity
              onPress={() => setShowAddForm(true)}
              style={styles.addButton}
              activeOpacity={0.7}
            >
              <View style={styles.addButtonContent}>
                <Feather name="plus" size={20} color={COLORS.emerald600} />
                <Text style={styles.addButtonText}>Thêm địa chỉ mới</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* 💡 Add Address Form */}
          {showAddForm && (
            <View style={styles.addFormCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Thêm địa chỉ mới</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddForm(false);
                    reset();
                  }}
                  style={styles.closeFormButton}
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={20} color={COLORS.slate600} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.formScrollWrapper}>
                {/* ⚠️ FORM WRAPPER */}
                <View style={styles.formWrapper}>
                  {/* Address Type */}
                  <View style={styles.formField}>
                    <Text style={styles.label}>Loại địa chỉ</Text>
                    <View style={styles.typeGrid}>
                      {Object.entries(ADDRESS_TYPES).map(([key, value]) => {
                        const Icon = Feather;
                        const isActive = watchedAddressType === key;

                        return (
                          <TouchableOpacity
                            key={key}
                            onPress={() =>
                              setValue("type", key as "home" | "work" | "other")
                            }
                            style={[
                              styles.typeButton,
                              isActive && styles.typeButtonActive,
                            ]}
                          >
                            <Icon
                              name={value.iconName as FeatherIconName}
                              size={20}
                              color={
                                isActive ? COLORS.emerald600 : COLORS.slate700
                              }
                            />
                            <Text
                              style={[
                                styles.typeLabel,
                                {
                                  color: isActive
                                    ? COLORS.emerald600
                                    : COLORS.slate700,
                                },
                              ]}
                            >
                              {value.label}
                            </Text>
                            {/* 💡 Checkmark visual feedback */}
                            <View
                              style={[
                                styles.typeCheckmark,
                                isActive && styles.typeCheckmarkActive,
                              ]}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

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
                        onChangeText={(text) =>
                          setValue("name", text, { shouldValidate: true })
                        }
                        placeholder="Nguyễn Văn A"
                        style={[styles.input, errors.name && styles.inputError]}
                      />
                    </View>
                    {renderError("name")}
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
                        placeholder="0901234567"
                        keyboardType="phone-pad"
                        style={[
                          styles.input,
                          errors.phone && styles.inputError,
                        ]}
                      />
                    </View>
                    {renderError("phone")}
                  </View>

                  {/* Address */}
                  <View style={styles.formField}>
                    <Text style={styles.label}>
                      Địa chỉ <Text style={styles.requiredText}>*</Text>
                    </Text>
                    <View style={styles.inputWrapperArea}>
                      <Feather
                        name="map-pin"
                        size={20}
                        color={COLORS.slate400}
                        style={styles.iconArea}
                      />
                      <TextInput
                        onChangeText={(text) =>
                          setValue("address", text, { shouldValidate: true })
                        }
                        placeholder="Số nhà, tên đường,..."
                        style={[
                          styles.textAreaInput,
                          errors.address && styles.inputError,
                        ]}
                        multiline={true}
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>
                    {renderError("address")}
                  </View>

                  {/* Submit Buttons */}
                  <View style={styles.submitButtonsRow}>
                    <TouchableOpacity
                      onPress={() => {
                        setShowAddForm(false);
                        reset();
                      }}
                      style={styles.cancelFormButton}
                    >
                      <Text style={styles.cancelFormButtonText}>Hủy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleSubmit(handleAddAddress)}
                      style={styles.saveFormButton}
                    >
                      <LinearGradient
                        colors={[COLORS.emerald600, COLORS.teal600]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      <Text style={styles.saveFormButtonText}>Lưu địa chỉ</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          )}

          {/* Addresses List (Giữ nguyên) */}
          <View style={styles.addressesList}>
            {addresses.map((address) => {
              const typeInfo = ADDRESS_TYPES[address.type];
              const TypeIcon = Feather;

              return (
                <View
                  key={address.id}
                  style={[
                    styles.addressCard,
                    address.isDefault && styles.addressDefaultRing,
                  ]}
                >
                  {/* Address Header */}
                  <View style={styles.addressHeaderRow}>
                    <View style={styles.addressTypeTag}>
                      <TypeIcon
                        name={typeInfo.iconName as FeatherIconName}
                        size={20}
                        color={typeInfo.color}
                      />
                      <Text
                        style={[
                          styles.addressTypeText,
                          { color: typeInfo.color },
                        ]}
                      >
                        {typeInfo.label}
                      </Text>
                      {address.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Mặc định</Text>
                        </View>
                      )}
                    </View>

                    {/* Delete Button */}
                    <TouchableOpacity
                      onPress={() => deleteAddress(address.id)}
                      style={styles.deleteButton}
                      activeOpacity={0.8}
                    >
                      <Feather name="trash-2" size={16} color={COLORS.red500} />
                    </TouchableOpacity>
                  </View>

                  {/* Address Details */}
                  <View style={styles.addressDetails}>
                    <View style={styles.detailRow}>
                      <Feather
                        name="map-pin"
                        size={16}
                        color={COLORS.slate400}
                        style={styles.detailIcon}
                      />
                      <View style={styles.detailInfo}>
                        <Text style={styles.detailName} numberOfLines={1}>
                          {address.name}
                        </Text>
                        <Text style={styles.detailText}>{address.phone}</Text>
                        <Text style={styles.detailText}>{address.address}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionEdit]}
                      onPress={() =>
                        Alert.alert("Chức năng", "Chỉnh sửa địa chỉ")
                      }
                    >
                      <Text style={styles.actionEditText}>Chỉnh sửa</Text>
                    </TouchableOpacity>

                    {!address.isDefault && (
                      <TouchableOpacity
                        onPress={() => setDefaultAddress(address.id)}
                        style={[styles.actionButton, styles.actionDefault]}
                      >
                        <Text style={styles.actionDefaultText}>
                          Đặt mặc định
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Empty State */}
          {addresses.length === 0 && (
            <View style={styles.emptyView}>
              <View style={styles.emptyIconWrapper}>
                <Feather name="map-pin" size={64} color={COLORS.slate400} />
              </View>
              <Text style={styles.emptyTitle}>Chưa có địa chỉ nào</Text>
              <Text style={styles.emptySubtitle}>
                Thêm địa chỉ để tiện lợi khi đặt hàng
              </Text>
            </View>
          )}
        </View>

        {/* Padding cuối cùng */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
export default AddressPage;

// -----------------------------------------------------------
// 💡 STYLE SHEET
// -----------------------------------------------------------

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: COLORS.slate50 },
  contentPadding: { paddingHorizontal: 16, paddingVertical: 16 },

  // --- Form styles ---
  addFormCard: {
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
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  formTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.slate800 },
  closeFormButton: { padding: 4 },
  formScrollWrapper: { paddingBottom: 10 }, // Để ScrollView chứa form không bị cắt nút Submit
  formWrapper: { gap: 16 },
  formField: { marginBottom: 16 },
  label: {
    color: COLORS.slate700,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  requiredText: { color: COLORS.red500 },
  // Input fields
  inputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  inputWrapperArea: { position: "relative" },
  icon: { position: "absolute", left: 16, zIndex: 1 },
  iconArea: { position: "absolute", left: 16, top: 12, zIndex: 1 },
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
  textAreaInput: {
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
    minHeight: 100,
    textAlignVertical: "top",
  },
  inputError: { borderColor: COLORS.red500, backgroundColor: COLORS.red50 },
  errorText: { color: COLORS.red500, fontSize: 12, marginTop: 4 },
  // Type Select
  typeGrid: { flexDirection: "row", gap: 8, justifyContent: "space-between" },
  typeButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: 12,
    borderWidth: 2,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    position: "relative",
  },
  typeButtonActive: {
    borderColor: COLORS.emerald500,
    backgroundColor: COLORS.emerald50,
  },
  typeLabel: { fontSize: 12, fontWeight: "500", color: COLORS.slate700 }, // Added color
  typeCheckmark: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 0,
    height: 0,
  }, // Placeholder
  typeCheckmarkActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.emerald500,
  }, // ✅ ĐỊNH NGHĨA BỊ THIẾU
  // Submit Buttons
  submitButtonsRow: { flexDirection: "row", gap: 12, paddingTop: 8 },
  cancelFormButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  cancelFormButtonText: {
    color: COLORS.slate700,
    fontSize: 16,
    fontWeight: "bold",
  },
  saveFormButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: COLORS.emerald500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  saveFormButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    zIndex: 1,
  },
  saveButtonBackground: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  // --- Address List Styles ---
  addButton: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.emerald500,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  addButtonText: { color: COLORS.emerald600, fontSize: 16, fontWeight: "600" },
  addressesList: { gap: 12 },
  addressCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  addressDefaultRing: { borderWidth: 2, borderColor: COLORS.emerald500 },
  addressHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
    paddingBottom: 8,
  },
  addressTypeTag: { flexDirection: "row", alignItems: "center", gap: 8 },
  addressTypeText: { fontWeight: "bold" },
  defaultBadge: {
    backgroundColor: COLORS.emerald100,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    color: COLORS.emerald600,
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteButton: { padding: 4, color: COLORS.red500, borderRadius: 4 },
  addressDetails: { marginBottom: 16 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  detailIcon: { marginTop: 2 },
  detailInfo: { flex: 1 },
  detailName: { color: COLORS.slate800, fontWeight: "500", marginBottom: 2 },
  detailText: { color: COLORS.slate600, fontSize: 14 },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: "500",
    borderWidth: 1,
  },
  actionEdit: { borderColor: COLORS.slate200, backgroundColor: COLORS.white },
  actionEditText: { color: COLORS.slate700, fontSize: 14 },
  actionDefault: {
    borderColor: COLORS.emerald500,
    backgroundColor: COLORS.emerald50,
  },
  actionDefaultText: {
    color: COLORS.emerald600,
    fontSize: 14,
    fontWeight: "600",
  },
  emptyView: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    textAlign: "center",
  },
  emptyIconWrapper: {
    width: 128,
    height: 128,
    backgroundColor: COLORS.slate100,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    color: COLORS.slate800,
    fontSize: 20,
    marginBottom: 8,
    fontWeight: "bold",
  },
  emptySubtitle: { color: COLORS.slate600, fontSize: 14 },
});
