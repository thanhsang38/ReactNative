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
}

export interface ProductRow {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string; // Giả định cột chứa URL ảnh sản phẩm
  category?: string;
  // Thêm các trường khác nếu cần
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

interface BaserowListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
// -------------------------------------------------------------
const USERS_TABLE_ID = 760467;
const PRODUCTS_TABLE_ID = 760465;
const CATEGORIES_TABLE_ID = 760466;
const USER_ADDRESSES_TABLE_ID = 768059;
const ORDERS_TABLE_ID = 760468;
const ORDER_DETAILS_TABLE_ID = 760469;
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
    const API_TOKEN = "78WCfXpbSExuHx3YTJ2CfO2rnMSSCosd"; // token của bạn

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
    estimatedTime?: string;
    voucherId?: number;
  }
): Promise<{ success: boolean; data?: OrderRow; message?: string }> => {
  // 1. CHUẨN BỊ PAYLOAD CHO ORDER HEADER
  const orderHeaderPayload = {
    name: `ORD-${new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14)}-${Math.floor(Math.random() * 1000)}-${userId}`,
    notes: orderData.note || null,
    status: "pending", // Default status
    amount: orderData.total,
    method: orderData.paymentMethod,
    address: [orderData.deliveryAddressId],
    estimated_time: orderData.estimatedTime || null, // Vẫn giữ estimated_time nếu bạn muốn
    voucher: orderData.voucherId ? [orderData.voucherId] : [],
    user: [userId],
  };

  const orderEndpoint = `${ORDERS_TABLE_ID}/?user_field_names=true`;

  try {
    // 2. TẠO ORDER HEADER
    const orderResponse: OrderRow = await axiosClient.post(
      orderEndpoint,
      cleanPayload(orderHeaderPayload)
    );
    const newOrderId = orderResponse.id;

    // 3. TẠO ORDER DETAIL ITEMS
    const detailPromises = orderData.items.map((item) => {
      const productIdNumber = Number(item.productId);

      const detailPayload = {
        quantity: item.quantity,
        price: Number(item.price),
        total: item.quantity * Number(item.price),
        size: item.size,
        ice: item.ice,
        sugar: item.sugar,
        is_drink: item.isDrink,
        Product: [productIdNumber], // Liên kết đến sản phẩm
        orders: [newOrderId], // Liên kết đến Order Header vừa tạo
      };

      const detailEndpoint = `${ORDER_DETAILS_TABLE_ID}/?user_field_names=true`;
      return axiosClient.post(detailEndpoint, cleanPayload(detailPayload));
    });

    await Promise.all(detailPromises);

    // 4. Trả về Order Header đã tạo
    return { success: true, data: orderResponse };
  } catch (error: any) {
    console.error("❌ [CREATE ORDER ERROR]", error.response?.data || error);

    return {
      success: false,
      message: "Không thể tạo đơn hàng (Lỗi Header hoặc Details).",
    };
  }
};

/**
 * ✅ FIX: Lấy danh sách Đơn hàng theo User ID
 */
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

/**
 * ⭐ Lấy chi tiết 1 đơn hàng theo ID
 */
export const getOrderById = async (
  orderId: number
): Promise<{ success: boolean; data?: any; message?: string }> => {
  try {
    // 1. Lấy Order header
    const orderEndpoint = `${ORDERS_TABLE_ID}/${orderId}/?user_field_names=true`;
    const orderRes = await axiosClient.get(orderEndpoint);

    if (!orderRes || !orderRes.id) {
      return { success: false, message: "Không tìm thấy đơn hàng." };
    }

    // 2. Query OrderDetail theo orderId
    const filters = JSON.stringify({
      filter_type: "AND",
      filters: [
        {
          type: "link_row_has",
          field: "orders",
          value: orderId.toString(),
        },
      ],
    });

    const detailEndpoint = `${ORDER_DETAILS_TABLE_ID}/?user_field_names=true&filters=${encodeURIComponent(
      filters
    )}`;

    const detailsRes = await axiosClient.get<
      BaserowListResponse<OrderDetailRow>
    >(detailEndpoint);

    const details = detailsRes.results || [];

    // 3. Lấy các product liên quan
    const productIds = details.map((d) => d.Product?.[0]?.id).filter(Boolean);

    const uniqueProductIds = [...new Set(productIds)];
    let productMap: Record<number, ProductRow> = {};

    if (uniqueProductIds.length > 0) {
      const productResults = await Promise.all(
        uniqueProductIds.map((pid) => getProductById(pid))
      );

      productResults.forEach((p) => {
        if (p?.id) productMap[p.id] = p;
      });
    }

    // 4. Gộp detail + product
    const mergedDetails = details.map((item) => {
      const pid = item.Product?.[0]?.id;
      return {
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        size: item.size,
        ice: item.ice,
        sugar: item.sugar,
        is_drink: item.is_drink,
        product: productMap[pid] || null,
      };
    });

    // 5. Chuẩn hoá dữ liệu trả về
    const normalizedOrder = {
      id: orderRes.id,
      name: orderRes.name,
      notes: orderRes.notes,
      status: orderRes.status,
      amount: orderRes.amount,
      method: orderRes.method,
      user: orderRes.user?.[0]?.id || null,
      address: orderRes.address?.[0] || null,
      voucher: orderRes.voucher?.[0] || null,
      orderDetail: mergedDetails,
    };

    return {
      success: true,
      data: normalizedOrder,
    };
  } catch (error: any) {
    console.error("❌ [GET ORDER BY ID ERROR]", error.response?.data || error);

    return {
      success: false,
      message: "Không thể tải chi tiết đơn hàng.",
    };
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
