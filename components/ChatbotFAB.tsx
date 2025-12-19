import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import Animated, {
  Easing,
  FadeInUp,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const COLORS = {
  primary: "#059669",
  teal600: "#0d9488",
  white: "#ffffff",
};

interface ChatbotFABProps {
  bottomOffset?: number;
}

export function ChatbotFAB({ bottomOffset = 20 }: ChatbotFABProps) {
  const router = useRouter();

  /* ================= PULSE ================= */
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.08, { duration: 1000 }), -1, true);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  /* ================= AUTO RIPPLE ================= */
  const RIPPLE_DURATION = 1800;

  const ripple1Scale = useSharedValue(1);
  const ripple1Opacity = useSharedValue(0.4);

  const ripple2Scale = useSharedValue(1);
  const ripple2Opacity = useSharedValue(0.4);

  useEffect(() => {
    ripple1Scale.value = withRepeat(
      withTiming(2.2, { duration: RIPPLE_DURATION }),
      -1,
      false
    );

    ripple1Opacity.value = withRepeat(
      withTiming(0, {
        duration: RIPPLE_DURATION,
        easing: Easing.linear, // ✅ FIX
      }),
      -1,
      false
    );

    ripple2Scale.value = withDelay(
      RIPPLE_DURATION / 2,
      withRepeat(withTiming(2.2, { duration: RIPPLE_DURATION }), -1, false)
    );

    ripple2Opacity.value = withDelay(
      RIPPLE_DURATION / 2,
      withRepeat(
        withTiming(0, {
          duration: RIPPLE_DURATION,
          easing: Easing.linear, // ✅ FIX
        }),
        -1,
        false
      )
    );
  }, []);

  const rippleStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: ripple1Scale.value }],
    opacity: ripple1Opacity.value,
  }));

  const rippleStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: ripple2Scale.value }],
    opacity: ripple2Opacity.value,
  }));

  /* ================= PRESS RIPPLE ================= */
  const pressScale = useSharedValue(1);
  const pressOpacity = useSharedValue(0);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
    opacity: pressOpacity.value,
  }));

  const handlePress = () => {
    pressScale.value = 1;
    pressOpacity.value = 0.4;

    pressScale.value = withTiming(2.5, { duration: 400 });
    pressOpacity.value = withTiming(0, { duration: 400 });

    router.push("/ChatbotScreen" as any);
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(400).springify()}
      exiting={FadeOutDown.duration(200)}
      style={[styles.container, { bottom: bottomOffset }]}
    >
      {/* 🌊 AUTO RIPPLE */}
      <Animated.View style={[styles.autoRipple, rippleStyle1]} />
      <Animated.View style={[styles.autoRipple, rippleStyle2]} />

      {/* 🫧 PRESS RIPPLE */}
      <Animated.View style={[styles.pressRipple, pressStyle]} />

      {/* 🤖 FAB */}
      <Animated.View style={pulseStyle}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePress}
          style={styles.fabButton}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.teal600]}
            start={{ x: 0.1, y: 0.9 }}
            end={{ x: 0.9, y: 0.1 }}
            style={styles.fabGradient}
          >
            <Feather name="aperture" size={26} color={COLORS.white} />
            <Text style={styles.hidden}>AI Chat</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 20,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    elevation: 10,
  },
  fabGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  autoRipple: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(5,150,105,0.4)",
  },
  pressRipple: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  hidden: {
    width: 1,
    height: 1,
    overflow: "hidden",
  },
});
