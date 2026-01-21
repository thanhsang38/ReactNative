import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location"; // 💡 1. Import Location
import React, { ComponentProps, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { getOSRMDistance } from "./services/mapService"; // 💡 IMPORT HÀM TÍNH KHOẢNG CÁCH

import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  AddressRow,
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from "./services/baserowApi";

// --- Types & Config ---
type FeatherIconName = ComponentProps<typeof Feather>["name"];

interface Address extends Omit<AddressRow, "id" | "user" | "name"> {
  id: string;
  name: string;
  phone: string;
  isDefault: boolean;
}

interface AddressFormData {
  street: string;
  province: { code: string; name: string } | null;
  district: { code: string; name: string } | null;
  ward: { code: string; name: string } | null;
  type: "home" | "work" | "other";
}
interface LocationItem {
  code: string;
  name: string;
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
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  emerald50: "#f0fff4",
  emerald100: "#d1fae5",
  emerald600: "#059669",
  red50: "#fef2f2",
  red500: "#ef4444",
  teal600: "#0d9488",
};

export function AddressPage({ goBack }: { goBack: () => void }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = 50 + insets.top;
  const { updateDistance } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false); // 💡 2. State loading GPS
  const [editingId, setEditingId] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [wards, setWards] = useState<LocationItem[]>([]);

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddressFormData>({
    defaultValues: {
      type: "home",
      province: null,
      district: null,
      ward: null,
      street: "",
    },
  });

  const watchedProvince = watch("province");
  const watchedDistrict = watch("district");
  const watchedType = watch("type");

  // 💡 3. Hàm lấy vị trí hiện tại
  const handleGetCurrentLocation = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Quyền truy cập", "Vui lòng cho phép truy cập vị trí.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      let reverse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverse.length > 0) {
        const addr = reverse[0];
        console.log("Dữ liệu GPS nhận được:", addr);

        // 1. Điền Số nhà / Tên đường
        const streetName = `${addr.name || ""} ${addr.street || ""}`.trim();
        setValue("street", streetName);

        // 2. TỰ ĐỘNG CHỌN TỈNH/THÀNH
        // So khớp tên thành phố từ GPS với danh sách provinces từ API
        const provinceNameFromGPS = addr.city || addr.region;
        const foundProvince = provinces.find(
          (p: any) =>
            provinceNameFromGPS?.includes(p.name) ||
            p.name.includes(provinceNameFromGPS || ""),
        );

        if (foundProvince) {
          setValue("province", {
            code: foundProvince.code,
            name: foundProvince.name,
          });

          // 3. TỰ ĐỘNG CHỌN QUẬN/HUYỆN (Cần đợi API load districts xong)
          // Vì useEffect theo dõi watchedProvince, ta gọi fetch districts trực tiếp ở đây để nhanh
          const distRes = await fetch(
            `https://provinces.open-api.vn/api/p/${foundProvince.code}?depth=2`,
          );
          const distData = await distRes.json();
          const apiDistricts = distData.districts || [];
          setDistricts(apiDistricts); // Cập nhật state để UI hiện danh sách huyện

          const districtNameFromGPS = addr.district || addr.subregion;
          const foundDistrict = apiDistricts.find(
            (d: any) =>
              districtNameFromGPS?.includes(d.name) ||
              d.name.includes(districtNameFromGPS || ""),
          );

          if (foundDistrict) {
            setValue("district", {
              code: foundDistrict.code,
              name: foundDistrict.name,
            });

            // 4. TỰ ĐỘNG CHỌN PHƯỜNG/XÃ
            const wardRes = await fetch(
              `https://provinces.open-api.vn/api/d/${foundDistrict.code}?depth=2`,
            );
            const wardData = await wardRes.json();
            const apiWards = wardData.wards || [];
            setWards(apiWards);

            // Phường xã từ GPS thường nằm ở subregion hoặc street (nếu street là tên phường)
            const wardNameFromGPS = addr.subregion || addr.street;
            const foundWard = apiWards.find(
              (w: any) =>
                wardNameFromGPS?.includes(w.name) ||
                w.name.includes(wardNameFromGPS || ""),
            );

            if (foundWard) {
              setValue("ward", { code: foundWard.code, name: foundWard.name });
            }
          }
        }

        Toast.show({
          type: "success",
          text1: "Đã tự động điền địa chỉ",
          text2: "Vui lòng kiểm tra lại độ chính xác.",
        });
      }
    } catch (error) {
      // console.error(error);
      Alert.alert("Lỗi", "Không thể xác định vị trí tự động.");
    } finally {
      setIsLocating(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const result = await getAddresses(user.id);
      if (result.success && result.data) {
        const mapped: Address[] = result.data.map((addr) => ({
          ...addr,
          id: addr.id.toString(),
          name: user.name || "Người dùng",
          phone: user.phone || "N/A",
          isDefault: addr.is_default || false,
        }));
        console.log("địa chỉ TẢI VỀ:", mapped);
        setAddresses(mapped.sort((a, b) => (b.isDefault ? -1 : 1)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/p/")
      .then((res) => res.json())
      .then((data) => setProvinces(data));
    fetchAddresses();
  }, [user?.id]);

  useEffect(() => {
    if (watchedProvince) {
      fetch(
        `https://provinces.open-api.vn/api/p/${watchedProvince.code}?depth=2`,
      )
        .then((res) => res.json())
        .then((data) => setDistricts(data.districts));
    }
  }, [watchedProvince]);

  useEffect(() => {
    if (watchedDistrict) {
      fetch(
        `https://provinces.open-api.vn/api/d/${watchedDistrict.code}?depth=2`,
      )
        .then((res) => res.json())
        .then((data) => setWards(data.wards));
    }
  }, [watchedDistrict]);

  const handleAddOrUpdate: SubmitHandler<AddressFormData> = async (data) => {
    if (!data.province || !data.district || !data.ward || !data.street) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    setIsSubmitting(true);
    const fullAddress = `${data.street}, ${data.ward.name}, ${data.district.name}, ${data.province.name}`;
    try {
      const result = editingId
        ? await updateAddress(Number(editingId), {
            address: fullAddress,
            type: data.type,
          })
        : await createAddress(user!.id, {
            address: fullAddress,
            type: data.type,
          });

      if (result.success) {
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Đã lưu địa chỉ",
        });
        setShowAddForm(false);
        setEditingId(null);
        reset();
        fetchAddresses();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (addr: Address) => {
    setEditingId(addr.id);
    const parts = addr.address.split(", ");
    setValue("street", parts[0] || "");
    setValue("type", addr.type as any);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Xóa địa chỉ", "Bạn có chắc chắn muốn xóa?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          await deleteAddress(Number(id));
          fetchAddresses();
        },
      },
    ]);
  };

  const setDefault = async (id: string) => {
    setIsSubmitting(true);
    try {
      // 1. Cập nhật is_default trên Baserow (giữ nguyên logic cũ của bạn)
      const updatePromises = addresses.map((addr) =>
        updateAddress(Number(addr.id), { is_default: addr.id === id }),
      );
      await Promise.all(updatePromises);

      // 2. Tìm địa chỉ vừa được đặt làm mặc định trong danh sách local
      const newDefaultAddr = addresses.find((addr) => addr.id === id);

      if (newDefaultAddr) {
        // 💡 BƯỚC QUAN TRỌNG: Tính lại phí ship ngay lập tức cho địa chỉ mới này
        const geo = await Location.geocodeAsync(newDefaultAddr.address);
        if (geo && geo.length > 0) {
          const km = await getOSRMDistance(geo[0].latitude, geo[0].longitude);

          // Cập nhật số km mới vào CartContext
          updateDistance(km);

          Toast.show({
            type: "success",
            text1: "Đã đổi địa chỉ mặc định",
            text2: `Phí ship đã được cập nhật (${km.toFixed(1)}km)`,
          });
        }
      }

      fetchAddresses(); // Tải lại danh sách để UI cập nhật tích xanh
    } catch (error) {
      console.error("Lỗi khi đặt mặc định:", error);
      Alert.alert("Lỗi", "Không thể cập nhật địa chỉ mặc định.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.fullContainer}>
      <Header title="Địa chỉ giao hàng" showBack={true} onBack={goBack} />
      <ScrollView
        style={{ paddingTop: headerHeight }}
        contentContainerStyle={styles.contentPadding}
      >
        {!showAddForm ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingId(null);
              reset();
              setShowAddForm(true);
            }}
          >
            <Feather name="plus" size={20} color={COLORS.emerald600} />
            <Text style={styles.addButtonText}>Thêm địa chỉ mới</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.addFormCard}>
            <View style={styles.formHeaderRow}>
              <Text style={styles.formTitle}>
                {editingId ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
              </Text>

              {/* 💡 4. Nút lấy vị trí hiện tại */}
              <TouchableOpacity
                style={styles.locationBtn}
                onPress={handleGetCurrentLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color={COLORS.emerald600} />
                ) : (
                  <>
                    <Feather
                      name="navigation"
                      size={14}
                      color={COLORS.emerald600}
                    />
                    <Text style={styles.locationBtnText}>Vị trí hiện tại</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.typeGrid}>
              {Object.entries(ADDRESS_TYPES).map(([key, val]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setValue("type", key as any)}
                  style={[
                    styles.typeButton,
                    watchedType === key && styles.typeButtonActive,
                  ]}
                >
                  <Feather
                    name={val.iconName}
                    size={18}
                    color={
                      watchedType === key ? COLORS.emerald600 : COLORS.slate600
                    }
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color:
                        watchedType === key
                          ? COLORS.emerald600
                          : COLORS.slate600,
                    }}
                  >
                    {val.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={provinces}
              labelField="name"
              valueField="code"
              placeholder="Tỉnh/Thành phố"
              value={watchedProvince?.code}
              onChange={(item) => {
                setValue("province", { code: item.code, name: item.name });
                setValue("district", null);
                setValue("ward", null);
              }}
            />
            <Dropdown
              style={[styles.dropdown, !watchedProvince && { opacity: 0.5 }]}
              data={districts}
              labelField="name"
              valueField="code"
              placeholder="Quận/Huyện"
              disable={!watchedProvince}
              value={watchedDistrict?.code}
              onChange={(item) => {
                setValue("district", { code: item.code, name: item.name });
                setValue("ward", null);
              }}
            />
            <Dropdown
              style={[styles.dropdown, !watchedDistrict && { opacity: 0.5 }]}
              data={wards}
              labelField="name"
              valueField="code"
              placeholder="Phường/Xã"
              disable={!watchedDistrict}
              value={watch("ward")?.code}
              onChange={(item) =>
                setValue("ward", { code: item.code, name: item.name })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Số nhà, tên đường..."
              value={watch("street")}
              onChangeText={(t) => setValue("street", t)}
            />
            <View style={styles.submitButtonsRow}>
              <TouchableOpacity
                style={styles.cancelFormButton}
                onPress={() => setShowAddForm(false)}
              >
                <Text>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveFormButton}
                onPress={handleSubmit(handleAddOrUpdate)}
              >
                <LinearGradient
                  colors={[COLORS.emerald600, COLORS.teal600]}
                  style={StyleSheet.absoluteFill}
                />
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Lưu địa chỉ
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isLoading ? (
          <ActivityIndicator color={COLORS.emerald600} />
        ) : (
          addresses.map((addr) => (
            <View
              key={addr.id}
              style={[
                styles.addressCard,
                addr.isDefault && styles.addressDefaultRing,
              ]}
            >
              <View style={styles.addressHeaderRow}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Text style={styles.addressTypeText}>
                    {ADDRESS_TYPES[addr.type].label}
                  </Text>
                  {addr.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Mặc định</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={() => handleDelete(addr.id)}>
                  <Feather name="trash-2" size={16} color={COLORS.red500} />
                </TouchableOpacity>
              </View>
              <Text style={styles.detailName}>
                {addr.name} | {addr.phone}
              </Text>
              <Text style={styles.detailText}>{addr.address}</Text>

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(addr)}
                >
                  <Text style={styles.actionText}>Chỉnh sửa</Text>
                </TouchableOpacity>
                {!addr.isDefault && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.btnSetDefault]}
                    onPress={() => setDefault(addr.id)}
                  >
                    <Text style={styles.actionTextDefault}>Đặt mặc định</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
export default AddressPage;

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: "#f8fafc" },
  contentPadding: { padding: 16 },
  addButton: {
    width: "100%",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.emerald600,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  addButtonText: { color: COLORS.emerald600, fontWeight: "bold" },
  addFormCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    elevation: 4,
    gap: 12,
    marginBottom: 16,
  },
  formHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  formTitle: { fontSize: 18, fontWeight: "bold" },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.emerald50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationBtnText: {
    color: COLORS.emerald600,
    fontSize: 12,
    fontWeight: "bold",
  },
  typeGrid: { flexDirection: "row", gap: 8, marginBottom: 8 },
  typeButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 8,
    alignItems: "center",
    gap: 4,
  },
  typeButtonActive: {
    borderColor: COLORS.emerald600,
    backgroundColor: COLORS.emerald50,
  },
  dropdown: {
    height: 50,
    borderColor: COLORS.slate200,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.slate100,
  },
  placeholderStyle: { fontSize: 14, color: COLORS.slate400 },
  selectedTextStyle: { fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.slate100,
  },
  submitButtonsRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelFormButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 8,
  },
  saveFormButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "center",
  },
  addressCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  addressDefaultRing: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.emerald600,
  },
  addressHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  addressTypeText: { fontWeight: "bold", color: COLORS.slate800 },
  detailName: { fontWeight: "500", marginBottom: 4, color: COLORS.slate700 },
  detailText: { color: COLORS.slate500, fontSize: 13, marginBottom: 12 },
  defaultBadge: {
    backgroundColor: COLORS.emerald100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: COLORS.emerald600,
    fontSize: 10,
    fontWeight: "bold",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  btnSetDefault: {
    backgroundColor: COLORS.emerald50,
    borderColor: COLORS.emerald600,
  },
  actionText: { fontSize: 13, color: COLORS.slate600 },
  actionTextDefault: {
    fontSize: 13,
    color: COLORS.emerald600,
    fontWeight: "600",
  },
});
