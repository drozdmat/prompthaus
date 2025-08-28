# Szczegółowy Plan Implementacji Tamagotchi - SvelteKit

## Przegląd Obecnego Stanu

✅ **Zrealizowane:**
- Konfiguracja SvelteKit z TypeScript i Tailwind CSS
- Kompletny UI tamagotchi z retro designem w `/src/routes/+page.svelte`
- Responsive design urządzenia tamagotchi (320x640px)
- Przyciski kontrolne (EAT, SLEEP, PLAY)
- Paski statusu (czerwony, zielony, niebieski)
- Pixel art styling z odpowiednimi efektami

🔄 **Do zaimplementowania:**
- Logika gry i stan tamagotchi
- Funkcjonalność przycisków
- System statusów i pasków zdrowia
- Animacje i interakcje
- Zapis stanu do localStorage

---

## Etap 1: Modele i Typy TypeScript

### 1.1 Definicja interfejsów
**Plik: `/src/lib/types/Pet.ts`**
```typescript
export interface Pet {
  name: string;
  hunger: number;      // 0-100 (0 = bardzo głodny, 100 = najedzony)
  happiness: number;   // 0-100 (0 = smutny, 100 = szczęśliwy)  
  energy: number;      // 0-100 (0 = zmęczony, 100 = pełen energii)
  health: number;      // 0-100 (0 = martwy, 100 = zdrowy)
  age: number;         // w godzinach
  state: PetState;
  lastUpdate: Date;
}

export type PetState = 
  | 'happy'       // 🐣 - domyślny stan
  | 'hungry'      // 😋 - gdy hunger < 30
  | 'sleeping'    // 😴 - gdy energy < 20 lub po kliknięciu SLEEP
  | 'playing'     // 🎮 - podczas zabawy  
  | 'sick'        // 🤒 - gdy health < 30
  | 'dead';       // 💀 - gdy health = 0

export interface GameStats {
  timeAlive: number;
  timesPlayedWith: number;
  timesFed: number;
  timesSlepped: number;
}
```

### 1.2 Konstany gry
**Plik: `/src/lib/config/gameConfig.ts`**
```typescript
export const GAME_CONFIG = {
  UPDATE_INTERVAL: 5000, // 5 sekund
  DECAY_RATES: {
    HUNGER: 2,      // zmniejsza się co update
    HAPPINESS: 1,   
    ENERGY: 1.5,
  },
  ACTION_EFFECTS: {
    FEED: { hunger: +40, happiness: +5 },
    PLAY: { happiness: +30, energy: -10, hunger: -5 },
    SLEEP: { energy: +50, hunger: -3 },
  },
  CRITICAL_LEVELS: {
    HUNGER: 30,
    HAPPINESS: 30, 
    ENERGY: 20,
    HEALTH: 30,
  }
} as const;
```

---

## Etap 2: Logika Gry

### 2.1 Game Engine
**Plik: `/src/lib/logic/gameEngine.ts`**
```typescript
import type { Pet, PetState } from '$lib/types/Pet.js';
import { GAME_CONFIG } from '$lib/config/gameConfig.js';

export class GameEngine {
  static updatePetStats(pet: Pet): Pet {
    const timeDiff = Date.now() - pet.lastUpdate.getTime();
    const updates = Math.floor(timeDiff / GAME_CONFIG.UPDATE_INTERVAL);
    
    if (updates === 0) return pet;
    
    const newPet = { ...pet };
    
    // Naturalny spadek statystyk
    newPet.hunger = Math.max(0, pet.hunger - (GAME_CONFIG.DECAY_RATES.HUNGER * updates));
    newPet.happiness = Math.max(0, pet.happiness - (GAME_CONFIG.DECAY_RATES.HAPPINESS * updates));
    newPet.energy = Math.max(0, pet.energy - (GAME_CONFIG.DECAY_RATES.ENERGY * updates));
    
    // Wpływ na zdrowie
    if (newPet.hunger < 10 || newPet.happiness < 10) {
      newPet.health = Math.max(0, newPet.health - 2);
    }
    
    // Aktualizacja wieku
    newPet.age += updates * (GAME_CONFIG.UPDATE_INTERVAL / (1000 * 60 * 60)); // w godzinach
    
    newPet.lastUpdate = new Date();
    newPet.state = this.calculateState(newPet);
    
    return newPet;
  }

  static feedPet(pet: Pet): Pet {
    const effects = GAME_CONFIG.ACTION_EFFECTS.FEED;
    return {
      ...pet,
      hunger: Math.min(100, pet.hunger + effects.hunger),
      happiness: Math.min(100, pet.happiness + effects.happiness),
      state: this.calculateState({
        ...pet,
        hunger: Math.min(100, pet.hunger + effects.hunger),
        happiness: Math.min(100, pet.happiness + effects.happiness),
      })
    };
  }

  static playWithPet(pet: Pet): Pet {
    if (pet.energy < 10) return pet; // Za mało energii
    
    const effects = GAME_CONFIG.ACTION_EFFECTS.PLAY;
    return {
      ...pet,
      happiness: Math.min(100, pet.happiness + effects.happiness),
      energy: Math.max(0, pet.energy + effects.energy),
      hunger: Math.max(0, pet.hunger + effects.hunger),
      state: 'playing'
    };
  }

  static putPetToSleep(pet: Pet): Pet {
    const effects = GAME_CONFIG.ACTION_EFFECTS.SLEEP;
    return {
      ...pet,
      energy: Math.min(100, pet.energy + effects.energy),
      hunger: Math.max(0, pet.hunger + effects.hunger),
      state: 'sleeping'
    };
  }

  private static calculateState(pet: Pet): PetState {
    if (pet.health <= 0) return 'dead';
    if (pet.health < GAME_CONFIG.CRITICAL_LEVELS.HEALTH) return 'sick';
    if (pet.energy < GAME_CONFIG.CRITICAL_LEVELS.ENERGY) return 'sleeping';
    if (pet.hunger < GAME_CONFIG.CRITICAL_LEVELS.HUNGER) return 'hungry';
    return 'happy';
  }
}
```

