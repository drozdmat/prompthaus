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
