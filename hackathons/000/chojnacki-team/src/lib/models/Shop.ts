export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'food' | 'toy' | 'costume' | 'decoration';
  effect: {
    hunger?: number;
    happiness?: number;
    health?: number;
    vibeLevel?: number;
    duration?: number; // w sekundach
  };
  icon: string;
  unlocked: boolean;
}

export interface GameCurrency {
  coins: number;
  totalEarned: number;
  totalSpent: number;
}

export const SHOP_ITEMS: Array<Omit<ShopItem, 'unlocked'> & { unlocked: boolean }> = [
  // Jedzenie
  {
    id: 'basic_food',
    name: 'Podstawowe Jedzenie',
    description: 'Zwykłe jedzenie dla zwierzaka',
    price: 0,
    type: 'food',
    effect: { hunger: -40, happiness: 5, health: 3 },
    icon: '🍎',
    unlocked: true
  },
  {
    id: 'premium_food',
    name: 'Premium Jedzenie',
    description: 'Wysokiej jakości jedzenie',
    price: 50,
    type: 'food',
    effect: { hunger: -60, happiness: 15, health: 8, vibeLevel: 10 },
    icon: '🍖',
    unlocked: true
  },
  {
    id: 'super_food',
    name: 'Super Jedzenie',
    description: 'Najlepsze jedzenie z magicznymi właściwościami',
    price: 150,
    type: 'food',
    effect: { hunger: -80, happiness: 25, health: 15, vibeLevel: 20, duration: 300 },
    icon: '🌟',
    unlocked: true
  },
  
  // Zabawki
  {
    id: 'basic_toy',
    name: 'Podstawowa Zabawka',
    description: 'Prosta zabawka',
    price: 0,
    type: 'toy',
    effect: { happiness: 15, hunger: 10, health: 2 },
    icon: '🎾',
    unlocked: true
  },
  {
    id: 'premium_toy',
    name: 'Premium Zabawka',
    description: 'Zaawansowana zabawka',
    price: 75,
    type: 'toy',
    effect: { happiness: 30, hunger: 15, health: 5, vibeLevel: 15 },
    icon: '🎮',
    unlocked: true
  },
  {
    id: 'magic_toy',
    name: 'Magiczna Zabawka',
    description: 'Zabawka z magicznymi właściwościami',
    price: 200,
    type: 'toy',
    effect: { happiness: 50, hunger: 20, health: 10, vibeLevel: 30, duration: 600 },
    icon: '✨',
    unlocked: true
  },
  
  // Kostiumy
  {
    id: 'hat_cowboy',
    name: 'Kapelusz Kowbojski',
    description: 'Stylowy kapelusz kowbojski',
    price: 100,
    type: 'costume',
    effect: { vibeLevel: 10 },
    icon: '🤠',
    unlocked: true
  },
  {
    id: 'glasses_sun',
    name: 'Okulary Słoneczne',
    description: 'Cool okulary słoneczne',
    price: 80,
    type: 'costume',
    effect: { vibeLevel: 8 },
    icon: '🕶️',
    unlocked: true
  },
  {
    id: 'crown',
    name: 'Korona',
    description: 'Królewska korona',
    price: 500,
    type: 'costume',
    effect: { vibeLevel: 25, happiness: 10 },
    icon: '👑',
    unlocked: false
  }
];

export const getShopItems = (): ShopItem[] => {
  return SHOP_ITEMS.map(item => ({
    ...item,
    unlocked: item.unlocked
  }));
};
