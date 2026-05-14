import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, ViewStyle, TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { EC, F } from '../constants';

// ── ECSmallCaps ───────────────────────────────────────────────
interface SmallCapsProps {
  children: React.ReactNode;
  color?: string;
  size?: number;
  tracking?: number;
  style?: TextStyle;
}
export function ECSmallCaps({ children, color = EC.inkSoft, size = 10, tracking = 0.22, style }: SmallCapsProps) {
  return (
    <Text style={[{
      fontFamily: F.serifMedium,
      fontSize: size,
      letterSpacing: tracking * size,
      textTransform: 'uppercase',
      color,
    }, style]}>
      {children}
    </Text>
  );
}

// ── ECMono ────────────────────────────────────────────────────
interface MonoProps {
  children: React.ReactNode;
  color?: string;
  size?: number;
  style?: TextStyle;
}
export function ECMono({ children, color = EC.ink, size = 12, style }: MonoProps) {
  return (
    <Text style={[{
      fontFamily: F.mono,
      fontSize: size,
      color,
      letterSpacing: 0.04 * size,
    }, style]}>
      {children}
    </Text>
  );
}

// ── ECHair ────────────────────────────────────────────────────
interface HairProps {
  color?: string;
  vertical?: boolean;
  length?: number;
  style?: ViewStyle;
}
export function ECHair({ color, vertical, length = 12, style }: HairProps) {
  const c = color || EC.creamLine;
  return vertical
    ? <View style={[{ width: 1, height: length, backgroundColor: c, flexShrink: 0 }, style]} />
    : <View style={[{ height: 1, width: length, backgroundColor: c }, style]} />;
}

// ── ECMonogram ────────────────────────────────────────────────
export function ECMonogram({ color = EC.teal, size = 18 }: { color?: string; size?: number }) {
  return (
    <Text style={{ fontFamily: F.serifMedium, fontSize: size, color, letterSpacing: 0.04 * size, fontStyle: 'italic', lineHeight: size * 1.2 }}>
      É c
    </Text>
  );
}

// ── Spinner ───────────────────────────────────────────────────
export function Spinner({ dark }: { dark?: boolean }) {
  const spin = useRef(new Animated.Value(0)).current;
  const c = dark ? EC.onTealSoft : EC.inkFaint;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1000, useNativeDriver: true })
    ).start();
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{ height: 80, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Svg width={28} height={28} viewBox="0 0 28 28">
          <Circle cx={14} cy={14} r={11} fill="none" stroke={c} strokeWidth={1.5}
            strokeDasharray="52" strokeDashoffset="20" strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ── ECPageHeader ──────────────────────────────────────────────
interface PageHeaderProps {
  left: string;
  right: string;
  dark?: boolean;
  extraTop?: number;
}
export function ECPageHeader({ left, right, dark, extraTop = 0 }: PageHeaderProps) {
  const insets = useSafeAreaInsets();
  const c    = dark ? EC.onTealSoft : EC.inkSoft;
  const line = dark ? EC.tealLine   : EC.creamLine;
  return (
    <View style={{ paddingTop: insets.top + 16 + extraTop, paddingHorizontal: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <ECSmallCaps color={c}>{left}</ECSmallCaps>
        <ECSmallCaps color={c}>{right}</ECSmallCaps>
      </View>
      <View style={{ height: 1, backgroundColor: line, marginTop: 10 }} />
    </View>
  );
}
