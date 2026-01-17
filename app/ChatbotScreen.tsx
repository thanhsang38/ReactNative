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
  ScrollView,
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
import { fetchOrdersWithDetails } from "../context/OrderContext";
import {
  CategoryRow,
  getCategories,
  getProducts,
  ProductRow,
} from "./services/baserowApi";
// --- CẤU HÌNH VÀ HẰNG SỐ ---
const GEMINI_API_KEY = "AIzaSyAx9uzHBiIvHyo1upz0Ad0bwAHhtaBqpKg";
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
  salePrice?: number;
};
interface ChatAction {
  type: "navigate";
  screen: string;
  label: string;
}
interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  suggestions?: SuggestionItem[];
  action?: ChatAction;
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
const QUICK_QUESTIONS = [
  {
    id: 1,
    text: "Món nào đang Hot? 🔥",
    query: "Gợi ý cho tôi các món đang Hot hoặc bán chạy nhất",
  },
  {
    id: 2,
    text: "Đang có giảm giá gì? 🏷️",
    query: "Liệt kê các sản phẩm đang có giá salePrice tốt nhất",
  },
  {
    id: 3,
    text: "Cà phê đậm vị ☕",
    query: "Tôi muốn tìm các món cà phê đậm đà",
  },
  {
    id: 4,
    text: "Trà trái cây giải nhiệt 🍎",
    query: "Tìm cho tôi các món trà trái cây thanh mát",
  },
];
// --- HÀM TẠO GROUNDING DATA (Bối cảnh cho Gemini) ---
const createGroundingData = (
  products: ProductRow[],
  categories: CategoryRow[],
  user: any, // 💡 Thêm thông tin User
  recentOrders: any[],
) => {
  let productList = "DANH SÁCH SẢN PHẨM HIỆN TẠI (Gồm giá gốc và giá giảm):\n";
  products.slice(0, 50).forEach((p) => {
    productList += `- Tên: ${p.name}, ID: ${p.id}, Giá gốc: ${
      p.price
    }, Giá giảm: ${p.salePrice || "Không có"}, Danh mục: ${
      p.category?.replace(/_/g, " ") || "Không rõ"
    }\n`;
  });

  let categoryList = "\nDANH MỤC CỬA HÀNG:\n";
  categories.forEach((c) => {
    if (c.category_id !== "all") {
      categoryList += `- ${c.name} (Mã: ${c.category_id})\n`;
    }
  }); // ✅ SỬ DỤNG CÚ PHÁP JSON DỰA TRÊN CẤU TRÚC DỮ LIỆU ĐỂ YÊU CẦU MÔN ĐỀ XUẤT SẢN PHẨM

  let userAddressText = "Chưa thiết lập";
  if (user?.address) {
    userAddressText =
      typeof user.address === "object"
        ? user.address.address || JSON.stringify(user.address)
        : String(user.address);
  }

  let userInfo = `THÔNG TIN KHÁCH HÀNG:
  - Tên: ${user?.name || "Khách"}
  - Số điện thoại: ${user?.phone || "Chưa có"}
  - Địa chỉ mặc định: ${userAddressText}\n`;

  let historyInfo = "\nLỊCH SỬ ĐƠN HÀNG (Món khách đã mua): \n";
  if (recentOrders && recentOrders.length > 0) {
    recentOrders.slice(0, 3).forEach((order) => {
      // Trích xuất tên món từ orderDetail
      const productNames =
        order.orderDetail && Array.isArray(order.orderDetail)
          ? order.orderDetail.map((d: any) => d.name).join(", ")
          : "Không rõ tên món";

      historyInfo += `- Đơn ${
        order.name || order.id
      }: Món đã mua [${productNames}]\n`;
    });
  } else {
    historyInfo += "- Khách hàng chưa có đơn hàng nào trước đây.\n";
  }
  const systemInstruction = `Bạn là Chatbot tư vấn thân thiện của cửa hàng Drink Xann. Nhiệm vụ của bạn là trả lời các câu hỏi liên quan đến thực đơn và cửa hàng dựa trên dữ liệu sau.
    Hãy dùng thông tin khách hàng để cá nhân hóa cuộc trò chuyện.
    - Nếu khách có địa chỉ, hãy tư vấn ship.
    - Nếu khách từng mua món nào đó, hãy hỏi thăm món đó.
    - Luôn dùng tên khách (${user?.name}) trong câu trả lời để tạo sự thân thiện.
    ${userInfo}
    ${historyInfo}

    Luôn giữ giọng điệu tích cực, chào hỏi thân thiện. KHÔNG trả lời các câu hỏi không liên quan đến sản phẩm/danh mục/cửa hàng.
    
    KHI ĐỀ XUẤT SẢN PHẨM (tối đa 3 món): Bạn phải trả lời bằng cấu trúc JSON sau. Nếu bạn không đề xuất sản phẩm, chỉ trả lời bằng văn bản thuần túy.
    KHI ĐỀ XUẤT SẢN PHẨM: Nếu sản phẩm có giá giảm (salePrice), hãy ưu tiên giới thiệu.
    CẤU TRÚC JSON YÊU CẦU:
    {
      "text": "[Văn bản giải thích thân thiện cho người dùng]",
      "suggestions": [
        {"id": 123, "name": "Tên sản phẩm", "price": 45000, "salePrice": 35000,"image_url": "URL ảnh"},
        ...
      ]
    }
    
    DỮ LIỆU CỬA HÀNG:
    ${productList}
    ${categoryList}
    DỮ LIỆU NGỮ CẢNH:
    ${userInfo}
    ${historyInfo}
    ...
    KHI KHÁCH MUỐN THỰC HIỆN HÀNH ĐỘNG: Ngoài văn bản, hãy trả về thêm trường "action".
    Các trang hỗ trợ (screen):
    - "/address": Khi khách muốn đổi/thêm địa chỉ, hỏi phí ship.
    - "/cart": Khi khách muốn xem giỏ hàng hoặc thanh toán.
    - "/(tabs)/orders": Khi khách muốn xem lịch sử đơn hàng hoặc kiểm tra trạng thái.
    - "/vouchers": Khi khách muốn tìm mã giảm giá.

    CẤU TRÚC JSON MỚI:
    {
      "text": "Thông báo cho khách",
      "suggestions": [...],
      "action": { "type": "navigate", "screen": "/address", "label": "📍 Cài đặt địa chỉ" }
    }
    `;

  return systemInstruction;
};

