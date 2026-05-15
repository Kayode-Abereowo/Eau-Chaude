import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, EC, F } from '../constants';
import { ECMono, ECPageHeader, ECSmallCaps } from '../components/atoms';

interface Props {
  score: number;
  correct: number;
  totalQs: number;
  fastestSecs: number;
  bestStreak: number;
  speedBonus: number;
  prevBest: number;
  matchWinner?: 'you' | 'opponent' | null;
  opponentScore?: number;
  newBadges: string[];
  allBadges: Badge[];
  onReplay: () => void;
  onChallenge: () => void;
  onHome: () => void;
}

const CONFETTI_COLORS = ['#0E6A78', '#FFD700', '#B65B5C', '#F4EEE6', '#4CAF50', '#FF6B35'];

function ConfettiPiece({ x, delay, duration, color, size }: {
  x: number; delay: number; duration: number; color: string; size: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute',
      left: `${x}%` as any,
      top: 0,
      width: size,
      height: size * 0.45,
      backgroundColor: color,
      borderRadius: 2,
      opacity: anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0.95, 0.95, 0] }),
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 700] }) },
        { rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '540deg'] }) },
      ],
    }} />
  );
}

const confettiPieces = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 1500,
  duration: 2200 + Math.random() * 1800,
  color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  size: 5 + Math.random() * 7,
}));

