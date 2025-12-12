import React, { createContext, ReactNode, useContext, useState } from "react";
import Toast from "react-native-toast-message";
import { useAuth } from "./AuthContext";
// ✅ IMPORT CHÍNH XÁC CÁC INTERFACES VÀ HÀM TỪ API
import {
  createOrder as createOrderApi,
  getOrderDetails,
  getOrders,
  getProductById,
  OrderCartItem,
  OrderDetailRow,
  OrderRow,
  updateOrder as updateOrderApi,
} from "../app/services/baserowApi";

// ----------------------------------------------------------------------
// Định nghĩa Kiểu dữ liệu và Interface (Client-Side Simplified)
// ----------------------------------------------------------------------

// ✅ FIX: CartItem Client-side KẾ THỪA từ OrderCartItem (API Input)
// và bổ sung trường id để dùng làm key trong React/Logic Cart
export interface CartItem extends OrderCartItem {
  id: string; // Giữ lại ID cục bộ cho React Keys/Logic Cart
}

// ✅ FIX: SỬ DỤNG TYPE ALIAS DỰA TRÊN OrderRow TỪ API FILE (CHỈ GIỮ LẠI CÁC TRƯỜNG CÓ TRONG BASEROW HOẶC ĐÃ RESOLVE)
export type Order = {
  id: string; // ID luôn là string trên Client
  name?: string; // Tên đơn hàng (nếu có)
  items: CartItem[];
  total: number;
  status: OrderRow["status"];
  deliveryAddress: string; // Chuỗi địa chỉ đầy đủ (Resolve từ Link Row Address)
  paymentMethod: string; // Tên phương thức thanh toán
  voucher?: string; // Tên voucher (Resolve từ Link Row Voucher)
  note?: string; // notes từ OrderRow
};

export type CreateOrderInput = {
  items: OrderCartItem[];
  total: number;
  deliveryAddressId: number;
  paymentMethod: string;
  voucherId?: number;
  deliveryAddressText: string;
  note?: string; // notes
};

interface OrderContextType {
  createOrder: (
    orderData: CreateOrderInput,
    onSuccess?: () => void
  ) => Promise<void>;

  cancelOrder: (orderId: string, onSuccess?: () => void) => Promise<void>;

  getOrderItems: (orderId: string) => Promise<OrderDetailRow[] | null>;
}




const OrderContext = createContext<OrderContextType | undefined>(undefined);
const mapOrderRowToOrder = async (row: OrderRow, details: OrderDetailRow[]): Promise<Order> => {
  const getLinkRowValue = (linkRow: any, columnKey: string = "value"): string | undefined => {
    if (!linkRow || linkRow.length === 0) return undefined;
    return linkRow[0][columnKey] || linkRow[0].value;
  };

  // Địa chỉ (Lấy chuỗi address từ Link Row)
  const deliveryAddressText =
    row.address && row.address.length > 0
      ? getLinkRowValue(row.address, "address") ||
      getLinkRowValue(row.address, "value") ||
      "Địa chỉ không rõ"
      : "Địa chỉ không rõ";

  // Voucher (Lấy tên/mã voucher từ Link Row Voucher)
  const voucherName =
    row.voucher && row.voucher.length > 0
      ? getLinkRowValue(row.voucher, "name") ||
      getLinkRowValue(row.voucher, "value")
      : undefined;

  // ✅ FIX CRITICAL: Xử lý Link Row/Object cho Status
  const rawStatus = row.status as unknown as { value: string } | string;
  let resolvedStatus: Order["status"] = "pending";

  if (typeof rawStatus === "string") {
    resolvedStatus = rawStatus as Order["status"];
  } else if (
    rawStatus &&
    typeof rawStatus === "object" &&
    "value" in rawStatus
  ) {
    const statusValue = rawStatus.value.toLowerCase();
    if (
      [
        "pending",
        "confirmed",
        "preparing",
        "delivering",
        "completed",
        "cancelled",
      ].includes(statusValue)
    ) {
      resolvedStatus = statusValue as Order["status"];
    }
  }

  // --- LẤY CHI TIẾT SẢN PHẨM ĐÚNG QUA API ---
  const orderDetails = row.orderDetail || [];

  const orderDetailIds = orderDetails.map((od: any) => od.id);

  const filteredDetails = details.filter((d: any) =>
    orderDetailIds.includes(d.id)
  );

  // --- MAP VỚI API LẤY PRODUCT FULL INFO ---
  const mappedItems: CartItem[] = await Promise.all(
    filteredDetails.map(async (detail: any) => {
      const productId = detail.productId || detail.Product?.[0]?.id;

      if (!productId) {
        console.warn("Thiếu productId ở detail:", detail.id);

        return {
          id: String(detail.id),
          productId: "0",
          name: "Sản phẩm lỗi",
          image: "https://placehold.co/64x64/f8fafc/94a3b8?text=Error",
          price: detail.price ?? 0,
          quantity: detail.quantity ?? 1,
          size: "M",
          ice: 0,
          sugar: 0,
          isDrink: false,
        };
      }

      // --- GỌI API LẤY SẢN PHẨM ---
      const product = await getProductById(productId);

      if (!product) {
        return {
          id: String(detail.id),
          productId: "0",
          name: "Sản phẩm lỗi",
          image: "https://placehold.co/64x64/f8fafc/94a3b8?text=Error",
          price: detail.price ?? 0,
          quantity: detail.quantity ?? 1,
          size: "M",
          ice: 0,
          sugar: 0,
          isDrink: false,
        };
      }

      // --- TRẢ KẾT QUẢ ĐÃ FULL INFO ---
      return {
        id: String(detail.id),
        productId: String(product.id),
        name: product.name,       // hoặc product.value tùy API bạn
        image: product.image,
        price: detail.price ?? product.price ?? 0,
        quantity: detail.quantity ?? 1,
        size: detail.size ?? "M",
        ice: detail.ice ?? 0,
        sugar: detail.sugar ?? 0,
        isDrink: detail.is_drink ?? true,
      };
    })
  );



  return {
    id: row.id.toString(),
    name: row.name, // Lấy tên đơn hàng
    items: mappedItems, // ✅ Dữ liệu chi tiết sản phẩm
    total: row.amount,
    status: resolvedStatus,

    deliveryAddress: deliveryAddressText,
    paymentMethod: row.method,

    // ✅ Gán giá trị cho các trường đã được thêm lại vào Order interface

    note: row.notes || undefined,
    voucher: voucherName,
  };
};