// --- HÀM GỌI GEMINI API VỚI EXPONENTIAL BACKOFF VÀ JSON MODE ---

const callGeminiApi = async (
  userQuery: string,
  history: Message[],
  systemInstruction: string,
): Promise<{
  text: string;
  suggestions?: SuggestionItem[];
  action?: ChatAction;
}> => {
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

      let parsedData: {
        text: string;
        suggestions?: SuggestionItem[];
        action?: ChatAction;
      };

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
        action: parsedData.action,
      };
    } catch (error: any) {
      retryCount++;
      if (retryCount >= MAX_RETRIES) {
        console.error(
          "GEMINI ERROR: Max retries reached.",
          error.message,
          "Raw:",
          rawTextResponse,
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
  // Logic tính toán tương tự trang Home
  const price = Number(suggestion.price) || 0;
  const salePrice = Number(suggestion.salePrice) || 0;
  const hasSale = salePrice > 0 && salePrice < price;
  const discountPercent = hasSale
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;
  const isHot = price > 30000;

  return (
    <View style={suggestionStyles.card}>
      <View style={suggestionStyles.imageContainer}>
        <Image
          source={{ uri: suggestion.image_url }}
          style={suggestionStyles.image}
        />

        {/* Badge Stack cho Chatbot */}
        <View style={suggestionStyles.badgeStack}>
          {hasSale && (
            <View style={suggestionStyles.saleBadge}>
              <Text style={suggestionStyles.badgeText}>
                -{discountPercent}%
              </Text>
            </View>
          )}
          {isHot && (
            <View style={suggestionStyles.hotBadge}>
              <Text style={suggestionStyles.badgeText}>🔥 Hot</Text>
            </View>
          )}
        </View>
      </View>

      <View style={suggestionStyles.info}>
        <Text style={suggestionStyles.name} numberOfLines={1}>
          {suggestion.name}
        </Text>

        <View style={suggestionStyles.priceRow}>
          <Text style={suggestionStyles.price}>
            {(hasSale ? salePrice : price).toLocaleString("vi-VN")}đ
          </Text>
          {hasSale && (
            <Text style={suggestionStyles.originalPrice}>
              {price.toLocaleString("vi-VN")}đ
            </Text>
          )}
        </View>

        <View style={suggestionStyles.actions}>
          <TouchableOpacity
            style={suggestionStyles.detailButton}
            onPress={() => onViewDetail(suggestion.id)}
          >
            <Text style={suggestionStyles.detailText}>Chi tiết</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={suggestionStyles.addButton}
            onPress={() => onAddToCart(suggestion)}
          >
            <Feather name="plus" size={14} color={COLORS.white} />
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
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const flatListRef = useRef<FlatList>(null); // 1. TẢI DỮ LIỆU SẢN PHẨM VÀ TẠO SYSTEM INSTRUCTION

  useEffect(() => {
    const loadAllData = async () => {
      try {
        // 1. Load sản phẩm & danh mục
        const [productResult, categoryResult] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        // 2. Load đơn hàng của user
        let orders: any[] = [];
        if (user?.id) {
          orders = await fetchOrdersWithDetails(user.id);
          orders = [...orders].sort((a, b) => Number(b.id) - Number(a.id));
        }

        const loadedProducts = productResult.data || [];
        const loadedCategories = categoryResult.data || [];

        setProducts(loadedProducts);
        setCategories(loadedCategories);
        setUserOrders(orders);

        // 3. TẠO INSTRUCTION KHI ĐÃ CÓ ĐỦ DỮ LIỆU
        const instruction = createGroundingData(
          loadedProducts,
          loadedCategories,
          user,
          orders, // Truyền mảng orders vừa fetch xong vào đây
        );
        setSystemInstruction(instruction);
      } catch (e) {
        console.error("Lỗi tải dữ liệu chatbot:", e);
      }
    };

    loadAllData();
  }, [user?.id]); // Chỉ chạy lại khi User ID thay đổi

  const handleQuickQuery = async (queryText: string) => {
    if (isTyping || !systemInstruction) return;

    // 1. Tạo tin nhắn giả lập của người dùng
    const userMsg: Message = {
      id: Date.now().toString(),
      text: queryText,
      sender: "user",
    };

    // 2. Cập nhật màn hình chat và bắt đầu gọi AI
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Tự động cuộn xuống cuối
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await callGeminiApi(
        queryText,
        [...messages, userMsg],
        systemInstruction,
      );

      // Xử lý Map dữ liệu sản phẩm tương tự như hàm handleSend cũ của bạn
      let finalSuggestions = response.suggestions || [];
      if (finalSuggestions.length > 0) {
        finalSuggestions = finalSuggestions.map((s) => {
          const productDetail = products.find((p) => p.id === s.id);
          return {
            ...s,
            image_url: productDetail?.image || "https://placehold.co/150",
            price: productDetail?.price || s.price,
            salePrice: productDetail?.salePrice || s.salePrice,
          };
        });
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString() + "bot",
        text: response.text,
        sender: "bot",
        suggestions: finalSuggestions,
        action: response.action,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      // Xử lý lỗi...
    } finally {
      setIsTyping(false);
    }
  };

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
        systemInstruction,
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
            salePrice: productDetail?.salePrice || s.salePrice,
          };
        });
      }

      const botMessage: Message = {
        id: Date.now().toString() + "bot",
        text: response.text,
        sender: "bot",
        suggestions: finalSuggestions, // Gửi đề xuất đi kèm
        action: response.action,
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
        100,
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
    const productDetail = products.find((p) => p.id === suggestion.id);

    const isDrink = productDetail
      ? DRINK_CATEGORIES_NORMALIZED.includes(productDetail.category ?? "")
      : false;

    // --- LOGIC TÍNH GIÁ ĐỂ CHO VÀO GIỎ ---
    // Ưu tiên lấy salePrice nếu có và hợp lệ
    const originalPrice = Number(suggestion.price) || 0;
    const salePrice = Number(suggestion.salePrice) || 0;

    const finalPrice =
      salePrice > 0 && salePrice < originalPrice ? salePrice : originalPrice;

    addToCart({
      productId: suggestion.id.toString(),
      name: suggestion.name,
      image: suggestion.image_url,
      price: finalPrice, // ✅ Đã dùng giá cuối cùng (đã giảm nếu có)
      quantity: 1,
      size: "M",
      ice: isDrink ? 75 : 0,
      sugar: isDrink ? 75 : 0,
      isDrink: isDrink,
    });

    Toast.show({
      type: "success",
      text1: "Đã thêm vào giỏ",
      text2: `${suggestion.name} - ${finalPrice.toLocaleString("vi-VN")}đ`,
      visibilityTime: 1500,
    });
  };

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
          {item.action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(item.action?.screen as any)}
            >
              <Feather name="external-link" size={14} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>{item.action.label}</Text>
            </TouchableOpacity>
          )}
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
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
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
      {/* 💡 QUICK QUESTIONS SECTION */}
      <View style={styles.quickQuestionsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickQuestionsContent}
        >
          {QUICK_QUESTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.quickQuestionBtn}
              onPress={() => handleQuickQuery(item.query)} // Gọi hàm xử lý riêng
              disabled={isTyping}
            >
              <Text style={styles.quickQuestionText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
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
  imageContainer: {
    position: "relative",
  },
  badgeStack: {
    position: "absolute",
    top: 4,
    left: 4,
    gap: 3,
  },
  saleBadge: {
    backgroundColor: "#ef4444", // Red 500
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hotBadge: {
    backgroundColor: "#fbbf24", // Amber 400
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  // Điều chỉnh lại card cho gọn
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
    paddingTop: 90, // ✅ FIX: Đã thêm padding top cho Header chung
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
  quickQuestionsWrapper: {
    backgroundColor: COLORS.background,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  quickQuestionsContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  quickQuestionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    // Hiệu ứng đổ bóng nhẹ
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickQuestionText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "500",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: "flex-start",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "bold",
  },
});
