import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type IconComponentType = React.ComponentType<{
  size: number;
  color: string;
  style?: any;
}>;

const Icons: { [key: string]: IconComponentType } = {
  Coffee: ({ size, color, style }) => (
    <Ionicons name="cafe-outline" size={size} color={color} style={style} />
  ),
  ShoppingBag: ({ size, color, style }) => (
    <Feather name="shopping-bag" size={size} color={color} style={style} />
  ),
  Zap: ({ size, color, style }) => (
    <Feather name="zap" size={size} color={color} style={style} />
  ),
  Heart: ({ size, color, style }) => (
    <Ionicons name="heart-outline" size={size} color={color} style={style} />
  ),
  ChevronRight: ({ size, color, style }) => (
    <Feather name="chevron-right" size={size} color={color} style={style} />
  ),
};

const { width } = Dimensions.get("window");
const SLIDE_WIDTH = width;

const introSlides = [
  {
    id: 1,
    title: "Chào mừng đến với DrinkJoy",
    description: "Thưởng thức hương vị tuyệt vời nhất",
    image:
      "https://images.unsplash.com/photo-1646681828239-843f5ed340de?w=1080",
    iconName: "Coffee",
    color: ["#10b981", "#0d9488"] as const,
  },
  {
    id: 2,
    title: "Đa dạng thực đơn",
    description: "Cà phê, trà sữa, sinh tố và nhiều món khác",
    image:
      "https://images.unsplash.com/photo-1530894649581-58df9294379f?w=1080",
    iconName: "ShoppingBag",
    color: ["#0d9488", "#00bcd4"] as const,
  },
  {
    id: 3,
    title: "Giao hàng nhanh chóng",
    description: "Nhanh – Nóng – Tươi mới",
    image:
      "https://images.unsplash.com/photo-1695654400275-641a445a762c?w=1080",
    iconName: "Zap",
    color: ["#00bcd4", "#3b82f6"] as const,
  },
  {
    id: 4,
    title: "Ưu đãi hấp dẫn",
    description: "Voucher, khuyến mãi mỗi ngày",
    image:
      "https://images.unsplash.com/photo-1648003901348-c1c6c8e0006f?w=1080",
    iconName: "Heart",
    color: ["#10b981", "#0d9488"] as const,
  },
] as const;

