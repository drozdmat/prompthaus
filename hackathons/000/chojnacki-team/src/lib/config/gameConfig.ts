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
