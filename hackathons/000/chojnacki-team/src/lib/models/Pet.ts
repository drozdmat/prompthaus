export interface Pet {
  hunger: number;
  happiness: number;
  health: number;
  state: 'happy' | 'hungry' | 'sleeping' | 'dead' | 'sick';
  // System ewolucji
  age: number; // wiek w dniach
  stage: 'egg' | 'baby' | 'teen' | 'adult' | 'elder';
  experience: number; // punkty doświadczenia
  level: number; // poziom zwierzaka
  // Dodatkowe statystyki
  totalInteractions: number;
  lastInteraction: number;
  createdAt: number;
  // Nowa właściwość Vibe Check
  vibeLevel: number; // poziom wibracji (0-100)
  // System waluty i personalizacji
  coins: number; // waluta gry
  equippedCostume?: string; // ID założonego kostiumu
  activeEffects: Array<{
    itemId: string;
    expiresAt: number;
    effect: any;
  }>;
}

// Typy akcji dla zwierzaka
export type PetAction = 'feed' | 'play' | 'sleep';

// Stan gry
export interface GameState {
  pet: Pet;
  isGameOver: boolean;
  score: number;
}
