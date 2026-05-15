import 'react-native-url-polyfill/auto';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono';

import { sb } from './src/supabase';
import {
  signIn, signUp, getSession,
  loadProfile, updateDisplayName, buildSession,
  saveSession, createMatch, joinMatch, startMatch,
  finalizeMatch, updatePlayerScore,
} from './src/api';
import {
  Badge, EC, F, getQuestionTime, Match, MatchPlayer, Profile, Question,
} from './src/constants';
import { Spinner } from './src/components/atoms';

import { AuthScreen }        from './src/screens/AuthScreen';
import { NameSetupScreen }   from './src/screens/NameSetupScreen';
import { HomeScreen }        from './src/screens/HomeScreen';
import { CategoryScreen }    from './src/screens/CategoryScreen';
import { LoadingScreen }     from './src/screens/LoadingScreen';
import { QuestionScreen }    from './src/screens/QuestionScreen';
import { ResultsScreen }     from './src/screens/ResultsScreen';
import { JoinMatchScreen }   from './src/screens/JoinMatchScreen';
import { LobbyScreen }       from './src/screens/LobbyScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { ProfileScreen }     from './src/screens/ProfileScreen';
import { AdminScreen }       from './src/screens/AdminScreen';

type Screen =
  | 'auth' | 'nameSetup' | 'home' | 'category' | 'category-h2h' | 'challengeMenu'
  | 'join' | 'loading' | 'question' | 'results' | 'h2h-waiting' | 'lobby'
  | 'leaderboard' | 'profile' | 'admin';

