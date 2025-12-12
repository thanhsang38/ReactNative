import React, { createContext, ReactNode, useContext, useState } from "react";
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
  isDrink: boolean;
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
    // ✅ LOGIC GỘP THÔNG MINH BẮT ĐẦU TẠI ĐÂY

    const isDrinkItem = item.isDrink;
    let existingItemIndex = -1;

    if (isDrinkItem) {
      // --- LOGIC GỘP CHẶT CHẼ (ĐỒ UỐNG) ---
      // Gộp nếu ProductID, Size, Ice, VÀ Sugar giống hệt nhau
      existingItemIndex = items.findIndex(
        (cartItem) =>
          cartItem.productId === item.productId &&
          cartItem.size === item.size &&
          cartItem.ice === item.ice &&
          cartItem.sugar === item.sugar
      );
    } else {
      // --- LOGIC GỘP LỎNG LẺO (ĐỒ ĂN/MÓN MẶC ĐỊNH) ---
      // Gộp chỉ cần ProductID giống nhau (và Size mặc định là M)
      existingItemIndex = items.findIndex(
        (cartItem) => cartItem.productId === item.productId
        // Không cần kiểm tra size, ice, sugar vì chúng được coi là mặc định/không liên quan
      );
    }

    if (existingItemIndex !== -1) {
      // Nếu đã tồn tại, tăng số lượng
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += item.quantity;
      setItems(updatedItems);
    } else {
      // Nếu chưa tồn tại, thêm mới với ID duy nhất
      const newItem: CartItem = {
        ...item,
        id: `${item.productId}-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)}`, // Đảm bảo ID duy nhất
      };
      setItems((prev) => [...prev, newItem]);
    }

    showSuccessToast("Đã thêm vào giỏ hàng!");
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