### 2.2 Local Storage Service
**Plik: `/src/lib/services/storageService.ts`**
```typescript
import type { Pet } from '$lib/types/Pet.js';

const STORAGE_KEY = 'tamagotchi-save';

export class StorageService {
  static savePet(pet: Pet): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pet));
  }

  static loadPet(): Pet | null {
    if (typeof localStorage === 'undefined') return null;
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    try {
      const pet = JSON.parse(saved);
      // Konwersja daty z stringa
      pet.lastUpdate = new Date(pet.lastUpdate);
      return pet;
    } catch {
      return null;
    }
  }

  static createNewPet(): Pet {
    return {
      name: 'Tamago',
      hunger: 80,
      happiness: 80,
      energy: 80,
      health: 100,
      age: 0,
      state: 'happy',
      lastUpdate: new Date()
    };
  }
}
```

---

## Etap 3: Komponenty Svelte

### 3.1 Komponent Screen
**Plik: `/src/lib/components/Screen.svelte`**
```svelte
<script lang="ts">
  import type { Pet } from '$lib/types/Pet.js';

  export let pet: Pet;

  const getCharacterEmoji = (state: Pet['state']): string => {
    const characters = {
      happy: '🐣',
      hungry: '😋', 
      sleeping: '😴',
      playing: '🎮',
      sick: '🤒',
      dead: '💀'
    };
    return characters[state];
  };

  const getStatusColor = (value: number): string => {
    if (value > 70) return '#44ff44';
    if (value > 30) return '#ffff44'; 
    return '#ff4444';
  };
</script>

<div class="screen-bezel">
  <div class="screen">
    <div class="screen-content">
      <!-- Status Info -->
      <div class="status-info">
        <div class="pet-name">{pet.name}</div>
        <div class="pet-age">Age: {Math.floor(pet.age)}h</div>
      </div>
      
      <!-- Character Display -->
      <div class="character-area">
        <div class="pixel-character" class:animate={pet.state === 'playing'}>
          {getCharacterEmoji(pet.state)}
        </div>
      </div>
      
      <!-- Status Messages -->
      {#if pet.state === 'hungry'}
        <div class="status-message">I'm hungry! 🍎</div>
      {:else if pet.state === 'sleeping'}
        <div class="status-message">Zzz... 💤</div>
      {:else if pet.state === 'sick'}
        <div class="status-message">I don't feel well... 🏥</div>
      {:else if pet.state === 'dead'}
        <div class="status-message">💔 Game Over 💔</div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Wykorzystać istniejące style z +page.svelte i dodać: */
  .status-info {
    position: absolute;
    top: 10px;
    left: 10px;
    color: #2E7D32;
    font-size: 12px;
    font-weight: bold;
  }

  .status-message {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    color: #2E7D32;
    font-size: 10px;
    text-align: center;
    font-weight: bold;
  }

  .animate {
    animation: bounce 0.5s infinite alternate;
  }

  @keyframes bounce {
    0% { transform: translateY(0px); }
    100% { transform: translateY(-10px); }
  }
</style>
```

