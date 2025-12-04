import React, {
  createContext,
  useContext,
  useState,
  useEffect, // 💡 Cần dùng useEffect để giả lập quá trình tải
  ReactNode,
} from "react";
import { useRouter } from "expo-router";

// ----------------------------------------------------------------------
// Định nghĩa Kiểu dữ liệu và Interface (Giữ nguyên)
// ----------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday?: string;
  gender?: "male" | "female" | "other";
  avatar?: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (userData: User) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 💡 DỮ LIỆU CODE CỨNG (MOCK DATA)
const USER_MOCK_DATA: User = {
  id: "1",
  name: "Nguyễn Văn A (MOCK)",
  email: "nguyenvana@mock.com",
  phone: "0901234567",
  birthday: "1990-01-01",
  gender: "male",
  token: "mock_token_active", // Thêm token để giả lập trạng thái hoạt động
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // 💡 KHỞI TẠO: Bắt đầu với user = null (chờ tải)
  const [user, setUser] = useState<User | null>(null);

  // 💡 KHỞI TẠO: Bắt đầu với isLoading = true (đang giả lập quá trình tải)
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  // 1. Tải trạng thái user MOCK khi khởi động
  useEffect(() => {
    // Giả lập quá trình tải:
    // Thường thì ở đây sẽ gọi SecureStore hoặc API.
    // Chúng ta giả lập mất 1 giây để tải và gán USER_MOCK_DATA.

    const mockLoad = setTimeout(() => {
      // 💡 SỬ DỤNG DỮ LIỆU CỨNG: Tự động gán user
      setUser(USER_MOCK_DATA);
      setIsLoading(false); // Kết thúc quá trình tải
    }, 1000);

    return () => clearTimeout(mockLoad); // Dọn dẹp
  }, []);

  // 2. Đăng nhập (Vẫn giữ cho mục đích test)
  const signIn = async (userData: User) => {
    setUser(userData);
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.replace("/(tabs)");
  };

  // 3. Đăng xuất (Vẫn giữ cho mục đích test)
  const signOut = async () => {
    setUser(null);
    await new Promise((resolve) => setTimeout(resolve, 200));
    router.replace("/App");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ----------------------------------------------------------------------
// Custom Hook (Giữ nguyên)
// ----------------------------------------------------------------------

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
