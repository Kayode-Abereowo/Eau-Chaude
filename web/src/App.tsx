import { useState, useEffect, useRef } from 'react';
import { sb } from './supabase';
import {
  TIMER_TOTAL, type Category, type Profile, type Badge, type Question,
} from './constants';
import {
  getSession, loadProfile, updateDisplayName, buildSession,
  saveSession, createMatch, joinMatch, startMatch, updatePlayerScore,
} from './api';
import { IOSDevice }            from './components/IOSDevice';
import { LoadingScreen }        from './screens/LoadingScreen';
import { AuthScreen }           from './screens/AuthScreen';
import { NameSetupScreen }      from './screens/NameSetupScreen';
import { HomeScreen }           from './screens/HomeScreen';
import { CategoryScreen }       from './screens/CategoryScreen';
import { QuestionScreen }       from './screens/QuestionScreen';
import { ResultsScreen }        from './screens/ResultsScreen';
import { LobbyScreen }          from './screens/LobbyScreen';
import { ChallengeMenuScreen }  from './screens/ChallengeMenuScreen';
import { JoinMatchScreen }      from './screens/JoinMatchScreen';
import { LeaderboardScreen }    from './screens/LeaderboardScreen';
import { ProfileScreen }        from './screens/ProfileScreen';
import { AdminScreen }          from './screens/AdminScreen';

type Screen =
  | 'boot' | 'auth' | 'nameSetup' | 'home'
  | 'category' | 'category-h2h' | 'loading' | 'question' | 'results'
  | 'challengeMenu' | 'join' | 'lobby'
  | 'leaderboard' | 'profile' | 'admin';

interface MatchState {
  id: string; code: string; status: string;
  category_id: number; difficulty: string;
}
interface PlayerState { user_id: string; display_name: string; score: number; id: string; }

