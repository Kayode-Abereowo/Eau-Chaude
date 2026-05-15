import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EC, F } from '../constants';
import { ECMonogram, ECPageHeader } from '../components/atoms';
import { signIn, signUp } from '../api';

interface Props {
  onAuth: (user: any) => void;
}

const inputStyle = {
  width: '100%' as const,
  height: 52,
  borderWidth: 1,
  borderColor: 'rgba(26,35,38,0.12)' as string,
  borderRadius: 6,
  backgroundColor: 'transparent' as const,
  fontFamily: F.serif,
  fontSize: 18,
  color: EC.ink,
  paddingHorizontal: 16,
};

export function AuthScreen({ onAuth }: Props) {
  const [mode,        setMode]        = useState<'signin' | 'signup'>('signin');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading,     setLoading]     = useState(false);
  const insets = useSafeAreaInsets();

  async function handleSubmit() {
    if (!email.trim() || !password) return;
    if (mode === 'signup' && !displayName.trim()) return;
    setLoading(true);
    try {
      const user = mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password, displayName);
      onAuth(user);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: EC.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ECPageHeader left="Welcome" right={mode === 'signin' ? 'Sign in' : 'Register'} />

      <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'center', gap: 12 }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <ECMonogram color={EC.teal} size={22} />
          <Text style={{ marginTop: 18, fontFamily: F.serif, fontSize: 44, lineHeight: 42,
            color: EC.ink, letterSpacing: -0.5, textAlign: 'center' }}>
            Eau{' '}<Text style={{ fontStyle: 'italic', color: EC.teal }}>Claude</Text>
          </Text>
          <Text style={{ marginTop: 10, fontFamily: F.serifItalic, fontSize: 15,
            color: EC.inkSoft, textAlign: 'center' }}>
            {mode === 'signin' ? 'Welcome back.' : 'Create your account to begin.'}
          </Text>
        </View>

        {mode === 'signup' && (
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Game name"
            placeholderTextColor={EC.inkFaint}
            autoCapitalize="words"
            returnKeyType="next"
            style={inputStyle}
          />
        )}
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={EC.inkFaint}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          style={inputStyle}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={EC.inkFaint}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          style={inputStyle}
        />
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24, gap: 10 }}>
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={{ width: '100%', height: 56,
            backgroundColor: loading ? 'rgba(14,106,120,0.3)' : EC.teal,
            borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: F.serif, fontSize: 19, color: EC.cream }}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in →' : 'Register →'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); }}
          style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: F.serifItalic, fontSize: 14, color: EC.inkSoft }}>
            {mode === 'signin' ? 'No account? Register here.' : 'Already registered? Sign in.'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
