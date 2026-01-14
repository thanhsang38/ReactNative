import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { getUserById, loginUser, UserRow } from "../app/services/baserowApi";

// ===========================================
// Kiểu dữ liệu
// ===========================================
export type User = Omit<UserRow, "password_hash">;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  updateUserContext: (updatedData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  isHydrated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===========================================
// Hàm timeout tiện ích
// ===========================================

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("API Timeout: Server phản hồi quá lâu."));
    }, ms);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
};

// ===========================================
// AuthProvider
// ===========================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // =====================================================
  // 🔥 Khi mở app → tự load user từ AsyncStorage
  // =====================================================
  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true); // 🔥 thêm dòng này

      try {
        const savedUser = await AsyncStorage.getItem("user");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
          console.log("AUTH: User loaded from storage");
        }
      } catch (error) {
        console.log("AUTH: Load user error:", error);
      } finally {
        setIsLoading(false); // 🔥 và thêm dòng này
        setIsHydrated(true);
      }
    };

    loadUser();
  }, []);

  // =====================================================
  // SIGN IN
  // =====================================================
  const signIn = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);

    try {
      console.log("AUTH: Login started:", email);

      const response = await withTimeout(loginUser(email, password), 10000);

      if (!response.success) {
        throw new Error(response.message || "Đăng nhập thất bại.");
      }

      const userData = response.data!;
      setUser(userData);

      // 🔥 Lưu lại user vào AsyncStorage
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      console.log("AUTH: Login success → user saved.");
      return userData;
    } catch (error: any) {
      console.log("AUTH: Login FAILED:", error.message);
      setUser(null);
      await AsyncStorage.removeItem("user");
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // SIGN OUT
  // =====================================================
  const signOut = async (): Promise<void> => {
    setUser(null);

    // 🔥 Xóa khỏi AsyncStorage
    await AsyncStorage.removeItem("user");

    router.replace("/App");
  };
  // =====================================================
  // REFRESH USER TỪ SERVER
  // =====================================================
  const refreshUser = async (): Promise<void> => {
    if (!user?.id) return;

    try {
      console.log("AUTH: Refreshing user from server...");

      const freshUser = await getUserById(user.id);

      setUser(freshUser);
      await AsyncStorage.setItem("user", JSON.stringify(freshUser));

      console.log("AUTH: User refreshed");
    } catch (error) {
      console.log("AUTH: Refresh user failed:", error);
    }
  };

  // =====================================================
  // Cập nhật user trong Context
  // =====================================================
  const updateUserContext = (updatedData: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedData };
      setUser(newUser);

      // 🔥 Đồng bộ luôn vào Storage
      AsyncStorage.setItem("user", JSON.stringify(newUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signOut,
        updateUserContext,
        refreshUser,
        isHydrated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ===========================================
// Hook
// ===========================================
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
