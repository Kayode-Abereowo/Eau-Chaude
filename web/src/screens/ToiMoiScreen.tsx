import { useState, useEffect, useRef, useCallback } from 'react';
import { sb } from '../supabase';
import { EC, ecSerif } from '../constants';

// ── Palette ───────────────────────────────────────────────────────────────────
const TM = {
  bg:       '#FBF5EF',
  rose:     '#B65B5C',
  roseDeep: '#8B3A3B',
  roseSoft: 'rgba(182,91,92,0.08)',
  roseLine: 'rgba(182,91,92,0.18)',
  gold:     '#C4973A',
  goldSoft: 'rgba(196,151,58,0.12)',
  ink:      '#1A2326',
  inkSoft:  'rgba(26,35,38,0.55)',
  inkFaint: 'rgba(26,35,38,0.35)',
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface TmSession {
  id: string; code: string;
  host_user_id: string; guest_user_id: string | null;
  host_name: string; guest_name: string;
  question_count: number; status: string;
}
interface TmQuestion {
  id: string; session_id: string; author_user_id: string;
  question_text: string; correct_answer: string; hint: string | null;
  question_order: number;
}
interface TmAnswer {
  id: string; question_id: string; answerer_user_id: string;
  answer_text: string; is_correct: boolean | null;
}
interface MarkItem { answer: TmAnswer; question: TmQuestion }
interface DraftQ { text: string; answer: string; hint: string }

type TMPhase =
  | 'setup' | 'lobby' | 'welcome' | 'creating' | 'waiting_create'
  | 'answering' | 'waiting_answer' | 'marking' | 'waiting_mark' | 'reveal' | 'results';

// ── Reactions ─────────────────────────────────────────────────────────────────
const HIGH_REACTIONS = [
  { text: 'This is Obsession',                                    emojis: '😵‍💫🫶🔍' },
  { text: 'You love me too much',                                  emojis: '💀❤️‍🔥😭' },
  { text: 'You are knowing too much about me',                     emojis: '👁️👁️🫣😳' },
  { text: 'Na see finish dey cause these things',                  emojis: '💀😂🫵' },
  { text: 'Iho ho lo fa',                                          emojis: '🎶😍🪄✨' },
  { text: 'At this point just move in',                            emojis: '🤯🏠❤️' },
  { text: 'Who are you and what have you done with a normal person', emojis: '🕵️🔎😂' },
];
const LOW_REACTIONS = [
  { text: 'Wow. Just wow.',                emojis: '😤🙄💔' },
  { text: 'This is how you pay me back',   emojis: '🫠😩💸' },
  { text: 'After all these years',         emojis: '😔⏳💔' },
  { text: 'I really thought you loved me', emojis: '😞🥀🚶' },
  { text: 'Iwo at tani?',                  emojis: '🤨🫵😒' },
  { text: 'We need to talk',               emojis: '💔🛋️😬' },
  { text: 'Stranger. Actual stranger.',    emojis: '😐👤🚪' },
];

function pickReaction(pct: number, seed: number) {
  const pool = pct >= 70 ? HIGH_REACTIONS : LOW_REACTIONS;
  return pool[seed % pool.length];
}

// ── DB helpers ────────────────────────────────────────────────────────────────
function tmCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  userId: string;
  displayName: string;
  joinSessionId?: string;
  onHome: () => void;
}

// ── CSS animations ────────────────────────────────────────────────────────────
const ANIM_STYLES = `
  @keyframes tm-fade-up { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes tm-scale-in { from { opacity:0; transform:scale(0.7); } to { opacity:1; transform:scale(1); } }
  @keyframes tm-pulse { 0%,100%{ transform:scale(1);} 50%{ transform:scale(1.06);} }
  @keyframes tm-breathe { 0%,100%{ opacity:0.6;} 50%{ opacity:1;} }
  @keyframes tm-count { 0%{ opacity:0; transform:scale(0.4);} 30%{ opacity:1; transform:scale(1.15);} 70%{ opacity:1; transform:scale(1);} 100%{ opacity:0; transform:scale(1.3);} }
  @keyframes tm-rain { from { transform:translateY(-20px) rotate(var(--r)); opacity:0.9; } to { transform:translateY(900px) rotate(calc(var(--r) + 360deg)); opacity:0; } }
  @keyframes tm-reaction { 0%{ opacity:0; transform:translateY(30px) scale(0.8);} 60%{ transform:translateY(-6px) scale(1.04);} 100%{ opacity:1; transform:translateY(0) scale(1);} }
  @keyframes tm-shake { 0%,100%{ transform:translateX(0);} 20%{ transform:translateX(-6px);} 40%{ transform:translateX(6px);} 60%{ transform:translateX(-4px);} 80%{ transform:translateX(4px);} }
  @keyframes tm-bar { from { width:0%; } to { width:var(--w); } }
`;

