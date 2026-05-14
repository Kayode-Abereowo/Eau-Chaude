import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES_LIST, Category, EC, F } from '../constants';
import { ECMono, ECPageHeader, ECSmallCaps } from '../components/atoms';

interface Props {
  mode?: 'solo' | 'h2h';
  onBegin: (cat: Category, difficulty: string) => void;
}

function CategoryCard({ n, name, count, selected, onPress }: {
  n: string; name: string; count: number; selected: boolean; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{
      flex: 1, minWidth: 0, height: 90,
      borderWidth: 1, borderColor: selected ? EC.teal : EC.creamLine,
      backgroundColor: selected ? EC.tealSoft : 'transparent',
      borderRadius: 4, padding: 11,
      justifyContent: 'space-between',
    }}>
      <ECSmallCaps color={selected ? EC.teal : EC.inkFaint} size={9} tracking={0.28}>{n}</ECSmallCaps>
      <View>
        <Text style={{ fontFamily: F.serif, fontSize: 15, lineHeight: 18, color: EC.ink }}>{name}</Text>
        <View style={{ marginTop: 3 }}>
          <ECMono color={EC.inkFaint} size={10}>{count.toLocaleString()}</ECMono>
        </View>
      </View>
    </Pressable>
  );
}

export function CategoryScreen({ mode = 'solo', onBegin }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(1);
  const [difficulty, setDifficulty]   = useState('Medium');
  const insets = useSafeAreaInsets();
  const cat = CATEGORIES_LIST[selectedIdx];

  return (
    <View style={{ flex: 1, backgroundColor: EC.cream }}>
      <ECPageHeader left={`${mode === 'h2h' ? 'Match' : 'Solo'} · No. 002`} right="Choose a subject" />

      <View style={{ paddingHorizontal: 28, paddingTop: 20, paddingBottom: 8 }}>
        <Text style={{ fontFamily: F.serif, fontSize: 28, lineHeight: 30, color: EC.ink, letterSpacing: -0.3 }}>
          What would you{'\n'}like to know{' '}
          <Text style={{ fontStyle: 'italic', color: EC.teal }}>tonight</Text>?
        </Text>
        <Text style={{ marginTop: 6, fontFamily: F.serifItalic, fontSize: 13, color: EC.inkSoft }}>
          Fourteen subjects. Ten questions each.
        </Text>
      </View>

      {/* Difficulty picker */}
      <View style={{ paddingHorizontal: 28, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <ECSmallCaps color={EC.inkFaint} size={9}>Difficulty</ECSmallCaps>
        <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: EC.creamLine, borderRadius: 4, overflow: 'hidden' }}>
          {(['Gentle', 'Medium', 'Hard'] as const).map((d, i) => (
            <Pressable key={d} onPress={() => setDifficulty(d)} style={{
              paddingVertical: 5, paddingHorizontal: 12,
              backgroundColor: difficulty === d ? EC.ink : 'transparent',
              borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: EC.creamLine,
            }}>
              <Text style={{ fontFamily: F.serif, fontSize: 12, color: difficulty === d ? EC.cream : EC.inkSoft }}>
                {d}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Category grid */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 7 }} showsVerticalScrollIndicator={false}>
        {Array.from({ length: 7 }).map((_, row) => (
          <View key={row} style={{ flexDirection: 'row', gap: 7 }}>
            <CategoryCard
              {...CATEGORIES_LIST[row * 2]}
              selected={selectedIdx === row * 2}
              onPress={() => setSelectedIdx(row * 2)}
            />
            {CATEGORIES_LIST[row * 2 + 1] && (
              <CategoryCard
                {...CATEGORIES_LIST[row * 2 + 1]}
                selected={selectedIdx === row * 2 + 1}
                onPress={() => setSelectedIdx(row * 2 + 1)}
              />
            )}
          </View>
        ))}
        <View style={{ height: 8 }} />
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16, paddingTop: 8 }}>
        <Pressable onPress={() => onBegin(cat, difficulty)} style={({ pressed }) => ({
          width: '100%', height: 56, backgroundColor: pressed ? EC.tealDeep : EC.teal,
          borderRadius: 6, flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', paddingHorizontal: 22,
        })}>
          <Text style={{ fontFamily: F.serif, fontSize: 18, color: EC.cream }}>Begin {cat.name} · 10 Qs</Text>
          <Text style={{ fontSize: 20, color: EC.cream }}>→</Text>
        </Pressable>
      </View>
    </View>
  );
}