// ✅ EXPORT CÁC HÀM TẢI/MAP NÀY RA NGOÀI ĐỂ ORDERSPAGE CÓ THỂ GỌI TRỰC TIẾP
export const fetchOrdersWithDetails = async (
  userId: number
): Promise<Order[]> => {
  try {
    const orderResult = await getOrders(userId);

    if (orderResult.success && orderResult.data) {
      // 1. Tải tất cả Order Details song song
      const detailPromises = orderResult.data.map(async (row) => {
        const detailResult = await getOrderDetails(row.id);
        return detailResult.data || [];
      });

      const allDetails = await Promise.all(detailPromises);

      // 2. Map Orders Header với Order Details tương ứng
      const mappedOrdersPromises = orderResult.data.map((row, index) => {
        return mapOrderRowToOrder(row, allDetails[index]); // <--- async → Promise<Order>
      });

      const mappedOrders: Order[] = await Promise.all(mappedOrdersPromises);
      return mappedOrders;
    }
    return [];
  } catch (e) {
    console.error("Error fetching orders:", e);
    return [];
  }
};

// ----------------------------------------------------------------------
// Provider Component
// ----------------------------------------------------------------------

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const showSuccessToast = (message: string) => {
    Toast.show({
      type: "success_custom",
      text1: "Đơn hàng",
      text2: message,
      position: "top",
      visibilityTime: 2000,
    });
  };

  // 💡 HELPER: MAP OrderRow từ API về Order Client

  // TẢI ĐƠN HÀNG KHI USER THAY ĐỔI

  const createOrder = async (
    orderData: CreateOrderInput,
    onSuccess?: () => void // ✅ Callback onSuccess
  ) => {
    if (!user || !user.id) {
      Toast.show({
        type: "error",
        text1: "Lỗi",
        text2: "Vui lòng đăng nhập để tạo đơn hàng.",
      });
      return;
    }

    try {
      const result = await createOrderApi(user.id, {
        items: orderData.items,
        total: orderData.total,
        deliveryAddressId: orderData.deliveryAddressId,
        paymentMethod: orderData.paymentMethod,
        note: orderData.note,
        voucherId: orderData.voucherId,
      });

      if (result.success && result.data) {
        showSuccessToast("Đặt hàng thành công!");
        if (onSuccess) onSuccess();
      } else {
        Toast.show({
          type: "error",
          text1: "Lỗi API",
          text2: result.message || "Không thể tạo đơn hàng trên server.",
        });
      }
    } catch (e) {
      console.error("Error creating order:", e);
      Toast.show({
        type: "error",
        text1: "Lỗi hệ thống",
        text2: "Lỗi mạng hoặc server khi tạo đơn.",
      });
    }
  };

  const cancelOrder = async (orderId: string, onSuccess?: () => void) => {
    try {
      const result = await updateOrderApi(Number(orderId), {
        status: "cancelled",
      });

      if (result.success) {
        showSuccessToast("Đã hủy đơn hàng thành công!");
        if (onSuccess) onSuccess();
      } else {
        Toast.show({
          type: "error",
          text1: "Lỗi API",
          text2: result.message || "Không thể hủy đơn hàng trên server.",
        });
      }
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Lỗi hệ thống",
        text2: "Lỗi mạng hoặc server khi hủy đơn.",
      });
    }
  };
  const getOrderItems = async (
    orderId: string
  ): Promise<OrderDetailRow[] | null> => {
    try {
      const res = await getOrderDetails(Number(orderId));
      return res.data ?? null; // tránh undefined
    } catch (error) {
      console.log("getOrderById error:", error);
      return null;
    }
  };


  return (
    <OrderContext.Provider value={{ createOrder, cancelOrder, getOrderItems }}>
      {children}
    </OrderContext.Provider>
  );
}

// ----------------------------------------------------------------------
// Custom Hook
// ----------------------------------------------------------------------

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
}