// ── Shared UI atoms ───────────────────────────────────────────────────────────
function TmHeader({ left, right }: { left: string; right: string }) {
  return (
    <div style={{ padding: '70px 28px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: ecSerif, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: TM.inkFaint }}>{left}</span>
        <span style={{ fontFamily: ecSerif, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: TM.inkFaint }}>{right}</span>
      </div>
      <div style={{ height: 1, background: TM.roseLine, marginTop: 10 }} />
    </div>
  );
}

function TmBtn({ children, onClick, variant = 'primary', disabled = false, style: s = {} }: {
  children: React.ReactNode; onClick: () => void;
  variant?: 'primary' | 'outline' | 'ghost'; disabled?: boolean; style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    width: '100%', height: 56, border: 'none', borderRadius: 6,
    fontFamily: ecSerif, fontSize: 19, cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: disabled ? 0.45 : 1, transition: 'opacity 0.15s', ...s,
  };
  if (variant === 'primary') return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...base, background: TM.rose, color: '#fff' }}>
      {children}
    </button>
  );
  if (variant === 'outline') return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...base, background: 'transparent', border: `1px solid ${TM.rose}`, color: TM.rose }}>
      {children}
    </button>
  );
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...base, background: 'transparent', border: `1px solid ${TM.roseLine}`, color: TM.inkSoft }}>
      {children}
    </button>
  );
}

