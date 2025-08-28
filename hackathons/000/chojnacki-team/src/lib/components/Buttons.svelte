<script lang="ts">
  export let onPlay: () => void;
  export let onEat: () => void;
  export let onSleep: () => void;
  export let onReset: () => void;
  export let onVibeCheck: () => void;
  export let isGameOver: boolean = false;
</script>

<div class="buttons-container">
  <div class="button-row">
    <button 
      class="tamagotchi-button play-button" 
      on:click={onPlay}
      disabled={isGameOver}
    >
      🎮 GRAJ
    </button>
    
    <button 
      class="tamagotchi-button eat-button" 
      on:click={onEat}
      disabled={isGameOver}
    >
      🍎 JEDZ
    </button>
  </div>
  
  <div class="button-row">
    <button 
      class="tamagotchi-button sleep-button" 
      on:click={onSleep}
      disabled={isGameOver}
    >
      😴 ŚPIJ
    </button>
    
    <button 
      class="tamagotchi-button vibe-button" 
      on:click={onVibeCheck}
      disabled={isGameOver}
    >
      🎭 VIBE
    </button>
  </div>
  
  <div class="button-row">
    {#if isGameOver}
      <button 
        class="tamagotchi-button reset-button" 
        on:click={onReset}
      >
        🔄 RESTART
      </button>
    {:else}
      <div class="button-placeholder"></div>
    {/if}
    
    <div class="button-placeholder"></div>
  </div>
</div>

<style>
  .buttons-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 20px;
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
    border: 3px solid #6b7280;
    border-radius: 12px;
    width: 420px;
  }
  
  .button-row {
    display: flex;
    gap: 15px;
  }
  
  .tamagotchi-button {
    flex: 1;
    height: 60px;
    border: 3px solid #9ca3af;
    border-radius: 8px;
    background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
    color: white;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    box-shadow: 
      0 4px 8px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    position: relative;
    overflow: hidden;
  }
  
  .tamagotchi-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  .tamagotchi-button:hover::before {
    left: 100%;
  }
  
  .tamagotchi-button:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 
      0 8px 16px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    border-color: #d1d5db;
  }
  
  .tamagotchi-button:active:not(:disabled) {
    transform: translateY(-1px) scale(0.98);
    box-shadow: 
      0 2px 4px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  .tamagotchi-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  .play-button {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    border-color: #34d399;
  }
  
  .play-button:hover:not(:disabled) {
    border-color: #6ee7b7;
  }
  
  .eat-button {
    background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
    border-color: #f87171;
  }
  
  .eat-button:hover:not(:disabled) {
    border-color: #fca5a5;
  }
  
  .sleep-button {
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    border-color: #60a5fa;
  }
  
  .sleep-button:hover:not(:disabled) {
    border-color: #93c5fd;
  }
  
  .vibe-button {
    background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
    border-color: #a78bfa;
  }
  
  .vibe-button:hover:not(:disabled) {
    border-color: #c4b5fd;
  }
  
  .reset-button {
    background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
    border-color: #f87171;
  }
  
  .reset-button:hover:not(:disabled) {
    border-color: #fca5a5;
  }
  
  .button-placeholder {
    flex: 1;
    height: 60px;
  }
  
  /* Button animations */
  .play-button {
    animation: pulse-green 2s ease-in-out infinite;
  }
  
  .eat-button {
    animation: pulse-red 2s ease-in-out infinite;
  }
  
  .sleep-button {
    animation: pulse-blue 2s ease-in-out infinite;
  }
  
  .vibe-button {
    animation: pulse-purple 2s ease-in-out infinite;
  }
  
  @keyframes pulse-green {
    0%, 100% { box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
    50% { box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
  }
  
  @keyframes pulse-red {
    0%, 100% { box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
    50% { box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
  }
  
  @keyframes pulse-blue {
    0%, 100% { box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
    50% { box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
  }
  
  @keyframes pulse-purple {
    0%, 100% { box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
    50% { box-shadow: 0 4px 8px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
  }
</style>
