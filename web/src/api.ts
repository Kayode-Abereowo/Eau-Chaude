import { sb } from './supabase';
import { DIFF_MAP, type Category, type Profile, type Question } from './constants';

// ── Auth ──────────────────────────────────────────────────────────────────────

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

// ── Profile ───────────────────────────────────────────────────────────────────

export async function loadProfile(userId: string): Promise<Profile | null> {
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
  return data as Profile | null;
}

export async function updateDisplayName(userId: string, name: string) {
  await sb.from('profiles').update({ display_name: name }).eq('id', userId);
}

// ── Questions ─────────────────────────────────────────────────────────────────

function decodeHTML(str: string): string {
  const ta = document.createElement('textarea');
  ta.innerHTML = str;
  return ta.value;
}

const LOCAL_FALLBACK: Question[] = [
  { question: 'How many sides does a hexagon have?',             answers: ['Five','Six','Seven','Eight'],                      correct_index: 1, source: 'local' },
  { question: 'What is the chemical symbol for gold?',           answers: ['Go','Gd','Au','Ag'],                               correct_index: 2, source: 'local' },
  { question: 'In which year did the Berlin Wall fall?',         answers: ['1987','1988','1989','1990'],                       correct_index: 2, source: 'local' },
  { question: 'Who painted the Mona Lisa?',                      answers: ['Michelangelo','Raphael','Leonardo da Vinci','Botticelli'], correct_index: 2, source: 'local' },
  { question: 'What is the largest planet in our solar system?', answers: ['Saturn','Jupiter','Neptune','Uranus'],             correct_index: 1, source: 'local' },
  { question: 'Which element has atomic number 1?',              answers: ['Helium','Lithium','Hydrogen','Carbon'],            correct_index: 2, source: 'local' },
  { question: 'How many bones are in the adult human body?',     answers: ['196','206','216','226'],                           correct_index: 1, source: 'local' },
  { question: 'What is the national currency of Japan?',         answers: ['Won','Yuan','Yen','Ringgit'],                     correct_index: 2, source: 'local' },
  { question: 'Which river flows through Vienna and Budapest?',  answers: ['The Rhine','The Volga','The Danube','The Dnieper'], correct_index: 2, source: 'local' },
  { question: 'What is the capital city of Australia?',          answers: ['Sydney','Melbourne','Canberra','Brisbane'],       correct_index: 2, source: 'local' },
];

async function fetchInternalQuestions(categoryId: number, difficulty: string, count: number): Promise<Question[]> {
  const { data, error } = await sb.rpc('get_session_questions', {
    p_category_id: categoryId,
    p_difficulty:  difficulty,
    p_limit:       count,
  });
  if (error || !data) return [];
  return (data as any[]).map(q => ({
    ...q,
    answers: Array.isArray(q.answers) ? q.answers : JSON.parse(q.answers),
  }));
}

async function fetchRandomInternalQuestions(difficulty: string, count: number): Promise<Question[]> {
  const { data, error } = await sb.rpc('get_random_questions', {
    p_difficulty: difficulty,
    p_limit:      count,
  });
  if (error || !data) return [];
  return (data as any[]).map(q => ({
    ...q,
    answers: Array.isArray(q.answers) ? q.answers : JSON.parse(q.answers),
  }));
}

async function fetchOpenTDBQuestions(opentdbId: number | null, difficulty: string, count: number, anyCategory = false): Promise<Question[]> {
  if (!anyCategory && !opentdbId) return [];
  try {
    const diff = difficulty === 'easy' ? 'easy' : difficulty === 'hard' ? 'hard' : 'medium';
    const catParam = opentdbId ? `&category=${opentdbId}` : '';
    const url  = `https://opentdb.com/api.php?amount=${count}${catParam}&difficulty=${diff}&type=multiple&encode=url3986`;
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
    });
  } catch { return []; }
}

