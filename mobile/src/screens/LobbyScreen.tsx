import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES_LIST, EC, F, Match, MatchPlayer } from '../constants';
import { ECHair, ECMono, ECPageHeader, ECSmallCaps } from '../components/atoms';

function PlayerCard({ name, initial, you, host, status, dark }: {
  name: string; initial: string; you?: boolean; host?: boolean; status: string; dark?: boolean;
}) {
  const text  = dark ? EC.cream : EC.ink;
  const faint = dark ? EC.onTealFaint : EC.inkFaint;
  const soft  = dark ? EC.onTealSoft : EC.inkSoft;
  const line  = dark ? EC.tealLine : EC.creamLine;
  return (
    <View style={{ flex: 1, padding: 16, borderWidth: 1, borderColor: line,
      borderRadius: 6, alignItems: 'center', gap: 8 }}>
      <ECSmallCaps color={faint} size={9}>{you ? 'You' : host ? 'Host' : 'Guest'}</ECSmallCaps>
      <View style={{ width: 70, height: 70, borderRadius: 35, borderWidth: 1, borderColor: line,
        alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: F.serifItalic, fontSize: 26, color: text, lineHeight: 30 }}>{initial}</Text>
      </View>
      <Text style={{ fontFamily: F.serif, fontSize: 17, color: text, textAlign: 'center' }}>{name}</Text>
      <Text style={{ fontFamily: F.serifItalic, fontSize: 11, color: soft, textAlign: 'center', minHeight: 14 }}>{status}</Text>
    </View>
  );
}

interface Props {
  match: Match;
  players: MatchPlayer[];
  currentUserId: string;
  isHost: boolean;
  onStart: () => void;
  onHome: () => void;
}

export function LobbyScreen({ match, players, currentUserId, isHost, onStart, onHome }: Props) {
  const [copied,   setCopied]   = useState(false);
  const insets    = useSafeAreaInsets();
  const starting  = match.status === 'active';
  const me        = players.find(p => p.user_id === currentUserId);
  const opponent  = players.find(p => p.user_id !== currentUserId);
  const bothReady = players.length >= 2;
  const catName   = CATEGORIES_LIST.find(c => c.id === match.category_id)?.name || '';

  async function copyCode() {
    await Clipboard.setStringAsync(`Join me on Eau Claude! Code: ${match.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <View style={{ flex: 1, backgroundColor: starting ? EC.tealDeep : EC.cream }}>
      <ECPageHeader
        left={starting ? 'Match · No. 005' : 'Lobby · No. 005'}
        right={starting ? 'Beginning' : 'Awaiting'}
        dark={starting}
      />

      <View style={{ paddingHorizontal: 28, paddingTop: 20 }}>
        <Text style={{ fontFamily: F.serif, fontSize: 27, lineHeight: 29, letterSpacing: -0.3,
          color: starting ? EC.cream : EC.ink }}>
          {starting
            ? <>The match{' '}<Text style={{ fontStyle: 'italic', opacity: 0.85 }}>begins</Text></>
            : <>Head{' '}<Text style={{ fontStyle: 'italic', color: EC.teal }}>to</Text>{' '}head</>
          }
        </Text>
        <Text style={{ marginTop: 5, fontFamily: F.serifItalic, fontSize: 13,
          color: starting ? EC.onTealSoft : EC.inkSoft }}>
          {`Ten questions · ${catName} · ${match.difficulty}`}
        </Text>
      </View>

      {/* Player cards */}
      <View style={{ paddingHorizontal: 22, paddingTop: 20, flexDirection: 'row', alignItems: 'stretch', gap: 10 }}>
        <PlayerCard
          name={me?.display_name || 'You'}
          initial={(me?.display_name || 'Y')[0]}
          you status="Ready" dark={starting}
        />
        <View style={{ width: 32, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: F.serifItalic, fontSize: 20, color: starting ? EC.cream : EC.ink, opacity: 0.6 }}>vs</Text>
        </View>
        <PlayerCard
          name={opponent?.display_name || 'Claude'}
          initial={(opponent?.display_name || 'C')[0]}
          status={opponent ? 'Ready' : 'Connecting…'}
          dark={starting}
        />
      </View>

      {/* Center */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
        {starting ? (
          <>
            <ECSmallCaps color={EC.onTealSoft} size={10}>Beginning in</ECSmallCaps>
            <Text style={{ marginTop: 12, fontFamily: F.serif, fontSize: 110, lineHeight: 100, color: EC.cream }}>3</Text>
            <View style={{ marginTop: 10, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <ECMono color={EC.onTealFaint} size={14}>3</ECMono>
              <ECHair length={14} color={EC.tealLine} />
              <ECMono color={EC.cream} size={14}>2</ECMono>
              <ECHair length={14} color={EC.tealLine} />
              <ECMono color={EC.onTealFaint} size={14}>1</ECMono>
            </View>
          </>
        ) : (
          <>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: EC.teal, opacity: 0.5, marginBottom: 12 }} />
            <ECSmallCaps color={EC.inkFaint} size={10}>
              {bothReady ? 'Both players are ready' : 'Waiting for opponent'}
            </ECSmallCaps>
            <Text style={{ marginTop: 12, fontFamily: F.serifItalic, fontSize: 14,
              color: EC.inkSoft, textAlign: 'center', maxWidth: 240 }}>
              {bothReady
                ? 'Host can start the match when ready.'
                : 'Your invitation has been sent.\nThey have until the kettle whistles.'}
            </Text>
          </>
        )}
      </View>

      {/* Bottom */}
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
        {!starting && (
          <>
            <Pressable onPress={copyCode} style={{
              borderWidth: 1, borderColor: EC.creamLine, borderRadius: 6,
              padding: 12, paddingHorizontal: 15, flexDirection: 'row',
              alignItems: 'center', gap: 10, marginBottom: 10,
            }}>
              <View style={{ flex: 1 }}>
                <ECSmallCaps color={EC.inkFaint} size={9}>Match code</ECSmallCaps>
                <View style={{ marginTop: 3 }}>
                  <ECMono color={EC.ink} size={18}>{match.code}</ECMono>
                </View>
              </View>
              <ECSmallCaps color={EC.teal} size={10}>{copied ? 'Copied ✓' : 'Copy invite'}</ECSmallCaps>
            </Pressable>
            {isHost ? (
              <Pressable onPress={onStart} disabled={!bothReady} style={{
                width: '100%', height: 52,
                backgroundColor: bothReady ? EC.teal : 'rgba(14,106,120,0.3)',
                borderRadius: 6, alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontFamily: F.serif, fontSize: 18, color: EC.cream }}>
                  {bothReady ? 'Start match →' : 'Waiting for opponent…'}
                </Text>
              </Pressable>
            ) : (
              <View style={{ height: 52, alignItems: 'center', justifyContent: 'center' }}>
                <ECSmallCaps color={EC.inkFaint} size={10}>Waiting for host to start…</ECSmallCaps>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}
