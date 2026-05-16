import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EC, F, Profile } from '../constants';
import { ECHair, ECMono, ECMonogram, ECPageHeader, ECSmallCaps } from '../components/atoms';

interface Props {
  profile: Profile | null;
  onSolo: () => void;
  onChallenge: () => void;
  onToiMoi: () => void;
  onLeaderboard: () => void;
  onProfile: () => void;
  onMonogramTap: () => void;
}

export function HomeScreen({ profile, onSolo, onChallenge, onToiMoi, onLeaderboard, onProfile, onMonogramTap }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: EC.cream }}>
      <ECPageHeader left="No. 001" right="Chapter — Welcome" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View style={{ marginBottom: 28, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ECHair length={28} color={EC.inkFaint} />
          <Pressable onPress={onMonogramTap} hitSlop={12}>
            <ECMonogram color={EC.teal} size={20} />
          </Pressable>
          <ECHair length={28} color={EC.inkFaint} />
        </View>
        <Text style={{ fontFamily: F.serif, fontSize: 64, lineHeight: 60, color: EC.ink, letterSpacing: -0.6, textAlign: 'center' }}>
          {'Eau\n'}<Text style={{ fontStyle: 'italic', color: EC.teal }}>Claude</Text>
        </Text>
        <Text style={{ marginTop: 24, fontFamily: F.serifItalic, fontSize: 17, color: EC.inkSoft, lineHeight: 26, textAlign: 'center', maxWidth: 260 }}>
          {'A trivia game,\nmade with love.'}
        </Text>
        {profile?.display_name && (
          <View style={{ marginTop: 14 }}>
            <ECSmallCaps color={EC.inkFaint} size={9}>Welcome back, {profile.display_name}</ECSmallCaps>
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
        <Pressable onPress={onSolo} style={({ pressed }) => ({
          width: '100%', height: 60, backgroundColor: pressed ? EC.tealDeep : EC.teal,
          borderRadius: 6, flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', paddingHorizontal: 22, marginBottom: 12,
        })}>
          <Text style={{ fontFamily: F.serif, fontSize: 21, color: EC.cream, letterSpacing: 0.4 }}>Begin a solo game</Text>
          <ECSmallCaps color={EC.onTealSoft} size={10}>I</ECSmallCaps>
        </Pressable>

        <Pressable onPress={onChallenge} style={({ pressed }) => ({
          width: '100%', height: 60, backgroundColor: pressed ? 'rgba(26,35,38,0.04)' : 'transparent',
          borderWidth: 1, borderColor: EC.ink, borderRadius: 6, marginBottom: 12,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22,
        })}>
          <Text style={{ fontFamily: F.serif, fontSize: 21, color: EC.ink, letterSpacing: 0.4 }}>Invite a friend</Text>
          <ECSmallCaps color={EC.inkSoft} size={10}>II</ECSmallCaps>
        </Pressable>

        <Pressable onPress={onToiMoi} style={({ pressed }) => ({
          width: '100%', height: 60, backgroundColor: pressed ? '#8B3A3B' : '#B65B5C',
          borderRadius: 6, flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', paddingHorizontal: 22,
        })}>
          <Text style={{ fontFamily: F.serif, fontSize: 21, color: '#FBF5EF', letterSpacing: 0.4 }}>
            Toi <Text style={{ fontStyle: 'italic' }}>&amp;</Text> Moi
          </Text>
          <ECSmallCaps color="rgba(251,245,239,0.55)" size={10}>III</ECSmallCaps>
        </Pressable>

        {/* Stats strip */}
        <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
          <View>
            <ECSmallCaps color={EC.inkFaint} size={9}>Personal best</ECSmallCaps>
            <View style={{ marginTop: 4 }}>
              <ECMono color={EC.ink} size={14}>{profile?.personal_best ? profile.personal_best.toLocaleString() : '—'}</ECMono>
            </View>
          </View>
          <ECHair vertical length={28} color={EC.creamLine} />
          <View style={{ alignItems: 'center' }}>
            <ECSmallCaps color={EC.inkFaint} size={9}>Streak</ECSmallCaps>
            <View style={{ marginTop: 4 }}>
              <ECMono color={EC.ink} size={14}>{profile?.current_streak ?? 0} days</ECMono>
            </View>
          </View>
          <ECHair vertical length={28} color={EC.creamLine} />
          <View style={{ alignItems: 'flex-end' }}>
            <ECSmallCaps color={EC.inkFaint} size={9}>Longest</ECSmallCaps>
            <View style={{ marginTop: 4 }}>
              <ECMono color={EC.ink} size={14}>{profile?.longest_streak ?? 0}d</ECMono>
            </View>
          </View>
        </View>

        {/* Secondary nav */}
        <View style={{ marginTop: 14, flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={onLeaderboard} style={({ pressed }) => ({
            flex: 1, height: 40, backgroundColor: pressed ? EC.creamSoft : 'transparent',
            borderWidth: 1, borderColor: EC.creamLine, borderRadius: 5,
            alignItems: 'center', justifyContent: 'center',
          })}>
            <Text style={{ fontFamily: F.serif, fontSize: 14, color: EC.inkSoft }}>Standings</Text>
          </Pressable>
          <Pressable onPress={onProfile} style={({ pressed }) => ({
            flex: 1, height: 40, backgroundColor: pressed ? EC.creamSoft : 'transparent',
            borderWidth: 1, borderColor: EC.creamLine, borderRadius: 5,
            alignItems: 'center', justifyContent: 'center',
          })}>
            <Text style={{ fontFamily: F.serif, fontSize: 14, color: EC.inkSoft }}>Profile</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