export async function buildSession(category: Category | null, difficulty: string, count = 10): Promise<Question[]> {
  const diff = DIFF_MAP[difficulty] || 'medium';
  const internalCount = Math.ceil(count * 0.6);
  const externalCount = count - internalCount;
  const [internal, external] = await Promise.all([
    category
      ? fetchInternalQuestions(category.id, diff, internalCount)
      : fetchRandomInternalQuestions(diff, internalCount),
    fetchOpenTDBQuestions(category?.opentdb_id ?? null, diff, externalCount, category === null),
  ]);
  let questions = [...internal, ...external].sort(() => Math.random() - 0.5);
  if (questions.length < 5) questions = [...LOCAL_FALLBACK].sort(() => Math.random() - 0.5);
  return questions.slice(0, count);
}

// ── Session persistence ───────────────────────────────────────────────────────

export async function saveSession(
  userId: string,
  categoryId: number,
  difficulty: string,
  score: number,
  correctCount: number,
  bestStreak: number,
  speedBonus: number,
  questions: Question[],
): Promise<{ sessionId: string | null; newBadges: string[] }> {
  const diff = DIFF_MAP[difficulty] || 'medium';
  const { data } = await sb.from('sessions').insert({
    user_id:       userId,
    category_id:   categoryId,
    difficulty:    diff,
    score,
    correct_count: correctCount,
    best_streak:   bestStreak,
    speed_bonus:   speedBonus,
    question_set:  questions,
    completed_at:  new Date().toISOString(),
  }).select('id').single();
  await sb.rpc('upsert_personal_best', { p_user_id: userId, p_category_id: categoryId, p_score: score });
  await sb.rpc('update_streak',        { p_user_id: userId });
  await sb.rpc('update_weekly_score',  { p_user_id: userId, p_score: score });
  const { data: newBadges } = await sb.rpc('check_and_award_badges', { p_user_id: userId });
  return { sessionId: (data as any)?.id ?? null, newBadges: (newBadges as string[]) || [] };
}

// ── Match management ──────────────────────────────────────────────────────────

function clientMatchCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function createMatch(userId: string, displayName: string, category: Category | null, difficulty: string, count = 10) {
  const diff      = DIFF_MAP[difficulty] || 'medium';
  const code      = clientMatchCode();
  const questions = await buildSession(category, difficulty, count);
  const { data: match, error } = await sb.from('matches').insert({
    code,
    host_id:      userId,
    category_id:  category?.id ?? null,
    difficulty:   diff,
    status:       'waiting',
    question_set: questions,
  }).select('id,code').single();
  if (error) throw error;
  await sb.from('match_players').insert({
    match_id: (match as any).id, user_id: userId, display_name: displayName,
  });
  return match as { id: string; code: string };
}

export async function joinMatch(code: string, userId: string, displayName: string) {
  const { data: match, error } = await sb.from('matches')
    .select('id,code,status,category_id,difficulty,question_set')
    .eq('code', code.toUpperCase())
    .eq('status', 'waiting')
    .single();
  if (error || !match) throw new Error('Match not found or already started');
  const { error: insertError } = await sb.from('match_players').insert({
    match_id: (match as any).id, user_id: userId, display_name: displayName,
  });
  if (insertError) throw new Error('Could not join match. You may already be in it.');
  return match as any;
}

export async function startMatch(matchId: string) {
  await sb.from('matches').update({ status: 'active', started_at: new Date().toISOString() }).eq('id', matchId);
}

export async function claimMatchWinner(matchId: string, userId: string): Promise<boolean> {
  const { data } = await sb.rpc('claim_match_winner', { p_match_id: matchId, p_user_id: userId });
  return data === true;
}

export async function updatePlayerScore(matchId: string, userId: string, score: number, qIndex: number, completed: boolean) {
  await sb.from('match_players').update({
    score, current_q_index: qIndex, completed,
  }).eq('match_id', matchId).eq('user_id', userId);
}

