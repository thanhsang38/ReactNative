import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import Toast from "react-native-toast-message";
import { useAuth } from "./AuthContext";
// ✅ IMPORT CHÍNH XÁC CÁC INTERFACES VÀ HÀM TỪ API
import {
  createOrder as createOrderApi,
  fetchOrdersWithDetails as fetchOrdersApi,
  getOrderDetails,
  OrderCartItem,
  OrderDetailRow,
  OrderRow,
  updateOrder as updateOrderApi,
  updateVoucherUsedStatus,
} from "../app/services/baserowApi";
import { listenOrderUpdates } from "../app/services/orderRealtime";

// ----------------------------------------------------------------------
// Định nghĩa Kiểu dữ liệu và Interface (Client-Side Simplified)
// ----------------------------------------------------------------------

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
  ) => Promise<
    { success: boolean; data?: OrderRow; message?: string } | undefined
  >;

  cancelOrder: (orderId: string, onSuccess?: () => void) => Promise<void>;

  getOrderItems: (orderId: string) => Promise<OrderDetailRow[] | null>;
  hasRealtimeUpdate: boolean;
  reloadOrders: () => Promise<void>;
  realtimePayload: {
    orderId: string;
    status: string;
    orderName: string;
  } | null;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const fetchOrdersWithDetails = async (
  userId: number
): Promise<Order[]> => {
  // Gọi hàm logic đã viết ở baserowApi.ts
  return await fetchOrdersApi(userId);
};

// ----------------------------------------------------------------------
// Provider Component
// ----------------------------------------------------------------------

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [hasRealtimeUpdate, setHasRealtimeUpdate] = useState(false);
  const [realtimePayload, setRealtimePayload] = useState<{
    orderId: string;
    orderName: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const stop = listenOrderUpdates(user.id, (data) => {
      console.log("📦 Order update received:", data);
      setRealtimePayload(data);
      setHasRealtimeUpdate(true);
    });

    return stop;
  }, [user?.id]);

  const showSuccessToast = (message: string) => {
    Toast.show({
      type: "success",
      text1: "Đơn hàng",
      text2: message,
      position: "top",
      visibilityTime: 2000,
    });
  };
  const reloadOrders = async () => {
    if (!user?.id) return;

    setIsLoadingOrders(true);
    try {
      const latestOrders = await fetchOrdersApi(user.id);
      setOrders(latestOrders);
      setHasRealtimeUpdate(false); // ✅ reset cờ
    } catch (e) {
      console.error("Reload orders error:", e);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const createOrder = async (
    orderData: CreateOrderInput,
    onSuccess?: () => void
  ) => {
    if (!user || !user.id) {
      Toast.show({ type: "error", text1: "Lỗi", text2: "Vui lòng đăng nhập." });
      return;
    }

    try {
      // Gọi hàm createOrder đã được tối ưu từ baserowApi.ts
      const result = await createOrderApi(user.id, orderData);

      if (result.success && result.data) {
        // Nếu có dùng Voucher, cập nhật trạng thái đã sử dụng
        if (orderData.voucherId) {
          await updateVoucherUsedStatus(orderData.voucherId, true);
        }

        showSuccessToast("Đặt hàng thành công!");
        if (onSuccess) onSuccess();
        return result;
      } else {
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: result.message || "Tạo đơn hàng thất bại.",
        });
        return result;
      }
    } catch (e) {
      console.error("Lỗi trong OrderProvider:", e);
      Toast.show({ type: "error", text1: "Lỗi", text2: "Đã có lỗi xảy ra." });
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
    <OrderContext.Provider
      value={{
        createOrder,
        cancelOrder,
        getOrderItems,
        hasRealtimeUpdate,
        reloadOrders,
        realtimePayload,
      }}
    >
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
