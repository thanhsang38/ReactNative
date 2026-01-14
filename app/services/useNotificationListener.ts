import { usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import Toast from "react-native-toast-message";
import { listenChatNotifications } from "./chatService"; // <-- Thay đổi đường dẫn cho đúng file chứa hàm listenOrderUpdates của bạn

export function useNotificationListener(userId: number | string | undefined) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    // Lắng nghe từ node order_updates mà bạn đã thiết lập
    const unsubscribe = listenChatNotifications(Number(userId), (data: any) => {
      // 1. Kiểm tra nếu đây là loại tin nhắn chat
      if (data.category === "chat" || data.type === "new_message") {
        // Kiểm tra xem người dùng có đang đứng ở trang chat hay không
        // Nếu đã ở trong trang chat rồi thì không hiện Toast nữa
        const isChatPage = pathname.includes("support-chat");

        if (!isChatPage) {
          Toast.show({
            type: "info", // Hoặc 'success' tùy vào config trong CustomToast của bạn
            text1: data.title || "Tin nhắn mới",
            text2: data.body || "Admin đã trả lời tin nhắn của bạn",
            onPress: () => {
              router.push("/support-chat");
              Toast.hide();
            },
            visibilityTime: 5000,
            autoHide: true,
            topOffset: 60,
          });
        }
      }
    });

    return () => unsubscribe();
  }, [userId, pathname]); // Lắng nghe sự thay đổi của userId và vị trí trang (pathname)
}
