import { useRouter } from "expo-router";
import React, { createContext, ReactNode, useContext, useState } from "react";
import { loginUser, UserRow } from "../app/services/baserowApi";

// ----------------------------------------------------------------------
// Kiểu dữ liệu
// ----------------------------------------------------------------------

export type User = Omit<UserRow, "password_hash">;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  updateUserContext: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ----------------------------------------------------------------------
// Hàm timeout tiện ích
// ----------------------------------------------------------------------

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

// ----------------------------------------------------------------------
// AuthProvider
// ----------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // ------------------------------------------------------------------
  // SIGN IN
  // ------------------------------------------------------------------
  const signIn = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);

    try {
      console.log("AUTH: Login started:", email);

      // ⛔ loginUser KHÔNG trả về User — nó trả object success/data/message
      const response = await withTimeout(loginUser(email, password), 10000);

      // Nếu hệ thống lỗi không mong muốn (success = false)
      if (!response.success) {
        throw new Error(response.message || "Đăng nhập thất bại.");
      }

      // Thành công → response.data là User
      const userData = response.data!;
      setUser(userData);

      console.log("AUTH: Login success → user saved.");
      return userData;
    } catch (error: any) {
      console.log("AUTH: Login FAILED:", error.message);
      setUser(null);
      throw new Error(error.message); // UI tự toast error
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // SIGN OUT
  // ------------------------------------------------------------------
  const signOut = async (): Promise<void> => {
    setUser(null);
    await new Promise((res) => setTimeout(res, 200));
    router.replace("/App");
  };
  const updateUserContext = (updatedData: Partial<User>) => {
    if (user) {
      // Ghi đè các trường cũ bằng dữ liệu mới
      setUser((prevUser) => ({
        ...prevUser!,
        ...updatedData,
      }));
    }
  };
  return (
    <AuthContext.Provider
      value={{ user, isLoading, signIn, signOut, updateUserContext }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ----------------------------------------------------------------------
// Hook
// ----------------------------------------------------------------------

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
