export const EC = {
  cream:       '#F4EEE6',
  creamSoft:   '#EFE7DB',
  creamLine:   'rgba(26,35,38,0.08)',
  ink:         '#1A2326',
  inkSoft:     'rgba(26,35,38,0.55)',
  inkFaint:    'rgba(26,35,38,0.35)',
  teal:        '#0E6A78',
  tealDeep:    '#0A4C57',
  tealSoft:    'rgba(14,106,120,0.08)',
  tealLine:    'rgba(244,238,230,0.18)',
  onTeal:      '#F4EEE6',
  onTealSoft:  'rgba(244,238,230,0.62)',
  onTealFaint: 'rgba(244,238,230,0.35)',
  heart:       '#B65B5C',
} as const;

export const ecSerif = '"Cormorant Garamond","EB Garamond",Georgia,serif';
export const ecMono  = '"DM Mono","JetBrains Mono",ui-monospace,monospace';

export const TIMER_TOTAL = 15;

export function getQuestionTime(difficulty: string, count: number): number {
  const base = difficulty === 'Hard' ? 10 : difficulty === 'Medium' ? 15 : 20;
  const adj  = Math.round(-(count - 10) / 5);
  return Math.max(6, base + adj);
}
export const LETTERS = ['A', 'B', 'C', 'D'] as const;
export const DIFF_MAP: Record<string, string> = { Gentle: 'easy', Medium: 'medium', Hard: 'hard' };

export interface Category {
  id: number;
  n: string;
  name: string;
  count: number;
  opentdb_id: number | null;
}

export const CATEGORIES_LIST: Category[] = [
  { id: 1,  n: 'I',    name: 'General Knowledge', count: 4281, opentdb_id: 9   },
  { id: 2,  n: 'II',   name: 'Geography',          count: 1130, opentdb_id: 22  },
  { id: 3,  n: 'III',  name: 'Film & Television',  count: 649,  opentdb_id: 11  },
  { id: 4,  n: 'IV',   name: 'Science & Nature',   count: 623,  opentdb_id: 17  },
  { id: 5,  n: 'V',    name: 'History',            count: 619,  opentdb_id: 23  },
  { id: 6,  n: 'VI',   name: 'Food & Drink',       count: 459,  opentdb_id: null },
  { id: 7,  n: 'VII',  name: 'Literature',         count: 423,  opentdb_id: 10  },
  { id: 8,  n: 'VIII', name: 'Sport',              count: 387,  opentdb_id: 21  },
  { id: 9,  n: 'IX',   name: 'The Animal Kingdom', count: 364,  opentdb_id: 27  },
  { id: 10, n: 'X',    name: 'Music',              count: 351,  opentdb_id: 12  },
  { id: 11, n: 'XI',   name: 'Religion & Myth',    count: 290,  opentdb_id: 20  },
  { id: 12, n: 'XII',  name: 'Politics & Society', count: 175,  opentdb_id: 24  },
  { id: 13, n: 'XIII', name: 'Technology',         count: 125,  opentdb_id: 18  },
  { id: 14, n: 'XIV',  name: 'Art & Culture',      count: 108,  opentdb_id: 25  },
];

export interface Profile {
  id: string;
  display_name: string;
  personal_best: number;
  current_streak: number;
  longest_streak: number;
  last_played_at: string | null;
  is_admin: boolean;
}

export interface Badge {
  id: string;
  icon: string;
  name: string;
  description: string;
}

export interface Question {
  question: string;
  answers: string[];
  correct_index: number;
  source: string;
  personal?: boolean;
}
