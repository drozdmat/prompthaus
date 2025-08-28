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
