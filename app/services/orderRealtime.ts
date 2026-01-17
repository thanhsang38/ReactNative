import { off, onValue, ref, remove } from "firebase/database";
import { realtimeDb } from "../config/firebase";

export const listenOrderUpdates = (
  userId: number,
  onUpdate: (data: any) => void,
) => {
  const updatesRef = ref(realtimeDb, `order_updates/${userId}`);

  const callback = (snapshot: any) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log("🔥 Firebase order update:", data);
      onUpdate(data);
      remove(updatesRef)
        .then(() => console.log("🧹 Firebase node cleared"))
        .catch((err) => console.error("❌ Clear firebase failed", err));
    }
  };

  onValue(updatesRef, callback);

  return () => off(updatesRef, "value", callback);
};
