import { Feather } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// ✅ IMPORT API DỮ LIỆU SẢN PHẨM CỦA BẠN
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext"; // ✅ IMPORT CART CONTEXT
import {
  CategoryRow,
  getCategories,
  getProducts,
  ProductRow,
} from "./services/baserowApi";

// --- CẤU HÌNH VÀ HẰNG SỐ ---
const GEMINI_API_KEY = "AIzaSyBYJWtVh2bvgEjWZF7K6hLhJoYFjiIwRRE";
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

// ✅ HẰNG SỐ CATEGORY (Được định nghĩa một lần)
const DRINK_CATEGORIES_NORMALIZED = [
  "sinh_to",
  "ca_phe",
  "tra_sua",
  "tra_trai_cay",
];

// --- TYPES ---
// ✅ FIX LỖI TYPE CHECKING: Định nghĩa kiểu dữ liệu cho phần tử mảng
type SuggestionItem = {
  id: number;
  name: string;
  price: number;
  image_url: string;
};

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  suggestions?: SuggestionItem[];
}
// --- USER INTENT (PHÂN TÍCH Ý ĐỊNH KHÁCH) ---

// Màu sắc (Đồng bộ với các file khác)
const COLORS = {
  primary: "#059669",
  secondary: "#14b8a6",
  text: "#374151",
  placeholder: "#94a3b8",
  border: "#e2e8f0",
  background: "#f8fafc",
  white: "#ffffff",
  botBg: "#e0f2f1",
  userBg: "#d1fae5",
  red500: "#ef4444",
};

// --- HÀM TẠO GROUNDING DATA (Bối cảnh cho Gemini) ---
const createGroundingData = (
  products: ProductRow[],
  categories: CategoryRow[]
) => {
  let productList = "DANH SÁCH SẢN PHẨM HIỆN TẠI (Được giới hạn 50 mục):\n";
  products.slice(0, 50).forEach((p) => {
    productList += `- Tên: ${p.name}, ID: ${p.id}, Giá: ${p.price}, Danh mục: ${
      p.category?.replace(/_/g, " ") || "Không rõ"
    }, Mô tả: ${p.description.substring(0, 40)}...\n`;
  });

  let categoryList = "\nDANH MỤC CỬA HÀNG:\n";
  categories.forEach((c) => {
    if (c.category_id !== "all") {
      categoryList += `- ${c.name} (Mã: ${c.category_id})\n`;
    }
  }); // ✅ SỬ DỤNG CÚ PHÁP JSON DỰA TRÊN CẤU TRÚC DỮ LIỆU ĐỂ YÊU CẦU MÔN ĐỀ XUẤT SẢN PHẨM

  const systemInstruction = `Bạn là Chatbot tư vấn thân thiện của cửa hàng Drink Xann. Nhiệm vụ của bạn là trả lời các câu hỏi liên quan đến thực đơn và cửa hàng dựa trên dữ liệu sau.

    Luôn giữ giọng điệu tích cực, chào hỏi thân thiện. KHÔNG trả lời các câu hỏi không liên quan đến sản phẩm/danh mục/cửa hàng.
    
    KHI ĐỀ XUẤT SẢN PHẨM (tối đa 3 món): Bạn phải trả lời bằng cấu trúc JSON sau. Nếu bạn không đề xuất sản phẩm, chỉ trả lời bằng văn bản thuần túy.
    
    CẤU TRÚC JSON YÊU CẦU:
    {
      "text": "[Văn bản giải thích thân thiện cho người dùng]",
      "suggestions": [
        {"id": 123, "name": "Tên sản phẩm", "price": 45000, "image_url": "URL ảnh"},
        ...
      ]
    }
    
    DỮ LIỆU CỬA HÀNG:
    ${productList}
    ${categoryList}
    `;

  return systemInstruction;
};

// --- HÀM GỌI GEMINI API VỚI EXPONENTIAL BACKOFF VÀ JSON MODE ---

