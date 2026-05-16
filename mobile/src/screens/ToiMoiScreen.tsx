import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, Text, TextInput, View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sb } from '../supabase';
import { EC, F } from '../constants';

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
interface DraftQ  { text: string; answer: string; hint: string }

type TMPhase =
  | 'setup' | 'lobby' | 'welcome' | 'creating' | 'waiting_create'
  | 'answering' | 'waiting_answer' | 'marking' | 'waiting_mark' | 'reveal';

// ── Reactions ─────────────────────────────────────────────────────────────────
const HIGH_REACTIONS = [
  { text: 'This is Obsession',                                      emojis: '😵‍💫🫶🔍' },
  { text: 'You love me too much',                                    emojis: '💀❤️‍🔥😭' },
  { text: 'You are knowing too much about me',                       emojis: '👁️👁️🫣😳' },
  { text: 'Na see finish dey cause these things',                    emojis: '💀😂🫵' },
  { text: 'Iho ho lo fa',                                            emojis: '🎶😍🪄✨' },
  { text: 'At this point just move in',                              emojis: '🤯🏠❤️' },
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

// ── Shared atoms ──────────────────────────────────────────────────────────────
function TmHeader({ left, right }: { left: string; right: string }) {
  return (
    <View style={{ paddingHorizontal: 28, paddingTop: 0, paddingBottom: 0 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: F.serifMedium, fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase', color: TM.inkFaint }}>{left}</Text>
        <Text style={{ fontFamily: F.serifMedium, fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase', color: TM.inkFaint }}>{right}</Text>
      </View>
      <View style={{ height: 1, backgroundColor: TM.roseLine, marginTop: 10 }} />
    </View>
  );
}

function TmBtn({ children, onPress, variant = 'primary', disabled = false }: {
  children: string; onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost'; disabled?: boolean;
}) {
  const bg    = variant === 'primary' ? TM.rose : 'transparent';
  const clr   = variant === 'primary' ? '#fff' : variant === 'outline' ? TM.rose : TM.inkSoft;
  const brd   = variant === 'outline' ? TM.rose : variant === 'ghost' ? TM.roseLine : undefined;
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => ({
      height: 56, borderRadius: 6, alignItems: 'center', justifyContent: 'center',
      backgroundColor: pressed ? (variant === 'primary' ? TM.roseDeep : TM.roseSoft) : bg,
      borderWidth: variant !== 'primary' ? 1 : 0, borderColor: brd,
      opacity: disabled ? 0.45 : 1,
    })}>
      <Text style={{ fontFamily: F.serif, fontSize: 19, color: clr }}>{children}</Text>
    </Pressable>
  );
}

// ── Breathing animation ───────────────────────────────────────────────────────
function Breathing({ children }: { children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.6, duration: 1200, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={{ opacity: anim }}>{children}</Animated.View>;
}

// ── Pulse animation ───────────────────────────────────────────────────────────
function Pulse({ children }: { children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1.06, duration: 700, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1,    duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={{ transform: [{ scale: anim }] }}>{children}</Animated.View>;
}

// ── Spring-in animation ───────────────────────────────────────────────────────
function SpringIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 180 }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }, delay);
  }, []);
  return <Animated.View style={{ transform: [{ scale }], opacity }}>{children}</Animated.View>;
}

