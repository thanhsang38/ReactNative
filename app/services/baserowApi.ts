import { isAxiosError } from "axios";
import CryptoJS from "crypto-js";
import axiosClient from "./axiosClient";

// -------------------------------------------------------------
// TYPES
// -------------------------------------------------------------

export interface UserRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  birthday?: string | null;
  gender?: "male" | "female" | "other" | null;
  avatar?: string | null;
  password_hash: string;
  favorites?: { id: number }[] | [];
  order_count?: number; // Cột Count từ bảng Orders
  voucher_count?: number; // Cột Count từ bảng Vouchers
  rating?: number | string; // Cột Rollup tính trung bình sao
}

export interface ProductRow {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string; // Giả định cột chứa URL ảnh sản phẩm
  category?: string;
  salePrice?: number | null;
}
export interface CategoryRow {
  id: number;
  name: string; // Tên danh mục (Cột name)
  image: string; // ✅ FIX: Tên cột Icon/Emoji (Cột image)
  category_id: string; // ID dùng để lọc sản phẩm (Giả định là name hoặc ID Baserow)
}
export interface AddressRow {
  id: number;
  is_default: boolean;
  address: string;
  type: string; // home, work, other
  user: [{ id: number }] | []; // Foreign key to user (UserRow ID)
}

export interface OrderCartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size: string; // ✅ Cần cột này trong OrderDetail
  ice: number; // ✅ Cần cột này trong OrderDetail
  sugar: number; // ✅ Cần cột này trong OrderDetail
  isDrink: boolean; // ✅ Cần cột này trong OrderDetail
}
export interface OrderDetailRow {
  id: number;
  quantity: number;
  price: number; // Price unit
  total: number; // quantity * price
  Product: [{ id: number }]; // Link to Product Table
  orders: [{ id: number }]; // Link back to Orders Table
  size?: string;
  ice?: number;
  sugar?: number;
  is_drink?: boolean;
}

export interface OrderRow {
  id: number;
  name?: string;
  notes?: string | null;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "delivering"
    | "completed"
    | "cancelled";
  amount: number; // total
  method: string; // payment_method
  address: [{ id: number; address: string }] | [];
  user: [{ id: number }];
  orderDetail: [{ id: number }] | []; // Link to OrderDetails
  voucher: [{ id: number; name: string }] | []; // Bao gồm tên Voucher
}
export interface VoucherRow {
  id: number;
  Name: string; // Tên voucher
  code: string;
  description: string;
  discount: number; // Giá trị số
  minOrder: number;
  maxDiscount?: number | null;
  expiry: string; // Baserow trả về chuỗi ISO
  type: "percent" | "fixed" | "shipping"; // Kiểu single select
  used: boolean;
  order_voucher: [{ id: number }] | []; // Link Row
  user: [{ id: number }] | []; // Link Row (Người sở hữu)
}
export interface ReviewRow {
  id: number;
  rating: number;
  comment: string;
  product: [{ id: number }];
  user: [{ id: number }];
  reviewerName: string;
  reviewerAvatar: string;
  is_edited: boolean;
}
interface BaserowListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
// -------------------------------------------------------------
const API_TOKEN = "78WCfXpbSExuHx3YTJ2CfO2rnMSSCosd";
const USERS_TABLE_ID = 760467;
const PRODUCTS_TABLE_ID = 760465;
const CATEGORIES_TABLE_ID = 760466;
const USER_ADDRESSES_TABLE_ID = 768059;
const ORDERS_TABLE_ID = 760468;
const ORDER_DETAILS_TABLE_ID = 760469;
const VOUCHERS_TABLE_ID = 769574;
const USER_FAVORITES_FIELD = "field_6574405";
const REVIEWS_TABLE_ID = 780986;

// -------------------------------------------------------------
const normalizeCategoryName = (name: string): string => {
  if (!name) return "";
  // Chuyển tiếng Việt có dấu thành không dấu, chuyển sang chữ thường, thay thế khoảng trắng bằng _
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/đ/g, "d"); // Xử lý chữ đ/Đ
};
// -------------------------------------------------------------
// bảng người dùng
// -------------------------------------------------------------
export const findUserByEmail = async (email: string) => {
  try {
    const cleanedEmail = email.trim().toLowerCase();

    console.log("🔎 [CHECK EMAIL] cleanedEmail =", cleanedEmail);

    const response = await axiosClient.get(`${USERS_TABLE_ID}/`, {
      params: {
        user_field_names: true,
        filter__field_6452566__equal: cleanedEmail, // bạn nói đúng ID thì giữ nguyên
      },
    });

    console.log("📌 [CHECK EMAIL RESULT]", response);

    return {
      success: true,
      data: response.results?.[0] ?? null,
    };
  } catch (error) {
    console.log("❌ [CHECK EMAIL ERROR]", error);
    return {
      success: false,
      data: null,
      message: "Không thể kiểm tra email.",
    };
  }
};

