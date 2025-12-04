import React, { createContext, useContext, useState, ReactNode } from "react";
import Toast from "react-native-toast-message"; // 💡 Import Toast cho React Native
// import { CartItem } from './CartContext'; // Đảm bảo CartItem được định nghĩa/import

// ----------------------------------------------------------------------
// Định nghĩa Kiểu dữ liệu (Tái định nghĩa CartItem nếu cần, hoặc giả định import)
// ----------------------------------------------------------------------

// Tái định nghĩa CartItem để component này độc lập (giả định cấu trúc giống hệt file CartContext gốc)
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size: "S" | "M" | "L";
  ice: number;
  sugar: number;
  toppings: string[];
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "delivering"
    | "completed"
    | "cancelled";
  createdAt: Date;
  deliveryAddress: string;
  paymentMethod: string;
  phone: string;
  note?: string;
  estimatedTime?: string;
  voucher?: string;
  discount?: number;
}

interface OrderContextType {
  orders: Order[];
  createOrder: (orderData: Omit<Order, "id" | "createdAt" | "status">) => void;
  cancelOrder: (orderId: string) => void;
  getOrderById: (orderId: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// ----------------------------------------------------------------------
// Provider Component
// ----------------------------------------------------------------------

export function OrderProvider({ children }: { children: ReactNode }) {
  // Dữ liệu mock ban đầu
  const initialOrders: Order[] = [
    {
      id: "ORD001",
      items: [
        {
          id: "1",
          productId: "1",
          name: "Trà Sữa Trân Châu Đường Đen",
          image:
            "https://images.unsplash.com/photo-1670468642364-6cacadfb7bb0?w=400",
          price: 45000,
          quantity: 2,
          size: "L",
          ice: 70,
          sugar: 50,
          toppings: ["Trân châu", "Kem cheese"],
        },
      ],
      total: 90000,
      status: "delivering",
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      deliveryAddress: "123 Nguyễn Huệ, Quận 1, TP.HCM",
      paymentMethod: "cash",
      phone: "0901234567",
      estimatedTime: "15-20 phút",
    },
    {
      id: "ORD002",
      items: [
        {
          id: "2",
          productId: "7",
          name: "Trà Đào Cam Sả",
          image:
            "https://images.unsplash.com/photo-1645467148762-6d7fd24d7acf?w=400",
          price: 39000,
          quantity: 1,
          size: "M",
          ice: 100,
          sugar: 30,
          toppings: ["Thạch dừa"],
        },
      ],
      total: 39000,
      status: "completed",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      deliveryAddress: "123 Nguyễn Huệ, Quận 1, TP.HCM",
      paymentMethod: "momo",
      phone: "0901234567",
    },
  ];

  const [orders, setOrders] = useState<Order[]>(initialOrders);

  const showSuccessToast = (message: string) => {
    Toast.show({
      type: "success_custom",
      text1: "Đơn hàng",
      text2: message,
      position: "top",
      visibilityTime: 2000,
    });
  };

  const createOrder = (
    orderData: Omit<Order, "id" | "createdAt" | "status">
  ) => {
    const newOrder: Order = {
      ...orderData,
      // Tạo ID mới an toàn hơn trong môi trường async/multi-user
      id: `ORD${String(Date.now()).slice(-6)}`,
      createdAt: new Date(),
      status: "pending",
    };
    setOrders((prev) => [newOrder, ...prev]);
    showSuccessToast("Đặt hàng thành công!"); // 💡 Thay thế toast.success
  };

  const cancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        // Chỉ cho phép hủy nếu trạng thái là pending hoặc confirmed
        if (
          order.id === orderId &&
          ["pending", "confirmed"].includes(order.status)
        ) {
          showSuccessToast("Đã hủy đơn hàng"); // 💡 Thay thế toast.success
          return { ...order, status: "cancelled" as const };
        }
        return order;
      })
    );
  };

  const getOrderById = (orderId: string) => {
    return orders.find((order) => order.id === orderId);
  };

  return (
    <OrderContext.Provider
      value={{ orders, createOrder, cancelOrder, getOrderById }}
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