### 3.2 Komponent StatusBars
**Plik: `/src/lib/components/StatusBars.svelte`**
```svelte
<script lang="ts">
  import type { Pet } from '$lib/types/Pet.js';

  export let pet: Pet;

  const getBarColor = (value: number): string => {
    if (value > 70) return '#44ff44';
    if (value > 30) return '#ffaa44';
    return '#ff4444';
  };
</script>

<div class="status-bars">
  <!-- Hunger Bar -->
  <div class="status-bar" 
       style="background: linear-gradient(90deg, {getBarColor(pet.hunger)} {pet.hunger}%, #ccc {pet.hunger}%)"
       title="Hunger: {pet.hunger}%">
  </div>
  
  <!-- Happiness Bar -->  
  <div class="status-bar"
       style="background: linear-gradient(90deg, {getBarColor(pet.happiness)} {pet.happiness}%, #ccc {pet.happiness}%)"
       title="Happiness: {pet.happiness}%">
  </div>
  
  <!-- Energy Bar -->
  <div class="status-bar"
       style="background: linear-gradient(90deg, {getBarColor(pet.energy)} {pet.energy}%, #ccc {pet.energy}%)"
       title="Energy: {pet.energy}%">
  </div>
</div>

<style>
  .status-bars {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 40px;
  }

  .status-bar {
    height: 12px;
    border-radius: 6px;
    border: 1px solid #999;
    transition: background 0.3s ease;
  }
</style>
```

---

## Etap 4: Główna Logika Aplikacji

### 4.1 Aktualizacja +page.svelte
**Modyfikacje w `/src/routes/+page.svelte`:**

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { GameEngine } from '$lib/logic/gameEngine.js';
  import { StorageService } from '$lib/services/storageService.js';
  import Screen from '$lib/components/Screen.svelte';
  import StatusBars from '$lib/components/StatusBars.svelte';
  import type { Pet } from '$lib/types/Pet.js';

  let pet: Pet;
  let gameInterval: number;

  onMount(() => {
    // Wczytaj lub utwórz nowego pet
    const savedPet = StorageService.loadPet();
    pet = savedPet ? GameEngine.updatePetStats(savedPet) : StorageService.createNewPet();
    
    // Uruchom główną pętlę gry
    gameInterval = setInterval(() => {
      pet = GameEngine.updatePetStats(pet);
      StorageService.savePet(pet);
    }, 5000);
  });

  onDestroy(() => {
    if (gameInterval) {
      clearInterval(gameInterval);
    }
  });

  // Action handlers
  const handleFeed = () => {
    if (pet.state !== 'dead') {
      pet = GameEngine.feedPet(pet);
      StorageService.savePet(pet);
    }
  };

  const handlePlay = () => {
    if (pet.state !== 'dead' && pet.energy >= 10) {
      pet = GameEngine.playWithPet(pet);
      StorageService.savePet(pet);
      
      // Reset po 2 sekundach
      setTimeout(() => {
        if (pet.state === 'playing') {
          pet = { ...pet, state: GameEngine.calculateState(pet) };
        }
      }, 2000);
    }
  };

  const handleSleep = () => {
    if (pet.state !== 'dead') {
      pet = GameEngine.putPetToSleep(pet);
      StorageService.savePet(pet);
      
      // Obudź po 5 sekundach
      setTimeout(() => {
        if (pet.state === 'sleeping') {
          pet = { ...pet, state: GameEngine.calculateState(pet) };
        }
      }, 5000);
    }
  };

  const resetGame = () => {
    pet = StorageService.createNewPet();
    StorageService.savePet(pet);
  };
</script>

