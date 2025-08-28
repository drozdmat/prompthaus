import type { Pet } from '$lib/models/Pet';

// Funkcja karmienia zwierzaka
export const feedPet = (pet: Pet): Pet => {
  if (pet.state === 'dead') return pet;
  
  // Vibe Level wpływa na efektywność jedzenia
  const vibeBonus = pet.vibeLevel > 70 ? 1.2 : pet.vibeLevel < 30 ? 0.8 : 1.0;
  
  // Jedzenie ZWIĘKSZA głód (odwrócona logika) o 40-50 (losowo) + wpływ vibe
  const baseHungerIncrease = 40 + Math.floor(Math.random() * 11);
  const hungerIncrease = Math.floor(baseHungerIncrease * vibeBonus);
  const newHunger = Math.min(100, pet.hunger + hungerIncrease);
  
  // Jedzenie poprawia szczęście i zdrowie + wpływ vibe
  const newHappiness = Math.min(100, pet.happiness + Math.floor(8 * vibeBonus));
  const newHealth = Math.min(100, pet.health + Math.floor(5 * vibeBonus));
  
  // Określ nowy stan na podstawie wszystkich parametrów
  let newState: Pet['state'] = 'happy';
  
  if (newHealth <= 0) {
    newState = 'dead';
  } else if (newHunger <= 0) {
    // Śmierć z głodu (odwrócona logika)
    newState = 'dead';
  } else if (newHappiness <= 0) {
    // Śmierć z nieszczęścia
    newState = 'dead';
  } else if (newHealth < 30) {
    newState = 'sick';
  } else if (newHunger < 20) {
    newState = 'hungry';
  } else if (newHappiness > 70 && newHunger > 50) {
    newState = 'happy';
  } else {
    newState = 'happy';
  }
  
  return {
    ...pet,
    hunger: newHunger,
    happiness: newHappiness,
    health: newHealth,
    vibeLevel: Math.min(100, pet.vibeLevel + 5),
    state: newState,
    totalInteractions: pet.totalInteractions + 1,
    lastInteraction: Date.now(),
    experience: pet.experience + 5,
    coins: pet.coins + 5 // Zarabiaj monety za karmienie
  };
};

// Funkcja zabawy ze zwierzakiem
export const playWithPet = (pet: Pet): Pet => {
  if (pet.state === 'dead' || pet.state === 'sleeping') return pet;
  
  // Vibe Level wpływa na efektywność zabawy
  const vibeBonus = pet.vibeLevel > 70 ? 1.3 : pet.vibeLevel < 30 ? 0.7 : 1.0;
  
  const newHappiness = Math.min(100, pet.happiness + Math.floor(20 * vibeBonus));
  const newHunger = Math.max(0, pet.hunger - 15); // Zabawa zmniejsza głód (odwrócona logika)
  const newHealth = Math.min(100, pet.health + Math.floor(1 * vibeBonus));
  
  // Określ nowy stan
  let newState: Pet['state'] = 'happy';
  if (newHealth <= 0) {
    newState = 'dead';
  } else if (newHunger <= 0) {
    newState = 'dead';
  } else if (newHappiness <= 0) {
    newState = 'dead';
  } else if (newHunger < 20) {
    newState = 'hungry';
  } else if (newHealth < 30) {
    newState = 'sick';
  }
  
  return {
    ...pet,
    happiness: newHappiness,
    hunger: newHunger,
    health: newHealth,
    vibeLevel: Math.min(100, pet.vibeLevel + 10),
    state: newState,
    totalInteractions: pet.totalInteractions + 1,
    lastInteraction: Date.now(),
    experience: pet.experience + 8,
    coins: pet.coins + 3 // Zarabiaj monety za zabawę
  };
};

// Funkcja usypiania zwierzaka
export const putToSleep = (pet: Pet): Pet => {
  if (pet.state === 'dead') return pet;
  
  const newHealth = Math.min(100, pet.health + 20);
  const newHappiness = Math.max(0, pet.happiness - 3);
  
  return {
    ...pet,
    health: newHealth,
    happiness: newHappiness,
    vibeLevel: Math.max(0, pet.vibeLevel - 2),
    state: 'sleeping',
    totalInteractions: pet.totalInteractions + 1,
    lastInteraction: Date.now(),
    experience: pet.experience + 5,
    coins: pet.coins + 2 // Zarabiaj monety za sen
  };
};

