import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, EC, F, TIMER_TOTAL } from '../constants';
import { ECHair, ECMono, ECPageHeader, ECSmallCaps } from '../components/atoms';

interface Props {
  score: number;
  correct: number;
  fastestSecs: number;
  bestStreak: number;
  speedBonus: number;
  prevBest: number;
  categoryName: string;
  matchWinner?: 'you' | 'opponent' | null;
  newBadges: string[];
  allBadges: Badge[];
  onReplay: () => void;
  onChallenge: () => void;
}

export function ResultsScreen({
  score, correct, fastestSecs, bestStreak, speedBonus,
  prevBest, categoryName, matchWinner, newBadges, allBadges,
  onReplay, onChallenge,
}: Props) {
  const isNewBest = score > prevBest;
  const insets    = useSafeAreaInsets();
  const rows = [
    { label: 'Correct',     mono: `${String(correct).padStart(2, '0')} / 10` },
    { label: 'Fastest',     mono: `${fastestSecs >= TIMER_TOTAL ? TIMER_TOTAL : fastestSecs.toFixed(1)} s` },
    { label: 'Best streak', mono: `${bestStreak} in a row` },
    { label: 'Speed bonus', mono: `+${speedBonus}` },
  ];
  const earnedBadgeDetails = newBadges.map(id => allBadges.find(b => b.id === id)).filter(Boolean) as Badge[];

  return (
    <View style={{ flex: 1, backgroundColor: EC.cream }}>
      <ECPageHeader left="No. 004" right="A session, concluded" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18 }}
        showsVerticalScrollIndicator={false}>

        {/* Match result */}
        {matchWinner && (
          <View style={{ marginBottom: 10, alignItems: 'center' }}>
            <ECSmallCaps color={matchWinner === 'you' ? EC.teal : EC.inkFaint} size={10}>
              {matchWinner === 'you' ? 'You won the match' : 'Opponent won'}
            </ECSmallCaps>
          </View>
        )}

        {/* Score */}
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <ECSmallCaps color={EC.inkFaint} size={10}>Final score</ECSmallCaps>
          <Text style={{ marginTop: 10, fontFamily: F.serif, fontSize: 80, lineHeight: 76,
            color: EC.ink, letterSpacing: -1.5 }}>
            {score.toLocaleString()}
          </Text>
          {isNewBest && (
            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
              paddingVertical: 5, paddingHorizontal: 12,
              borderWidth: 1, borderColor: EC.teal, borderRadius: 999 }}>
              <Text style={{ color: EC.teal, fontFamily: F.serif, fontSize: 13 }}>▲</Text>
              <ECSmallCaps color={EC.teal} size={10}>
                New personal best · +{(score - prevBest).toLocaleString()}
              </ECSmallCaps>
            </View>
          )}
        </View>

        {/* Stats table */}
        <View style={{ marginTop: 18, borderWidth: 1, borderColor: EC.creamLine, borderRadius: 6 }}>
          {rows.map((r, i) => (
            <View key={r.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              padding: 13, paddingHorizontal: 18,
              borderTopWidth: i === 0 ? 0 : 1, borderTopColor: EC.creamLine }}>
              <Text style={{ fontFamily: F.serifItalic, fontSize: 15, color: EC.ink }}>{r.label}</Text>
              <ECMono color={EC.ink} size={13}>{r.mono}</ECMono>
            </View>
          ))}
        </View>

        {/* New badges */}
        {earnedBadgeDetails.length > 0 && (
          <View style={{ marginTop: 14, padding: 14, backgroundColor: EC.tealSoft,
            borderWidth: 1, borderColor: 'rgba(14,106,120,0.15)', borderRadius: 6 }}>
            <ECSmallCaps color={EC.teal} size={9}>
              {earnedBadgeDetails.length > 1 ? 'Badges earned' : 'Badge earned'}
            </ECSmallCaps>
            <View style={{ marginTop: 10, gap: 8 }}>
              {earnedBadgeDetails.map(b => (
                <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontFamily: F.serif, fontSize: 16, color: EC.teal, width: 28 }}>{b.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: F.serif, fontSize: 14, color: EC.ink }}>{b.name}</Text>
                    <Text style={{ fontFamily: F.serifItalic, fontSize: 11, color: EC.inkSoft }}>{b.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Category accuracy */}
        <View style={{ paddingTop: 16 }}>
          <ECSmallCaps color={EC.inkFaint} size={9}>By category · this session</ECSmallCaps>
          <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ flex: 1, fontFamily: F.serifItalic, fontSize: 13, color: EC.inkSoft }}>{categoryName}</Text>
            <View style={{ width: 100, height: 1, backgroundColor: EC.creamLine }}>
              <View style={{ position: 'absolute', left: 0, top: -1,
                width: `${(correct / 10) * 100}%`, height: 3, backgroundColor: EC.teal }} />
            </View>
            <ECMono color={EC.ink} size={11} style={{ width: 32, textAlign: 'right' }}>
              {Math.round((correct / 10) * 100)}%
            </ECMono>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16, gap: 10 }}>
        <Pressable onPress={onReplay} style={({ pressed }) => ({
          width: '100%', height: 56, backgroundColor: pressed ? EC.tealDeep : EC.teal,
          borderRadius: 6, flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', paddingHorizontal: 22,
        })}>
          <Text style={{ fontFamily: F.serif, fontSize: 19, color: EC.cream }}>Play another round</Text>
          <Text style={{ fontSize: 19, color: EC.cream }}>↻</Text>
        </Pressable>
        <Pressable onPress={onChallenge} style={({ pressed }) => ({
          width: '100%', height: 56, backgroundColor: pressed ? 'rgba(26,35,38,0.04)' : 'transparent',
          borderWidth: 1, borderColor: EC.ink, borderRadius: 6,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22,
        })}>
          <Text style={{ fontFamily: F.serif, fontSize: 19, color: EC.ink }}>Challenge a friend</Text>
          <Text style={{ fontSize: 19, color: EC.ink }}>→</Text>
        </Pressable>
      </View>
    </View>
  );
}
