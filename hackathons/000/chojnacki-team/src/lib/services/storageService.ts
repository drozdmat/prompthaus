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
