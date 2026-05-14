import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, CATEGORIES_LIST, EC, F, Profile } from '../constants';
import { ECMono, ECPageHeader, ECSmallCaps, Spinner } from '../components/atoms';
import { sb } from '../supabase';

interface Props {
  userId?: string;
  profile: Profile | null;
  allBadges: Badge[];
  onBack: () => void;
}

export function ProfileScreen({ userId, profile, allBadges, onBack }: Props) {
  const [userBadges,  setUserBadges]  = useState<{ badge_id: string }[]>([]);
  const [catBests,    setCatBests]    = useState<{ category_id: number; score: number }[]>([]);
  const [h2hRecord,   setH2hRecord]   = useState<{ wins: number; losses: number } | null>(null);
  const [loading,     setLoading]     = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [{ data: ub }, { data: pb }, { data: h2h }] = await Promise.all([
        sb.from('user_badges').select('badge_id,earned_at').eq('user_id', userId),
        sb.from('personal_bests').select('category_id,score').eq('user_id', userId).order('score', { ascending: false }),
        sb.from('h2h_records').select('wins,losses').eq('user_id', userId).single(),
      ]);
      setUserBadges((ub as any[]) || []);
      setCatBests((pb as any[]) || []);
      setH2hRecord(h2h as any || null);
      setLoading(false);
    })();
  }, [userId]);

  const earnedIds = new Set(userBadges.map(b => b.badge_id));

  return (
    <View style={{ flex: 1, backgroundColor: EC.cream }}>
      <ECPageHeader left="No. 007" right="Your record" />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View style={{ paddingTop: 20, paddingBottom: 16, alignItems: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 32,
            borderWidth: 1, borderColor: EC.creamLine,
            alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Text style={{ fontFamily: F.serifItalic, fontSize: 26, color: EC.teal }}>
              {(profile?.display_name || '?')[0]}
            </Text>
          </View>
          <Text style={{ fontFamily: F.serif, fontSize: 22, color: EC.ink }}>
            {profile?.display_name || '—'}
          </Text>
          <View style={{ marginTop: 4 }}>
            <ECSmallCaps color={EC.inkFaint} size={9}>Member · Eau Claude</ECSmallCaps>
          </View>
        </View>

        {/* Stats row */}
        <View style={{ marginHorizontal: 24, flexDirection: 'row',
          borderWidth: 1, borderColor: EC.creamLine, borderRadius: 6,
          overflow: 'hidden', marginBottom: 20 }}>
          {[
            { label: 'Best score', val: (profile?.personal_best || 0).toLocaleString() },
            { label: 'Streak',     val: `${profile?.current_streak || 0}d` },
            { label: 'H2H wins',   val: String(h2hRecord?.wins || 0) },
          ].map((s, i) => (
            <View key={s.label} style={{ flex: 1, padding: 12, alignItems: 'center',
              borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: EC.creamLine }}>
              <ECSmallCaps color={EC.inkFaint} size={8}>{s.label}</ECSmallCaps>
              <View style={{ marginTop: 5 }}>
                <ECMono color={EC.ink} size={14}>{s.val}</ECMono>
              </View>
            </View>
          ))}
        </View>

        {/* Badges */}
        <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
          <ECSmallCaps color={EC.inkFaint} size={9}>Badges ({earnedIds.size} / {allBadges.length})</ECSmallCaps>
          {loading ? <Spinner /> : (
            <View style={{ marginTop: 10, borderWidth: 1, borderColor: EC.creamLine, borderRadius: 6, overflow: 'hidden' }}>
              {allBadges.map((b, i) => {
                const earned = earnedIds.has(b.id);
                return (
                  <View key={b.id} style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    padding: 11, paddingHorizontal: 16, opacity: earned ? 1 : 0.38,
                    borderTopWidth: i > 0 ? 1 : 0, borderTopColor: EC.creamLine,
                  }}>
                    <Text style={{ fontFamily: F.serif, fontSize: 16, color: earned ? EC.teal : EC.inkFaint, width: 28 }}>
                      {b.icon}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: F.serif, fontSize: 14, color: EC.ink }}>{b.name}</Text>
                      <Text style={{ fontFamily: F.serifItalic, fontSize: 11, color: EC.inkSoft }}>{b.description}</Text>
                    </View>
                    {earned && <ECSmallCaps color={EC.teal} size={8}>Earned</ECSmallCaps>}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Category personal bests */}
        {catBests.length > 0 && (
          <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
            <ECSmallCaps color={EC.inkFaint} size={9}>Personal bests by category</ECSmallCaps>
            <View style={{ marginTop: 10, borderWidth: 1, borderColor: EC.creamLine, borderRadius: 6, overflow: 'hidden' }}>
              {catBests.map((pb, i) => {
                const cat = CATEGORIES_LIST.find(c => c.id === pb.category_id);
                return (
                  <View key={pb.category_id} style={{
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    padding: 11, paddingHorizontal: 16,
                    borderTopWidth: i > 0 ? 1 : 0, borderTopColor: EC.creamLine,
                  }}>
                    <Text style={{ fontFamily: F.serifItalic, fontSize: 14, color: EC.ink }}>
                      {cat?.name || '—'}
                    </Text>
                    <ECMono color={EC.ink} size={13}>{pb.score.toLocaleString()}</ECMono>
                  </View>
                );
              })}
            </View>
          </View>
        )}
        <View style={{ height: 16 }} />
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
        <Pressable onPress={onBack} style={{
          width: '100%', height: 48, borderWidth: 1, borderColor: EC.creamLine,
          borderRadius: 6, alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontFamily: F.serif, fontSize: 17, color: EC.inkSoft }}>← Back</Text>
        </Pressable>
      </View>
    </View>
  );
}
