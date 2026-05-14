import React from 'react';
import { Text, View } from 'react-native';
import { Category, EC, F } from '../constants';
import { ECMonogram, ECSmallCaps, Spinner } from '../components/atoms';

export function LoadingScreen({ category }: { category?: Category | null }) {
  return (
    <View style={{ flex: 1, backgroundColor: EC.cream, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <ECMonogram color={EC.teal} size={22} />
      <Text style={{ fontFamily: F.serifItalic, fontSize: 17, color: EC.inkSoft }}>
        Assembling your questions…
      </Text>
      <Spinner />
      {category && <ECSmallCaps color={EC.inkFaint} size={9}>{category.name}</ECSmallCaps>}
    </View>
  );
}