export function ResultsScreen({
  score, correct, totalQs, fastestSecs, bestStreak, speedBonus,
  prevBest, matchWinner, opponentScore, newBadges, allBadges, onReplay, onChallenge, onHome,
}: Props) {
  const isNewBest = score > prevBest;
  const isWinner  = matchWinner === 'you';
  const isLoser   = matchWinner === 'opponent';
  const insets    = useSafeAreaInsets();

  const medalAnim   = useRef(new Animated.Value(0)).current;
  const textSlide   = useRef(new Animated.Value(16)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isWinner) {
      Animated.sequence([
        Animated.delay(300),
        Animated.spring(medalAnim, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 200 }),
      ]).start();
      Animated.sequence([
        Animated.delay(800),
        Animated.parallel([
          Animated.timing(textSlide,   { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, []);

  const rows = [
    { label: 'Correct',     mono: `${String(correct).padStart(2, '0')} / ${totalQs}` },
    { label: 'Fastest',     mono: fastestSecs < 9999 ? `${fastestSecs.toFixed(1)} s` : '—' },
    { label: 'Best streak', mono: `${bestStreak} in a row` },
    { label: 'Speed bonus', mono: `+${speedBonus}` },
    ...(opponentScore !== undefined ? [{ label: 'Opponent score', mono: opponentScore.toLocaleString() }] : []),
  ];

  const earnedBadgeDetails = newBadges
    .map(id => allBadges.find(b => b.id === id))
    .filter(Boolean) as Badge[];

  const bg       = isWinner ? EC.tealDeep : EC.cream;
  const textClr  = isWinner ? EC.cream : EC.ink;
  const borderClr = isWinner ? EC.tealLine : EC.creamLine;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Confetti layer (winner only) */}
      {isWinner && (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, overflow: 'hidden' }}>
          {confettiPieces.map(p => <ConfettiPiece key={p.id} {...p} />)}
        </View>
      )}

      <ECPageHeader
        left="No. 004"
        right={isWinner ? 'Victory' : isLoser ? 'Well played' : 'A session, concluded'}
        dark={isWinner}
      />

      <ScrollView style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}>

        {/* Winner header */}
        {isWinner && (
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 8 }}>
            <Animated.Text style={{
              fontSize: 72, lineHeight: 72,
              transform: [
                { scale: medalAnim.interpolate({ inputRange: [0, 0.65, 1], outputRange: [0, 1.25, 1] }) },
                { rotate: medalAnim.interpolate({ inputRange: [0, 0.65, 1], outputRange: ['-15deg', '5deg', '0deg'] }) },
              ],
            }}>🥇</Animated.Text>
            <Animated.Text style={{
              marginTop: 14, fontFamily: F.serifItalic, fontSize: 38,
              color: '#FFD700', letterSpacing: -0.3, lineHeight: 38,
              opacity: textOpacity,
              transform: [{ translateY: textSlide }],
            }}>You won!</Animated.Text>
            <Animated.Text style={{
              marginTop: 6, fontFamily: F.serifItalic, fontSize: 14,
              color: EC.onTealSoft, textAlign: 'center',
              opacity: textOpacity,
              transform: [{ translateY: textSlide }],
            }}>First to finish — the match is yours.</Animated.Text>
          </View>
        )}

        {/* Loser header */}
        {isLoser && (
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 8 }}>
            <Text style={{ fontSize: 52, lineHeight: 56 }}>🥈</Text>
            <ECSmallCaps color={EC.inkFaint} size={10} style={{ marginTop: 10 }}>Opponent finished first</ECSmallCaps>
            <Text style={{ marginTop: 6, fontFamily: F.serifItalic, fontSize: 14,
              color: EC.inkSoft, textAlign: 'center' }}>Good game — keep practising.</Text>
          </View>
        )}

        {/* Solo header */}
        {!matchWinner && (
          <View style={{ alignItems: 'center', paddingBottom: 4 }}>
            <ECSmallCaps color={EC.inkFaint} size={10}>Final score</ECSmallCaps>
          </View>
        )}

        {/* Score */}
        <View style={{ alignItems: 'center', paddingTop: isWinner ? 18 : 8 }}>
          <Text style={{ fontFamily: F.serif, fontSize: 80, lineHeight: 76,
            color: textClr, letterSpacing: -1.5 }}>
            {score.toLocaleString()}
          </Text>
          {isNewBest && (
            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
              paddingVertical: 5, paddingHorizontal: 12,
              borderWidth: 1, borderColor: isWinner ? '#FFD700' : EC.teal, borderRadius: 999 }}>
              <Text style={{ color: isWinner ? '#FFD700' : EC.teal, fontFamily: F.serif, fontSize: 13 }}>▲</Text>
              <ECSmallCaps color={isWinner ? '#FFD700' : EC.teal} size={10}>
                New personal best · +{(score - prevBest).toLocaleString()}
              </ECSmallCaps>
            </View>
          )}
        </View>

        {/* Stats table */}
        <View style={{ marginTop: 18, borderWidth: 1, borderColor: borderClr, borderRadius: 6 }}>
          {rows.map((r, i) => (
            <View key={r.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              padding: 13, paddingHorizontal: 18,
              borderTopWidth: i === 0 ? 0 : 1, borderTopColor: borderClr }}>
              <Text style={{ fontFamily: F.serifItalic, fontSize: 15,
                color: isWinner ? EC.onTealSoft : EC.ink }}>{r.label}</Text>
              <ECMono color={textClr} size={13}>{r.mono}</ECMono>
            </View>
          ))}
        </View>

        {/* Badges */}
        {earnedBadgeDetails.length > 0 && (
          <View style={{ marginTop: 14, padding: 14,
            backgroundColor: isWinner ? 'rgba(255,215,0,0.1)' : EC.tealSoft,
            borderWidth: 1,
            borderColor: isWinner ? 'rgba(255,215,0,0.3)' : 'rgba(14,106,120,0.15)',
            borderRadius: 6 }}>
            <ECSmallCaps color={isWinner ? '#FFD700' : EC.teal} size={9}>
              {earnedBadgeDetails.length > 1 ? 'Badges earned' : 'Badge earned'}
            </ECSmallCaps>
            <View style={{ marginTop: 10, gap: 8 }}>
              {earnedBadgeDetails.map(b => (
                <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontFamily: F.serif, fontSize: 16,
                    color: isWinner ? '#FFD700' : EC.teal, width: 28 }}>{b.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: F.serif, fontSize: 14, color: textClr }}>{b.name}</Text>
                    <Text style={{ fontFamily: F.serifItalic, fontSize: 11,
                      color: isWinner ? EC.onTealSoft : EC.inkSoft }}>{b.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16, gap: 10, zIndex: 1 }}>
        <Pressable onPress={onReplay} style={({ pressed }) => ({
          width: '100%', height: 56,
          backgroundColor: isWinner ? '#FFD700' : (pressed ? EC.tealDeep : EC.teal),
          borderRadius: 6, flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', paddingHorizontal: 22,
        })}>
          <Text style={{ fontFamily: F.serif, fontSize: 19,
            color: isWinner ? EC.ink : EC.cream }}>Play another round</Text>
          <Text style={{ fontSize: 19, color: isWinner ? EC.ink : EC.cream }}>↻</Text>
        </Pressable>
        <Pressable onPress={onChallenge} style={({ pressed }) => ({
          width: '100%', height: 56,
          backgroundColor: pressed ? 'rgba(26,35,38,0.04)' : 'transparent',
          borderWidth: 1, borderColor: isWinner ? EC.tealLine : EC.ink,
          borderRadius: 6, flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', paddingHorizontal: 22,
        })}>
          <Text style={{ fontFamily: F.serif, fontSize: 19, color: textClr }}>Challenge a friend</Text>
          <Text style={{ fontSize: 19, color: textClr }}>→</Text>
        </Pressable>
        <Pressable onPress={onHome} style={({ pressed }) => ({
          width: '100%', height: 48,
          backgroundColor: pressed ? 'rgba(26,35,38,0.04)' : 'transparent',
          borderWidth: 1, borderColor: isWinner ? EC.tealLine : EC.creamLine,
          borderRadius: 6, alignItems: 'center', justifyContent: 'center',
        })}>
          <Text style={{ fontFamily: F.serif, fontSize: 16, color: isWinner ? EC.onTealSoft : EC.inkSoft }}>← Home</Text>
        </Pressable>
      </View>
    </View>
  );
}