// -------------------------------------------------------------
// CLEAN PAYLOAD
// -------------------------------------------------------------

const cleanPayload = (data: Record<string, any>) => {
  const cleaned: Record<string, any> = {};
  for (const key in data) {
    const value = data[key];
    if (value !== null && value !== undefined && value !== "") {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

// -------------------------------------------------------------
// FIXED REGISTER USER
// -------------------------------------------------------------
export const registerUser = async (userData: any) => {
  try {
    console.log("🚀 [REGISTER START] userData =", userData);

    const check = await findUserByEmail(userData.email);

    console.log("📌 [EMAIL CHECK RESULT]", check);

    if (!check.success) {
      console.log("❌ [EMAIL CHECK FAILED]");
      return { success: false, message: "Không thể kiểm tra email." };
    }

    if (check.data) {
      console.log("⚠️ [EMAIL EXISTS] => STOP REGISTER");
      return { success: false, message: "Email đã được sử dụng." };
    }

    const hashedPassword = CryptoJS.SHA256(userData.password).toString();

    const payload = {
      name: userData.name,
      email: userData.email.trim().toLowerCase(),
      phone: userData.phone,
      password_hash: hashedPassword,
    };

    console.log("📝 [REGISTER PAYLOAD]", payload);

    const response = await axiosClient.post(`${USERS_TABLE_ID}/`, payload, {
      params: { user_field_names: true },
    });

    console.log("✅ [REGISTER SUCCESS]", response);

    return { success: true, data: response };
  } catch (error) {
    console.log("❌ [REGISTER ERROR]", error);
    return { success: false, message: "Đăng ký thất bại." };
  }
};

// -------------------------------------------------------------
// LOGIN USER
// -------------------------------------------------------------

export const loginUser = async (
  email: string,
  password: string
): Promise<{
  success: boolean;
  data?: Omit<UserRow, "password_hash">;
  message?: string;
}> => {
  try {
    const result = await findUserByEmail(email);

    if (!result.success) {
      return { success: false, message: result.message };
    }

    const user = result.data;
    if (!user) {
      return { success: false, message: "Tài khoản không tồn tại." };
    }

    const enteredHash = CryptoJS.SHA256(password).toString();
    if (enteredHash !== user.password_hash) {
      return { success: false, message: "Mật khẩu không chính xác." };
    }

    const { password_hash, ...safeUser } = user;
    return { success: true, data: safeUser };
  } catch {
    return { success: false, message: "Lỗi hệ thống. Vui lòng thử lại." };
  }
};
export const updateUser = async (
  userId: number,
  userData: Partial<Omit<UserRow, "id" | "password_hash">>
): Promise<{
  success: boolean;
  data?: Omit<UserRow, "password_hash">;
  message?: string;
}> => {
  // 💡 Chỉ gửi các trường có dữ liệu, không gửi các trường null/rỗng
  const payloadToPatch = cleanPayload(userData);
  const endpoint = `${USERS_TABLE_ID}/${userId}/`;

  try {
    console.log("🚀 [UPDATE START] User ID:", userId);
    console.log("📝 [UPDATE PAYLOAD]", payloadToPatch);

    // Baserow API PATCH request
    const response: UserRow = await axiosClient.patch(
      endpoint,
      payloadToPatch,
      {
        params: { user_field_names: true },
      }
    );

    console.log("✅ [UPDATE SUCCESS]", response);

    // Baserow trả về toàn bộ hàng đã cập nhật (bao gồm hash). Ta loại bỏ hash.
    const { password_hash, ...safeUser } = response;
    return { success: true, data: safeUser };
  } catch (error: any) {
    console.error("❌ [UPDATE ERROR]", error.response?.data || error);

    let detailMessage =
      "Cập nhật hồ sơ thất bại. Lỗi mạng hoặc dữ liệu không hợp lệ.";
    if (error.response?.data) {
      // Lỗi Validation 400
      detailMessage = `Lỗi Validation: ${JSON.stringify(error.response.data)}`;
    } else if (isAxiosError(error) && !error.response) {
      detailMessage = "Lỗi mạng: Không thể kết nối tới Baserow.";
    }

    return { success: false, message: detailMessage };
  }
};
export const getUserById = async (userId: number): Promise<UserRow | null> => {
  try {
    const response: UserRow = await axiosClient.get(
      `${USERS_TABLE_ID}/${userId}/?user_field_names=true`
    );
    return response;
  } catch (error) {
    console.error(`❌ [GET USER BY ID ERROR] ID: ${userId}`, error);
    return null;
  }
};
export const uploadFileToBaserow = async (fileUri: string) => {
  try {
    const fileExt = fileUri.split(".").pop();
    const mime =
      fileExt === "png"
        ? "image/png"
        : fileExt === "jpg" || fileExt === "jpeg"
        ? "image/jpeg"
        : "application/octet-stream";

    const file = await fetch(fileUri);
    const blob = await file.blob();

    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      name: `upload.${fileExt}`,
      type: mime,
    } as any);

    const API_URL = "https://api.baserow.io/api/user-files/upload-file/";
    // token của bạn

    const uploadResponse = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${API_TOKEN}`,
      },
      body: formData,
    });

    const text = await uploadResponse.text();

    if (!uploadResponse.ok) {
      console.error("UPLOAD FAIL RAW:", text);
      throw new Error("Baserow upload failed");
    }

    const json = JSON.parse(text);
    return json; // json.url chính là link ảnh
  } catch (error) {
    console.log("❌ [UPLOAD ERROR]", error);
    throw error;
  }
};
// -------------------------------------------------------------
// bảng sản phẩm
// -------------------------------------------------------------
export const getProducts = async (): Promise<{
  success: boolean;
  data?: ProductRow[];
  totalCount: number;
  message?: string;
}> => {
  // ✅ FIX: Chỉ dùng limit lớn nhất (Giả định max 5000)
  let query = `?user_field_names=true&limit=5000`;

  const endpoint = `${PRODUCTS_TABLE_ID}/${query}`;

  // 💡 FIX/DEBUG: In ra URL API cuối cùng
  console.log("-----------------------------------------");
  console.log(`DEBUG: Final Product API URL (Full Load): ${endpoint}`);
  console.log("-----------------------------------------");

  try {
    const response: BaserowListResponse<any> = await axiosClient.get(endpoint);

    const normalizedProducts: ProductRow[] = (response.results || []).map(
      (product) => {
        let categoryValue = "";

        // XỬ LÝ CỘT LINK (trả về Array(1) Object)
        if (Array.isArray(product.category) && product.category.length > 0) {
          categoryValue = product.category[0].value;
        } else if (typeof product.category === "string") {
          categoryValue = product.category;
        }

        return {
          id: product.id,
          name: product.name,
          description: product.description || "Chưa có mô tả",
          price: product.price || 0,
          salePrice: product.salePrice || null,
          image:
            product.image ||
            "https://placehold.co/150x150/f0f9ff/64748b?text=No+Image",
          // CHUẨN HÓA: Gán giá trị chuẩn hóa (sinh_to) cho cột category để lọc
          category: normalizeCategoryName(categoryValue),
          rating: product.rating || 0,
          soldCount: product.soldCount || 0,
        };
      }
    );

    return {
      success: true,
      data: normalizedProducts as ProductRow[],
      totalCount: response.count, // ✅ TRẢ VỀ TỔNG SỐ LƯỢNG
    };
  } catch (error: any) {
    console.error("❌ [GET PRODUCTS ERROR]", error.response?.data || error);

    let detailMessage =
      "Không thể tải danh sách sản phẩm. Lỗi mạng hoặc server.";
    if (isAxiosError(error) && !error.response) {
      detailMessage = "Lỗi mạng: Không thể kết nối tới Baserow.";
    } else if (error.response?.status === 404) {
      detailMessage = `Lỗi 404: Không tìm thấy bảng Sản phẩm (ID: ${PRODUCTS_TABLE_ID}).`;
    }

    return { success: false, message: detailMessage, totalCount: 0 };
  }
};
const normalizeSingleProduct = (product: any): ProductRow => {
  let categoryValue = "";

  // XỬ LÝ CỘT LINK (trả về Array(1) Object)
  if (Array.isArray(product.category) && product.category.length > 0) {
    categoryValue = product.category[0].value;
  } else if (typeof product.category === "string") {
    categoryValue = product.category;
  }

  return {
    id: product.id,
    name: product.name,
    description: product.description || "Chưa có mô tả",
    price: product.price || 0,
    salePrice: product.salePrice || null,
    image:
      product.image ||
      "https://placehold.co/150x150/f0f9ff/64748b?text=No+Image",
    category: normalizeCategoryName(categoryValue),
  };
};

/**
 * ✅ HÀM MỚI: Lấy 1 sản phẩm theo ID
 */
export const getProductById = async (
  productId: number
): Promise<ProductRow | null> => {
  const endpoint = `${PRODUCTS_TABLE_ID}/${productId}/?user_field_names=true`;

  try {
    console.log("🚀 [GET PRODUCT BY ID] Endpoint:", endpoint);

    const productData = await axiosClient.get(endpoint);

    if (productData) {
      return normalizeSingleProduct(productData);
    }
    return null;
  } catch (error: any) {
    console.error(
      "❌ [GET PRODUCT BY ID ERROR]",
      error.response?.data || error
    );
    if (error.response?.status === 404) {
      return null;
    }
    throw new Error("Không thể tải chi tiết sản phẩm.");
  }
};

export const getAllProductsForRelated = async (): Promise<ProductRow[]> => {
  // Lấy tối đa 5000 bản ghi (hoặc max limit Baserow cho phép)
  const endpoint = `${PRODUCTS_TABLE_ID}/?user_field_names=true&limit=5000`;

  try {
    console.log("🚀 [GET ALL PRODUCTS FOR RELATED] Endpoint:", endpoint);

    const response: BaserowListResponse<any> = await axiosClient.get(endpoint);

    // Ánh xạ và chuẩn hóa tất cả sản phẩm
    return (response.results || []).map(normalizeSingleProduct);
  } catch (error) {
    console.error("❌ [GET ALL PRODUCTS FOR RELATED ERROR]", error);
    // Trả về mảng rỗng nếu có lỗi để UI không bị crash
    return [];
  }
};
export const getFavoriteProductsByUser = async (
  userId: number
): Promise<ProductRow[]> => {
  const filters = {
    filter_type: "AND",
    filters: [
      {
        type: "link_row_has",
        field: "favorites", // 👈 TÊN CỘT LINK ROW Ở PRODUCT
        value: userId.toString(),
      },
    ],
  };

  const endpoint = `${PRODUCTS_TABLE_ID}/?user_field_names=true&filters=${encodeURIComponent(
    JSON.stringify(filters)
  )}`;

  const res = await axiosClient.get(endpoint);
  console.log("FAVORITES RAW RESPONSE:", res);

  return res.results ?? [];
};

// -------------------------------------------------------------
// bảng danh mục
// -------------------------------------------------------------
export const getCategories = async (): Promise<{
  success: boolean;
  data?: CategoryRow[];
  message?: string;
}> => {
  const endpoint = `${CATEGORIES_TABLE_ID}/?user_field_names=true`;

  try {
    console.log("🚀 [GET CATEGORIES] Endpoint:", endpoint);

    const response: BaserowListResponse<any> = await axiosClient.get(endpoint);

    console.log("✅ [GET CATEGORIES SUCCESS] Count:", response.count);

    const apiCategories = response.results || [];

    // Map dữ liệu để đảm bảo CategoryRow có category_id là ID lọc chuẩn
    const categoriesData: CategoryRow[] = apiCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      // ✅ SỬ DỤNG TÊN CỘT 'name' ĐỂ TẠO RA ID LỌC (ví dụ: Trà sữa -> trà_sua)
      category_id: normalizeCategoryName(cat.name),
      image: cat.image, // Dùng cột 'image' cho icon/emoji
    }));

    // Thêm option "Tất cả" thủ công cho UI
    const allCategories: CategoryRow[] = [
      { id: 0, name: "Tất cả", image: "✨", category_id: "all" },
      ...categoriesData,
    ];

    return {
      success: true,
      data: allCategories,
    };
  } catch (error: any) {
    console.error("❌ [GET CATEGORIES ERROR]", error.response?.data || error);

    let detailMessage = "Không thể tải danh mục. Lỗi mạng hoặc server.";
    if (isAxiosError(error) && !error.response) {
      detailMessage = "Lỗi mạng: Không thể kết nối tới Baserow.";
    } else if (error.response?.status === 404) {
      detailMessage = `Lỗi 404: Không tìm thấy bảng Danh mục (ID: ${CATEGORIES_TABLE_ID}). Vui lòng kiểm tra ID bảng.`;
    }

    return { success: false, message: detailMessage };
  }
};
// -------------------------------------------------------------
// TẠO ĐỊA CHỈ MỚI CHO NGƯỜI DÙNG
// -------------------------------------------------------------
export const createAddress = async (
  userId: number,
  addressData: { address: string; type: string } // ✅ Đã xóa phone
): Promise<{ success: boolean; data?: AddressRow; message?: string }> => {
  // Tên cột Baserow là 'name', 'address', 'type', và 'user' (cho FK)
  const payload = {
    address: addressData.address,
    type: addressData.type,
    is_default: false,
    user: [userId],
  };

  const endpoint = `${USER_ADDRESSES_TABLE_ID}/?user_field_names=true`;

  try {
    const response: AddressRow = await axiosClient.post(endpoint, payload);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("❌ [CREATE ADDRESS ERROR]", error.response?.data || error);

    let detailMessage = "Lỗi hệ thống khi tạo địa chỉ.";
    if (error.response?.data?.error) {
      detailMessage = `Lỗi Baserow: ${error.response.data.error}`;
    }

    return { success: false, message: detailMessage };
  }
};
export const getAddresses = async (
  userId: number
): Promise<{ success: boolean; data?: AddressRow[]; message?: string }> => {
  const filters = JSON.stringify({
    filter_type: "AND",
    filters: [
      {
        type: "link_row_has",
        field: "user", // 👉 tên field trong bảng address
        value: userId.toString(),
      },
    ],
  });

  const endpoint = `${USER_ADDRESSES_TABLE_ID}/?user_field_names=true&filters=${encodeURIComponent(
    filters
  )}`;

  console.log(`DEBUG: Address API URL for READ: ${endpoint}`);

  try {
    const response: BaserowListResponse<AddressRow> = await axiosClient.get(
      endpoint
    );
    return { success: true, data: response.results };
  } catch (error: any) {
    console.error("❌ [GET ADDRESSES ERROR]", error.response?.data || error);
    return { success: false, message: "Không thể tải danh sách địa chỉ." };
  }
};

export const updateAddress = async (
  addressId: number,
  // Payload cho phép cập nhật address, type, và is_default
  data: { address?: string; type?: string; is_default?: boolean }
): Promise<{ success: boolean; data?: AddressRow; message?: string }> => {
  const cleanedData = cleanPayload(data); // Loại bỏ các trường null/undefined

  if (Object.keys(cleanedData).length === 0) {
    return { success: false, message: "Không có dữ liệu để cập nhật." };
  }

  const endpoint = `${USER_ADDRESSES_TABLE_ID}/${addressId}/?user_field_names=true`;

  try {
    // Dùng PATCH để cập nhật một phần
    const response: AddressRow = await axiosClient.patch(endpoint, cleanedData);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("❌ [UPDATE ADDRESS ERROR]", error.response?.data || error);
    return { success: false, message: "Không thể cập nhật địa chỉ." };
  }
};
export const deleteAddress = async (
  addressId: number
): Promise<{ success: boolean; message?: string }> => {
  const endpoint = `${USER_ADDRESSES_TABLE_ID}/${addressId}/?user_field_names=true`;

  try {
    await axiosClient.delete(endpoint);
    return { success: true };
  } catch (error: any) {
    console.error("❌ [DELETE ADDRESS ERROR]", error.response?.data || error);
    return { success: false, message: "Không thể xóa địa chỉ." };
  }
};
// -------------------------------------------------------------
// Bảng đơn hàng và chi tiết đơn hàng
// -------------------------------------------------------------

export const createOrder = async (
  userId: number,
  orderData: {
    items: OrderCartItem[];
    total: number;
    deliveryAddressId: number;
    paymentMethod: string;
    note?: string;
    voucherId?: number;
  }
): Promise<{ success: boolean; data?: OrderRow; message?: string }> => {
  const orderHeaderPayload = {
    name: `ORD-${new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14)}-${userId}`,
    notes: orderData.note || null,
    status:
      orderData.paymentMethod === "banking" ? "awaiting_payment" : "pending",
    amount: orderData.total,
    method: orderData.paymentMethod,
    address: [orderData.deliveryAddressId],
    voucher: orderData.voucherId ? [orderData.voucherId] : [],
    user: [userId],
  };

  try {
    // Bước 1: Tạo Order Header
    const orderResponse: OrderRow = await axiosClient.post(
      `${ORDERS_TABLE_ID}/?user_field_names=true`,
      cleanPayload(orderHeaderPayload)
    );
    const newOrderId = orderResponse.id;
    const items = orderData.items;
    const chunkSize = 5; // Gửi 5 món cùng lúc mỗi đợt

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);

      // Tạo một nhóm các Promise để chạy song song trong nội bộ nhóm
      const chunkPromises = chunk.map((item) => {
        const detailPayload = {
          quantity: item.quantity,
          price: Number(item.price),
          total: item.quantity * Number(item.price),
          size: item.size,
          ice: item.ice,
          sugar: item.sugar,
          is_drink: item.isDrink,
          Product: [Number(item.productId)],
          orders: [newOrderId],
        };

        return axiosClient.post(
          `${ORDER_DETAILS_TABLE_ID}/?user_field_names=true`,
          cleanPayload(detailPayload)
        );
      });

      // Chờ cả nhóm 5 món tạo xong
      await Promise.all(chunkPromises);

      // Nghỉ một chút (khoảng 150ms) giữa các đợt để "thở"
      if (i + chunkSize < items.length) {
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    }

    return { success: true, data: orderResponse };
  } catch (error: any) {
    console.error("❌ [CREATE ORDER ERROR]", error.response?.data || error);
    return {
      success: false,
      message: "Không thể tạo đơn hàng do quá tải hoặc lỗi mạng.",
    };
  }
};

export const getOrders = async (
  userId: number
): Promise<{ success: boolean; data?: OrderRow[]; message?: string }> => {
  const filters = JSON.stringify({
    filter_type: "AND",
    filters: [
      {
        type: "link_row_has",
        field: "user", // 👉 sửa đúng tên cột link row của bạn
        value: userId.toString(),
      },
    ],
  });

  const endpoint = `${ORDERS_TABLE_ID}/?user_field_names=true&filters=${encodeURIComponent(
    filters
  )}`;
  try {
    const response: BaserowListResponse<OrderRow> = await axiosClient.get(
      endpoint
    );
    console.log("getOrders", response);
    return { success: true, data: response.results };
  } catch (error: any) {
    console.error("❌ [GET ORDERS ERROR]", error.response?.data || error);
    return { success: false, message: "Không thể tải danh sách đơn hàng." };
  }
};

export const fetchOrdersWithDetails = async (
  userId: number
): Promise<any[]> => {
  try {
    // 1. Lấy danh sách Đơn hàng của người dùng
    const orderResult = await getOrders(userId);
    if (
      !orderResult.success ||
      !orderResult.data ||
      orderResult.data.length === 0
    ) {
      return [];
    }

    const orderRows = orderResult.data;

    // 2. Lấy cache sản phẩm để có thông tin tên, ảnh
    const allProductsRes = await getProducts();
    const productMap = new Map<number, any>();
    allProductsRes.data?.forEach((p) => productMap.set(p.id, p));

    // 3. Lấy tất cả chi tiết của các đơn hàng này trong 1 request
    const orderIds = orderRows.map((row) => row.id).join(",");
    const detailsFilters = JSON.stringify({
      filter_type: "AND",
      filters: [{ type: "link_row_has", field: "orders", value: orderIds }],
    });

    // Gọi trực tiếp axiosClient vì đang ở trong file baserowApi
    const allDetailsRes = await axiosClient.get(
      `${ORDER_DETAILS_TABLE_ID}/?user_field_names=true&filters=${encodeURIComponent(
        detailsFilters
      )}`
    );
    const allDetails = (allDetailsRes as any).results || [];

    // 4. Phân loại chi tiết về đúng đơn hàng tương ứng
    const mappedOrders = orderRows.map((row) => {
      // Lọc các món thuộc về đơn hàng 'row.id' này
      const detailsForThisOrder = allDetails.filter(
        (d: any) => d.orders && d.orders.some((o: any) => o.id === row.id)
      );

      const mappedItems = detailsForThisOrder.map((detail: any) => {
        const productId = detail.Product?.[0]?.id;
        const product = productMap.get(productId);

        return {
          id: String(detail.id),
          productId: String(productId || 0),
          name: product?.name || "Sản phẩm cũ",
          image: product?.image || "https://placehold.co/64",
          price: detail.price ?? 0,
          quantity: detail.quantity ?? 1, // Lấy đúng số lượng từ OrderDetail
          size: detail.size ?? "M",
          ice: detail.ice ?? 0,
          sugar: detail.sugar ?? 0,
          isDrink: detail.is_drink ?? false,
        };
      });

      return {
        id: row.id.toString(),
        name: row.name,
        items: mappedItems, // Chỉ chứa món của đơn hàng này
        total: row.amount,
        status: (row.status as any)?.value || row.status,
        deliveryAddress: row.address?.[0]?.address || "Địa chỉ không rõ",
        paymentMethod: row.method,
        note: row.notes || "",
        voucher: row.voucher?.[0]?.name,
      };
    });

    return mappedOrders;
  } catch (e) {
    console.error("Lỗi fetchOrdersWithDetails:", e);
    return [];
  }
};
export const updatePaymentMethodToCash = async (orderId: number) => {
  const endpoint = `${ORDERS_TABLE_ID}/${orderId}/?user_field_names=true`;

  // Payload cập nhật
  const payload = {
    method: "cash", // Chuyển sang Tiền mặt
    status: "pending", // Chuyển về Chờ xác nhận (vì không cần check Webhook nữa)
  };

  try {
    console.log(
      `🚀 [UPDATE PAYMENT] Đang chuyển đơn hàng #${orderId} sang Tiền mặt...`
    );

    const response: OrderRow = await axiosClient.patch(endpoint, payload);

    console.log("✅ [UPDATE PAYMENT SUCCESS]", response);

    return {
      success: true,
      data: response,
    };
  } catch (error: any) {
    console.error("❌ [UPDATE PAYMENT ERROR]", error.response?.data || error);

    let message = "Không thể cập nhật phương thức thanh toán.";
    if (error.response?.data?.error === "ERROR_ROW_DOES_NOT_EXIST") {
      message = "Đơn hàng không tồn tại.";
    }

    return {
      success: false,
      message: message,
    };
  }
};
export const getOrderById = async (
  orderId: number
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    // 1. Lấy Order header
    const orderRes = await axiosClient.get(
      `${ORDERS_TABLE_ID}/${orderId}/?user_field_names=true`
    );

    // Lưu ý: axiosClient của bạn có thể trả về data trực tiếp hoặc qua .data
    const orderData = orderRes.id ? orderRes : orderRes.data;

    if (!orderData || !orderData.id) {
      return { success: false, message: "Không tìm thấy đơn hàng." };
    }

    // 2. Query OrderDetail
    const filters = JSON.stringify({
      filter_type: "AND",
      filters: [
        { type: "link_row_has", field: "orders", value: orderId.toString() },
      ],
    });

    const detailEndpoint = `${ORDER_DETAILS_TABLE_ID}/?user_field_names=true&filters=${encodeURIComponent(
      filters
    )}`;
    const detailsRes = await axiosClient.get<
      BaserowListResponse<OrderDetailRow>
    >(detailEndpoint);

    // Lưu ý: Kiểm tra results hoặc data tùy vào axiosClient
    const details =
      (detailsRes as any).results || (detailsRes as any).data?.results || [];

    // 3. Tải cache sản phẩm
    const allProductsRes = await getProducts();
    let productMap = new Map<number, any>();

    // Lưu ý quan trọng: Phải lấy đúng mảng sản phẩm từ .data
    const productsArray = allProductsRes.data || [];
    productsArray.forEach((p: any) => productMap.set(p.id, p));

    // 4. MAP thông tin
    const mergedDetails = details.map((item: any) => {
      const productId = item.Product?.[0]?.id;
      const productInfo = productMap.get(productId);

      // Xử lý lấy URL ảnh từ Baserow (thường là mảng các object)
      let imageUrl = "";
      if (productInfo?.image) {
        if (Array.isArray(productInfo.image) && productInfo.image.length > 0) {
          imageUrl = productInfo.image[0].url; // Lấy URL từ object đầu tiên trong mảng
        } else if (typeof productInfo.image === "string") {
          imageUrl = productInfo.image;
        }
      }

      return {
        id: item.id,
        productId: productId,
        name: productInfo?.name || "Sản phẩm không xác định",
        image: imageUrl || "https://placehold.co/200", // Ảnh mặc định nếu lỗi
        quantity: item.quantity || 1,
        price: item.price || 0,
        total: item.total || 0,
        size: item.size || "M",
        ice: item.ice || 0,
        sugar: item.sugar || 0,
        is_drink: item.is_drink || false,
      };
    });

    // 5. Tính tổng

    return {
      success: true,
      data: {
        id: orderData.id,
        name: orderData.name,
        status: orderData.status?.value || orderData.status,
        amount: orderData.amount,

        method: orderData.method,
        address:
          orderData.address?.[0]?.address || orderData.address?.[0] || "N/A",
        orderDetail: mergedDetails,
      },
    };
  } catch (error: any) {
    console.error("❌ [GET ORDER BY ID ERROR]", error);
    return { success: false, message: "Lỗi tải chi tiết đơn hàng." };
  }
};
export const getOrderDetails = async (
  orderId: number
): Promise<{ success: boolean; data?: OrderDetailRow[]; message?: string }> => {
  const endpoint = `${ORDER_DETAILS_TABLE_ID}/?user_field_names=true&filter__orders=${orderId}`;
  try {
    const response: BaserowListResponse<OrderDetailRow> = await axiosClient.get(
      endpoint
    );
    return { success: true, data: response.results };
  } catch (error: any) {
    console.error(
      "❌ [GET ORDER DETAILS ERROR]",
      error.response?.data || error
    );
    return { success: false, message: "Không thể tải chi tiết đơn hàng." };
  }
};
// CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG HOẶC CÁC TRƯỜNG KHÁC
export const updateOrder = async (
  orderId: number,
  data: Partial<OrderRow>
): Promise<{ success: boolean; data?: OrderRow; message?: string }> => {
  const cleanedData = cleanPayload(data);

  if (Object.keys(cleanedData).length === 0) {
    return { success: false, message: "Không có dữ liệu để cập nhật." };
  }
  const endpoint = `${ORDERS_TABLE_ID}/${orderId}/?user_field_names=true`;
  try {
    const response: OrderRow = await axiosClient.patch(endpoint, cleanedData);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("❌ [UPDATE ORDER ERROR]", error.response?.data || error);
    return { success: false, message: "Không thể cập nhật đơn hàng." };
  }
};
//----------------------------------------------------------------------------
//Bảng voucher
//----------------------------------------------------------------------------
export const getVouchers = async (
  userId: number
): Promise<{ success: boolean; data?: VoucherRow[]; message?: string }> => {
  const filters = JSON.stringify({
    filter_type: "AND",
    filters: [
      {
        type: "link_row_has",
        field: "user", // ✅ Cột Link Row tới bảng Users
        value: userId.toString(),
      },
    ],
  });

  const endpoint = `${VOUCHERS_TABLE_ID}/?user_field_names=true&filters=${encodeURIComponent(
    filters
  )}`;

  try {
    const response: BaserowListResponse<VoucherRow> = await axiosClient.get(
      endpoint
    );
    const normalizedVouchers: VoucherRow[] = response.results.map(
      (voucher) => ({
        ...voucher,
        type: (voucher.type as any)?.value || (voucher.type as any),
        expiry: (voucher.expiry as string)?.split("T")[0] || "", // Chỉ giữ lại ngày (YYYY-MM-DD)
      })
    ) as VoucherRow[];

    return { success: true, data: normalizedVouchers };
  } catch (error: any) {
    console.error("❌ [GET VOUCHERS ERROR]", error.response?.data || error);
    return { success: false, message: "Không thể tải danh sách voucher." };
  }
};
export const updateVoucherUsedStatus = async (
  voucherId: number,
  usedStatus: boolean
): Promise<{ success: boolean; message?: string }> => {
  const endpoint = `${VOUCHERS_TABLE_ID}/${voucherId}/`;

  try {
    console.log(
      `🚀 [VOUCHER UPDATE] Cập nhật Voucher ID ${voucherId} thành used=${usedStatus}`
    );

    await axiosClient.patch(
      endpoint,
      { used: usedStatus },
      {
        params: { user_field_names: true },
      }
    );

    console.log(`✅ [VOUCHER UPDATE SUCCESS]`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ [VOUCHER UPDATE ERROR]", error.response?.data || error);
    return {
      success: false,
      message: "Không thể cập nhật trạng thái voucher.",
    };
  }
};
//-------------------------------------------------------------------------------
//Bảng yêu thích
//-------------------------------------------------------------------------------

export const getFavoriteProductIds = async (
  userId: number
): Promise<number[]> => {
  const endpoint = `${USERS_TABLE_ID}/${userId}/?user_field_names=true`;

  try {
    const response: UserRow = await axiosClient.get(endpoint);

    const favoritesLinkRow = response.favorites;

    if (favoritesLinkRow && Array.isArray(favoritesLinkRow)) {
      // Trích xuất ID từ Link Row
      return favoritesLinkRow.map((f) => f.id);
    }
    return [];
  } catch (error) {
    console.error("❌ [GET FAVORITES ERROR]", error);
    return [];
  }
};
export const updateFavoriteProductIds = async (
  userId: number,
  productIds: number[]
): Promise<{ success: boolean; message?: string }> => {
  const payload = {
    [USER_FAVORITES_FIELD]: productIds, // ✅ QUAN TRỌNG
  };

  const endpoint = `${USERS_TABLE_ID}/${userId}/`;

  try {
    console.log("🚀 PATCH FAVORITES:", payload);
    await axiosClient.patch(endpoint, payload);
    return { success: true };
  } catch (error: any) {
    console.error("❌ [UPDATE FAVORITES ERROR]", error.response?.data || error);
    return {
      success: false,
      message: "Không thể cập nhật danh sách yêu thích.",
    };
  }
};
//-------------------------------------------------------------------------------
//Bảng đánh giá
//-------------------------------------------------------------------------------
export const createReview = async (payload: {
  rating: number;
  comment: string;
  productId: number;
  userId: number;
  is_edited: false;
}) => {
  const endpoint = `${REVIEWS_TABLE_ID}/?user_field_names=true`;

  const body = {
    rating: payload.rating,
    comment: payload.comment,
    product: [payload.productId], // Liên kết sản phẩm
    user: [payload.userId], // Liên kết người dùng
    is_edited: false,
  };

  try {
    const response = await axiosClient.post(endpoint, body);
    return { success: true, data: response };
  } catch (error: any) {
    console.error("❌ [CREATE REVIEW ERROR]", error.response?.data || error);
    return { success: false, message: "Không thể gửi đánh giá." };
  }
};
export const getReviewsByProduct = async (
  productId: number
): Promise<{ success: boolean; data: ReviewRow[] }> => {
  const filters = JSON.stringify({
    filter_type: "AND",
    filters: [
      { type: "link_row_has", field: "product", value: productId.toString() },
    ],
  });

  try {
    const response: BaserowListResponse<any> = await axiosClient.get(
      `${REVIEWS_TABLE_ID}/?user_field_names=true&filters=${encodeURIComponent(
        filters
      )}`
    );

    const reviews = response.results || [];

    // ✅ TỐI ƯU HÓA: Tìm tất cả User ID duy nhất trong danh sách đánh giá
    const uniqueUserIds = Array.from(
      new Set(
        reviews.map((r) => r.user?.[0]?.id).filter((id) => id !== undefined)
      )
    ) as number[];

    // Tải thông tin của các User này
    const usersData = await Promise.all(
      uniqueUserIds.map((id) => getUserById(id))
    );

    // Tạo một bản đồ (Map) để tra cứu nhanh: userId -> avatarUrl
    const avatarMap = new Map<number, string>();
    usersData.forEach((u) => {
      if (u) avatarMap.set(u.id, u.avatar || "");
    });

    // ✅ KẾT HỢP DỮ LIỆU
    const processedData: ReviewRow[] = reviews.map((item) => {
      const userId = item.user?.[0]?.id;
      return {
        ...item,
        reviewerName: item.user?.[0]?.value || "Người dùng ẩn danh",
        reviewerAvatar:
          avatarMap.get(userId) || "https://placehold.co/100x100?text=User",
      };
    });

    return { success: true, data: processedData };
  } catch (error) {
    console.error("Lỗi lấy đánh giá:", error);
    return { success: false, data: [] };
  }
};

export const updateReviewApi = async (
  reviewId: number,
  data: { rating: number; comment: string }
) => {
  try {
    const payload = {
      ...data,
      is_edited: true, // ✅ Đánh dấu đã sửa, sau này sẽ không cho sửa nữa
    };
    const response = await axiosClient.patch(
      `${REVIEWS_TABLE_ID}/${reviewId}/?user_field_names=true`,
      payload
    );
    return { success: true, data: response };
  } catch (error) {
    return { success: false, message: "Cập nhật đánh giá thất bại." };
  }
};