export default function App() {
  // ── Auth / profile ────────────────────────────────────────────
  const [userId,    setUserId]    = useState<string | null>(null);
  const [profile,   setProfile]   = useState<Profile | null>(null);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);

  // ── Navigation ────────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>('boot');

  // ── Solo session ─────────────────────────────────────────────
  const [category,    setCategory]    = useState<Category | null>(null);
  const [difficulty,  setDifficulty]  = useState('Medium');
  const [questions,   setQuestions]   = useState<Question[]>([]);
  const [qIndex,      setQIndex]      = useState(0);
  const [score,       setScore]       = useState(0);
  const [correct,     setCorrect]     = useState(0);
  const [fastestSecs, setFastestSecs] = useState(TIMER_TOTAL);
  const [bestStreak,  setBestStreak]  = useState(0);
  const [curStreak,   setCurStreak]   = useState(0);
  const [speedBonus,  setSpeedBonus]  = useState(0);
  const [prevBest,    setPrevBest]    = useState(0);
  const [newBadgesList, setNewBadgesList] = useState<string[]>([]);

  // ── H2H ──────────────────────────────────────────────────────
  const [match,        setMatch]        = useState<MatchState | null>(null);
  const [matchPlayers, setMatchPlayers] = useState<PlayerState[]>([]);
  const [isHost,       setIsHost]       = useState(false);
  const [opponentScore, setOpponentScore] = useState<number | undefined>(undefined);
  const [matchWinner,  setMatchWinner]  = useState<'you' | 'opponent' | null>(null);
  const [joinLoading,  setJoinLoading]  = useState(false);
  const channelRef = useRef<ReturnType<typeof sb.channel> | null>(null);

  // ── Admin tap ─────────────────────────────────────────────────
  const [monogramTaps, setMonogramTaps] = useState(0);
  const monogramTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Pending join code (from URL before auth) ─────────────────
  const pendingJoinCode = useRef<string | null>(null);

  // ── Boot ─────────────────────────────────────────────────────
  useEffect(() => {
    // Grab ?join=CODE from URL before auth
    const joinCode = new URLSearchParams(window.location.search).get('join');
    if (joinCode) {
      pendingJoinCode.current = joinCode;
      window.history.replaceState({}, '', window.location.pathname);
    }

    (async () => {
      const session = await getSession();
      if (!session) { setScreen('auth'); return; }

      const uid = session.user.id;
      setUserId(uid);
      const [p] = await Promise.all([
        loadProfile(uid),
        sb.from('badges').select('*').then(({ data }) => setAllBadges(data || [])),
      ]);
      setProfile(p);
      setPrevBest(p?.personal_best || 0);

      if (!p?.display_name || p.display_name === 'Player') {
        setScreen('nameSetup');
        return;
      }

      if (pendingJoinCode.current) {
        const code = pendingJoinCode.current;
        pendingJoinCode.current = null;
        await doJoinMatch(code, uid, p);
        return;
      }

      setScreen('home');
    })();
  }, []);

  // ── Auth callback ─────────────────────────────────────────────
  async function handleAuthDone() {
    const session = await getSession();
    if (!session) return;
    const uid = session.user.id;
    setUserId(uid);
    const [p] = await Promise.all([
      loadProfile(uid),
      sb.from('badges').select('*').then(({ data }) => setAllBadges(data || [])),
    ]);
    setProfile(p);
    setPrevBest(p?.personal_best || 0);

    if (!p?.display_name || p.display_name === 'Player') {
      setScreen('nameSetup'); return;
    }

    if (pendingJoinCode.current) {
      const code = pendingJoinCode.current;
      pendingJoinCode.current = null;
      await doJoinMatch(code, uid, p);
      return;
    }
    setScreen('home');
  }

  // ── Name setup ────────────────────────────────────────────────
  async function handleNameSave(name: string) {
    if (!userId) return;
    await updateDisplayName(userId, name);
    setProfile(p => p ? { ...p, display_name: name } : p);
    setScreen('home');
  }

  // ── Admin monogram tap ────────────────────────────────────────
  function handleMonogramTap() {
    const next = monogramTaps + 1;
    setMonogramTaps(next);
    clearTimeout(monogramTimeout.current!);
    if (next >= 7 && profile?.is_admin) { setScreen('admin'); setMonogramTaps(0); return; }
    monogramTimeout.current = setTimeout(() => setMonogramTaps(0), 3000);
  }

  // ── Solo game ─────────────────────────────────────────────────
  async function startSolo(cat: Category, diff: string) {
    setCategory(cat); setDifficulty(diff);
    setScreen('loading');
    const qs = await buildSession(cat, diff);
    setQuestions(qs); setQIndex(0);
    setScore(0); setCorrect(0); setFastestSecs(TIMER_TOTAL);
    setBestStreak(0); setCurStreak(0); setSpeedBonus(0); setNewBadgesList([]);
    setScreen('question');
  }

  async function handleAnswer(isCorrect: boolean, pts: number, timeAtAnswer: number) {
    const base     = difficulty === 'Hard' ? 300 : difficulty === 'Medium' ? 200 : 100;
    const bonus    = isCorrect ? pts - base : 0;
    const newScore = score + pts;
    const newCorr  = correct + (isCorrect ? 1 : 0);
    const newStrk  = isCorrect ? curStreak + 1 : 0;
    const newBest  = Math.max(bestStreak, newStrk);
    const newFast  = isCorrect && timeAtAnswer > 0
      ? Math.min(fastestSecs, TIMER_TOTAL - timeAtAnswer + 0.1)
      : fastestSecs;

    setScore(newScore); setCorrect(newCorr);
    setCurStreak(newStrk); setBestStreak(newBest);
    setSpeedBonus(prev => prev + bonus); setFastestSecs(newFast);

    if (match && userId) {
      updatePlayerScore(match.id, userId, newScore, qIndex + 1, qIndex + 1 >= questions.length);
    }

    if (qIndex + 1 >= questions.length) {
      if (!match && userId && category) {
        try {
          const { newBadges } = await saveSession(
            userId, category.id, difficulty, newScore, newCorr, newBest, speedBonus + bonus, questions,
          );
          if (newScore > prevBest) {
            setPrevBest(newScore);
            setProfile(p => p ? { ...p, personal_best: newScore } : p);
          }
          if (newBadges.length > 0) setNewBadgesList(newBadges);
          loadProfile(userId).then(p => p && setProfile(p));
        } catch (e) { console.error('saveSession failed:', e); }
      }
      if (match && userId) {
        sb.rpc('complete_match', { p_match_id: match.id });
        const opp = matchPlayers.find(p => p.user_id !== userId);
        setMatchWinner(opp && newScore > opp.score ? 'you' : 'opponent');
      }
      setTimeout(() => setScreen('results'), 420);
    } else {
      setQIndex(i => i + 1);
    }
  }

  // ── H2H: create ───────────────────────────────────────────────
  async function handleCreateMatch(cat: Category, diff: string) {
    if (!userId || !profile) return;
    setCategory(cat); setDifficulty(diff);
    setScreen('loading');
    try {
      const m = await createMatch(userId, profile.display_name, cat, diff);
      setMatch({ ...m, status: 'waiting', category_id: cat.id, difficulty: DIFF_MAP_REVERSE[diff] || diff });
      setIsHost(true);
      subscribeToMatch(m.id);
      const { data: qs } = await sb.from('matches').select('question_set').eq('id', m.id).single();
      setQuestions((qs as any)?.question_set || []);
      const { data: players } = await sb.from('match_players').select('*').eq('match_id', m.id);
      setMatchPlayers((players as PlayerState[]) || []);
      setScreen('lobby');
    } catch (e) { console.error(e); setScreen('category-h2h'); }
  }

  const DIFF_MAP_REVERSE: Record<string, string> = { Gentle: 'easy', Medium: 'medium', Hard: 'hard' };

  // ── H2H: join ─────────────────────────────────────────────────
  async function doJoinMatch(code: string, uid: string, p: Profile | null) {
    setJoinLoading(true);
    try {
      const m = await joinMatch(code, uid, p?.display_name || 'Guest');
      setMatch(m); setIsHost(false);
      subscribeToMatch(m.id);
      setQuestions(Array.isArray(m.question_set) ? m.question_set : JSON.parse(m.question_set));
      const { data: players } = await sb.from('match_players').select('*').eq('match_id', m.id);
      setMatchPlayers((players as PlayerState[]) || []);
      setScreen('lobby');
    } catch (e: any) {
      alert(e.message);
      setScreen('home');
    } finally { setJoinLoading(false); }
  }

  async function handleJoinMatch(code: string) {
    if (!userId) return;
    await doJoinMatch(code, userId, profile);
  }

  // ── H2H: realtime ─────────────────────────────────────────────
  function subscribeToMatch(matchId: string) {
    if (channelRef.current) channelRef.current.unsubscribe();
    channelRef.current = sb.channel(`match-${matchId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'match_players', filter: `match_id=eq.${matchId}` },
        payload => {
          const updated = payload.new as PlayerState;
          setMatchPlayers(prev => {
            const next = prev.map(p => p.id === updated.id ? { ...p, ...updated } : p);
            return next.find(p => p.id === updated.id) ? next : [...prev, updated];
          });
          if (updated.user_id !== userId) setOpponentScore(updated.score);
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        payload => {
          const m = payload.new as MatchState;
          setMatch(prev => prev ? { ...prev, ...m } : m);
          if (m.status === 'active') {
            setQIndex(0); setScore(0); setCorrect(0);
            setFastestSecs(TIMER_TOTAL); setBestStreak(0); setCurStreak(0); setSpeedBonus(0);
            setTimeout(() => setScreen('question'), 3200);
          }
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_players', filter: `match_id=eq.${matchId}` },
        payload => { setMatchPlayers(prev => [...prev, payload.new as PlayerState]); })
      .subscribe();
  }

  async function handleStartMatch() {
    if (!match) return;
    await startMatch(match.id);
    setQIndex(0); setScore(0); setCorrect(0);
    setFastestSecs(TIMER_TOTAL); setBestStreak(0); setCurStreak(0); setSpeedBonus(0);
    setTimeout(() => setScreen('question'), 3200);
  }

  // ── Render ────────────────────────────────────────────────────
  const isDark = screen === 'lobby' && match?.status === 'active';

  const opponentScore_ = matchPlayers.find(p => p.user_id !== userId)?.score;

  if (screen === 'boot') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <IOSDevice><LoadingScreen /></IOSDevice>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px 0' }}>
      <div style={{ filter: 'drop-shadow(0 32px 56px rgba(10,30,36,0.22))' }}>
        <IOSDevice dark={isDark}>
          {screen === 'auth' && (
            <AuthScreen onAuth={handleAuthDone} />
          )}

          {screen === 'nameSetup' && (
            <NameSetupScreen onSave={handleNameSave} />
          )}

          {screen === 'home' && (
            <HomeScreen profile={profile} onSolo={() => setScreen('category')}
              onChallenge={() => setScreen('challengeMenu')}
              onLeaderboard={() => setScreen('leaderboard')}
              onProfile={() => setScreen('profile')}
              monogramTaps={monogramTaps} onMonogramTap={handleMonogramTap} />
          )}

          {screen === 'category' && (
            <CategoryScreen onBegin={startSolo} mode="solo" />
          )}

          {screen === 'category-h2h' && (
            <CategoryScreen onBegin={handleCreateMatch} mode="h2h" />
          )}

          {screen === 'loading' && (
            <LoadingScreen category={category} />
          )}

          {screen === 'question' && questions[qIndex] && (
            <QuestionScreen
              question={questions[qIndex]}
              qIndex={qIndex}
              totalQs={questions.length}
              score={score}
              difficulty={difficulty}
              onAnswer={handleAnswer}
              onExit={() => setScreen('home')}
              opponentScore={match ? opponentScore_ : undefined}
            />
          )}

          {screen === 'results' && (
            <ResultsScreen
              score={score} correct={correct}
              fastestSecs={fastestSecs === TIMER_TOTAL ? TIMER_TOTAL : fastestSecs}
              bestStreak={bestStreak} speedBonus={speedBonus}
              prevBest={prevBest}
              categoryId={category?.id || 1}
              onReplay={() => category && startSolo(category, difficulty)}
              onChallenge={() => setScreen('challengeMenu')}
              matchWinner={matchWinner}
              newBadges={newBadgesList}
              allBadges={allBadges}
            />
          )}

          {screen === 'challengeMenu' && (
            <ChallengeMenuScreen
              onCreateMatch={() => setScreen('category-h2h')}
              onJoinMatch={() => setScreen('join')}
              onBack={() => setScreen('home')}
            />
          )}

          {screen === 'join' && (
            <JoinMatchScreen
              onJoin={handleJoinMatch}
              onBack={() => setScreen('challengeMenu')}
              loading={joinLoading}
            />
          )}

          {screen === 'lobby' && match && userId && (
            <LobbyScreen
              match={match} players={matchPlayers}
              currentUserId={userId} isHost={isHost}
              onStart={handleStartMatch}
              onHome={() => setScreen('home')}
            />
          )}

          {screen === 'leaderboard' && userId && (
            <LeaderboardScreen userId={userId} onBack={() => setScreen('home')} />
          )}

          {screen === 'profile' && userId && (
            <ProfileScreen userId={userId} profile={profile} allBadges={allBadges} onBack={() => setScreen('home')} />
          )}

          {screen === 'admin' && userId && (
            <AdminScreen userId={userId} onBack={() => setScreen('home')} />
          )}
        </IOSDevice>
      </div>
    </div>
  );
}
