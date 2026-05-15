import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EC, F } from '../constants';
import { ECPageHeader, ECSmallCaps } from '../components/atoms';

const Q_COUNTS = [5, 10, 15, 20, 25];

interface Props {
  mode?: 'solo' | 'h2h';
  onBegin: (difficulty: string, count: number, categoryId: number | null) => void;
  onBack: () => void;
}

export function CategoryScreen({ mode = 'solo', onBegin, onBack }: Props) {
  const [difficulty,  setDifficulty]  = useState('Medium');
  const [count,       setCount]       = useState(10);
  const [categoryId,  setCategoryId]  = useState<number | null>(null);
  const insets = useSafeAreaInsets();

  const isBible = categoryId === 15;

  return (
    <View style={{ flex: 1, backgroundColor: EC.cream }}>
      <ECPageHeader
        left={`${mode === 'h2h' ? 'Match' : 'Solo'} · No. 002`}
        right="Set up your round"
      />

      <View style={{ paddingHorizontal: 28, paddingTop: 20, paddingBottom: 8 }}>
        <Text style={{ fontFamily: F.serif, fontSize: 28, lineHeight: 30, color: EC.ink, letterSpacing: -0.3 }}>
          How would you{'\n'}like to{' '}
          <Text style={{ fontStyle: 'italic', color: EC.teal }}>play</Text>?
        </Text>
        <Text style={{ marginTop: 6, fontFamily: F.serifItalic, fontSize: 13, color: EC.inkSoft }}>
          {isBible ? 'Scripture & theology questions.' : 'Questions drawn from all fourteen subjects.'}
        </Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 24, gap: 24 }}>

        {/* Category */}
        <View style={{ gap: 12 }}>
          <ECSmallCaps color={EC.inkFaint} size={9}>Category</ECSmallCaps>
          <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: EC.creamLine, borderRadius: 6, overflow: 'hidden' }}>
            {([
              { label: 'All subjects', id: null },
              { label: 'Bible Trivia', id: 15 },
            ] as const).map((opt, i) => {
              const active = categoryId === opt.id;
              return (
                <Pressable key={String(opt.id)} onPress={() => setCategoryId(opt.id)} style={{
                  flex: 1, paddingVertical: 13,
                  backgroundColor: active ? EC.teal : 'transparent',
                  borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: EC.creamLine,
                  alignItems: 'center',
                }}>
                  <Text style={{ fontFamily: F.serif, fontSize: 15, color: active ? EC.cream : EC.inkSoft }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Difficulty */}
        <View style={{ gap: 12 }}>
          <ECSmallCaps color={EC.inkFaint} size={9}>Difficulty</ECSmallCaps>
          <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: EC.creamLine, borderRadius: 6, overflow: 'hidden' }}>
            {(['Gentle', 'Medium', 'Hard'] as const).map((d, i) => (
              <Pressable key={d} onPress={() => setDifficulty(d)} style={{
                flex: 1, paddingVertical: 13,
                backgroundColor: difficulty === d ? EC.ink : 'transparent',
                borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: EC.creamLine,
                alignItems: 'center',
              }}>
                <Text style={{ fontFamily: F.serif, fontSize: 15, color: difficulty === d ? EC.cream : EC.inkSoft }}>
                  {d}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Question count */}
        <View style={{ gap: 12 }}>
          <ECSmallCaps color={EC.inkFaint} size={9}>Questions</ECSmallCaps>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {Q_COUNTS.map(n => (
              <Pressable key={n} onPress={() => setCount(n)} style={{
                flex: 1, height: 52,
                borderWidth: 1, borderColor: count === n ? EC.teal : EC.creamLine,
                backgroundColor: count === n ? EC.tealSoft : 'transparent',
                borderRadius: 6, alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontFamily: F.serif, fontSize: 18, color: count === n ? EC.teal : EC.inkSoft }}>
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16, paddingTop: 8, gap: 10 }}>
        <Pressable onPress={() => onBegin(difficulty, count, categoryId)} style={({ pressed }) => ({
          width: '100%', height: 56, backgroundColor: pressed ? EC.tealDeep : EC.teal,
          borderRadius: 6, flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', paddingHorizontal: 22,
        })}>
          <Text style={{ fontFamily: F.serif, fontSize: 18, color: EC.cream }}>
            Begin · {count} questions
          </Text>
          <Text style={{ fontSize: 20, color: EC.cream }}>→</Text>
        </Pressable>
        <Pressable onPress={onBack} style={({ pressed }) => ({
          width: '100%', height: 48,
          backgroundColor: pressed ? 'rgba(26,35,38,0.04)' : 'transparent',
          borderWidth: 1, borderColor: EC.creamLine,
          borderRadius: 6, alignItems: 'center', justifyContent: 'center',
        })}>
          <Text style={{ fontFamily: F.serif, fontSize: 16, color: EC.inkSoft }}>← Back</Text>
        </Pressable>
      </View>
    </View>
  );
}