// Funkcja aktualizacji stanu zwierzaka (wywoływana cyklicznie)
export const updatePetState = (pet: Pet): Pet => {
  if (pet.state === 'dead') return pet;
  
  // Vibe Level wpływa na wszystkie statystyki
  const vibeMultiplier = pet.vibeLevel / 100; // 0.0 - 1.0
  
  // ZMNIEJSZ głód w czasie (odwrócona logika) + wpływ vibe - ZWOLNIONE!
  let hungerDecrease = 2; // Podstawowy spadek głodu (zmniejszony z 8 na 2)
  if (pet.vibeLevel < 30) {
    hungerDecrease += 2; // Niski vibe = szybszy spadek głodu
  } else if (pet.vibeLevel < 50) {
    hungerDecrease += 1; // Średni vibe = szybszy spadek głodu
  } else if (pet.vibeLevel > 80) {
    hungerDecrease -= 1; // Wysoki vibe = wolniejszy spadek głodu
  }
  const newHunger = Math.max(0, pet.hunger - hungerDecrease);
  
  // Zmniejsz szczęście naturalnie w czasie + wpływ vibe - ZWOLNIONE!
  let happinessDecrease = 1; // Podstawowy spadek szczęścia (zmniejszony z 5 na 1)
  if (pet.vibeLevel < 20) {
    happinessDecrease += 2; // Bardzo niski vibe = szybszy spadek szczęścia
  } else if (pet.vibeLevel < 50) {
    happinessDecrease += 1; // Niski vibe = szybszy spadek szczęścia
  } else if (pet.vibeLevel > 80) {
    happinessDecrease -= 0; // Wysoki vibe = brak spadku szczęścia
  }
  let newHappiness = Math.max(0, pet.happiness - happinessDecrease);
  
  // Dodatkowe kary za zaniedbanie
  if (newHunger < 30) {
    newHappiness = Math.max(0, newHappiness - 3);
  } else if (pet.health < 30) {
    newHappiness = Math.max(0, newHappiness - 2);
  }
  
  // Zmniejsz zdrowie - zawsze trochę spada + wpływ vibe - ZWOLNIONE!
  let healthDecrease = 0; // Podstawowy spadek zdrowia (zmniejszony z 2 na 0)
  
  // Wpływ vibe na zdrowie
  if (pet.vibeLevel < 20) {
    healthDecrease += 1; // Bardzo niski vibe = spadek zdrowia
  } else if (pet.vibeLevel < 50) {
    healthDecrease += 0; // Niski vibe = brak spadku zdrowia
  } else if (pet.vibeLevel > 80) {
    healthDecrease = 0; // Wysoki vibe = zdrowie nie spada
  }
  
  // Dodatkowe kary za zaniedbanie
  if (newHunger < 10 || newHappiness < 10) {
    healthDecrease += 8;
  } else if (newHunger < 30 || newHappiness < 30) {
    healthDecrease += 4;
  } else if (newHunger < 50 || newHappiness < 50) {
    healthDecrease += 2;
  }
  
  let newHealth = Math.max(0, pet.health - healthDecrease);
  
  // Określ nowy stan
  let newState: Pet['state'] = pet.state;
  
  // ŚMIERĆ - główna logika śmierci
  if (newHealth <= 0) {
    newState = 'dead';
  } else if (newHunger <= 0) {
    // Śmierć z głodu - bezpośrednio! (odwrócona logika)
    newState = 'dead';
    newHealth = 0;
  } else if (newHappiness <= 0) {
    // Śmierć z nieszczęścia - bezpośrednio!
    newState = 'dead';
    newHealth = 0;
  } else if (pet.state === 'sleeping') {
    // Obudź się po śnie z lepszym zdrowiem
    newState = 'happy';
    newHealth = Math.min(100, newHealth + 15);
  } else if (newHealth < 30) {
    newState = 'sick';
  } else if (newHunger < 20) {
    newState = 'hungry';
  } else if (newHappiness > 60 && newHunger > 50) {
    newState = 'happy';
  }
  
  // Oblicz nowy wiek (w dniach)
  const now = Date.now();
  const ageInDays = Math.floor((now - pet.createdAt) / (1000 * 60 * 60 * 24));
  
  // Oblicz nowy poziom na podstawie doświadczenia
  const newLevel = Math.floor(pet.experience / 100) + 1;
  
  // Określ etap ewolucji
  let newStage = pet.stage;
  if (ageInDays >= 7 && pet.stage === 'baby') {
    newStage = 'teen';
  } else if (ageInDays >= 14 && pet.stage === 'teen') {
    newStage = 'adult';
  } else if (ageInDays >= 30 && pet.stage === 'adult') {
    newStage = 'elder';
  }
  
  // Vibe Level zmienia się w czasie (szybciej) - ZWOLNIONE!
  let vibeDecrease = 1; // Podstawowy spadek vibe (zmniejszony z 3 na 1)
  
  // Wpływ innych statystyk na vibe
  if (newHunger < 20) {
    vibeDecrease += 2; // Niski głód obniża vibe
  }
  if (newHappiness < 30) {
    vibeDecrease += 2; // Niskie szczęście obniża vibe
  }
  if (newHealth < 30) {
    vibeDecrease += 1; // Niskie zdrowie obniża vibe
  }
  
  const newVibeLevel = Math.max(0, Math.min(100, pet.vibeLevel - vibeDecrease));
  
  return {
    ...pet,
    hunger: newHunger,
    happiness: newHappiness,
    health: newHealth,
    state: newState,
    age: ageInDays,
    level: newLevel,
    stage: newStage,
    vibeLevel: newVibeLevel
  };
};