export default function IntroScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const translateX = useRef(new Animated.Value(0)).current;
  const skipOpacity = useRef(new Animated.Value(1)).current;

  /** 🔥 ICON EFFECTS */
  const bounceAnim = useRef(new Animated.Value(0)).current; // nhảy lên xuống
  const waveScale = useRef(new Animated.Value(0)).current; // vòng sóng scale
  const waveOpacity = useRef(new Animated.Value(1)).current;
  const finishIntro = async () => {
    await AsyncStorage.setItem("hasSeenIntro", "true");
    router.replace("/App");
  };
  useEffect(() => {
    // Slide animation
    Animated.timing(translateX, {
      toValue: -currentSlide * SLIDE_WIDTH,
      duration: 450,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    // Hide Skip button at last slide
    Animated.timing(skipOpacity, {
      toValue: currentSlide === introSlides.length - 1 ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Reset icon animations
    bounceAnim.setValue(0);
    waveScale.setValue(0);
    waveOpacity.setValue(1);

    /** 🎉 RUN ICON BOUNCE + WAVE */
    Animated.parallel([
      // Bounce icon
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -12,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),

      // Wave effect
      Animated.sequence([
        Animated.timing(waveScale, {
          toValue: 2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(waveScale, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),

      Animated.timing(waveOpacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentSlide]);

  /** Swipe gesture */
  const paginate = (direction: number) => {
    const next = currentSlide + direction;
    if (next >= 0 && next < introSlides.length) setCurrentSlide(next);
  };

  const goToApp = () => router.push("/App");

  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > Math.abs(g.dy) * 1.3 && Math.abs(g.dx) > 10,
    onPanResponderMove: (_, g) => {
      translateX.setValue(-currentSlide * SLIDE_WIDTH + g.dx);
    },
    onPanResponderRelease: (_, g) => {
      const t = SLIDE_WIDTH / 3;
      if (g.dx < -t && currentSlide < introSlides.length - 1) paginate(1);
      else if (g.dx > t && currentSlide > 0) paginate(-1);
      else
        Animated.timing(translateX, {
          toValue: -currentSlide * SLIDE_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }).start();
    },
  });

  return (
    <View style={styles.container}>
      {/* Skip */}
      <Animated.View style={[styles.skipWrapper, { opacity: skipOpacity }]}>
        <TouchableOpacity onPress={finishIntro} style={styles.skipBtn}>
          <Text style={styles.skipText}>Bỏ qua</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Slides */}
      <View style={styles.slider} {...pan.panHandlers}>
        <Animated.View
          style={{ flexDirection: "row", transform: [{ translateX }] }}
        >
          {introSlides.map((s) => {
            const Icon = Icons[s.iconName];

            return (
              <View key={s.id} style={styles.slide}>
                {/* WAVE EFFECT */}
                <Animated.View
                  style={[
                    styles.waveCircle,
                    {
                      transform: [{ scale: waveScale }],
                      opacity: waveOpacity,
                      backgroundColor: s.color[0] + "40",
                    },
                  ]}
                />

                {/* ICON WITH BOUNCE EFFECT */}
                <Animated.View
                  style={{
                    transform: [{ translateY: bounceAnim }],
                  }}
                >
                  <LinearGradient
                    colors={s.color}
                    style={styles.iconBox}
                    start={[0, 0]}
                    end={[1, 1]}
                  >
                    <Icon size={48} color="#fff" />
                  </LinearGradient>
                </Animated.View>

                <Image source={{ uri: s.image }} style={styles.image} />

                <Text style={styles.title}>{s.title}</Text>
                <Text style={styles.desc}>{s.description}</Text>
              </View>
            );
          })}
        </Animated.View>
      </View>

      {/* Indicators */}
      <View style={styles.indicatorRow}>
        {introSlides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentSlide ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* NEXT */}
      <TouchableOpacity
        onPress={() =>
          currentSlide === introSlides.length - 1
            ? finishIntro()
            : setCurrentSlide(currentSlide + 1)
        }
        style={styles.nextBtn}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={introSlides[currentSlide].color}
          style={styles.nextBtnBox}
        >
          <Text style={styles.nextText}>
            {currentSlide === introSlides.length - 1
              ? "Bắt đầu ngay"
              : "Tiếp theo"}
          </Text>
          <Icons.ChevronRight
            size={20}
            color="#fff"
            style={{ marginLeft: 6 }}
          />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: 60,
  },

  skipWrapper: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 20,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 20,
  },
  skipText: {
    color: "#475569",
    fontWeight: "600",
  },

  slider: {
    flex: 1,
    overflow: "hidden",
  },

  slide: {
    width: SLIDE_WIDTH,
    alignItems: "center",
    paddingHorizontal: 20,
    position: "relative",
  },

  /** Pulse Wave */
  waveCircle: {
    position: "absolute",
    top: 75,
    width: 120,
    height: 120,
    borderRadius: 999,
  },

  iconBox: {
    width: 90,
    height: 90,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },

  image: {
    width: "90%",
    height: 280,
    borderRadius: 22,
    marginBottom: 30,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 10,
  },

  desc: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    paddingHorizontal: 20,
  },

  indicatorRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },

  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotInactive: {
    width: 8,
    backgroundColor: "#cbd5e1",
  },
  dotActive: {
    width: 35,
    backgroundColor: "#10b981",
  },

  nextBtn: {
    marginBottom: 25,
    paddingHorizontal: 25,
  },
  nextBtnBox: {
    borderRadius: 18,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  nextText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
