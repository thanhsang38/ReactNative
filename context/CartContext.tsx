import { useAuth } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import Toast from "react-native-toast-message";

// ----------------------------------------------------------------------
// Types
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

export interface Voucher {
  id: number;
  code: string;
  type: "percent" | "fixed" | "shipping";
  discount: number;
  minOrder: number;
  maxDiscount?: number;
}
const calculateDistanceFee = (distance: number): number => {
  if (distance <= 0) return 0;
  if (distance <= 2) return 0; // Freeship dưới 2km
  if (distance <= 5) return 15000; // 2km - 5km giá 15k

  const extraKm = Math.ceil(distance - 5); // Làm tròn km tiếp theo
  return 15000 + extraKm * 5000; // Mỗi km thêm 5k
};
interface CartContextType {
  items: CartItem[];
  selectedVoucher: Voucher | null;

  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;

  setSelectedVoucher: (voucher: Voucher | null) => void;
  getShippingFee: () => number;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTotalPrice: () => number;
  distance: number;
  updateDistance: (km: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ----------------------------------------------------------------------
// Provider
// ----------------------------------------------------------------------

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const { user } = useAuth();
  const userId = user?.id; // hoặc user?.email
  const [distance, setDistance] = useState<number>(0);
  const updateDistance = (km: number) => {
    setDistance(km);
  };

  const showSuccessToast = (message: string) => {
    Toast.show({
      type: "custom",
      text1: "Giỏ hàng",
      props: { variant: "success" },
      text2: message,
      position: "top",
      visibilityTime: 2000,
    });
  };

  // ----------------------------------------------------------------------
  // Cart Actions
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (!userId) return;

    const loadCart = async () => {
      try {
        const data = await AsyncStorage.getItem(`cart_${userId}`);
        if (data) {
          const parsed = JSON.parse(data);
          setItems(parsed.items || []);
          setSelectedVoucher(parsed.selectedVoucher || null);
          console.log("CART: Loaded cart for user", userId);
        } else {
          setItems([]);
          setSelectedVoucher(null);
        }
      } catch (e) {
        console.log("CART: Load error", e);
      }
    };

    loadCart();
  }, [userId]);
  useEffect(() => {
    if (!userId) return;

    const saveCart = async () => {
      try {
        await AsyncStorage.setItem(
          `cart_${userId}`,
          JSON.stringify({
            items,
            selectedVoucher,
          })
        );
      } catch (e) {
        console.log("CART: Save error", e);
      }
    };

    saveCart();
  }, [items, selectedVoucher, userId]);

  const addToCart = (item: Omit<CartItem, "id">) => {
    const isDrinkItem = item.isDrink;
    let existingItemIndex = -1;

    if (isDrinkItem) {
      existingItemIndex = items.findIndex(
        (cartItem) =>
          cartItem.productId === item.productId &&
          cartItem.size === item.size &&
          cartItem.ice === item.ice &&
          cartItem.sugar === item.sugar
      );
    } else {
      existingItemIndex = items.findIndex(
        (cartItem) => cartItem.productId === item.productId
      );
    }

    if (existingItemIndex !== -1) {
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += item.quantity;
      setItems(updatedItems);
    } else {
      const newItem: CartItem = {
        ...item,
        id: `${item.productId}-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)}`,
      };
      setItems((prev) => [...prev, newItem]);
    }

    showSuccessToast("Đã thêm vào giỏ hàng!");
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    showSuccessToast("Đã xóa khỏi giỏ hàng");
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
    setSelectedVoucher(null);
  };

  // ----------------------------------------------------------------------
  // Calculations
  // ----------------------------------------------------------------------

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };
  const getShippingFee = () => {
    // Thay vì gán cứng 20k, hãy dùng hàm này
    let fee = calculateDistanceFee(distance);

    // Logic voucher giảm giá ship (giữ nguyên của bạn)
    if (selectedVoucher && selectedVoucher.type === "shipping") {
      if (getSubtotal() >= selectedVoucher.minOrder) {
        fee = Math.max(0, fee - selectedVoucher.discount);
      }
    }
    return fee;
  };

  const getDiscountAmount = () => {
    if (!selectedVoucher) {
      console.log("DEBUG: Không có voucher nào được chọn.");
      return 0;
    }

    const subtotal = getSubtotal();
    const minOrder = Number(selectedVoucher.minOrder) || 0;

    if (subtotal < minOrder) {
      console.log("DEBUG: Thất bại - Chưa đủ đơn tối thiểu.");
      return 0;
    }

    let discount = 0;
    const voucherValue = Number(selectedVoucher.discount) || 0;

    if (selectedVoucher.type === "percent") {
      discount = (subtotal * voucherValue) / 100;
      if (selectedVoucher.maxDiscount) {
        discount = Math.min(discount, Number(selectedVoucher.maxDiscount));
      }
    } else if (selectedVoucher.type === "fixed") {
      discount = voucherValue;
    }

    const finalDiscount = Math.round(discount);
    return finalDiscount;
  };

  const getTotalPrice = () => {
    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    const shipping = getShippingFee();

    const total = subtotal - discount + shipping;

    return Math.max(total, 0);
  };

  // ----------------------------------------------------------------------
  // ✅ AUTO REMOVE VOUCHER IF NOT ELIGIBLE
  // ----------------------------------------------------------------------

  useEffect(() => {
    if (selectedVoucher && getSubtotal() < selectedVoucher.minOrder) {
      setSelectedVoucher(null);
    }
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        selectedVoucher,

        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        distance,
        updateDistance,

        setSelectedVoucher,
        getShippingFee,
        getTotalItems,
        getSubtotal,
        getDiscountAmount,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ----------------------------------------------------------------------
// Hook
// ----------------------------------------------------------------------

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