// Funkcja sprawdzania czy gra się skończyła
export const isGameOver = (pet: Pet): boolean => {
  return pet.state === 'dead';
};

// Funkcja Vibe Check - sprawdza wibracje zwierzaka
export const performVibeCheck = (pet: Pet, selectedEmoji: string): Pet => {
  if (pet.state === 'dead') return pet;
  
  let vibeChange = 0;
  
  // Określ zmianę wibracji na podstawie wybranego emoji
  switch (selectedEmoji) {
    case '😊': // szczęśliwy
      vibeChange = 15;
      break;
    case '😍': // zakochany
      vibeChange = 20;
      break;
    case '🤗': // przytulanie
      vibeChange = 18;
      break;
    case '🎉': // świętowanie
      vibeChange = 25;
      break;
    case '😌': // spokojny
      vibeChange = 10;
      break;
    case '🤔': // myślący
      vibeChange = 5;
      break;
    case '😐': // neutralny
      vibeChange = 0;
      break;
    case '😔': // smutny
      vibeChange = -10;
      break;
    case '😤': // dumny
      vibeChange = 12;
      break;
    case '🥰': // kochający
      vibeChange = 22;
      break;
    default:
      vibeChange = 0;
  }
  
  const newVibeLevel = Math.max(0, Math.min(100, pet.vibeLevel + vibeChange));
  
  // Vibe Level wpływa na szczęście
  const happinessChange = vibeChange > 0 ? Math.floor(vibeChange / 2) : vibeChange;
  const newHappiness = Math.max(0, Math.min(100, pet.happiness + happinessChange));
  
  return {
    ...pet,
    vibeLevel: newVibeLevel,
    happiness: newHappiness,
    totalInteractions: pet.totalInteractions + 1,
    lastInteraction: Date.now(),
    experience: pet.experience + 8
  };
};

// Funkcja resetowania gry
export const resetGame = (): Pet => {
  return {
    hunger: 100, // Zwierzak zaczyna najedzony (odwrócona logika)
    happiness: 100,
    health: 100,
    state: 'happy',
    age: 0,
    stage: 'baby',
    experience: 0,
    level: 1,
    totalInteractions: 0,
    lastInteraction: Date.now(),
    createdAt: Date.now(),
    vibeLevel: 50, // domyślny poziom wibracji
    coins: 100, // startowa waluta
    activeEffects: []
  };
};