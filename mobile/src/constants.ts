export const EC = {
  cream: '#F4EEE6',
  creamSoft: '#EFE7DB',
  creamLine: 'rgba(26,35,38,0.08)',
  ink: '#1A2326',
  inkSoft: 'rgba(26,35,38,0.55)',
  inkFaint: 'rgba(26,35,38,0.35)',
  teal: '#0E6A78',
  tealDeep: '#0A4C57',
  tealSoft: 'rgba(14,106,120,0.08)',
  tealLine: 'rgba(244,238,230,0.18)',
  onTeal: '#F4EEE6',
  onTealSoft: 'rgba(244,238,230,0.62)',
  onTealFaint: 'rgba(244,238,230,0.35)',
  heart: '#B65B5C',
} as const;

// Font family constants — match the loaded expo-google-fonts names
export const F = {
  serif: 'CormorantGaramond_400Regular',
  serifItalic: 'CormorantGaramond_400Regular_Italic',
  serifMedium: 'CormorantGaramond_500Medium',
  serifSemiBold: 'CormorantGaramond_600SemiBold',
  mono: 'DMMono_400Regular',
} as const;

export const TIMER_TOTAL = 15;
export const LETTERS = ['A', 'B', 'C', 'D'] as const;
export const DIFF_MAP: Record<string, string> = {
  Gentle: 'easy',
  Medium: 'medium',
  Hard: 'hard',
};

export type Category = {
  id: number;
  n: string;
  name: string;
  count: number;
  opentdb_id: number | null;
};

export type Question = {
  question: string;
  answers: string[];
  correct_index: number;
  source?: string;
  personal?: boolean;
};

export type Profile = {
  id: string;
  display_name: string;
  personal_best: number;
  current_streak: number;
  longest_streak: number;
  last_played_at: string | null;
  is_admin: boolean;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export type MatchPlayer = {
  id: string;
  match_id: string;
  user_id: string;
  display_name: string;
  score: number;
  current_q_index: number;
  completed: boolean;
};

export type Match = {
  id: string;
  code: string;
  host_id: string;
  category_id: number;
  difficulty: string;
  status: 'waiting' | 'active' | 'finished';
  question_set: Question[];
  started_at: string | null;
};

export const CATEGORIES_LIST: Category[] = [
  { id: 1,  n: 'I',    name: 'General Knowledge',  count: 4281, opentdb_id: 9   },
  { id: 2,  n: 'II',   name: 'Geography',           count: 1130, opentdb_id: 22  },
  { id: 3,  n: 'III',  name: 'Film & Television',   count: 649,  opentdb_id: 11  },
  { id: 4,  n: 'IV',   name: 'Science & Nature',    count: 623,  opentdb_id: 17  },
  { id: 5,  n: 'V',    name: 'History',             count: 619,  opentdb_id: 23  },
  { id: 6,  n: 'VI',   name: 'Food & Drink',        count: 459,  opentdb_id: null},
  { id: 7,  n: 'VII',  name: 'Literature',          count: 423,  opentdb_id: 10  },
  { id: 8,  n: 'VIII', name: 'Sport',               count: 387,  opentdb_id: 21  },
  { id: 9,  n: 'IX',   name: 'The Animal Kingdom',  count: 364,  opentdb_id: 27  },
  { id: 10, n: 'X',    name: 'Music',               count: 351,  opentdb_id: 12  },
  { id: 11, n: 'XI',   name: 'Religion & Myth',     count: 290,  opentdb_id: 20  },
  { id: 12, n: 'XII',  name: 'Politics & Society',  count: 175,  opentdb_id: 24  },
  { id: 13, n: 'XIII', name: 'Technology',          count: 125,  opentdb_id: 18  },
  { id: 14, n: 'XIV',  name: 'Art & Culture',       count: 108,  opentdb_id: 25  },
];

export const LOCAL_FALLBACK: Question[] = [
  { question: 'How many sides does a hexagon have?',             answers: ['Five','Six','Seven','Eight'],                    correct_index: 1, source: 'local' },
  { question: 'What is the chemical symbol for gold?',           answers: ['Go','Gd','Au','Ag'],                             correct_index: 2, source: 'local' },
  { question: 'In which year did the Berlin Wall fall?',         answers: ['1987','1988','1989','1990'],                     correct_index: 2, source: 'local' },
  { question: 'Who painted the Mona Lisa?',                      answers: ['Michelangelo','Raphael','Leonardo da Vinci','Botticelli'], correct_index: 2, source: 'local' },
  { question: 'What is the largest planet in our solar system?', answers: ['Saturn','Jupiter','Neptune','Uranus'],           correct_index: 1, source: 'local' },
  { question: 'Which element has atomic number 1?',              answers: ['Helium','Lithium','Hydrogen','Carbon'],          correct_index: 2, source: 'local' },
  { question: 'How many bones are in the adult human body?',     answers: ['196','206','216','226'],                        correct_index: 1, source: 'local' },
  { question: 'What is the national currency of Japan?',         answers: ['Won','Yuan','Yen','Ringgit'],                   correct_index: 2, source: 'local' },
  { question: 'Which river flows through Vienna and Budapest?',  answers: ['The Rhine','The Volga','The Danube','The Dnieper'], correct_index: 2, source: 'local' },
  { question: 'What is the capital city of Australia?',          answers: ['Sydney','Melbourne','Canberra','Brisbane'],     correct_index: 2, source: 'local' },
];