{#if pet}
<div class="tamagotchi-container">
  <div class="tamagotchi-device">
    <div class="device-shell">
      <!-- Top Section -->
      <div class="top-section">
        <div class="speaker-top"></div>
      </div>
      
      <!-- Main Screen Area -->
      <div class="screen-section">
        <Screen {pet} />
      </div>
      
      <!-- Control Section -->
      <div class="control-section">
        <!-- Status Bars -->
        <StatusBars {pet} />
        
        <!-- Control Buttons -->
        <div class="button-group">
          <button class="control-button" 
                  on:click={handleFeed}
                  disabled={pet.state === 'dead'}>
            <span class="button-label">EAT</span>
            <span class="button-number">3</span>
          </button>
          <button class="control-button" 
                  on:click={handleSleep}
                  disabled={pet.state === 'dead'}>
            <span class="button-label">SLEEP</span>
            <span class="button-number">1</span>
          </button>
          <button class="control-button" 
                  on:click={handlePlay}
                  disabled={pet.state === 'dead' || pet.energy < 10}>
            <span class="button-label">PLAY</span>
            <span class="button-number">2</span>
          </button>
        </div>
        
        <!-- Speaker Grille -->
        <div class="speaker-grille">
          <div class="speaker-holes"></div>
        </div>
      </div>
      
      <!-- Reset Button (jeśli pet umarł) -->
      {#if pet.state === 'dead'}
        <div class="reset-section">
          <button class="reset-button" on:click={resetGame}>
            New Pet
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
{/if}

<style>
  /* Zachować wszystkie istniejące style i dodać: */
  
  .control-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .reset-section {
    text-align: center;
    margin-top: 10px;
  }
  
  .reset-button {
    background: #ff6b6b;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 20px;
    cursor: pointer;
    font-weight: bold;
  }
</style>
```

---

## Etap 5: Dodatkowe Funkcjonalności

### 5.1 Efekty dźwiękowe (opcjonalnie)
**Plik: `/src/lib/services/audioService.ts`**
```typescript
export class AudioService {
  private static context: AudioContext | null = null;
  
  private static getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.context;
  }

  static playBeep(frequency: number = 800, duration: number = 200): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'square';
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  }

  static playFeedSound(): void { this.playBeep(600, 150); }
  static playPlaySound(): void { this.playBeep(800, 100); }
  static playSleepSound(): void { this.playBeep(400, 300); }
  static playDeathSound(): void { this.playBeep(200, 1000); }
}
```

### 5.2 Statystyki i osiągnięcia  
**Plik: `/src/lib/components/Stats.svelte`** (modal z statystykami)

---

## Harmonogram Implementacji

### Dzień 1 (2-3 godziny)
1. ✅ Stworzenie struktury typów (`Pet.ts`, `gameConfig.ts`)
2. ✅ Implementacja `GameEngine` z podstawową logiką
3. ✅ Stworzenie `StorageService` 

### Dzień 2 (2-3 godziny)  
4. ✅ Komponenty `Screen.svelte` i `StatusBars.svelte`
5. ✅ Integracja logiki z główną stroną (`+page.svelte`)
6. ✅ Testowanie podstawowej funkcjonalności

### Dzień 3 (1-2 godziny)
7. ✅ Dodanie efektów dźwiękowych
8. ✅ Dopracowanie animacji i przejść
9. ✅ Finalne testowanie i debugging

---

## Testowanie

### Scenariusze testowe:
1. **Nowy pet** - sprawdź czy rozpoczyna z dobrymi statystykami
2. **Karmienie** - hunger powinien wzrosnąć o 40
3. **Zabawa** - happiness +30, energy -10, przejściowy stan 'playing'  
4. **Sen** - energy +50, przejściowy stan 'sleeping'
5. **Automatyczne spadki** - co 5s statystyki spadają
6. **Zapis/wczytanie** - odśwież stronę i sprawdź czy stan się zachował
7. **Śmierć** - doprowadź health do 0 i sprawdź blokadę przycisków

### Komendy deweloperskie:
```bash
npm run dev          # Uruchomienie serwera dev
npm run build        # Build produkcyjny  
npm run preview      # Podgląd builda
npm run check        # TypeScript check
```

---

## Możliwe Rozszerzenia

### Faza 2 (po podstawowej wersji):
- **Różne rasy zwierząt** z różnymi charakterystykami
- **System ewolucji** - zmiana wyglądu z wiekiem
- **Mini-gry** zamiast prostych przycisków
- **Sklep** z jedzeniem i zabawkami  
- **Multiplayer** - odwiedzanie zwierząt znajomych
- **Push notifications** przy krytycznych stanach
- **Tryb ciemny/jasny**
- **Responsive design** na telefony

### Optymalizacje:  
- Service Worker dla offline gameplay
- IndexedDB zamiast localStorage 
- Web Audio API dla lepszych dźwięków
- Canvas 2D dla płynnych animacji

---

## Podsumowanie

Obecny projekt ma już solidną bazę wizualną. Plan koncentruje się na dodaniu logiki gry przy zachowaniu istniejącego designu. Implementacja powinna zająć 2-3 dni pracy i rezultować w pełni funkcjonalną grą tamagotchi z automatycznym zapisem stanu.
