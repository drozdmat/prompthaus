import type { Pet } from '$lib/models/Pet';
import { browser } from '$app/environment';

const STORAGE_KEY = 'tamagotchi-pet-state';
const STATS_KEY = 'tamagotchi-stats';

export interface GameStats {
  totalPlayTime: number;
  totalInteractions: number;
  petsRaised: number;
  achievements: string[];
  lastSaved: number;
}

// Zapisz stan zwierzaka
export const savePetState = (pet: Pet): void => {
  if (!browser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pet));
  } catch (error) {
    console.error('Błąd zapisywania stanu zwierzaka:', error);
  }
};

// Wczytaj stan zwierzaka
export const loadPetState = (): Pet | null => {
  if (!browser) return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Błąd wczytywania stanu zwierzaka:', error);
  }
  return null;
};

// Zapisz statystyki gry
export const saveGameStats = (stats: GameStats): void => {
  if (!browser) return;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Błąd zapisywania statystyk:', error);
  }
};

// Wczytaj statystyki gry
export const loadGameStats = (): GameStats => {
  if (!browser) {
    // Zwróć domyślne statystyki dla SSR
    return {
      totalPlayTime: 0,
      totalInteractions: 0,
      petsRaised: 0,
      achievements: [],
      lastSaved: Date.now()
    };
  }
  
  try {
    const saved = localStorage.getItem(STATS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Błąd wczytywania statystyk:', error);
  }
  
  // Domyślne statystyki
  return {
    totalPlayTime: 0,
    totalInteractions: 0,
    petsRaised: 0,
    achievements: [],
    lastSaved: Date.now()
  };
};

// Wyczyść wszystkie dane
export const clearAllData = (): void => {
  if (!browser) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STATS_KEY);
};