const callGeminiApi = async (
  userQuery: string,
  history: Message[],
  systemInstruction: string
): Promise<{ text: string; suggestions?: SuggestionItem[] }> => {
  const chatHistory = history.map((msg) => ({
    role: msg.sender === "user" ? "user" : "model",
    parts: [{ text: msg.text }],
  }));

  chatHistory.push({ role: "user", parts: [{ text: userQuery }] });

  const payload = {
    contents: chatHistory,
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
  };

  let retryCount = 0;
  let rawTextResponse = "";
  while (retryCount < MAX_RETRIES) {
    try {
      const response = await axios.post(GEMINI_API_URL, payload);

      const candidate = response.data.candidates?.[0];
      rawTextResponse = candidate?.content?.parts?.[0]?.text || "";

      if (!rawTextResponse) {
        throw new Error("Invalid response format (empty text).");
      }

      // 💡 PHÂN TÍCH JSON: Đảm bảo chỉ phân tích phần JSON bên trong chuỗi
      const jsonMatch = rawTextResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : rawTextResponse;

      let parsedData: { text: string; suggestions?: SuggestionItem[] };

      try {
        // Lỗi nếu chuỗi không phải JSON (ví dụ: Gemini trả lời văn bản thuần túy)
        parsedData = JSON.parse(jsonString);
      } catch (e) {
        // Fallback: Nếu không phải JSON, coi toàn bộ là text
        return { text: rawTextResponse };
      }

      return {
        text: parsedData.text || rawTextResponse,
        suggestions: parsedData.suggestions,
      };
    } catch (error: any) {
      retryCount++;
      if (retryCount >= MAX_RETRIES) {
        console.error(
          "GEMINI ERROR: Max retries reached.",
          error.message,
          "Raw:",
          rawTextResponse
        );
        throw new Error("Lỗi kết nối tới AI. Vui lòng thử lại sau.");
      }
      const delay = INITIAL_DELAY_MS * Math.pow(2, retryCount - 1);
      console.warn(`GEMINI RETRY: Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Lỗi kết nối AI không xác định.");
};

// -----------------------------------------------------------
// 💡 COMPONENT HIỂN THỊ SẢN PHẨM ĐỀ XUẤT
// -----------------------------------------------------------

interface ProductSuggestionCardProps {
  suggestion: SuggestionItem; // ✅ FIX: Dùng kiểu dữ liệu an toàn
  onViewDetail: (id: number) => void;
  onAddToCart: (product: SuggestionItem) => void; // ✅ FIX: Dùng kiểu dữ liệu an toàn
}

const ProductSuggestionCard: React.FC<ProductSuggestionCardProps> = ({
  suggestion,
  onViewDetail,
  onAddToCart,
}) => {
  return (
    <View style={suggestionStyles.card}>
      <Image
        source={{ uri: suggestion.image_url }}
        style={suggestionStyles.image}
        onError={(e) => console.log("Image Load Error:", e.nativeEvent.error)}
      />
      <View style={suggestionStyles.info}>
        <Text style={suggestionStyles.name} numberOfLines={2}>
          {suggestion.name}
        </Text>
        <Text style={suggestionStyles.price}>
          {Number(suggestion.price).toLocaleString("vi-VN")}đ
        </Text>
        <View style={suggestionStyles.actions}>
          <TouchableOpacity
            style={suggestionStyles.detailButton}
            onPress={() => onViewDetail(suggestion.id)}
          >
            <Text style={suggestionStyles.detailText}>Xem</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={suggestionStyles.addButton}
            onPress={() => onAddToCart(suggestion)}
          >
            <Feather name="plus" size={16} color={COLORS.white} />
            <Text style={suggestionStyles.addText}>Thêm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// -----------------------------------------------------------
// 💡 CHATBOT COMPONENT CHÍNH
// -----------------------------------------------------------

export function ChatbotScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addToCart } = useCart(); // ✅ LẤY HÀM THÊM VÀO GIỎ HÀNG

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      text: `Chào ${
        user?.name || "bạn"
      }! Tôi là trợ lý AI của Drink Xann. Tôi có thể giúp bạn tìm kiếm thông tin về sản phẩm, giá cả, và danh mục của cửa hàng. Bạn muốn hỏi gì?`,
      sender: "bot",
      suggestions: [], // Mặc định không có đề xuất
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false); // Dữ liệu Baserow để truyền làm ngữ cảnh

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [systemInstruction, setSystemInstruction] = useState("");

  const flatListRef = useRef<FlatList>(null); // 1. TẢI DỮ LIỆU SẢN PHẨM VÀ TẠO SYSTEM INSTRUCTION

  useEffect(() => {
    const loadGroundingData = async () => {
      try {
        const productResult = await getProducts();
        const categoryResult = await getCategories();

        let loadedProducts: ProductRow[] = [];
        if (productResult.success && productResult.data) {
          loadedProducts = productResult.data;
          setProducts(loadedProducts);
        }

        if (categoryResult.success && categoryResult.data) {
          setCategories(categoryResult.data);
        } // Tạo hướng dẫn hệ thống

        const instruction = createGroundingData(
          loadedProducts,
          categoryResult.data || []
        );
        setSystemInstruction(instruction);
      } catch (e) {
        console.error("Lỗi tải dữ liệu grounding:", e);
        Toast.show({
          type: "error",
          text1: "Lỗi Chatbot",
          text2: "Không tải được dữ liệu sản phẩm nền.",
          visibilityTime: 3000,
        });
      }
    };
    loadGroundingData();
  }, []); // 2. XỬ LÝ GỬI TIN NHẮN VÀ GỌI API

  const handleSend = async () => {
    const userQuery = input.trim();
    if (!userQuery || isTyping || !systemInstruction) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: userQuery,
      sender: "user",
      suggestions: [],
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await callGeminiApi(
        userQuery,
        [...messages, newMessage],
        systemInstruction
      );

      // ✅ MAP SẢN PHẨM TÌM ĐƯỢC VỚI URL ẢNH TỪ DỮ LIỆU GỐC
      let finalSuggestions: SuggestionItem[] = response.suggestions || [];
      if (finalSuggestions.length > 0) {
        finalSuggestions = finalSuggestions.map((s) => {
          const productDetail = products.find((p) => p.id === s.id);
          return {
            ...s,
            // Đảm bảo dùng URL ảnh thực tế hoặc placeholder
            image_url:
              productDetail?.image ||
              "https://placehold.co/150x150/f0f9ff/64748b?text=N%2FA",
            price: productDetail?.price || s.price,
          };
        });
      }

      const botMessage: Message = {
        id: Date.now().toString() + "bot",
        text: response.text,
        sender: "bot",
        suggestions: finalSuggestions, // Gửi đề xuất đi kèm
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: Date.now().toString() + "err",
        text: error.message || "Lỗi không xác định khi liên lạc với AI.",
        sender: "bot",
        suggestions: [],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100
      );
    }
  };

  // --- HÀM XỬ LÝ TƯƠNG TÁC SẢN PHẨM ---
  const handleViewDetail = (productId: number) => {
    router.push({
      pathname: "/product-detail",
      params: { id: productId.toString() },
    } as any);
  };

  const handleAddToCart = (suggestion: SuggestionItem) => {
    // Giả định các sản phẩm được đề xuất là đồ uống (hoặc thiết lập mặc định)
    const productDetail = products.find((p) => p.id === suggestion.id);

    // Kiểm tra loại sản phẩm dựa trên Category đã chuẩn hóa
    const isDrink = productDetail
      ? DRINK_CATEGORIES_NORMALIZED.includes(productDetail.category ?? "")
      : false; // ✅ FIX NULLISH COALESCING

    addToCart({
      productId: suggestion.id.toString(),
      name: suggestion.name,
      image: suggestion.image_url,
      price: suggestion.price,
      quantity: 1,
      size: "M",
      ice: isDrink ? 75 : 0,
      sugar: isDrink ? 75 : 0,
      isDrink: isDrink,
    });

    Toast.show({
      type: "success",
      text1: "Đã thêm vào giỏ",
      text2: `${suggestion.name} x 1`,
      visibilityTime: 1500,
    });
  }; // 3. RENDER ITEM

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";
    return (
      <View>
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.botBubble,
            isUser ? { marginLeft: 50 } : { marginRight: 50 },
          ]}
        >
          <Text style={isUser ? styles.userText : styles.botText}>
            {item.text}
          </Text>
        </View>
        {/* Render Suggestions */}
        {item.sender === "bot" &&
          item.suggestions &&
          item.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {item.suggestions.map((suggestion, index) => (
                <ProductSuggestionCard
                  key={index}
                  suggestion={suggestion}
                  onViewDetail={handleViewDetail}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </View>
          )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.fullContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 60}
    >
      <Header
        title="Drink Xann AI"
        showBack={true}
        onBack={() => router.back()}
      />
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.chatList}
        contentContainerStyle={styles.chatListContent}
      />
      {/* Input Area */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Hỏi về sản phẩm, giá cả..."
          placeholderTextColor={COLORS.placeholder}
          editable={!isTyping && !!systemInstruction}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!input.trim() || isTyping || !systemInstruction) &&
              styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!input.trim() || isTyping || !systemInstruction}
        >
          {isTyping ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Feather name="send" size={24} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>
      {/* Loading Indicator for Grounding Data */}
      {!systemInstruction && (
        <View style={styles.dataLoadingOverlay}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.dataLoadingText}>
            Đang tải dữ liệu sản phẩm...
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

export default ChatbotScreen;

// --- STYLES FOR SUGGESTION CARD ---

const suggestionStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 10,
    padding: 10,
    width: "100%", // ✅ QUAN TRỌNG
    alignSelf: "stretch", // ✅ KHÔNG dùng flex-start
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: COLORS.botBg,
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
  },
  name: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  detailButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  detailText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "500",
  },
  addButton: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    gap: 4,
  },
  addText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "bold",
  },
});

// --- STYLES CHO CHATBOT CONTAINER ---

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  chatListContent: {
    paddingVertical: 15,
    paddingTop: 80, // ✅ FIX: Đã thêm padding top cho Header chung
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 5,
    borderRadius: 15,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 5,
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.botBg,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userText: {
    color: COLORS.white,
    fontSize: 15,
  },
  botText: {
    color: COLORS.text,
    fontSize: 15,
  },
  suggestionsContainer: {
    paddingVertical: 10,
    paddingLeft: 10,
    alignSelf: "flex-start",
    width: "100%",
  },
  inputArea: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
    backgroundColor: COLORS.background,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.placeholder,
    opacity: 0.7,
  },
  dataLoadingOverlay: {
    position: "absolute",
    bottom: 70,
    left: 0,
    right: 0,
    alignItems: "center",
    padding: 10,
    backgroundColor: COLORS.white,
  },
  dataLoadingText: {
    marginTop: 5,
    fontSize: 14,
    color: COLORS.text,
  },
});