// ── Rain particles ────────────────────────────────────────────────────────────
function EmojiRain({ high }: { high: boolean }) {
  const items = useRef(Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2.5,
    dur: 2.8 + Math.random() * 2,
    rot: Math.random() * 40 - 20,
    em: high
      ? ['🫶','❤️‍🔥','✨','🎶','💀','😍','🪄'][i % 7]
      : ['💔','😔','🥀','😤','💸','⏳','🚪'][i % 7],
  }))).current;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      {items.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.x}%`, top: 0, fontSize: 20,
          '--r': `${p.rot}deg`,
          animation: `tm-rain ${p.dur}s ${p.delay}s linear both`,
        } as React.CSSProperties}>
          {p.em}
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export function ToiMoiScreen({ userId, displayName, joinSessionId, onHome }: Props) {
  const [phase,          setPhase]         = useState<TMPhase>(joinSessionId ? 'lobby' : 'setup');
  const [session,        setSession]       = useState<TmSession | null>(null);
  const [role,           setRole]          = useState<'host' | 'guest'>('host');
  const [qCount,         setQCount]        = useState(5);
  const [loading,        setLoading]       = useState(false);
  const [error,          setError]         = useState('');

  // Welcome
  const [iAmReady,       setIAmReady]      = useState(false);
  const [partnerReady,   setPartnerReady]  = useState(false);
  const [countdown,      setCountdown]     = useState<number | null>(null);

  // Creation
  const emptyDraft = (): DraftQ => ({ text: '', answer: '', hint: '' });
  const [drafts,         setDrafts]        = useState<DraftQ[]>([emptyDraft()]);
  const [draftIdx,       setDraftIdx]      = useState(0);
  const [mySubmitted,    setMySubmitted]   = useState(0);
  const [partnerSubmitted, setPartnerSubmitted] = useState(0);

  // Answer
  const [opponentQs,     setOpponentQs]   = useState<TmQuestion[]>([]);
  const [answerIdx,      setAnswerIdx]     = useState(0);
  const [draftAns,       setDraftAns]      = useState('');
  const [showHint,       setShowHint]      = useState(false);
  const [answerError,    setAnswerError]   = useState('');

  // Marking
  const [markItems,      setMarkItems]     = useState<MarkItem[]>([]);
  const [markIdx,        setMarkIdx]       = useState(0);

  // Results
  const [myPct,          setMyPct]         = useState(0);
  const [partnerPct,     setPartnerPct]    = useState(0);
  const [revealStep,     setRevealStep]    = useState(0); // 0=bar anim, 1=my reaction, 2=partner, 3=both
  const [mySeed,         setMySeed]        = useState(0);
  const [partnerSeed,    setPartnerSeed]   = useState(0);

  const channelRef           = useRef<ReturnType<typeof sb.channel> | null>(null);
  const sessionRef           = useRef<TmSession | null>(null);
  const partnerAnswersDoneRef = useRef(false); // true once the other player finishes answering

  // keep sessionRef in sync
  useEffect(() => { sessionRef.current = session; }, [session]);

  // ── Guest join on mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (!joinSessionId) return;
    setLoading(true);
    (async () => {
      const { data, error: e } = await sb.from('toi_moi_sessions')
        .select('*').eq('id', joinSessionId).single();
      if (e || !data) { setError('Session not found or expired.'); setLoading(false); return; }
      const s = data as TmSession;
      if (s.status !== 'lobby') { setError('This session has already started.'); setLoading(false); return; }
      if (s.guest_user_id && s.guest_user_id !== userId) {
        setError('This session already has a guest.'); setLoading(false); return;
      }
      await sb.rpc('join_toi_moi_session', { p_session_id: joinSessionId, p_guest_name: displayName });
      const { data: updated } = await sb.from('toi_moi_sessions').select('*').eq('id', joinSessionId).single();
      setSession(updated as TmSession);
      setRole('guest');
      setQCount((updated as TmSession).question_count);
      setPhase('lobby');
      setLoading(false);
    })();
  }, [joinSessionId]);

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    const ch = sb.channel(`toi_moi:${session.id}`, { config: { broadcast: { self: false } } });

    ch.on('broadcast', { event: 'player_ready' }, ({ payload }: any) => {
      if (payload.player_id !== userId) setPartnerReady(true);
    });
    ch.on('broadcast', { event: 'phase_change' }, ({ payload }: any) => {
      const p = payload.phase as TMPhase;
      setPhase(p);
      // Use sessionRef.current (always up-to-date) instead of the stale closure value of session
      if (p === 'answering') loadOpponentQuestions(sessionRef.current!);
      if (p === 'marking')   loadAnswersToMark(sessionRef.current!);
      if (p === 'reveal')    loadResults(sessionRef.current!);
    });
    ch.on('broadcast', { event: 'question_submitted' }, ({ payload }: any) => {
      if (payload.author_id !== userId) setPartnerSubmitted(payload.questions_submitted_so_far);
    });
    ch.on('broadcast', { event: 'answers_complete' }, ({ payload }: any) => {
      if (payload.player_id !== userId) {
        partnerAnswersDoneRef.current = true;
        setPhase(prev => {
          if (prev === 'waiting_answer') {
            // I'm already done too → both done → load items and go to marking
            loadAnswersToMark(sessionRef.current!);
            return 'marking';
          }
          // I'm still answering — don't interrupt; handleSubmitAnswer will check the ref
          return prev;
        });
      }
    });
    ch.on('broadcast', { event: 'marking_complete' }, ({ payload }: any) => {
      if (payload.marker_id !== userId) {
        setPhase(prev => {
          if (prev === 'waiting_mark') { triggerReveal(session, payload.results); return 'reveal'; }
          return prev;
        });
      }
    });
    ch.on('broadcast', { event: 'session_reset' }, () => {
      resetState();
    });

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState();
      const count = Object.keys(state).length;
      if (count >= 2 && phase === 'lobby') setPhase('welcome');
    });

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ user_id: userId, display_name: displayName });
      }
    });

    channelRef.current = ch;
    return () => { ch.unsubscribe(); channelRef.current = null; };
  }, [session?.id]);

  // ── Welcome: both ready → countdown ──────────────────────────────────────
  useEffect(() => {
    if (!iAmReady || !partnerReady || countdown !== null) return;
    setCountdown(3);
  }, [iAmReady, partnerReady]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setPhase('creating');
      const qArr = Array.from({ length: qCount }, () => emptyDraft());
      setDrafts(qArr);
      setDraftIdx(0);
    } else {
      const t = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1100);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function broadcast(event: string, payload: object) {
    channelRef.current?.send({ type: 'broadcast', event, payload });
  }

  async function loadOpponentQuestions(s: TmSession) {
    // Re-fetch session so we always have the live guest_user_id.
    // The host's local session was created before the guest joined, so
    // guest_user_id is null in their local state until we refresh here.
    const { data: fresh } = await sb.from('toi_moi_sessions').select('*').eq('id', s.id).single();
    const ss = (fresh as TmSession | null) ?? s;
    if (fresh) { setSession(ss); sessionRef.current = ss; }
    const authorId = role === 'host' ? ss.guest_user_id : ss.host_user_id;
    if (!authorId) return; // guard: guest hasn't joined yet
    const { data } = await sb.from('toi_moi_questions')
      .select('*').eq('session_id', ss.id).eq('author_user_id', authorId)
      .order('question_order');
    setOpponentQs((data || []) as TmQuestion[]);
    setAnswerIdx(0); setDraftAns(''); setShowHint(false);
  }

  async function loadAnswersToMark(s: TmSession) {
    // Re-fetch for the same reason — ensure guest_user_id is present.
    const { data: fresh } = await sb.from('toi_moi_sessions').select('*').eq('id', s.id).single();
    const ss = (fresh as TmSession | null) ?? s;
    if (fresh) { setSession(ss); sessionRef.current = ss; }
    const myQs = await sb.from('toi_moi_questions')
      .select('*').eq('session_id', ss.id).eq('author_user_id', userId).order('question_order');
    const myQIds = (myQs.data || []).map((q: any) => q.id);
    if (!myQIds.length) return;
    const answererIds = role === 'host' ? ss.guest_user_id : ss.host_user_id;
    if (!answererIds) return;
    const answers = await sb.from('toi_moi_answers')
      .select('*').in('question_id', myQIds).eq('answerer_user_id', answererIds);
    const qMap: Record<string, TmQuestion> = {};
    (myQs.data || []).forEach((q: any) => { qMap[q.id] = q; });
    const items: MarkItem[] = (answers.data || [])
      .map((a: any) => ({ answer: a as TmAnswer, question: qMap[a.question_id] }))
      .filter(i => i.question);
    setMarkItems(items); setMarkIdx(0);
  }

  async function loadResults(s: TmSession) {
    const { data: answers } = await sb.from('toi_moi_answers')
      .select('*').eq('session_id', s.id);
    const all = (answers || []) as TmAnswer[];
    const mine    = all.filter(a => a.answerer_user_id === userId);
    const theirs  = all.filter(a => a.answerer_user_id !== userId);
    const myCorr  = mine.filter(a => a.is_correct).length;
    const thCorr  = theirs.filter(a => a.is_correct).length;
    const total   = s.question_count;
    setMyPct(Math.round((myCorr / total) * 100));
    setPartnerPct(Math.round((thCorr / total) * 100));
    setMySeed(myCorr);
    setPartnerSeed(thCorr);
    setRevealStep(0);
    setTimeout(() => setRevealStep(1), 2200);
    setTimeout(() => setRevealStep(2), 5500);
    setTimeout(() => setRevealStep(3), 8800);
  }

  function triggerReveal(s: TmSession, _results: any) {
    loadResults(s);
  }

  function resetState() {
    setPhase('setup');
    setSession(null);
    setRole('host');
    setIAmReady(false); setPartnerReady(false); setCountdown(null);
    setDrafts([emptyDraft()]); setDraftIdx(0);
    setMySubmitted(0); setPartnerSubmitted(0);
    setOpponentQs([]); setAnswerIdx(0); setDraftAns('');
    setMarkItems([]); setMarkIdx(0);
    setMyPct(0); setPartnerPct(0); setRevealStep(0);
    partnerAnswersDoneRef.current = false;
  }

  // ── Phase handlers ────────────────────────────────────────────────────────
  async function handleCreateSession() {
    setLoading(true); setError('');
    try {
      const code = tmCode();
      const { data, error: e } = await sb.from('toi_moi_sessions').insert({
        code, host_user_id: userId, host_name: displayName, question_count: qCount, status: 'lobby',
      }).select('*').single();
      if (e) throw e;
      setSession(data as TmSession);
      setRole('host');
      setPhase('lobby');
    } catch { setError('Could not create session. Please try again.'); }
    setLoading(false);
  }

  function handleIAmReady() {
    setIAmReady(true);
    broadcast('player_ready', { player_id: userId });
  }

  async function handleSubmitQuestion() {
    const draft = drafts[draftIdx];
    const text = draft.text.trim().slice(0, 500);
    const answer = draft.answer.trim().slice(0, 300);
    if (!text || !answer) { setError('Question and answer are both required.'); return; }
    setError(''); setLoading(true);
    await sb.from('toi_moi_questions').insert({
      session_id: session!.id, author_user_id: userId,
      question_text: text, correct_answer: answer,
      hint: draft.hint.trim().slice(0, 300) || null,
      question_order: draftIdx,
    });
    const next = mySubmitted + 1;
    setMySubmitted(next);
    broadcast('question_submitted', { author_id: userId, questions_submitted_so_far: next });
    setLoading(false);
    if (draftIdx + 1 < qCount) {
      setDraftIdx(i => i + 1);
    } else {
      setPhase('waiting_create');
      // Check if partner already done
      if (partnerSubmitted >= qCount) {
        await sb.from('toi_moi_sessions').update({ status: 'answering', updated_at: new Date().toISOString() }).eq('id', session!.id);
        broadcast('phase_change', { phase: 'answering' });
        await loadOpponentQuestions(session!);
        setPhase('answering');
      }
    }
  }

  async function handleSubmitAnswer() {
    const text = draftAns.trim().slice(0, 300);
    if (!text) { setAnswerError('You have to try — even a guess counts.'); return; }
    setAnswerError(''); setLoading(true);
    const q = opponentQs[answerIdx];
    await sb.from('toi_moi_answers').insert({
      session_id: session!.id, question_id: q.id,
      answerer_user_id: userId, answer_text: text,
    });
    setLoading(false);
    if (answerIdx + 1 < opponentQs.length) {
      setAnswerIdx(i => i + 1); setDraftAns(''); setShowHint(false); setAnswerError('');
    } else {
      broadcast('answers_complete', { player_id: userId });
      if (partnerAnswersDoneRef.current) {
        // Partner already finished → both done → go straight to marking
        await loadAnswersToMark(sessionRef.current ?? session!);
        setPhase('marking');
      } else {
        setPhase('waiting_answer');
      }
    }
  }

  async function handleMark(isCorrect: boolean) {
    const item = markItems[markIdx];
    await sb.from('toi_moi_answers').update({ is_correct: isCorrect }).eq('id', item.answer.id);
    if (markIdx + 1 < markItems.length) {
      setMarkIdx(i => i + 1);
    } else {
      const myQs = markItems.map(m => ({ question_id: m.question.id, is_correct: m.answer.id === item.answer.id ? isCorrect : null }));
      broadcast('marking_complete', { marker_id: userId, results: myQs });
      setPhase('waiting_mark');
      // If both done simultaneously, reveal
      await sb.from('toi_moi_sessions').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', session!.id);
      broadcast('phase_change', { phase: 'reveal' });
      await loadResults(session!);
      setPhase('reveal');
    }
  }

  async function handlePlayAgain() {
    broadcast('session_reset', {});
    resetState();
  }

  // ── partnerSubmitted watcher for host (they finalize phase) ───────────────
  useEffect(() => {
    if (phase !== 'waiting_create') return;
    if (partnerSubmitted >= qCount && mySubmitted >= qCount && session) {
      (async () => {
        await sb.from('toi_moi_sessions').update({ status: 'answering', updated_at: new Date().toISOString() }).eq('id', session.id);
        broadcast('phase_change', { phase: 'answering' });
        await loadOpponentQuestions(session);
        setPhase('answering');
      })();
    }
  }, [partnerSubmitted, phase]);

  const partnerName = session ? (role === 'host' ? session.guest_name : session.host_name) : '';
  const inviteUrl   = session ? `${window.location.origin}${window.location.pathname}?toi=${session.id}` : '';

  // ── Render ────────────────────────────────────────────────────────────────
  const wrap = (children: React.ReactNode, padded = true) => (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: TM.bg, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <style>{ANIM_STYLES}</style>
      {padded ? children : children}
    </div>
  );

  // ── 1. SETUP ──────────────────────────────────────────────────────────────
  if (phase === 'setup') return wrap(
    <>
      <TmHeader left="Toi & Moi" right="Mode III" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px' }}>
        <div style={{ fontFamily: ecSerif, fontSize: 42, lineHeight: 1, color: TM.rose, letterSpacing: '-0.01em', animation: 'tm-fade-up 0.5s ease both' }}>
          Toi<br /><em style={{ color: TM.gold }}>&amp; Moi</em>
        </div>
        <div style={{ marginTop: 12, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 15, color: TM.inkSoft, lineHeight: 1.6, animation: 'tm-fade-up 0.5s 0.1s ease both' }}>
          How well do you really know each other?
        </div>
        <div style={{ marginTop: 36, animation: 'tm-fade-up 0.5s 0.2s ease both' }}>
          <span style={{ fontFamily: ecSerif, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: TM.inkFaint }}>Questions each player will write</span>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            {[3, 5, 7, 10].map(n => (
              <button key={n} onClick={() => setQCount(n)} style={{
                flex: 1, height: 56, borderRadius: 6, border: `1px solid ${n === qCount ? TM.rose : TM.roseLine}`,
                background: n === qCount ? TM.roseSoft : 'transparent',
                color: n === qCount ? TM.rose : TM.inkSoft,
                fontFamily: ecSerif, fontSize: 22, cursor: 'pointer',
              }}>{n}</button>
            ))}
          </div>
        </div>
        {error && <div style={{ marginTop: 12, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 13, color: TM.rose }}>{error}</div>}
      </div>
      <div style={{ padding: '0 24px 36px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <TmBtn onClick={handleCreateSession} disabled={loading}>
          {loading ? 'Creating…' : `Create session · ${qCount} questions each →`}
        </TmBtn>
        <TmBtn variant="ghost" onClick={onHome}>← Home</TmBtn>
      </div>
    </>
  );

  // ── 2. LOBBY ──────────────────────────────────────────────────────────────
  if (phase === 'lobby') return wrap(
    <>
      <TmHeader left="Toi & Moi" right="Waiting" />
      {loading && <div style={{ padding: '40px 28px', textAlign: 'center', fontFamily: ecSerif, fontStyle: 'italic', color: TM.inkSoft }}>Joining session…</div>}
      {error && <div style={{ padding: '40px 28px', textAlign: 'center', fontFamily: ecSerif, color: TM.rose }}>{error}</div>}
      {!loading && !error && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px' }}>
          {role === 'host' ? (
            <>
              <div style={{ fontFamily: ecSerif, fontSize: 28, lineHeight: 1.15, color: TM.ink, animation: 'tm-fade-up 0.4s ease both' }}>
                Share this link<br /><em style={{ color: TM.rose }}>with your person.</em>
              </div>
              <div style={{ marginTop: 28, padding: '16px 18px', background: TM.roseSoft, borderRadius: 6, border: `1px solid ${TM.roseLine}`, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 12, color: TM.roseDeep }}>
                {inviteUrl}
              </div>
              <button onClick={() => navigator.clipboard.writeText(inviteUrl)} style={{ marginTop: 10, padding: '10px 0', background: 'transparent', border: 'none', fontFamily: ecSerif, fontStyle: 'italic', fontSize: 14, color: TM.rose, cursor: 'pointer' }}>
                Copy link
              </button>
              <div style={{ marginTop: 28, textAlign: 'center', fontFamily: ecSerif, fontStyle: 'italic', color: TM.inkSoft, fontSize: 15, animation: 'tm-breathe 2.5s ease infinite' }}>
                Waiting for them to join…
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', animation: 'tm-fade-up 0.4s ease both' }}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>🫶</div>
              <div style={{ fontFamily: ecSerif, fontSize: 26, color: TM.ink }}>You've joined</div>
              <div style={{ marginTop: 10, fontFamily: ecSerif, fontStyle: 'italic', color: TM.inkSoft, fontSize: 15 }}>
                Waiting for the session to begin…
              </div>
            </div>
          )}
        </div>
      )}
      <div style={{ padding: '0 24px 36px' }}>
        <TmBtn variant="ghost" onClick={onHome}>← Leave</TmBtn>
      </div>
    </>
  );

  // ── 3. WELCOME ────────────────────────────────────────────────────────────
  if (phase === 'welcome') {
    const myReaction = iAmReady ? '✓' : null;
    return wrap(
      <>
        <TmHeader left="Toi & Moi" right="Before We Begin" />
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 0', animation: 'tm-fade-up 0.6s ease both' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontFamily: ecSerif, fontSize: 36, color: TM.rose, animation: 'tm-scale-in 0.7s 0.2s ease both', opacity: 0 }}>
              ❤️
            </div>
            <div style={{ fontFamily: ecSerif, fontSize: 28, color: TM.ink, marginTop: 8 }}>Toi &amp; Moi</div>
          </div>

          <div style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 15, color: TM.inkSoft, lineHeight: 1.8, marginBottom: 24 }}>
            Welcome.<br /><br />
            This is not a trivia game.<br /><br />
            This is a test of how well two people have been paying attention to each other.<br /><br />
            In this mode, you will write questions for your partner — about yourself, your life, your memories, the things only someone who truly knows you would know. They will answer. Then you will see.<br /><br />
            No Google. No guessing from a list. Just what you actually know about each other.<br /><br />
            <strong style={{ color: TM.ink }}>Play honestly. That is the only rule that matters.</strong>
          </div>

          <div style={{ marginBottom: 24 }}>
            {[
              { icon: '📝', text: 'Each player writes their own questions — the other player answers them.' },
              { icon: '🤝', text: 'No hints from outside the app. Your memory is your only weapon.' },
              { icon: '✍️', text: 'Answers are free text — spell it your way, say it your way.' },
              { icon: '⚖️', text: 'The player who wrote the question decides if the answer is correct. Be fair. Be honest.' },
              { icon: '💀', text: 'Score 70% or above and you know them well. Below 70% and you owe them something. Settle it between yourselves.' },
              { icon: '🫶', text: 'This is just between the two of you. No one else sees this. Ever.' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>{r.icon}</span>
                <span style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 14, color: TM.inkSoft, lineHeight: 1.6 }}>{r.text}</span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', padding: '16px 0', borderTop: `1px solid ${TM.roseLine}`, borderBottom: `1px solid ${TM.roseLine}`, marginBottom: 24 }}>
            <div style={{ fontFamily: ecSerif, fontSize: 20, color: TM.ink, letterSpacing: '0.04em' }}>
              {session?.host_name || 'Host'} <span style={{ color: TM.rose }}>×</span> {session?.guest_name || 'Guest'}
            </div>
            <div style={{ marginTop: 8, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 14, color: TM.inkSoft }}>
              Tonight: {qCount} questions each.
            </div>
          </div>

          <div style={{ height: 16 }} />
        </div>

        {countdown !== null ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: TM.bg, zIndex: 20 }}>
            <div key={countdown} style={{ fontFamily: ecSerif, fontSize: 96, color: TM.rose, animation: 'tm-count 1s ease both', lineHeight: 1 }}>
              {countdown === 0 ? '✦' : countdown}
            </div>
          </div>
        ) : (
          <div style={{ padding: '12px 24px 36px', flexShrink: 0 }}>
            {iAmReady ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontFamily: ecSerif, fontSize: 15, color: TM.rose, animation: 'tm-breathe 2s ease infinite' }}>
                  ✓ Ready — Waiting for {partnerName || 'your partner'}…
                </div>
                {partnerReady && <div style={{ marginTop: 6, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 13, color: TM.gold }}>They're ready too!</div>}
              </div>
            ) : (
              <button onClick={handleIAmReady} style={{
                width: '100%', height: 60, background: TM.rose, color: '#fff', border: 'none',
                borderRadius: 6, fontFamily: ecSerif, fontSize: 20, cursor: 'pointer',
                animation: partnerReady ? 'tm-pulse 1.5s ease infinite' : 'none',
              }}>
                I'm Ready
              </button>
            )}
            {partnerReady && !iAmReady && (
              <div style={{ marginTop: 10, textAlign: 'center', fontFamily: ecSerif, fontStyle: 'italic', fontSize: 13, color: TM.gold }}>
                {partnerName || 'They'} is ready. Your turn.
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  // ── 4. CREATING ───────────────────────────────────────────────────────────
  if (phase === 'creating') {
    const draft = drafts[draftIdx] || emptyDraft();
    const updateDraft = (field: keyof DraftQ, val: string) => {
      setDrafts(prev => prev.map((d, i) => i === draftIdx ? { ...d, [field]: val } : d));
    };
    return wrap(
      <>
        <TmHeader left={`Question ${draftIdx + 1} of ${qCount}`} right="Your turn to write" />
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 0' }}>
          <div style={{ fontFamily: ecSerif, fontSize: 13, color: TM.gold, marginBottom: 20 }}>
            ✏️ Write a question only {partnerName || 'they'} would know — about you.
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontFamily: ecSerif, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: TM.inkFaint }}>Your question</label>
            <textarea value={draft.text} onChange={e => updateDraft('text', e.target.value)}
              placeholder="Ask something only they would know about you…"
              maxLength={500}
              style={{ width: '100%', marginTop: 8, padding: '14px 16px', background: TM.roseSoft, border: `1px solid ${TM.roseLine}`, borderRadius: 6, fontFamily: ecSerif, fontSize: 16, color: TM.ink, resize: 'none', minHeight: 90, boxSizing: 'border-box', outline: 'none', lineHeight: 1.6 }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontFamily: ecSerif, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: TM.inkFaint }}>The correct answer</label>
            <input value={draft.answer} onChange={e => updateDraft('answer', e.target.value)}
              placeholder="What's the right answer?"
              maxLength={300}
              style={{ width: '100%', marginTop: 8, padding: '14px 16px', background: TM.roseSoft, border: `1px solid ${TM.roseLine}`, borderRadius: 6, fontFamily: ecSerif, fontSize: 16, color: TM.ink, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontFamily: ecSerif, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: TM.inkFaint }}>Hint (optional)</label>
            <input value={draft.hint} onChange={e => updateDraft('hint', e.target.value)}
              placeholder="Give them a clue if you're feeling generous…"
              maxLength={300}
              style={{ width: '100%', marginTop: 8, padding: '14px 16px', background: TM.roseSoft, border: `1px solid ${TM.roseLine}`, borderRadius: 6, fontFamily: ecSerif, fontSize: 16, color: TM.ink, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {error && <div style={{ color: TM.rose, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <div style={{ height: 8 }} />
        </div>

        <div style={{ padding: '0 24px 36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: ecSerif, fontSize: 12, color: TM.inkFaint }}>{partnerName}: {partnerSubmitted}/{qCount} written</span>
            <span style={{ fontFamily: ecSerif, fontSize: 12, color: TM.rose }}>{mySubmitted}/{qCount} submitted</span>
          </div>
          <TmBtn onClick={handleSubmitQuestion} disabled={loading}>
            {draftIdx + 1 < qCount ? `Next Question →` : `Submit My Questions ✓`}
          </TmBtn>
        </div>
      </>
    );
  }

  // ── 5. WAITING CREATE ─────────────────────────────────────────────────────
  if (phase === 'waiting_create') return wrap(
    <>
      <TmHeader left="Toi & Moi" right="Waiting" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 24, animation: 'tm-breathe 2.5s ease infinite' }}>✍️</div>
        <div style={{ fontFamily: ecSerif, fontSize: 24, color: TM.ink }}>Questions submitted.</div>
        <div style={{ marginTop: 12, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 15, color: TM.inkSoft }}>
          Waiting for {partnerName || 'your partner'} to finish writing their questions…
        </div>
        <div style={{ marginTop: 20, fontFamily: ecSerif, fontSize: 13, color: TM.rose }}>
          They've written {partnerSubmitted} of {qCount} questions so far.
        </div>
      </div>
    </>
  );

  // ── 6. ANSWERING ──────────────────────────────────────────────────────────
  if (phase === 'answering') {
    const q = opponentQs[answerIdx];
    if (!q) return wrap(<div style={{ padding: '40px 28px', fontFamily: ecSerif, color: TM.inkSoft }}>Loading questions…</div>);
    return wrap(
      <>
        <TmHeader left={`Question ${answerIdx + 1} of ${opponentQs.length}`} right="Answer time" />
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 0' }}>
          <div style={{ fontFamily: ecSerif, fontSize: 22, color: TM.ink, lineHeight: 1.5, marginBottom: 28, animation: 'tm-fade-up 0.4s ease both' }}>
            {q.question_text}
          </div>
          {q.hint && !showHint && (
            <button onClick={() => setShowHint(true)} style={{ marginBottom: 16, padding: '8px 16px', background: TM.goldSoft, border: `1px solid ${TM.gold}`, borderRadius: 6, fontFamily: ecSerif, fontSize: 14, color: TM.gold, cursor: 'pointer' }}>
              Show hint
            </button>
          )}
          {showHint && (
            <div style={{ marginBottom: 20, padding: '12px 16px', background: TM.goldSoft, border: `1px solid ${TM.gold}`, borderRadius: 6, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 14, color: TM.gold, animation: 'tm-fade-up 0.3s ease both' }}>
              💡 {q.hint}
            </div>
          )}
          <textarea value={draftAns} onChange={e => setDraftAns(e.target.value)}
            placeholder="Type your answer here…"
            maxLength={300}
            style={{ width: '100%', padding: '14px 16px', background: TM.roseSoft, border: `1px solid ${TM.roseLine}`, borderRadius: 6, fontFamily: ecSerif, fontSize: 16, color: TM.ink, resize: 'none', minHeight: 100, boxSizing: 'border-box', outline: 'none', lineHeight: 1.6 }}
          />
          {answerError && <div style={{ marginTop: 8, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 13, color: TM.rose }}>{answerError}</div>}
        </div>
        <div style={{ padding: '12px 24px 36px' }}>
          <TmBtn onClick={handleSubmitAnswer} disabled={loading}>
            {answerIdx + 1 < opponentQs.length ? 'Submit Answer →' : 'Submit Final Answer ✓'}
          </TmBtn>
        </div>
      </>
    );
  }

  // ── 7. WAITING ANSWER ─────────────────────────────────────────────────────
  if (phase === 'waiting_answer') return wrap(
    <>
      <TmHeader left="Toi & Moi" right="Patience" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 24, animation: 'tm-breathe 2.5s ease infinite' }}>⏳</div>
        <div style={{ fontFamily: ecSerif, fontSize: 24, color: TM.ink }}>All answered.</div>
        <div style={{ marginTop: 12, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 15, color: TM.inkSoft }}>
          Waiting for {partnerName || 'your partner'} to finish answering…
        </div>
      </div>
    </>
  );

  // ── 8. MARKING ────────────────────────────────────────────────────────────
  if (phase === 'marking') {
    const item = markItems[markIdx];
    if (!item) return wrap(
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ecSerif, color: TM.inkSoft }}>
        Loading answers to mark…
      </div>
    );
    return wrap(
      <>
        <TmHeader left={`Marking ${markIdx + 1} of ${markItems.length}`} right="Be honest" />
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 0', animation: 'tm-fade-up 0.35s ease both' }}>
          <div style={{ fontFamily: ecSerif, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: TM.inkFaint, marginBottom: 10 }}>Your question</div>
          <div style={{ fontFamily: ecSerif, fontSize: 19, color: TM.ink, lineHeight: 1.5, marginBottom: 28 }}>{item.question.question_text}</div>
          <div style={{ fontFamily: ecSerif, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: TM.inkFaint, marginBottom: 10 }}>
            {partnerName}'s answer
          </div>
          <div style={{ padding: '14px 16px', background: TM.roseSoft, border: `1px solid ${TM.roseLine}`, borderRadius: 6, fontFamily: ecSerif, fontSize: 18, color: TM.ink, lineHeight: 1.5, marginBottom: 28 }}>
            {item.answer.answer_text}
          </div>
        </div>
        <div style={{ padding: '12px 24px 36px', display: 'flex', gap: 12 }}>
          <button onClick={() => handleMark(true)} style={{ flex: 1, height: 60, background: '#34A853', color: '#fff', border: 'none', borderRadius: 6, fontFamily: ecSerif, fontSize: 22, cursor: 'pointer' }}>
            ✓ Correct
          </button>
          <button onClick={() => handleMark(false)} style={{ flex: 1, height: 60, background: TM.rose, color: '#fff', border: 'none', borderRadius: 6, fontFamily: ecSerif, fontSize: 22, cursor: 'pointer' }}>
            ✗ Wrong
          </button>
        </div>
      </>
    );
  }

  // ── 9. WAITING MARK ───────────────────────────────────────────────────────
  if (phase === 'waiting_mark') return wrap(
    <>
      <TmHeader left="Toi & Moi" right="Almost" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 24, animation: 'tm-breathe 2s ease infinite' }}>⚖️</div>
        <div style={{ fontFamily: ecSerif, fontSize: 24, color: TM.ink }}>Marking done.</div>
        <div style={{ marginTop: 12, fontFamily: ecSerif, fontStyle: 'italic', fontSize: 15, color: TM.inkSoft }}>
          Waiting for {partnerName || 'your partner'} to finish marking…
        </div>
      </div>
    </>
  );

  // ── 10. REVEAL ────────────────────────────────────────────────────────────
  if (phase === 'reveal') {
    const myHigh    = myPct >= 70;
    const partHigh  = partnerPct >= 70;
    const myR       = pickReaction(myPct, mySeed);
    const partR     = pickReaction(partnerPct, partnerSeed);
    const bothLow   = !myHigh && !partHigh;

    return wrap(
      <>
        {(revealStep >= 1 && myHigh) && <EmojiRain high />}
        {(revealStep >= 2 && partHigh) && <EmojiRain high />}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center', overflow: 'hidden', zIndex: 1 }}>

          {/* Loading bar phase */}
          {revealStep === 0 && (
            <div style={{ width: '100%', animation: 'tm-fade-up 0.4s ease both' }}>
              <div style={{ fontFamily: ecSerif, fontStyle: 'italic', fontSize: 18, color: TM.inkSoft, marginBottom: 28 }}>
                Tallying the results…
              </div>
              {[{ label: 'You', pct: myPct }, { label: partnerName, pct: partnerPct }].map(({ label, pct }) => (
                <div key={label} style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: ecSerif, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: TM.inkFaint, marginBottom: 8 }}>{label}</div>
                  <div style={{ height: 8, background: TM.roseSoft, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ '--w': `${pct}%`, height: '100%', background: pct >= 70 ? TM.rose : TM.gold, borderRadius: 4, animation: 'tm-bar 1.8s 0.3s ease both', width: 0 } as React.CSSProperties} />
                  </div>
                  <div style={{ marginTop: 6, fontFamily: ecSerif, fontSize: 28, color: pct >= 70 ? TM.rose : TM.gold }}>{pct}%</div>
                </div>
              ))}
            </div>
          )}

          {/* My reaction */}
          {revealStep >= 1 && revealStep < 3 && (
            <div style={{ animation: 'tm-reaction 0.8s ease both', maxWidth: 320 }}>
              <div style={{ fontFamily: ecSerif, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: TM.inkFaint, marginBottom: 16 }}>
                You scored {myPct}%
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 32, color: myHigh ? TM.rose : TM.gold, lineHeight: 1.2, marginBottom: 16, animation: revealStep === 1 ? 'tm-shake 0.5s 0.9s ease' : 'none' }}>
                "{myR.text}"
              </div>
              <div style={{ fontSize: 36, letterSpacing: 4 }}>{myR.emojis}</div>
            </div>
          )}

          {/* Partner reaction */}
          {revealStep >= 2 && revealStep < 3 && (
            <div style={{ marginTop: 32, animation: 'tm-reaction 0.8s ease both', maxWidth: 320 }}>
              <div style={{ fontFamily: ecSerif, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: TM.inkFaint, marginBottom: 12 }}>
                {partnerName} scored {partnerPct}%
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 28, color: partHigh ? TM.rose : TM.gold, lineHeight: 1.2 }}>
                "{partR.text}"
              </div>
            </div>
          )}

          {/* Full results */}
          {revealStep >= 3 && (
            <div style={{ width: '100%', animation: 'tm-fade-up 0.6s ease both' }}>
              {bothLow && (
                <div style={{ marginBottom: 20, padding: '12px 16px', background: TM.roseSoft, border: `1px solid ${TM.roseLine}`, borderRadius: 6, fontFamily: ecSerif, fontSize: 15, color: TM.rose }}>
                  🫵 Someone owes someone something. Sort it out.
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                {[{ name: 'You', pct: myPct, high: myHigh, r: myR }, { name: partnerName, pct: partnerPct, high: partHigh, r: partR }].map(p => (
                  <div key={p.name} style={{ flex: 1, padding: '16px 12px', background: p.high ? TM.roseSoft : TM.goldSoft, border: `1px solid ${p.high ? TM.roseLine : TM.gold}`, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontFamily: ecSerif, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: TM.inkFaint }}>{p.name}</div>
                    <div style={{ fontFamily: ecSerif, fontSize: 44, color: p.high ? TM.rose : TM.gold, lineHeight: 1, marginTop: 8 }}>{p.pct}%</div>
                    <div style={{ marginTop: 8, fontSize: 18 }}>{p.r.emojis.slice(0, 3)}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <TmBtn onClick={handlePlayAgain}>Play Again ↺</TmBtn>
                <TmBtn variant="ghost" onClick={onHome}>← Go Home</TmBtn>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return wrap(<div />);
}
