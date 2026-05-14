import { sb } from './supabase';
import { DIFF_MAP, LOCAL_FALLBACK, Category, Match, Profile, Question } from './constants';

// ── Auth ──────────────────────────────────────────────────────
export async function ensureAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) return session.user;
  const { data, error } = await sb.auth.signInAnonymously();
  if (error) throw error;
  return data.user!;
}

export async function loadProfile(userId: string): Promise<Profile | null> {
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
  return data as Profile | null;
}

export async function updateDisplayName(userId: string, name: string) {
  await sb.from('profiles').update({ display_name: name }).eq('id', userId);
}

// ── Questions ─────────────────────────────────────────────────
async function fetchInternalQuestions(categoryId: number, difficulty: string, count = 6): Promise<Question[]> {
  const { data, error } = await sb.rpc('get_session_questions', {
    p_category_id: categoryId,
    p_difficulty:  difficulty,
    p_limit:       count,
  });
  if (error || !data) return [];
  return (data as any[]).map(q => ({
    ...q,
    answers: Array.isArray(q.answers) ? q.answers : JSON.parse(q.answers),
  })) as Question[];
}

async function fetchOpenTDBQuestions(opentdbId: number | null, difficulty: string, count = 4): Promise<Question[]> {
  if (!opentdbId) return [];
  try {
    const url = `https://opentdb.com/api.php?amount=${count}&category=${opentdbId}&difficulty=${difficulty}&type=multiple&encode=url3986`;
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

export async function buildSession(categoryId: number, opentdbId: number | null, difficulty: string): Promise<Question[]> {
  const diff = DIFF_MAP[difficulty] || 'medium';
  const [internal, external] = await Promise.all([
    fetchInternalQuestions(categoryId, diff, 6),
    fetchOpenTDBQuestions(opentdbId, diff, 4),
  ]);
  let questions = [...internal, ...external].sort(() => Math.random() - 0.5);
  if (questions.length < 5) questions = [...LOCAL_FALLBACK].sort(() => Math.random() - 0.5);
  return questions.slice(0, 10);
}

// ── Session ───────────────────────────────────────────────────
export async function saveSession(
  userId: string, categoryId: number, difficulty: string,
  score: number, correctCount: number, bestStreak: number,
  speedBonus: number, questions: Question[]
): Promise<{ sessionId: string | null; newBadges: string[] }> {
  const diff = DIFF_MAP[difficulty] || 'medium';
  const { data } = await sb.from('sessions').insert({
    user_id: userId, category_id: categoryId, difficulty: diff,
    score, correct_count: correctCount, best_streak: bestStreak,
    speed_bonus: speedBonus, question_set: questions,
    completed_at: new Date().toISOString(),
  }).select('id').single();
  await sb.rpc('upsert_personal_best', { p_user_id: userId, p_category_id: categoryId, p_score: score });
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

export async function createMatch(userId: string, displayName: string, category: Category, difficulty: string): Promise<Match> {
  const diff      = DIFF_MAP[difficulty] || 'medium';
  const code      = clientMatchCode();
  const questions = await buildSession(category.id, category.opentdb_id, difficulty);
  const { data: match, error } = await sb.from('matches').insert({
    code, host_id: userId, category_id: category.id,
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
  await sb.from('match_players').insert({ match_id: (match as any).id, user_id: userId, display_name: displayName });
  return match as Match;
}

export async function startMatch(matchId: string) {
  await sb.from('matches').update({ status: 'active', started_at: new Date().toISOString() }).eq('id', matchId);
}

export async function updatePlayerScore(matchId: string, userId: string, score: number, qIndex: number, completed: boolean) {
  await sb.from('match_players').update({ score, current_q_index: qIndex, completed })
    .eq('match_id', matchId).eq('user_id', userId);
}
