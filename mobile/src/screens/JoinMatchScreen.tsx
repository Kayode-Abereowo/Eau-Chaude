import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EC, F } from '../constants';
import { ECPageHeader, ECSmallCaps } from '../components/atoms';

interface Props {
  loading?: boolean;
  onJoin: (code: string) => void;
  onBack: () => void;
}

export function JoinMatchScreen({ loading, onJoin, onBack }: Props) {
  const [code, setCode] = useState('');
  const [err,  setErr]  = useState('');
  const insets = useSafeAreaInsets();

  function handleJoin() {
    if (code.trim().length !== 4) { setErr('Enter the 4-character match code'); return; }
    setErr('');
    onJoin(code.trim());
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: EC.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ECPageHeader left="No. 005" right="Join a match" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <ECSmallCaps color={EC.inkFaint} size={10}>Enter match code</ECSmallCaps>
        <TextInput
          value={code}
          onChangeText={v => setCode(v.toUpperCase().slice(0, 4))}
          placeholder="e.g. 8FA3"
          placeholderTextColor={EC.inkFaint}
          autoCapitalize="characters"
          returnKeyType="done"
          onSubmitEditing={handleJoin}
          style={{
            marginTop: 20, width: '100%', height: 64,
            borderWidth: 1, borderColor: EC.creamLine, borderRadius: 6,
            backgroundColor: 'transparent', fontFamily: F.mono, fontSize: 28,
            color: EC.ink, paddingHorizontal: 16, textAlign: 'center', letterSpacing: 5,
          }}
        />
        {err ? (
          <Text style={{ marginTop: 10, fontFamily: F.serifItalic, fontSize: 13, color: EC.heart }}>{err}</Text>
        ) : null}
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16, gap: 10 }}>
        <Pressable onPress={handleJoin} disabled={loading} style={{
          width: '100%', height: 56, backgroundColor: EC.teal, borderRadius: 6,
          alignItems: 'center', justifyContent: 'center', opacity: loading ? 0.6 : 1,
        }}>
          <Text style={{ fontFamily: F.serif, fontSize: 19, color: EC.cream }}>
            {loading ? 'Joining…' : 'Join match →'}
          </Text>
        </Pressable>
        <Pressable onPress={onBack} style={{
          width: '100%', height: 48, borderWidth: 1, borderColor: EC.creamLine,
          borderRadius: 6, alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontFamily: F.serif, fontSize: 17, color: EC.inkSoft }}>Back</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
