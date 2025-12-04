import React, { createContext, useContext, useState, ReactNode } from "react";
import Toast from "react-native-toast-message"; // 💡 Import Toast cho React Native

// ----------------------------------------------------------------------
// Định nghĩa Kiểu dữ liệu và Interface
// ----------------------------------------------------------------------

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
  // Lưu ý: Mảng trong React Native cần serialization tốt hơn,
  // nhưng ta giữ nguyên kiểu string[]
  toppings: string[];
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ----------------------------------------------------------------------
// Provider Component
// ----------------------------------------------------------------------

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const showSuccessToast = (message: string) => {
    Toast.show({
      type: "success_custom",
      text1: "Giỏ hàng",
      text2: message,
      position: "top",
      visibilityTime: 2000,
    });
  };

  const addToCart = (item: Omit<CartItem, "id">) => {
    // 💡 Tối ưu hóa: Kiểm tra xem mục đã tồn tại với cùng options chưa
    // Để đơn giản, chúng ta tạo id duy nhất mới cho mỗi lần thêm:
    const newItem: CartItem = {
      ...item,
      id: `${item.productId}-${Date.now()}`,
    };
    setItems((prev) => [...prev, newItem]);
    showSuccessToast("Đã thêm vào giỏ hàng!"); // 💡 Thay thế toast.success
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    showSuccessToast("Đã xóa khỏi giỏ hàng"); // 💡 Thay thế toast.success
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    // showSuccessToast("Đã xóa hết sản phẩm khỏi giỏ hàng");
  };

  const getTotalItems = () => {
    // Tính tổng số lượng
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    // Tính tổng tiền
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ----------------------------------------------------------------------
// Custom Hook
// ----------------------------------------------------------------------

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
