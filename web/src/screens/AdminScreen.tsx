import { useState, useEffect } from 'react';
import { EC, ecSerif, ecMono, LETTERS } from '../constants';
import { ECPageHeader, ECSmallCaps, Spinner } from '../components/atoms';
import { sb } from '../supabase';

interface Props { userId: string; onBack: () => void; }

const inputStyle: React.CSSProperties = {
  width: '100%', height: 40, border: `1px solid ${EC.creamLine}`, borderRadius: 4,
  background: 'transparent', fontFamily: ecSerif, fontSize: 14, color: EC.ink,
  padding: '0 10px', outline: 'none', marginTop: 6,
};

export function AdminScreen({ userId, onBack }: Props) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState('');
  const [form, setForm] = useState({
    question: '', a0: '', a1: '', a2: '', a3: '', correct_index: 0, user_id_b: '',
  });

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
    <div style={{ width: '100%', height: '100%', background: EC.cream, display: 'flex', flexDirection: 'column' }}>
      <ECPageHeader left="Admin" right="Personal Qs" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 0' }}>
        <ECSmallCaps color={EC.inkFaint} size={9}>Add a personal question</ECSmallCaps>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 0 }}>
          <textarea value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
            placeholder="Question text"
            style={{ ...inputStyle, height: 60, resize: 'none', paddingTop: 10 }} />
          {(['a0', 'a1', 'a2', 'a3'] as const).map((k, i) => (
            <input key={k} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
              placeholder={`Answer ${LETTERS[i]}`} style={inputStyle} />
          ))}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <ECSmallCaps color={EC.inkFaint} size={9}>Correct</ECSmallCaps>
            {LETTERS.map((l, i) => (
              <div key={i} onClick={() => setForm(f => ({ ...f, correct_index: i }))}
                style={{ paddingBottom: 4, paddingTop: 4, paddingLeft: 10, paddingRight: 10,
                  background: form.correct_index === i ? EC.ink : 'transparent',
                  border: `1px solid ${EC.creamLine}`, borderRadius: 4, cursor: 'pointer' }}>
                <span style={{ fontFamily: ecSerif, fontSize: 13,
                  color: form.correct_index === i ? EC.cream : EC.inkSoft }}>{l}</span>
              </div>
            ))}
          </div>
          <input value={form.user_id_b} onChange={e => setForm(f => ({ ...f, user_id_b: e.target.value }))}
            placeholder="Partner's user ID"
            style={{ ...inputStyle, fontFamily: ecMono, fontSize: 12 }} />
        </div>

        {msg && (
          <div style={{ marginTop: 8, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 13,
            color: msg.startsWith('Error') ? EC.heart : EC.teal }}>{msg}</div>
        )}
        <button onClick={addQuestion} disabled={saving} style={{ marginTop: 10, width: '100%', height: 44,
          background: EC.teal, color: EC.cream, border: 'none', borderRadius: 5,
          fontFamily: ecSerif, fontSize: 16, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Add question'}
        </button>

        <div style={{ marginTop: 24 }}>
          <ECSmallCaps color={EC.inkFaint} size={9}>Existing questions ({questions.length})</ECSmallCaps>
          {loading && <Spinner />}
          {questions.map(q => {
            const answers = Array.isArray(q.answers) ? q.answers : JSON.parse(q.answers);
            return (
              <div key={q.id} style={{ marginTop: 10, padding: '12px 14px',
                border: `1px solid ${q.active ? EC.creamLine : 'rgba(182,91,92,0.2)'}`,
                borderRadius: 5, opacity: q.active ? 1 : 0.5 }}>
                <div style={{ fontFamily: ecSerif, fontSize: 14, color: EC.ink, marginBottom: 6 }}>{q.question}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {answers.map((a: string, i: number) => (
                    <div key={i} style={{ fontFamily: ecSerif, fontSize: 12,
                      color: i === q.correct_index ? EC.teal : EC.inkFaint }}>
                      {LETTERS[i]}. {a}{i === q.correct_index ? ' ✓' : ''}
                    </div>
                  ))}
                </div>
                <button onClick={() => toggleActive(q)} style={{ fontFamily: ecSerif, fontSize: 12,
                  color: q.active ? EC.heart : EC.teal, background: 'transparent',
                  border: 'none', cursor: 'pointer', padding: 0 }}>
                  {q.active ? 'Retire' : 'Reactivate'}
                </button>
              </div>
            );
          })}
        </div>
        <div style={{ height: 24 }} />
      </div>
      <div style={{ padding: '10px 24px 24px' }}>
        <button onClick={onBack} style={{ width: '100%', height: 48, background: 'transparent',
          color: EC.inkSoft, border: `1px solid ${EC.creamLine}`, borderRadius: 6,
          fontFamily: ecSerif, fontSize: 17 }}>← Back to home</button>
      </div>
    </div>
  );
}
