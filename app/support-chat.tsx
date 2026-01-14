import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { onValue, push, ref, serverTimestamp } from "firebase/database";
import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Avatar,
  Bubble,
  GiftedChat,
  IMessage,
  InputToolbar,
  Send,
} from "react-native-gifted-chat";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { realtimeDb } from "./config/firebase";

const COLORS = {
  primary: "#059669",
  primaryLight: "#14b8a6",
  bg: "#f1f5f9",
  white: "#ffffff",
  textDark: "#0f172a",
};

export default function CustomerChatScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<IMessage[]>([]);

  // =====================
  // LOGIC ĐỊNH DẠNG THỜI GIAN
  // =====================
  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const msgDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (msgDate.getTime() === today.getTime()) {
      return timeStr;
    } else if (msgDate.getTime() === yesterday.getTime()) {
      return `Yesterday, ${timeStr}`;
    } else {
      return `${date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}, ${timeStr}`;
    }
  };

  // =====================
  // LẮNG NGHE TIN NHẮN
  // =====================
  useEffect(() => {
    if (!user?.id) return;

    const chatRef = ref(realtimeDb, `chats/${user.id}`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setMessages([]);
        return;
      }

      const formatted: IMessage[] = Object.keys(data)
        .map((key) => ({
          _id: key,
          text: data[key].text,
          createdAt: new Date(data[key].createdAt),
          user: data[key].user,
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setMessages(formatted);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // =====================
  // GỬI TIN NHẮN
  // =====================
  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      if (!user?.id || !newMessages.length) return;

      const message = newMessages[0];
      push(ref(realtimeDb, `chats/${user.id}`), {
        text: message.text,
        createdAt: serverTimestamp(),
        user: {
          _id: user.id,
          name: user.name || "Khách hàng",
          avatar:
            user.avatar ||
            `https://ui-avatars.com/api/?name=${user.name}&background=059669&color=fff`,
        },
      });
    },
    [user]
  );

  return (
    <View style={styles.container}>
      {/* ===== HEADER ===== */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Hỗ trợ khách hàng</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerSubtitle}>Admin đang trực tuyến</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ===== CHAT BODY ===== */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 60 : 0}
      >
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
          <GiftedChat
            messages={messages}
            onSend={onSend}
            user={{ _id: user?.id ?? "guest" }}
            renderTime={() => null}
            renderAvatar={(props) => (
              <Avatar
                {...props}
                imageStyle={{ left: styles.avatar, right: styles.avatar }}
              />
            )}
            textInputProps={{
              placeholder: "Nhập tin nhắn...",
              style: styles.textInputStyle,
            }}
            renderBubble={(props) => (
              <Bubble
                {...props}
                wrapperStyle={{
                  right: styles.bubbleRight,
                  left: styles.bubbleLeft,
                }}
                textStyle={{
                  right: styles.bubbleTextRight,
                  left: styles.bubbleTextLeft,
                }}
                // Lồng thời gian vào bên trong Bubble
                renderTime={() => (
                  <Text
                    style={[
                      styles.timeInsideBubble,
                      props.position === "left"
                        ? { color: "#64748b" }
                        : {
                            color: "rgba(255,255,255,0.7)",
                            textAlign: "right",
                          },
                    ]}
                  >
                    {formatMessageTime(
                      new Date(props.currentMessage?.createdAt!)
                    )}
                  </Text>
                )}
              />
            )}
            renderInputToolbar={(props) => (
              <InputToolbar {...props} containerStyle={styles.inputToolbar} />
            )}
            renderSend={(props) => (
              <Send {...props} containerStyle={styles.sendWrap}>
                <View style={styles.sendBtn}>
                  <Ionicons name="send" size={18} color="white" />
                </View>
              </Send>
            )}
          />
        </View>
      </KeyboardAvoidingView>
      <View style={{ height: Platform.OS === "ios" ? insets.bottom : 0 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  backBtn: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },
  headerText: { marginLeft: 15 },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "800" },
  onlineRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  headerSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ade80",
    marginRight: 6,
    borderWidth: 1,
    borderColor: "white",
  },

  /* AVATAR */
  avatar: { width: 36, height: 36, borderRadius: 18 },

  /* INPUT */
  inputToolbar: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 25,
    borderTopWidth: 0,
    backgroundColor: COLORS.white,
    elevation: 5,
    paddingVertical: 2,
  },
  textInputStyle: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.textDark,
    paddingTop: 8,
    lineHeight: 15,
  },
  sendWrap: { justifyContent: "center", alignItems: "center", marginRight: 5 },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  /* BUBBLES */
  bubbleRight: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    marginVertical: 4,
    marginRight: 2,
    elevation: 2,
  },
  bubbleLeft: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    marginVertical: 4,
    marginLeft: 2,
    elevation: 1,
  },
  bubbleTextRight: {
    color: "white",
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextLeft: {
    color: COLORS.textDark,
    fontSize: 15,
    lineHeight: 20,
  },

  /* TIME INSIDE BUBBLE */
  timeInsideBubble: {
    fontSize: 10,
    marginTop: 4,
    marginBottom: 2,
    marginHorizontal: 5,
    fontWeight: "400",
  },
});
