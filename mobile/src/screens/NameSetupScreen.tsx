import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EC, F } from '../constants';
import { ECMonogram, ECPageHeader, ECSmallCaps } from '../components/atoms';

interface Props {
  onSave: (name: string) => void;
}

export function NameSetupScreen({ onSave }: Props) {
  const [name, setName] = useState('');
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: EC.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ECPageHeader left="Welcome" right="Your name" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <ECMonogram color={EC.teal} size={22} />
        <Text style={{ marginTop: 32, fontFamily: F.serif, fontSize: 52, lineHeight: 50,
          color: EC.ink, letterSpacing: -0.5, textAlign: 'center' }}>
          {'Eau\n'}<Text style={{ fontStyle: 'italic', color: EC.teal }}>Claude</Text>
        </Text>
        <Text style={{ marginTop: 24, fontFamily: F.serifItalic, fontSize: 16,
          color: EC.inkSoft, lineHeight: 24, textAlign: 'center' }}>
          {'Before we begin —\nwhat shall we call you?'}
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={EC.inkFaint}
          returnKeyType="done"
          onSubmitEditing={() => name.trim() && onSave(name.trim())}
          style={{
            marginTop: 28, width: '100%', height: 52,
            borderWidth: 1, borderColor: EC.creamLine, borderRadius: 6,
            backgroundColor: 'transparent', fontFamily: F.serif, fontSize: 18,
            color: EC.ink, paddingHorizontal: 16, textAlign: 'center',
          }}
        />
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}>
        <Pressable
          onPress={() => name.trim() && onSave(name.trim())}
          style={{ width: '100%', height: 56, backgroundColor: name.trim() ? EC.teal : 'rgba(14,106,120,0.3)',
            borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: F.serif, fontSize: 19, color: EC.cream }}>Begin</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