// ════════════════════════════════════════════════════════════════════════════
export function ToiMoiScreen({ userId, displayName, joinSessionId, onHome }: Props) {
  const insets = useSafeAreaInsets();
  const [phase,             setPhase]           = useState<TMPhase>(joinSessionId ? 'lobby' : 'setup');
  const [session,           setSession]         = useState<TmSession | null>(null);
  const [role,              setRole]            = useState<'host' | 'guest'>('host');
  const [qCount,            setQCount]          = useState(5);
  const [loading,           setLoading]         = useState(false);

  // Welcome
  const [iAmReady,          setIAmReady]        = useState(false);
  const [partnerReady,      setPartnerReady]    = useState(false);
  const [countdown,         setCountdown]       = useState<number | null>(null);

  // Creation
  const emptyDraft = (): DraftQ => ({ text: '', answer: '', hint: '' });
  const [drafts,            setDrafts]          = useState<DraftQ[]>([emptyDraft()]);
  const [draftIdx,          setDraftIdx]        = useState(0);
  const [mySubmitted,       setMySubmitted]     = useState(0);
  const [partnerSubmitted,  setPartnerSubmitted]= useState(0);

  // Answer
  const [opponentQs,        setOpponentQs]      = useState<TmQuestion[]>([]);
  const [answerIdx,         setAnswerIdx]       = useState(0);
  const [draftAns,          setDraftAns]        = useState('');
  const [showHint,          setShowHint]        = useState(false);

  // Marking
  const [markItems,         setMarkItems]       = useState<MarkItem[]>([]);
  const [markIdx,           setMarkIdx]         = useState(0);

  // Results
  const [myPct,             setMyPct]           = useState(0);
  const [partnerPct,        setPartnerPct]      = useState(0);
  const [revealStep,        setRevealStep]      = useState(0);
  const [mySeed,            setMySeed]          = useState(0);
  const [partnerSeed,       setPartnerSeed]     = useState(0);

  const channelRef = useRef<any>(null);
  const sessionRef = useRef<TmSession | null>(null);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // ── Guest join ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!joinSessionId) return;
    setLoading(true);
    (async () => {
      const { data } = await sb.from('toi_moi_sessions').select('*').eq('id', joinSessionId).single();
      if (!data) { Alert.alert('Session not found or expired.'); setLoading(false); onHome(); return; }
      const s = data as TmSession;
      if (s.status !== 'lobby') { Alert.alert('This session has already started.'); setLoading(false); onHome(); return; }
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
        setPhase(prev => {
          if (prev === 'answering')     { loadAnswersToMark(sessionRef.current!); return 'marking'; }
          if (prev === 'waiting_answer') return 'marking';
          return prev;
        });
      }
    });
    ch.on('broadcast', { event: 'marking_complete' }, ({ payload }: any) => {
      if (payload.marker_id !== userId) {
        setPhase(prev => {
          if (prev === 'marking' || prev === 'waiting_mark') {
            loadResults(sessionRef.current!);
            return 'reveal';
          }
          return prev;
        });
      }
    });
    ch.on('broadcast', { event: 'session_reset' }, () => resetState());

    ch.on('presence', { event: 'sync' }, () => {
      const count = Object.keys(ch.presenceState()).length;
      if (count >= 2) setPhase(p => p === 'lobby' ? 'welcome' : p);
    });

    ch.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ user_id: userId, display_name: displayName });
      }
    });

    channelRef.current = ch;
    return () => { ch.unsubscribe(); channelRef.current = null; };
  }, [session?.id]);

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!iAmReady || !partnerReady || countdown !== null) return;
    setCountdown(3);
  }, [iAmReady, partnerReady]);

  useEffect(() => {
    if (countdown === null) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (countdown === 0) {
      setCountdown(null);
      setPhase('creating');
      setDrafts(Array.from({ length: qCount }, () => emptyDraft()));
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
      .select('*').eq('session_id', ss.id).eq('author_user_id', authorId).order('question_order');
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
    const partnerId = role === 'host' ? ss.guest_user_id : ss.host_user_id;
    if (!partnerId) return;
    const answers = await sb.from('toi_moi_answers')
      .select('*').in('question_id', myQIds).eq('answerer_user_id', partnerId);
    const qMap: Record<string, TmQuestion> = {};
    (myQs.data || []).forEach((q: any) => { qMap[q.id] = q; });
    const items: MarkItem[] = (answers.data || [])
      .map((a: any) => ({ answer: a as TmAnswer, question: qMap[a.question_id] }))
      .filter(i => i.question);
    setMarkItems(items); setMarkIdx(0);
  }

  async function loadResults(s: TmSession) {
    const { data } = await sb.from('toi_moi_answers').select('*').eq('session_id', s.id);
    const all    = (data || []) as TmAnswer[];
    const mine   = all.filter(a => a.answerer_user_id === userId);
    const theirs = all.filter(a => a.answerer_user_id !== userId);
    const myCor  = mine.filter(a => a.is_correct).length;
    const thCor  = theirs.filter(a => a.is_correct).length;
    const total  = s.question_count;
    setMyPct(Math.round((myCor / total) * 100));
    setPartnerPct(Math.round((thCor / total) * 100));
    setMySeed(myCor); setPartnerSeed(thCor);
    setRevealStep(0);
    setTimeout(() => setRevealStep(1), 2200);
    setTimeout(() => { setRevealStep(2); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }, 5500);
    setTimeout(() => setRevealStep(3), 8800);
  }

  function resetState() {
    setPhase('setup'); setSession(null); setRole('host');
    setIAmReady(false); setPartnerReady(false); setCountdown(null);
    setDrafts([emptyDraft()]); setDraftIdx(0);
    setMySubmitted(0); setPartnerSubmitted(0);
    setOpponentQs([]); setAnswerIdx(0); setDraftAns('');
    setMarkItems([]); setMarkIdx(0);
    setMyPct(0); setPartnerPct(0); setRevealStep(0);
  }

  // ── Phase handlers ────────────────────────────────────────────────────────
  async function handleCreateSession() {
    setLoading(true);
    const code = tmCode();
    const { data, error } = await sb.from('toi_moi_sessions').insert({
      code, host_user_id: userId, host_name: displayName, question_count: qCount, status: 'lobby',
    }).select('*').single();
    if (error || !data) { Alert.alert('Could not create session. Please try again.'); setLoading(false); return; }
    setSession(data as TmSession);
    setRole('host');
    setPhase('lobby');
    setLoading(false);
  }

  function handleIAmReady() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIAmReady(true);
    broadcast('player_ready', { player_id: userId });
  }

  async function handleSubmitQuestion() {
    const draft = drafts[draftIdx];
    const text   = draft.text.trim().slice(0, 500);
    const answer = draft.answer.trim().slice(0, 300);
    if (!text || !answer) { Alert.alert('Question and answer are both required.'); return; }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    if (!text) { Alert.alert('You have to try — even a guess counts.'); return; }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const q = opponentQs[answerIdx];
    await sb.from('toi_moi_answers').insert({
      session_id: session!.id, question_id: q.id,
      answerer_user_id: userId, answer_text: text,
    });
    setLoading(false);
    if (answerIdx + 1 < opponentQs.length) {
      setAnswerIdx(i => i + 1); setDraftAns(''); setShowHint(false);
    } else {
      broadcast('answers_complete', { player_id: userId });
      setPhase('waiting_answer');
    }
  }

  async function handleMark(isCorrect: boolean) {
    Haptics.impactAsync(isCorrect ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
    const item = markItems[markIdx];
    await sb.from('toi_moi_answers').update({ is_correct: isCorrect }).eq('id', item.answer.id);
    if (markIdx + 1 < markItems.length) {
      setMarkIdx(i => i + 1);
    } else {
      const results = markItems.map(m => ({ question_id: m.question.id, is_correct: m.answer.id === item.answer.id ? isCorrect : null }));
      broadcast('marking_complete', { marker_id: userId, results });
      await sb.from('toi_moi_sessions').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', session!.id);
      broadcast('phase_change', { phase: 'reveal' });
      await loadResults(session!);
      setPhase('reveal');
    }
  }

  function handlePlayAgain() { broadcast('session_reset', {}); resetState(); }

  // watcher: if we're waiting_create and partner finishes, proceed
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
  const inviteUrl   = session ? `https://eauclaude.app?toi=${session.id}` : '';

  const safeBot = insets.bottom + 16;

  // ── SETUP ─────────────────────────────────────────────────────────────────
  if (phase === 'setup') return (
    <View style={{ flex: 1, backgroundColor: TM.bg }}>
      <TmHeader left="Toi & Moi" right="Mode III" />
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
        <SpringIn>
          <Text style={{ fontFamily: F.serifItalic, fontSize: 48, color: TM.rose, lineHeight: 48 }}>Toi</Text>
          <Text style={{ fontFamily: F.serifItalic, fontSize: 48, color: TM.gold, lineHeight: 56 }}>& Moi</Text>
          <Text style={{ marginTop: 12, fontFamily: F.serifItalic, fontSize: 15, color: TM.inkSoft, lineHeight: 24 }}>
            How well do you really know each other?
          </Text>
        </SpringIn>
        <View style={{ marginTop: 36 }}>
          <Text style={{ fontFamily: F.serifMedium, fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase', color: TM.inkFaint }}>Questions each player will write</Text>
          <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
            {[3, 5, 7, 10].map(n => (
              <Pressable key={n} onPress={() => setQCount(n)} style={{
                flex: 1, height: 56, borderRadius: 6, alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: n === qCount ? TM.rose : TM.roseLine,
                backgroundColor: n === qCount ? TM.roseSoft : 'transparent',
              }}>
                <Text style={{ fontFamily: F.serif, fontSize: 24, color: n === qCount ? TM.rose : TM.inkSoft }}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: safeBot, gap: 10 }}>
        <TmBtn onPress={handleCreateSession} disabled={loading}>
          {loading ? 'Creating…' : `Create session · ${qCount} questions each →`}
        </TmBtn>
        <TmBtn variant="ghost" onPress={onHome}>← Home</TmBtn>
      </View>
    </View>
  );

  // ── LOBBY ─────────────────────────────────────────────────────────────────
  if (phase === 'lobby') return (
    <View style={{ flex: 1, backgroundColor: TM.bg }}>
      <TmHeader left="Toi & Moi" right="Waiting" />
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28, alignItems: role === 'guest' ? 'center' : undefined }}>
        {role === 'host' ? (
          <SpringIn>
            <Text style={{ fontFamily: F.serif, fontSize: 28, color: TM.ink, lineHeight: 34 }}>
              Share this link{'\n'}<Text style={{ fontStyle: 'italic', color: TM.rose }}>with your person.</Text>
            </Text>
            <View style={{ marginTop: 24, padding: 16, backgroundColor: TM.roseSoft, borderRadius: 6, borderWidth: 1, borderColor: TM.roseLine }}>
              <Text style={{ fontFamily: F.mono, fontSize: 11, color: TM.roseDeep }}>{inviteUrl}</Text>
            </View>
            <Pressable onPress={() => {
              // RN clipboard
              import('expo-clipboard').then(({ setStringAsync }) => setStringAsync(inviteUrl));
            }} style={{ marginTop: 10, padding: 10 }}>
              <Text style={{ fontFamily: F.serifItalic, fontSize: 14, color: TM.rose }}>Copy link</Text>
            </Pressable>
            <Breathing>
              <Text style={{ marginTop: 24, fontFamily: F.serifItalic, fontSize: 15, color: TM.inkSoft, textAlign: 'center' }}>
                Waiting for them to join…
              </Text>
            </Breathing>
          </SpringIn>
        ) : (
          <SpringIn>
            <Text style={{ fontSize: 56, textAlign: 'center', marginBottom: 20 }}>🫶</Text>
            <Text style={{ fontFamily: F.serif, fontSize: 26, color: TM.ink, textAlign: 'center' }}>You've joined</Text>
            <Text style={{ marginTop: 10, fontFamily: F.serifItalic, fontSize: 15, color: TM.inkSoft, textAlign: 'center' }}>
              Waiting for the session to begin…
            </Text>
          </SpringIn>
        )}
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: safeBot }}>
        <TmBtn variant="ghost" onPress={onHome}>← Leave</TmBtn>
      </View>
    </View>
  );

  // ── WELCOME ───────────────────────────────────────────────────────────────
  if (phase === 'welcome') return (
    <View style={{ flex: 1, backgroundColor: TM.bg }}>
      <TmHeader left="Toi & Moi" right="Before We Begin" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 28 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <SpringIn><Text style={{ fontSize: 40 }}>❤️</Text></SpringIn>
          <Text style={{ fontFamily: F.serif, fontSize: 28, color: TM.ink, marginTop: 8, textAlign: 'center' }}>Toi &amp; Moi</Text>
        </View>

        <Text style={{ fontFamily: F.serifItalic, fontSize: 15, color: TM.inkSoft, lineHeight: 26, marginBottom: 24 }}>
          {'Welcome.\n\nThis is not a trivia game.\n\nThis is a test of how well two people have been paying attention to each other.\n\nIn this mode, you will write questions for your partner — about yourself, your life, your memories, the things only someone who truly knows you would know. They will answer. Then you will see.\n\nNo Google. No guessing from a list. Just what you actually know about each other.\n\n'}
          <Text style={{ fontFamily: F.serifMedium, color: TM.ink }}>Play honestly. That is the only rule that matters.</Text>
        </Text>

        {[
          { icon: '📝', text: 'Each player writes their own questions — the other player answers them.' },
          { icon: '🤝', text: 'No hints from outside the app. Your memory is your only weapon.' },
          { icon: '✍️', text: 'Answers are free text — spell it your way, say it your way.' },
          { icon: '⚖️', text: 'The player who wrote the question decides if the answer is correct. Be fair. Be honest.' },
          { icon: '💀', text: 'Score 70% or above and you know them well. Below 70% and you owe them something.' },
          { icon: '🫶', text: 'This is just between the two of you. No one else sees this. Ever.' },
        ].map((r, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 16, marginTop: 2 }}>{r.icon}</Text>
            <Text style={{ fontFamily: F.serifItalic, fontSize: 14, color: TM.inkSoft, flex: 1, lineHeight: 22 }}>{r.text}</Text>
          </View>
        ))}

        <View style={{ paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: TM.roseLine, marginTop: 8, marginBottom: 24, alignItems: 'center' }}>
          <Text style={{ fontFamily: F.serif, fontSize: 20, color: TM.ink }}>
            {session?.host_name || 'Host'} <Text style={{ color: TM.rose }}>×</Text> {session?.guest_name || 'Guest'}
          </Text>
          <Text style={{ marginTop: 8, fontFamily: F.serifItalic, fontSize: 14, color: TM.inkSoft }}>
            Tonight: {qCount} questions each.
          </Text>
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Sticky footer */}
      <View style={{ paddingHorizontal: 24, paddingBottom: safeBot, paddingTop: 12, backgroundColor: TM.bg }}>
        {countdown !== null ? (
          <View style={{ alignItems: 'center', height: 60, justifyContent: 'center' }}>
            <SpringIn key={countdown}>
              <Text style={{ fontFamily: F.serifSemiBold, fontSize: 56, color: TM.rose, lineHeight: 60 }}>
                {countdown === 0 ? '✦' : countdown}
              </Text>
            </SpringIn>
          </View>
        ) : iAmReady ? (
          <View style={{ alignItems: 'center' }}>
            <Breathing>
              <Text style={{ fontFamily: F.serifItalic, fontSize: 15, color: TM.rose }}>
                ✓ Ready — Waiting for {partnerName || 'your partner'}…
              </Text>
            </Breathing>
            {partnerReady && <Text style={{ marginTop: 4, fontFamily: F.serifItalic, fontSize: 13, color: TM.gold }}>They're ready too!</Text>}
          </View>
        ) : (
          <>
            {partnerReady
              ? <Pulse><TmBtn onPress={handleIAmReady}>I'm Ready</TmBtn></Pulse>
              : <TmBtn onPress={handleIAmReady}>I'm Ready</TmBtn>
            }
            {partnerReady && (
              <Text style={{ marginTop: 8, textAlign: 'center', fontFamily: F.serifItalic, fontSize: 13, color: TM.gold }}>
                {partnerName || 'They'} is ready. Your turn.
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );

  // ── CREATING ──────────────────────────────────────────────────────────────
  if (phase === 'creating') {
    const draft = drafts[draftIdx] || emptyDraft();
    const update = (f: keyof DraftQ, v: string) =>
      setDrafts(prev => prev.map((d, i) => i === draftIdx ? { ...d, [f]: v } : d));
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1, backgroundColor: TM.bg }}>
          <TmHeader left={`Question ${draftIdx + 1} of ${qCount}`} right="Your turn to write" />
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 28 }} keyboardShouldPersistTaps="handled">
            <Text style={{ fontFamily: F.serifItalic, fontSize: 13, color: TM.gold, marginBottom: 20 }}>
              ✏️ Write a question only {partnerName || 'they'} would know — about you.
            </Text>

            {(['text', 'answer', 'hint'] as const).map((field, i) => (
              <View key={field} style={{ marginBottom: 20 }}>
                <Text style={{ fontFamily: F.serifMedium, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: TM.inkFaint, marginBottom: 8 }}>
                  {field === 'text' ? 'Your question' : field === 'answer' ? 'The correct answer' : 'Hint (optional)'}
                </Text>
                <TextInput
                  value={draft[field]}
                  onChangeText={v => update(field, v)}
                  placeholder={field === 'text' ? 'Ask something only they would know about you…' : field === 'answer' ? "What's the right answer?" : "Give them a clue if you're feeling generous…"}
                  placeholderTextColor={TM.inkFaint}
                  maxLength={field === 'text' ? 500 : 300}
                  multiline={field === 'text'}
                  style={{ padding: 14, backgroundColor: TM.roseSoft, borderWidth: 1, borderColor: TM.roseLine, borderRadius: 6, fontFamily: F.serif, fontSize: 16, color: TM.ink, minHeight: field === 'text' ? 90 : 50, textAlignVertical: 'top' }}
                />
              </View>
            ))}
            <View style={{ height: 16 }} />
          </ScrollView>
          <View style={{ paddingHorizontal: 24, paddingBottom: safeBot, paddingTop: 8, backgroundColor: TM.bg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontFamily: F.serif, fontSize: 12, color: TM.inkFaint }}>{partnerName}: {partnerSubmitted}/{qCount}</Text>
              <Text style={{ fontFamily: F.serif, fontSize: 12, color: TM.rose }}>{mySubmitted}/{qCount} submitted</Text>
            </View>
            <TmBtn onPress={handleSubmitQuestion} disabled={loading}>
              {draftIdx + 1 < qCount ? 'Next Question →' : 'Submit My Questions ✓'}
            </TmBtn>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── WAITING CREATE ────────────────────────────────────────────────────────
  if (phase === 'waiting_create') return (
    <View style={{ flex: 1, backgroundColor: TM.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
      <TmHeader left="Toi & Moi" right="Waiting" />
      <Breathing><Text style={{ fontSize: 48, marginBottom: 24 }}>✍️</Text></Breathing>
      <Text style={{ fontFamily: F.serif, fontSize: 24, color: TM.ink }}>Questions submitted.</Text>
      <Text style={{ marginTop: 12, fontFamily: F.serifItalic, fontSize: 15, color: TM.inkSoft, textAlign: 'center' }}>
        Waiting for {partnerName || 'your partner'} to finish writing…
      </Text>
      <Text style={{ marginTop: 20, fontFamily: F.serif, fontSize: 13, color: TM.rose }}>
        They've written {partnerSubmitted} of {qCount} questions.
      </Text>
    </View>
  );

  // ── ANSWERING ─────────────────────────────────────────────────────────────
  if (phase === 'answering') {
    const q = opponentQs[answerIdx];
    if (!q) return <View style={{ flex: 1, backgroundColor: TM.bg, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontFamily: F.serifItalic, color: TM.inkSoft }}>Loading questions…</Text></View>;
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1, backgroundColor: TM.bg }}>
          <TmHeader left={`Question ${answerIdx + 1} of ${opponentQs.length}`} right="Answer time" />
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 28 }} keyboardShouldPersistTaps="handled">
            <SpringIn key={answerIdx}>
              <Text style={{ fontFamily: F.serif, fontSize: 22, color: TM.ink, lineHeight: 32, marginBottom: 28 }}>{q.question_text}</Text>
            </SpringIn>
            {q.hint && !showHint && (
              <Pressable onPress={() => setShowHint(true)} style={{ marginBottom: 16, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: TM.goldSoft, borderRadius: 6, borderWidth: 1, borderColor: TM.gold, alignSelf: 'flex-start' }}>
                <Text style={{ fontFamily: F.serif, fontSize: 14, color: TM.gold }}>Show hint</Text>
              </Pressable>
            )}
            {showHint && (
              <View style={{ marginBottom: 20, padding: 14, backgroundColor: TM.goldSoft, borderRadius: 6, borderWidth: 1, borderColor: TM.gold }}>
                <Text style={{ fontFamily: F.serifItalic, fontSize: 14, color: TM.gold }}>💡 {q.hint}</Text>
              </View>
            )}
            <TextInput
              value={draftAns}
              onChangeText={setDraftAns}
              placeholder="Type your answer here…"
              placeholderTextColor={TM.inkFaint}
              maxLength={300}
              multiline
              style={{ padding: 14, backgroundColor: TM.roseSoft, borderWidth: 1, borderColor: TM.roseLine, borderRadius: 6, fontFamily: F.serif, fontSize: 16, color: TM.ink, minHeight: 100, textAlignVertical: 'top' }}
            />
            <View style={{ height: 16 }} />
          </ScrollView>
          <View style={{ paddingHorizontal: 24, paddingBottom: safeBot, paddingTop: 8 }}>
            <TmBtn onPress={handleSubmitAnswer} disabled={loading}>
              {answerIdx + 1 < opponentQs.length ? 'Submit Answer →' : 'Submit Final Answer ✓'}
            </TmBtn>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── WAITING ANSWER ────────────────────────────────────────────────────────
  if (phase === 'waiting_answer') return (
    <View style={{ flex: 1, backgroundColor: TM.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
      <Breathing><Text style={{ fontSize: 48, marginBottom: 24 }}>⏳</Text></Breathing>
      <Text style={{ fontFamily: F.serif, fontSize: 24, color: TM.ink }}>All answered.</Text>
      <Text style={{ marginTop: 12, fontFamily: F.serifItalic, fontSize: 15, color: TM.inkSoft, textAlign: 'center' }}>
        Waiting for {partnerName || 'your partner'} to finish…
      </Text>
    </View>
  );

  // ── MARKING ───────────────────────────────────────────────────────────────
  if (phase === 'marking') {
    const item = markItems[markIdx];
    if (!item) return <View style={{ flex: 1, backgroundColor: TM.bg, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontFamily: F.serifItalic, color: TM.inkSoft }}>Loading answers…</Text></View>;
    return (
      <View style={{ flex: 1, backgroundColor: TM.bg }}>
        <TmHeader left={`Marking ${markIdx + 1} of ${markItems.length}`} right="Be honest" />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 28 }}>
          <Text style={{ fontFamily: F.serifMedium, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: TM.inkFaint, marginBottom: 8 }}>Your question</Text>
          <Text style={{ fontFamily: F.serif, fontSize: 19, color: TM.ink, lineHeight: 28, marginBottom: 20 }}>{item.question.question_text}</Text>

          <Text style={{ fontFamily: F.serifMedium, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: TM.inkFaint, marginBottom: 8 }}>Correct answer</Text>
          <View style={{ padding: 14, backgroundColor: '#EEF9F0', borderWidth: 1, borderColor: 'rgba(52,168,83,0.25)', borderRadius: 6, marginBottom: 20 }}>
            <Text style={{ fontFamily: F.serif, fontSize: 16, color: '#276234' }}>{item.question.correct_answer}</Text>
          </View>

          <Text style={{ fontFamily: F.serifMedium, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: TM.inkFaint, marginBottom: 8 }}>{partnerName}'s answer</Text>
          <View style={{ padding: 14, backgroundColor: TM.roseSoft, borderWidth: 1, borderColor: TM.roseLine, borderRadius: 6, marginBottom: 28 }}>
            <Text style={{ fontFamily: F.serif, fontSize: 18, color: TM.ink, lineHeight: 26 }}>{item.answer.answer_text}</Text>
          </View>
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingBottom: safeBot, paddingTop: 12 }}>
          <Pressable onPress={() => handleMark(true)} style={({ pressed }) => ({ flex: 1, height: 60, backgroundColor: pressed ? '#2D8C47' : '#34A853', borderRadius: 6, alignItems: 'center', justifyContent: 'center' })}>
            <Text style={{ fontFamily: F.serif, fontSize: 22, color: '#fff' }}>✓ Correct</Text>
          </Pressable>
          <Pressable onPress={() => handleMark(false)} style={({ pressed }) => ({ flex: 1, height: 60, backgroundColor: pressed ? TM.roseDeep : TM.rose, borderRadius: 6, alignItems: 'center', justifyContent: 'center' })}>
            <Text style={{ fontFamily: F.serif, fontSize: 22, color: '#fff' }}>✗ Wrong</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── WAITING MARK ──────────────────────────────────────────────────────────
  if (phase === 'waiting_mark') return (
    <View style={{ flex: 1, backgroundColor: TM.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
      <Breathing><Text style={{ fontSize: 48, marginBottom: 24 }}>⚖️</Text></Breathing>
      <Text style={{ fontFamily: F.serif, fontSize: 24, color: TM.ink }}>Marking done.</Text>
      <Text style={{ marginTop: 12, fontFamily: F.serifItalic, fontSize: 15, color: TM.inkSoft, textAlign: 'center' }}>
        Waiting for {partnerName || 'your partner'} to finish marking…
      </Text>
    </View>
  );

  // ── REVEAL ────────────────────────────────────────────────────────────────
  if (phase === 'reveal') {
    const myHigh   = myPct >= 70;
    const partHigh = partnerPct >= 70;
    const myR      = pickReaction(myPct, mySeed);
    const partR    = pickReaction(partnerPct, partnerSeed);
    const bothLow  = !myHigh && !partHigh;

    return (
      <View style={{ flex: 1, backgroundColor: myHigh ? '#FDF0F0' : TM.bg }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          {revealStep === 0 && (
            <SpringIn>
              <Text style={{ fontFamily: F.serifItalic, fontSize: 18, color: TM.inkSoft, textAlign: 'center', marginBottom: 32 }}>
                Tallying the results…
              </Text>
              {[{ label: 'You', pct: myPct }, { label: partnerName, pct: partnerPct }].map(({ label, pct }) => (
                <View key={label} style={{ width: 280, marginBottom: 24 }}>
                  <Text style={{ fontFamily: F.serifMedium, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: TM.inkFaint, marginBottom: 8, textAlign: 'center' }}>{label}</Text>
                  <View style={{ height: 8, backgroundColor: TM.roseSoft, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                    <Animated.View style={{ height: 8, backgroundColor: pct >= 70 ? TM.rose : TM.gold, borderRadius: 4, width: `${pct}%` as any }} />
                  </View>
                  <Text style={{ fontFamily: F.serif, fontSize: 36, color: pct >= 70 ? TM.rose : TM.gold, textAlign: 'center' }}>{pct}%</Text>
                </View>
              ))}
            </SpringIn>
          )}

          {revealStep >= 1 && revealStep < 3 && (
            <SpringIn>
              <Text style={{ fontFamily: F.serifMedium, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: TM.inkFaint, textAlign: 'center', marginBottom: 16 }}>
                You scored {myPct}%
              </Text>
              <Text style={{ fontFamily: 'Georgia', fontWeight: '700', fontSize: 30, color: myHigh ? TM.rose : TM.gold, textAlign: 'center', lineHeight: 38, marginBottom: 16 }}>
                "{myR.text}"
              </Text>
              <Text style={{ fontSize: 36, textAlign: 'center', letterSpacing: 4 }}>{myR.emojis}</Text>
            </SpringIn>
          )}

          {revealStep >= 2 && revealStep < 3 && (
            <SpringIn delay={400}>
              <View style={{ marginTop: 36, paddingTop: 24, borderTopWidth: 1, borderColor: TM.roseLine }}>
                <Text style={{ fontFamily: F.serifMedium, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: TM.inkFaint, textAlign: 'center', marginBottom: 12 }}>
                  {partnerName} scored {partnerPct}%
                </Text>
                <Text style={{ fontFamily: 'Georgia', fontWeight: '700', fontSize: 26, color: partHigh ? TM.rose : TM.gold, textAlign: 'center', lineHeight: 32 }}>
                  "{partR.text}"
                </Text>
              </View>
            </SpringIn>
          )}

          {revealStep >= 3 && (
            <SpringIn>
              {bothLow && (
                <View style={{ marginBottom: 20, padding: 14, backgroundColor: TM.roseSoft, borderRadius: 6, borderWidth: 1, borderColor: TM.roseLine }}>
                  <Text style={{ fontFamily: F.serif, fontSize: 15, color: TM.rose, textAlign: 'center' }}>
                    🫵 Someone owes someone something. Sort it out.
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                {[{ name: 'You', pct: myPct, high: myHigh, r: myR }, { name: partnerName, pct: partnerPct, high: partHigh, r: partR }].map(p => (
                  <View key={p.name} style={{ flex: 1, padding: 16, backgroundColor: p.high ? TM.roseSoft : TM.goldSoft, borderRadius: 8, borderWidth: 1, borderColor: p.high ? TM.roseLine : TM.gold, alignItems: 'center' }}>
                    <Text style={{ fontFamily: F.serifMedium, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: TM.inkFaint }}>{p.name}</Text>
                    <Text style={{ fontFamily: F.serif, fontSize: 44, color: p.high ? TM.rose : TM.gold, lineHeight: 52 }}>{p.pct}%</Text>
                    <Text style={{ fontSize: 20 }}>{p.r.emojis.slice(0, 3)}</Text>
                  </View>
                ))}
              </View>
              <View style={{ gap: 10 }}>
                <TmBtn onPress={handlePlayAgain}>Play Again ↺</TmBtn>
                <TmBtn variant="ghost" onPress={onHome}>← Go Home</TmBtn>
              </View>
            </SpringIn>
          )}
        </ScrollView>
      </View>
    );
  }

  return null;
}
