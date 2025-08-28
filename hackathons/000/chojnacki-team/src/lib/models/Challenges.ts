export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  requirement: {
    type: 'interactions' | 'feeding' | 'playing' | 'sleeping' | 'vibe_checks' | 'perfect_care';
    target: number;
    timeframe?: number; // w sekundach
  };
  reward: {
    coins: number;
    experience: number;
    item?: string; // ID przedmiotu ze sklepu
  };
  progress: number;
  completed: boolean;
  completedAt?: number;
  expiresAt: number;
}

export const DAILY_CHALLENGES: Omit<Challenge, 'progress' | 'completed' | 'expiresAt'>[] = [
  {
    id: 'feed_5_times',
    name: 'Karmienie Master',
    description: 'Nakarm zwierzaka 5 razy dzisiaj',
    type: 'daily',
    requirement: { type: 'feeding', target: 5 },
    reward: { coins: 25, experience: 50 }
  },
  {
    id: 'play_3_times',
    name: 'Zabawa z Przyjacielem',
    description: 'Pobaw się ze zwierzakiem 3 razy dzisiaj',
    type: 'daily',
    requirement: { type: 'playing', target: 3 },
    reward: { coins: 20, experience: 40 }
  },
  {
    id: 'vibe_check_2_times',
    name: 'Vibe Master',
    description: 'Sprawdź wibracje zwierzaka 2 razy dzisiaj',
    type: 'daily',
    requirement: { type: 'vibe_checks', target: 2 },
    reward: { coins: 30, experience: 60 }
  },
  {
    id: 'perfect_care_1_hour',
    name: 'Perfekcyjna Opieka',
    description: 'Utrzymuj wszystkie statystyki powyżej 80% przez 1 godzinę',
    type: 'daily',
    requirement: { type: 'perfect_care', target: 3600 }, // 1 godzina
    reward: { coins: 100, experience: 200 }
  }
];

export const WEEKLY_CHALLENGES: Omit<Challenge, 'progress' | 'completed' | 'expiresAt'>[] = [
  {
    id: 'feed_25_times',
    name: 'Karmienie Expert',
    description: 'Nakarm zwierzaka 25 razy w tym tygodniu',
    type: 'weekly',
    requirement: { type: 'feeding', target: 25 },
    reward: { coins: 150, experience: 300, item: 'premium_food' }
  },
  {
    id: 'play_15_times',
    name: 'Zabawa Expert',
    description: 'Pobaw się ze zwierzakiem 15 razy w tym tygodniu',
    type: 'weekly',
    requirement: { type: 'playing', target: 15 },
    reward: { coins: 120, experience: 250, item: 'premium_toy' }
  },
  {
    id: 'perfect_care_5_hours',
    name: 'Mistrz Opieki',
    description: 'Utrzymuj wszystkie statystyki powyżej 80% przez 5 godzin',
    type: 'weekly',
    requirement: { type: 'perfect_care', target: 18000 }, // 5 godzin
    reward: { coins: 500, experience: 1000, item: 'crown' }
  }
];

export const getDailyChallenges = (): Challenge[] => {
  const now = Date.now();
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  
  return DAILY_CHALLENGES.map(challenge => ({
    ...challenge,
    progress: 0,
    completed: false,
    expiresAt: tomorrow.getTime()
  }));
};

export const getWeeklyChallenges = (): Challenge[] => {
  const now = Date.now();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(0, 0, 0, 0);
  
  return WEEKLY_CHALLENGES.map(challenge => ({
    ...challenge,
    progress: 0,
    completed: false,
    expiresAt: nextWeek.getTime()
  }));
};
