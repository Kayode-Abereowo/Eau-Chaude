import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EC, F, LETTERS } from '../constants';
import { ECPageHeader, ECSmallCaps, Spinner } from '../components/atoms';
import { sb } from '../supabase';

interface Props {
  userId?: string;
  onBack: () => void;
}

const INPUT_STYLE = {
  width: '100%' as const, height: 40,
  borderWidth: 1, borderColor: EC.creamLine, borderRadius: 4,
  backgroundColor: 'transparent' as const, fontFamily: F.serif, fontSize: 14,
  color: EC.ink, paddingHorizontal: 10, marginTop: 6,
};

export function AdminScreen({ userId, onBack }: Props) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState('');
  const [form, setForm] = useState({
    question: '', a0: '', a1: '', a2: '', a3: '', correct_index: 0, user_id_b: '',
  });
  const insets = useSafeAreaInsets();

  useEffect(() => {
    sb.from('personal_questions').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setQuestions(data || []); setLoading(false); });
  }, []);

  async function addQuestion() {
    if (!form.question || !form.a0 || !form.a1 || !form.a2 || !form.a3 || !form.user_id_b) {
      setMsg('Fill all fields.'); return;
    }
    setSaving(true); setMsg('');
    const answers = [form.a0, form.a1, form.a2, form.a3];
    const { error } = await sb.from('personal_questions').insert({
      question: form.question, answers, correct_index: form.correct_index,
      user_id_a: userId, user_id_b: form.user_id_b,
    });
    setSaving(false);
    if (error) { setMsg('Error: ' + error.message); return; }
    setMsg('Saved ✓');
    const { data } = await sb.from('personal_questions').select('*').order('created_at', { ascending: false });
    setQuestions(data || []);
    setForm(f => ({ question: '', a0: '', a1: '', a2: '', a3: '', correct_index: 0, user_id_b: f.user_id_b }));
  }

  async function toggleActive(q: any) {
    await sb.from('personal_questions').update({
      active: !q.active, retired_at: q.active ? new Date().toISOString() : null,
    }).eq('id', q.id);
    setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, active: !x.active } : x));
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: EC.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ECPageHeader left="Admin" right="Personal Qs" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled">
        <ECSmallCaps color={EC.inkFaint} size={9}>Add a personal question</ECSmallCaps>
        <TextInput
          value={form.question} onChangeText={v => setForm(f => ({ ...f, question: v }))}
          placeholder="Question text" placeholderTextColor={EC.inkFaint} multiline
          style={{ ...INPUT_STYLE, height: 64, paddingTop: 10 }}
        />
        {(['a0','a1','a2','a3'] as const).map((k, i) => (
          <TextInput key={k} value={form[k]} onChangeText={v => setForm(f => ({ ...f, [k]: v }))}
            placeholder={`Answer ${LETTERS[i]}`} placeholderTextColor={EC.inkFaint}
            style={INPUT_STYLE} />
        ))}

        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ECSmallCaps color={EC.inkFaint} size={9}>Correct</ECSmallCaps>
          {LETTERS.map((l, i) => (
            <Pressable key={i} onPress={() => setForm(f => ({ ...f, correct_index: i }))}
              style={{ paddingVertical: 4, paddingHorizontal: 10,
                backgroundColor: form.correct_index === i ? EC.ink : 'transparent',
                borderWidth: 1, borderColor: EC.creamLine, borderRadius: 4 }}>
              <Text style={{ fontFamily: F.serif, fontSize: 13,
                color: form.correct_index === i ? EC.cream : EC.inkSoft }}>{l}</Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={form.user_id_b} onChangeText={v => setForm(f => ({ ...f, user_id_b: v }))}
          placeholder="Partner's user ID" placeholderTextColor={EC.inkFaint}
          style={{ ...INPUT_STYLE, fontFamily: F.mono, fontSize: 12 }}
        />

        {msg ? (
          <Text style={{ marginTop: 8, fontFamily: F.serifItalic, fontSize: 13,
            color: msg.startsWith('Error') ? EC.heart : EC.teal }}>{msg}</Text>
        ) : null}

        <Pressable onPress={addQuestion} disabled={saving} style={{
          marginTop: 12, width: '100%', height: 44, backgroundColor: EC.teal,
          borderRadius: 5, alignItems: 'center', justifyContent: 'center',
          opacity: saving ? 0.6 : 1,
        }}>
          <Text style={{ fontFamily: F.serif, fontSize: 16, color: EC.cream }}>
            {saving ? 'Saving…' : 'Add question'}
          </Text>
        </Pressable>

        {/* Existing questions */}
        <View style={{ marginTop: 24 }}>
          <ECSmallCaps color={EC.inkFaint} size={9}>Existing questions ({questions.length})</ECSmallCaps>
          {loading && <Spinner />}
          {questions.map(q => {
            const answers = Array.isArray(q.answers) ? q.answers : JSON.parse(q.answers);
            return (
              <View key={q.id} style={{
                marginTop: 10, padding: 12, borderRadius: 5,
                borderWidth: 1, borderColor: q.active ? EC.creamLine : 'rgba(182,91,92,0.2)',
                opacity: q.active ? 1 : 0.5,
              }}>
                <Text style={{ fontFamily: F.serif, fontSize: 14, color: EC.ink, marginBottom: 6 }}>{q.question}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {answers.map((a: string, i: number) => (
                    <Text key={i} style={{ fontFamily: F.serif, fontSize: 12,
                      color: i === q.correct_index ? EC.teal : EC.inkFaint }}>
                      {LETTERS[i]}. {a}{i === q.correct_index ? ' ✓' : ''}
                    </Text>
                  ))}
                </View>
                <Pressable onPress={() => toggleActive(q)}>
                  <Text style={{ fontFamily: F.serif, fontSize: 12,
                    color: q.active ? EC.heart : EC.teal }}>
                    {q.active ? 'Retire' : 'Reactivate'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16 }}>
        <Pressable onPress={onBack} style={{
          width: '100%', height: 48, borderWidth: 1, borderColor: EC.creamLine,
          borderRadius: 6, alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontFamily: F.serif, fontSize: 17, color: EC.inkSoft }}>← Back to home</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
