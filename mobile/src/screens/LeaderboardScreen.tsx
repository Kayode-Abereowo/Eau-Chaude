import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EC, F } from '../constants';
import { ECMono, ECPageHeader, ECSmallCaps, Spinner } from '../components/atoms';
import { sb } from '../supabase';

const TABS = [
  { id: 'global', label: 'Global' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'h2h',    label: 'H2H'    },
] as const;
type TabId = typeof TABS[number]['id'];

interface Props {
  userId?: string;
  onBack: () => void;
}

export function LeaderboardScreen({ userId, onBack }: Props) {
  const [tab,     setTab]     = useState<TabId>('global');
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setRows([]); setLoading(true);
    (async () => {
      if (tab === 'global') {
        const { data } = await sb.from('global_leaderboard').select('user_id,display_name,score,rank').order('rank').limit(50);
        setRows(data || []);
      } else if (tab === 'weekly') {
        const { data } = await sb.from('weekly_leaderboard').select('user_id,display_name,score,games_played,rank').order('rank').limit(50);
        setRows(data || []);
      } else {
        const { data } = await sb.from('h2h_leaderboard').select('user_id,display_name,wins,losses,rank').order('rank').limit(50);
        setRows(data || []);
      }
      setLoading(false);
    })();
  }, [tab]);

  function rowValue(r: any) {
    if (tab === 'h2h') return `${r.wins}W · ${r.losses}L`;
    return (r.score || 0).toLocaleString();
  }

  return (
    <View style={{ flex: 1, backgroundColor: EC.cream }}>
      <ECPageHeader left="No. 006" right="The standings" />
      <View style={{ paddingHorizontal: 28, paddingTop: 18 }}>
        <Text style={{ fontFamily: F.serif, fontSize: 28, lineHeight: 30, color: EC.ink, letterSpacing: -0.3 }}>
          Who plays <Text style={{ fontStyle: 'italic', color: EC.teal }}>best</Text>?
        </Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 24, marginTop: 16,
        borderBottomWidth: 1, borderBottomColor: EC.creamLine }}>
        {TABS.map(t => (
          <Pressable key={t.id} onPress={() => setTab(t.id)}
            style={{ paddingVertical: 8, paddingHorizontal: 16,
              borderBottomWidth: 2, borderBottomColor: tab === t.id ? EC.teal : 'transparent',
              marginBottom: -1 }}>
            <ECSmallCaps color={tab === t.id ? EC.teal : EC.inkFaint} size={10}>{t.label}</ECSmallCaps>
          </Pressable>
        ))}
      </View>

      {loading ? <Spinner /> : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {rows.length === 0 && (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontFamily: F.serifItalic, fontSize: 15, color: EC.inkSoft }}>
                No scores recorded yet.
              </Text>
            </View>
          )}
          {rows.map((r, i) => {
            const isMe = r.user_id === userId;
            return (
              <View key={r.user_id || i} style={{
                flexDirection: 'row', alignItems: 'center',
                paddingVertical: 13, paddingHorizontal: 24,
                backgroundColor: isMe ? EC.tealSoft : 'transparent',
                borderBottomWidth: 1, borderBottomColor: EC.creamLine,
              }}>
                <ECMono color={isMe ? EC.teal : EC.inkFaint} size={12} style={{ width: 28 }}>
                  {String(r.rank).padStart(2, '0')}
                </ECMono>
                <Text style={{ flex: 1, fontFamily: isMe ? F.serifItalic : F.serif, fontSize: 16, color: EC.ink }}>
                  {r.display_name || '—'}{isMe ? ' (you)' : ''}
                </Text>
                <ECMono color={isMe ? EC.teal : EC.ink} size={13}>{rowValue(r)}</ECMono>
              </View>
            );
          })}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

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