export default function App() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    DMMono_400Regular,
  });

  // ── Auth ──────────────────────────────────────────────────────
  const [user,      setUser]      = useState<any>(null);
  const [profile,   setProfile]   = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // ── Badges ────────────────────────────────────────────────────
  const [allBadges,     setAllBadges]     = useState<Badge[]>([]);
  const [newBadgesList, setNewBadgesList] = useState<string[]>([]);

  // ── Navigation ────────────────────────────────────────────────
  const [screen,   setScreen]   = useState<Screen>('auth');
  const [prevBest, setPrevBest] = useState(0);

  // ── Solo session ──────────────────────────────────────────────
  const [difficulty,  setDifficulty]  = useState('Medium');
  const [timerTotal,  setTimerTotal]  = useState(15);
  const [questions,   setQuestions]   = useState<Question[]>([]);
  const [qIndex,      setQIndex]      = useState(0);
  const [score,       setScore]       = useState(0);
  const [correct,     setCorrect]     = useState(0);
  const [fastestSecs, setFastestSecs] = useState(9999);
  const [bestStreak,  setBestStreak]  = useState(0);
  const [curStreak,   setCurStreak]   = useState(0);
  const [speedBonus,  setSpeedBonus]  = useState(0);

  // ── H2H ───────────────────────────────────────────────────────
  const [match,         setMatch]         = useState<Match | null>(null);
  const [matchPlayers,  setMatchPlayers]  = useState<MatchPlayer[]>([]);
  const [isHost,        setIsHost]        = useState(false);
  const [opponentScore, setOpponentScore] = useState<number | undefined>(undefined);
  const [matchWinner,   setMatchWinner]   = useState<'you' | 'opponent' | null>(null);
  const [joinLoading,   setJoinLoading]   = useState(false);
  const channelRef     = useRef<any>(null);
  const myCompletedRef = useRef(false);

  // ── Admin tap counter ─────────────────────────────────────────
  const [monogramTaps,  setMonogramTaps]  = useState(0);
  const monogramTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Boot ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [session] = await Promise.all([
          getSession(),
          sb.from('badges').select('*').then(({ data }) => setAllBadges((data as Badge[]) || [])),
        ]);
        if (session?.user) {
          setUser(session.user);
          const p = await loadProfile(session.user.id);
          setProfile(p);
          setPrevBest(p?.personal_best || 0);
          setScreen(!p?.display_name || p.display_name === 'Player' ? 'nameSetup' : 'home');
        } else {
          setScreen('auth');
        }
      } catch (e) {
        console.error('Boot failed:', e);
        setScreen('auth');
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  // ── Auth ──────────────────────────────────────────────────────
  async function handleAuth(u: any) {
    setUser(u);
    const p = await loadProfile(u.id);
    setProfile(p);
    setPrevBest(p?.personal_best || 0);
    setScreen(!p?.display_name || p.display_name === 'Player' ? 'nameSetup' : 'home');
  }

  // ── Name setup ────────────────────────────────────────────────
  async function handleNameSave(name: string) {
    if (!user) return;
    await updateDisplayName(user.id, name);
    setProfile(p => p ? { ...p, display_name: name } : p);
    setScreen('home');
  }

  // ── Admin monogram (tap 7×) ───────────────────────────────────
  function handleMonogramTap() {
    const next = monogramTaps + 1;
    setMonogramTaps(next);
    if (monogramTimeout.current) clearTimeout(monogramTimeout.current);
    if (next >= 7 && profile?.is_admin) { setScreen('admin'); setMonogramTaps(0); return; }
    monogramTimeout.current = setTimeout(() => setMonogramTaps(0), 3000);
  }

  // ── Solo game ─────────────────────────────────────────────────
  async function startSolo(diff: string, count: number, categoryId: number | null = null) {
    setDifficulty(diff);
    const tt = getQuestionTime(diff, count);
    setTimerTotal(tt);
    setScreen('loading');
    const qs = await buildSession(diff, count, categoryId);
    setQuestions(qs); setQIndex(0);
    setScore(0); setCorrect(0);
    setFastestSecs(9999); setBestStreak(0); setCurStreak(0); setSpeedBonus(0);
    setScreen('question');
  }

  async function handleAnswer(isCorrect: boolean, pts: number, timeAtAnswer: number) {
    const base     = difficulty === 'Hard' ? 300 : difficulty === 'Medium' ? 200 : 100;
    const bonus    = isCorrect ? pts - base : 0;
    const newScore = score + pts;
    const newCorr  = correct + (isCorrect ? 1 : 0);
    const newStrk  = isCorrect ? curStreak + 1 : 0;
    const newBest  = Math.max(bestStreak, newStrk);
    const elapsed  = timerTotal - timeAtAnswer;
    const newFast  = isCorrect && timeAtAnswer > 0 ? Math.min(fastestSecs, elapsed) : fastestSecs;

    setScore(newScore); setCorrect(newCorr);
    setCurStreak(newStrk); setBestStreak(newBest);
    setSpeedBonus(prev => prev + bonus);
    setFastestSecs(newFast);

    const isLast = qIndex + 1 >= questions.length;

    if (match) {
      if (isLast) {
        await updatePlayerScore(match.id, user.id, newScore, qIndex + 1, true);
      } else {
        updatePlayerScore(match.id, user.id, newScore, qIndex + 1, false);
      }
    }

    if (isLast) {
      if (!match) {
        try {
          const { newBadges } = await saveSession(
            user.id, difficulty, newScore, newCorr, newBest, speedBonus + bonus, questions
          );
          if (newScore > prevBest) { setPrevBest(newScore); setProfile(p => p ? { ...p, personal_best: newScore } : p); }
          if (newBadges.length > 0) setNewBadgesList(newBadges);
          loadProfile(user.id).then(p => p && setProfile(p));
        } catch (e) { console.error('saveSession failed:', e); }
      }
      if (match) {
        myCompletedRef.current = true;
        const winnerId = await finalizeMatch(match.id);
        if (winnerId !== null) {
          setMatchWinner(winnerId === user.id ? 'you' : 'opponent');
          loadProfile(user.id).then(p => p && setProfile(p));
          setTimeout(() => setScreen('results'), 420);
        } else {
          setTimeout(() => setScreen('h2h-waiting'), 420);
        }
      } else {
        setTimeout(() => setScreen('results'), 420);
      }
    } else {
      setQIndex(i => i + 1);
    }
  }

  // ── H2H: create ───────────────────────────────────────────────
  async function handleCreateMatch(diff: string, count: number, categoryId: number | null = null) {
    setDifficulty(diff);
    const tt = getQuestionTime(diff, count);
    setTimerTotal(tt);
    setScreen('loading');
    try {
      const m = await createMatch(user.id, profile?.display_name || 'Eau', diff, count, categoryId);
      setMatch(m); setIsHost(true);
      subscribeToMatch(m.id, user.id);
      const { data: qs } = await sb.from('matches').select('question_set').eq('id', m.id).single();
      setQuestions((qs as any)?.question_set || []);
      const { data: players } = await sb.from('match_players').select('*').eq('match_id', m.id);
      setMatchPlayers((players as MatchPlayer[]) || []);
      setScreen('lobby');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not create match');
      setScreen('category-h2h');
    }
  }

  // ── H2H: join ─────────────────────────────────────────────────
  async function handleJoinMatch(code: string) {
    if (!user) return;
    setJoinLoading(true);
    try {
      const m = await joinMatch(code, user.id, profile?.display_name || 'Guest');
      setMatch(m); setIsHost(false);
      subscribeToMatch(m.id, user.id);
      setQuestions(Array.isArray(m.question_set) ? m.question_set : JSON.parse(m.question_set as any));
      const { data: players } = await sb.from('match_players').select('*').eq('match_id', m.id);
      setMatchPlayers((players as MatchPlayer[]) || []);
      setScreen('lobby');
    } catch (e: any) {
      Alert.alert('Not found', e.message || 'Check the code and try again.');
    } finally {
      setJoinLoading(false);
    }
  }

  // ── H2H: realtime ─────────────────────────────────────────────
  function subscribeToMatch(matchId: string, uid: string) {
    if (channelRef.current) channelRef.current.unsubscribe();
    channelRef.current = sb.channel(`match-${matchId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'match_players', filter: `match_id=eq.${matchId}` },
        (payload: any) => {
          const updated = payload.new as MatchPlayer & { completed?: boolean };
          setMatchPlayers(prev => {
            const next = prev.map(p => p.id === updated.id ? { ...p, ...updated } : p);
            return next.find(p => p.id === updated.id) ? next : [...prev, updated];
          });
          if (updated.user_id !== uid) {
            setOpponentScore(updated.score);
            if (updated.completed && myCompletedRef.current) {
              finalizeMatch(matchId).then(winnerId => {
                if (winnerId) {
                  setMatchWinner(winnerId === uid ? 'you' : 'opponent');
                  loadProfile(uid).then(p => p && setProfile(p));
                  setScreen('results');
                }
              });
            }
          }
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        (payload: any) => {
          const m = payload.new as Match & { winner_id?: string };
          setMatch(prev => prev ? { ...prev, ...m } : prev);
          if (m.status === 'waiting') {
            // Guest joined and inject_personal_questions fired — re-fetch players and questions
            sb.from('match_players').select('*').eq('match_id', matchId).then(({ data }) => {
              if (data) setMatchPlayers(data as MatchPlayer[]);
            });
            if (Array.isArray(m.question_set)) setQuestions(m.question_set as Question[]);
          }
          if (m.status === 'active') {
            setQIndex(0); setScore(0); setCorrect(0);
            setFastestSecs(9999); setBestStreak(0); setCurStreak(0); setSpeedBonus(0);
            setTimeout(() => setScreen('question'), 3200);
          }
          if (m.status === 'completed' && m.winner_id) {
            setMatchWinner(m.winner_id === uid ? 'you' : 'opponent');
            loadProfile(uid).then(p => p && setProfile(p));
            setTimeout(() => setScreen('results'), 420);
          }
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_players', filter: `match_id=eq.${matchId}` },
        (payload: any) => {
          // Fast-path update; reliable fallback is the matches UPDATE handler above
          setMatchPlayers(prev => {
            const incoming = payload.new as MatchPlayer;
            return prev.find(p => p.id === incoming.id) ? prev : [...prev, incoming];
          });
        })
      .subscribe();
  }

  async function handleStartMatch() {
    if (!match) return;
    myCompletedRef.current = false;
    await startMatch(match.id);
    setQIndex(0); setScore(0); setCorrect(0);
    setFastestSecs(9999); setBestStreak(0); setCurStreak(0); setSpeedBonus(0);
    setTimeout(() => setScreen('question'), 3200);
  }

  // ── Loading / font splash ─────────────────────────────────────
  if (!fontsLoaded || !authReady) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: EC.cream, alignItems: 'center', justifyContent: 'center' }}>
          <Spinner />
        </View>
      </SafeAreaProvider>
    );
  }

  const isDark = screen === 'lobby' && match?.status === 'active';

  // ── Screen routing ────────────────────────────────────────────
  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1, backgroundColor: isDark ? EC.tealDeep : EC.cream }}>

        {screen === 'auth' && <AuthScreen onAuth={handleAuth} />}

        {screen === 'nameSetup' && <NameSetupScreen onSave={handleNameSave} />}

        {screen === 'home' && (
          <HomeScreen
            profile={profile}
            onSolo={() => setScreen('category')}
            onChallenge={() => setScreen('challengeMenu')}
            onLeaderboard={() => setScreen('leaderboard')}
            onProfile={() => setScreen('profile')}
            onMonogramTap={handleMonogramTap}
          />
        )}

        {screen === 'challengeMenu' && (
          <View style={{ flex: 1, backgroundColor: EC.cream }}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 }}>
              <Text style={{ fontFamily: F.serif, fontSize: 28, lineHeight: 30, color: EC.ink, textAlign: 'center', letterSpacing: -0.3 }}>
                Head{' '}
                <Text style={{ fontStyle: 'italic', color: EC.teal }}>to</Text>
                {' '}head
              </Text>
              <Text style={{ fontFamily: F.serifItalic, fontSize: 15, color: EC.inkSoft, textAlign: 'center' }}>
                {'Challenge a friend to questions\non the same question set.'}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 24, paddingBottom: 36, gap: 10 }}>
              <Pressable onPress={() => setScreen('category-h2h')} style={({ pressed }) => ({
                width: '100%' as const, height: 56,
                backgroundColor: pressed ? EC.tealDeep : EC.teal,
                borderRadius: 6, flexDirection: 'row' as const, alignItems: 'center' as const,
                justifyContent: 'space-between' as const, paddingHorizontal: 22,
              })}>
                <Text style={{ fontFamily: F.serif, fontSize: 19, color: EC.cream }}>Create a match</Text>
                <Text style={{ color: EC.cream }}>→</Text>
              </Pressable>
              <Pressable onPress={() => setScreen('join')} style={({ pressed }) => ({
                width: '100%' as const, height: 56,
                backgroundColor: pressed ? 'rgba(26,35,38,0.04)' : 'transparent',
                borderWidth: 1, borderColor: EC.ink, borderRadius: 6,
                flexDirection: 'row' as const, alignItems: 'center' as const,
                justifyContent: 'space-between' as const, paddingHorizontal: 22,
              })}>
                <Text style={{ fontFamily: F.serif, fontSize: 19, color: EC.ink }}>Join with a code</Text>
                <Text style={{ color: EC.ink }}>→</Text>
              </Pressable>
              <Pressable onPress={() => setScreen('home')} style={{
                width: '100%' as const, height: 44,
                borderWidth: 1, borderColor: EC.creamLine, borderRadius: 6,
                alignItems: 'center' as const, justifyContent: 'center' as const,
              }}>
                <Text style={{ fontFamily: F.serif, fontSize: 16, color: EC.inkSoft }}>Back</Text>
              </Pressable>
            </View>
          </View>
        )}

        {screen === 'category' && <CategoryScreen mode="solo" onBegin={(d, c, cat) => startSolo(d, c, cat)} onBack={() => setScreen('home')} />}
        {screen === 'category-h2h' && <CategoryScreen mode="h2h" onBegin={(d, c, cat) => handleCreateMatch(d, c, cat)} onBack={() => setScreen('challengeMenu')} />}

        {screen === 'join' && (
          <JoinMatchScreen onJoin={handleJoinMatch} onBack={() => setScreen('challengeMenu')} loading={joinLoading} />
        )}

        {screen === 'loading' && <LoadingScreen />}

        {screen === 'question' && questions.length > 0 && (
          <QuestionScreen
            question={questions[qIndex]} qIndex={qIndex}
            totalQs={questions.length} score={score} difficulty={difficulty}
            timerTotal={timerTotal}
            onAnswer={handleAnswer}
            onExit={() => { setMatch(null); setScreen('home'); }}
            opponentScore={match ? opponentScore : undefined}
          />
        )}

        {screen === 'h2h-waiting' && (
          <View style={{ flex: 1, backgroundColor: EC.cream, alignItems: 'center',
            justifyContent: 'center', gap: 16, paddingHorizontal: 32 }}>
            <Text style={{ fontFamily: F.serifItalic, fontSize: 22, color: EC.ink, textAlign: 'center' }}>
              Waiting for your opponent to finish…
            </Text>
            <Text style={{ fontFamily: F.serifItalic, fontSize: 13, color: EC.inkSoft, textAlign: 'center' }}>
              Results will appear when both players are done.
            </Text>
          </View>
        )}

        {screen === 'results' && (
          <ResultsScreen
            score={score} correct={correct} totalQs={questions.length}
            fastestSecs={fastestSecs}
            bestStreak={bestStreak} speedBonus={speedBonus}
            prevBest={prevBest}
            matchWinner={matchWinner}
            opponentScore={matchWinner ? matchPlayers.find(p => p.user_id !== user?.id)?.score : undefined}
            newBadges={newBadgesList} allBadges={allBadges}
            onReplay={() => {
              setMatch(null); setMatchWinner(null); setNewBadgesList([]);
              startSolo(difficulty, questions.length);
            }}
            onChallenge={() => {
              setMatch(null); setMatchWinner(null); setNewBadgesList([]);
              setScreen('challengeMenu');
            }}
            onHome={() => {
              setMatch(null); setMatchWinner(null); setNewBadgesList([]);
              setScreen('home');
            }}
          />
        )}

        {screen === 'lobby' && match && (
          <LobbyScreen
            match={match} players={matchPlayers}
            currentUserId={user?.id} isHost={isHost}
            onStart={handleStartMatch}
            onHome={() => { setMatch(null); setScreen('home'); }}
          />
        )}

        {screen === 'leaderboard' && (
          <LeaderboardScreen userId={user?.id} onBack={() => setScreen('home')} />
        )}

        {screen === 'profile' && (
          <ProfileScreen userId={user?.id} profile={profile} allBadges={allBadges} onBack={() => setScreen('home')} />
        )}

        {screen === 'admin' && (
          <AdminScreen userId={user?.id} onBack={() => setScreen('home')} />
        )}

      </View>
    </SafeAreaProvider>
  );
}
