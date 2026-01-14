// Hàm này chỉ lắng nghe node chat_notifications
import { off, onValue, ref, remove } from "firebase/database";
import { realtimeDb } from "../config/firebase";

export const listenChatNotifications = (
  userId: number,
  onUpdate: (data: any) => void
) => {
  const chatRef = ref(realtimeDb, `chat_notifications/${userId}`);

  const callback = (snapshot: any) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      onUpdate(data);
      // Xóa ngay sau khi đã nhận để không bị hiện lại khi reload
      remove(chatRef);
    }
  };

  onValue(chatRef, callback);
  return () => off(chatRef, "value", callback);
};
