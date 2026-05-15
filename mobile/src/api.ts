import { sb } from './supabase';
import { DIFF_MAP, LOCAL_FALLBACK, Match, Profile, Question } from './constants';

// ── Auth ──────────────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data.user!;
}

export async function signUp(email: string, password: string, displayName: string) {
  const { data, error } = await sb.auth.signUp({
    email: email.trim(), password,
    options: { data: { display_name: displayName.trim() } },
  });
  if (error) throw error;
  return data.user!;
}

export async function signOut() {
  await sb.auth.signOut();
}

export async function getSession() {
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

export async function loadProfile(userId: string): Promise<Profile | null> {
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
  return data as Profile | null;
}

export async function updateDisplayName(userId: string, name: string) {
  await sb.from('profiles').update({ display_name: name }).eq('id', userId);
}

// ── Questions ─────────────────────────────────────────────────
async function fetchRandomInternalQuestions(difficulty: string, count: number): Promise<Question[]> {
  const { data, error } = await sb.rpc('get_random_questions', {
    p_difficulty: difficulty,
    p_limit:      count,
  });
  if (error || !data) return [];
  return (data as any[]).map(q => ({
    ...q,
    answers: Array.isArray(q.answers) ? q.answers : JSON.parse(q.answers),
  })) as Question[];
}

async function fetchOpenTDBQuestions(difficulty: string, count: number): Promise<Question[]> {
  try {
    const diff = difficulty === 'easy' ? 'easy' : difficulty === 'hard' ? 'hard' : 'medium';
    const url  = `https://opentdb.com/api.php?amount=${count}&difficulty=${diff}&type=multiple&encode=url3986`;
    const res  = await fetch(url);
    const json = await res.json();
    if (json.response_code !== 0) return [];
    return json.results.map((q: any) => {
      const wrong   = q.incorrect_answers.map((a: string) => decodeURIComponent(a));
      const correct = decodeURIComponent(q.correct_answer);
      const answers = [...wrong, correct].sort(() => Math.random() - 0.5);
      return {
        question:      decodeURIComponent(q.question),
        answers,
        correct_index: answers.indexOf(correct),
        source:        'opentdb',
      };
    }) as Question[];
  } catch { return []; }
}

export async function buildSession(difficulty: string, count = 10, categoryId: number | null = null): Promise<Question[]> {
  const diff = DIFF_MAP[difficulty] || 'medium';

  if (categoryId !== null) {
    const { data, error } = await sb.rpc('get_session_questions', {
      p_category_id: categoryId,
      p_difficulty:  diff,
      p_limit:       count,
    });
    if (error || !data) return [...LOCAL_FALLBACK].sort(() => Math.random() - 0.5).slice(0, count);
    const qs = (data as any[]).map(q => ({
      ...q,
      answers: Array.isArray(q.answers) ? q.answers : JSON.parse(q.answers),
    })) as Question[];
    return qs.length >= 5 ? qs : [...LOCAL_FALLBACK].sort(() => Math.random() - 0.5).slice(0, count);
  }

  const internalCount = Math.ceil(count * 0.6);
  const externalCount = count - internalCount;
  const [internal, external] = await Promise.all([
    fetchRandomInternalQuestions(diff, internalCount),
    fetchOpenTDBQuestions(diff, externalCount),
  ]);
  let questions = [...internal, ...external].sort(() => Math.random() - 0.5);
  if (questions.length < 5) questions = [...LOCAL_FALLBACK].sort(() => Math.random() - 0.5);
  return questions.slice(0, count);
}

// ── Session ───────────────────────────────────────────────────
export async function saveSession(
  userId: string, difficulty: string, score: number,
  correctCount: number, bestStreak: number, speedBonus: number,
  questions: Question[]
): Promise<{ sessionId: string | null; newBadges: string[] }> {
  const diff = DIFF_MAP[difficulty] || 'medium';
  const { data } = await sb.from('sessions').insert({
    user_id: userId, category_id: null, difficulty: diff,
    score, correct_count: correctCount, best_streak: bestStreak,
    speed_bonus: speedBonus, question_set: questions,
    completed_at: new Date().toISOString(),
  }).select('id').single();
  await sb.rpc('upsert_personal_best', { p_user_id: userId, p_category_id: null, p_score: score });
  await sb.rpc('update_streak',        { p_user_id: userId });
  await sb.rpc('update_weekly_score',  { p_user_id: userId, p_score: score });
  const { data: newBadges } = await sb.rpc('check_and_award_badges', { p_user_id: userId });
  return { sessionId: (data as any)?.id ?? null, newBadges: (newBadges as string[]) || [] };
}

// ── Match management ──────────────────────────────────────────
function clientMatchCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function createMatch(userId: string, displayName: string, difficulty: string, count: number, categoryId: number | null = null): Promise<Match> {
  const diff      = DIFF_MAP[difficulty] || 'medium';
  const code      = clientMatchCode();
  const questions = await buildSession(difficulty, count, categoryId);
  const { data: match, error } = await sb.from('matches').insert({
    code, host_id: userId, category_id: categoryId,
    difficulty: diff, status: 'waiting', question_set: questions,
  }).select('id,code,host_id,category_id,difficulty,status,question_set,started_at').single();
  if (error) throw error;
  await sb.from('match_players').insert({ match_id: (match as any).id, user_id: userId, display_name: displayName });
  return match as Match;
}

export async function joinMatch(code: string, userId: string, displayName: string): Promise<Match> {
  const { data: match, error } = await sb.from('matches')
    .select('id,code,host_id,category_id,difficulty,status,question_set,started_at')
    .eq('code', code.toUpperCase())
    .eq('status', 'waiting')
    .single();
  if (error || !match) throw new Error('Match not found or already started');
  const m = match as Match;
  const { error: insertError } = await sb.from('match_players').insert({
    match_id: m.id, user_id: userId, display_name: displayName,
  });
  if (insertError) throw new Error('Could not join match. You may already be in it.');

  // Inject personal questions for this specific pair (up to 2, prepended)
  await sb.rpc('inject_personal_questions', {
    p_match_id: m.id,
    p_user_a:   userId,
    p_user_b:   m.host_id,
  });

  // Re-fetch so the guest gets the updated question_set (with personal Qs prepended)
  const { data: updated } = await sb.from('matches')
    .select('id,code,host_id,category_id,difficulty,status,question_set,started_at')
    .eq('id', m.id).single();
  return (updated || m) as Match;
}

export async function startMatch(matchId: string) {
  await sb.from('matches').update({ status: 'active', started_at: new Date().toISOString() }).eq('id', matchId);
}

export async function finalizeMatch(matchId: string): Promise<string | null> {
  const { data, error } = await sb.rpc('finalize_match', { p_match_id: matchId });
  if (error) { console.error('finalizeMatch error:', error); return null; }
  return (data as string) || null;
}

export async function updatePlayerScore(matchId: string, userId: string, score: number, qIndex: number, completed: boolean) {
  await sb.from('match_players').update({ score, current_q_index: qIndex, completed })
    .eq('match_id', matchId).eq('user_id', userId);
}
