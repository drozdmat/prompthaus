export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  requirement: number;
  current: number;
}

export const ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'current'>[] = [
  {
    id: 'first-pet',
    name: 'Pierwszy Zwierzak',
    description: 'Urodź swojego pierwszego zwierzaka',
    icon: '🥚',
    requirement: 1
  },
  {
    id: 'caregiver',
    name: 'Opiekun',
    description: 'Nakarm zwierzaka 10 razy',
    icon: '🍎',
    requirement: 10
  },
  {
    id: 'playmate',
    name: 'Towarzysz Zabaw',
    description: 'Pobaw się ze zwierzakiem 15 razy',
    icon: '🎮',
    requirement: 15
  },
  {
    id: 'survivor',
    name: 'Ocalony',
    description: 'Utrzymaj zwierzaka przy życiu przez 7 dni',
    icon: '🏆',
    requirement: 7
  },
  {
    id: 'evolution-master',
    name: 'Mistrz Ewolucji',
    description: 'Doprowadź zwierzaka do dorosłości',
    icon: '⭐',
    requirement: 1
  },
  {
    id: 'interaction-king',
    name: 'Król Interakcji',
    description: 'Wykonaj 100 interakcji',
    icon: '👑',
    requirement: 100
  },
  {
    id: 'perfect-care',
    name: 'Doskonała Opieka',
    description: 'Utrzymaj wszystkie statystyki powyżej 90% przez 24h',
    icon: '💎',
    requirement: 1
  }
];

export const checkAchievements = (
  stats: {
    totalInteractions: number;
    petsRaised: number;
    maxAge: number;
    currentStage: string;
    perfectCareHours: number;
  },
  currentAchievements: Achievement[]
): Achievement[] => {
  const updatedAchievements = [...currentAchievements];
  
  // Sprawdź każde osiągnięcie
  ACHIEVEMENTS.forEach((achievement) => {
    const existing = updatedAchievements.find(a => a.id === achievement.id);
    let current = 0;
    
    switch (achievement.id) {
      case 'first-pet':
        current = stats.petsRaised;
        break;
      case 'caregiver':
        current = Math.floor(stats.totalInteractions * 0.4); // 40% to karmienie
        break;
      case 'playmate':
        current = Math.floor(stats.totalInteractions * 0.3); // 30% to zabawa
        break;
      case 'survivor':
        current = stats.maxAge;
        break;
      case 'evolution-master':
        current = stats.currentStage === 'adult' ? 1 : 0;
        break;
      case 'interaction-king':
        current = stats.totalInteractions;
        break;
      case 'perfect-care':
        current = stats.perfectCareHours >= 24 ? 1 : 0;
        break;
    }
    
    if (!existing) {
      // Nowe osiągnięcie
      updatedAchievements.push({
        ...achievement,
        unlocked: current >= achievement.requirement,
        unlockedAt: current >= achievement.requirement ? Date.now() : undefined,
        current
      });
    } else if (!existing.unlocked && current >= achievement.requirement) {
      // Odblokuj osiągnięcie
      existing.unlocked = true;
      existing.unlockedAt = Date.now();
      existing.current = current;
    } else {
      // Aktualizuj postęp
      existing.current = current;
    }
  });
  
  return updatedAchievements;
};
