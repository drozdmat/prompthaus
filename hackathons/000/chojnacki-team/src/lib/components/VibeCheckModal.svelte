<script lang="ts">
  export let show: boolean = false;
  export let onVibeCheck: (emoji: string) => void;
  
  const vibeOptions = [
    { emoji: '😊', label: 'Szczęśliwy' },
    { emoji: '😍', label: 'Zakochany' },
    { emoji: '🤗', label: 'Przytulanie' },
    { emoji: '🎉', label: 'Świętowanie' },
    { emoji: '😌', label: 'Spokojny' },
    { emoji: '🤔', label: 'Myślący' },
    { emoji: '😐', label: 'Neutralny' },
    { emoji: '😔', label: 'Smutny' },
    { emoji: '😤', label: 'Dumny' },
    { emoji: '🥰', label: 'Kochający' }
  ];
  
  const closeModal = () => {
    show = false;
  };
  
  const handleVibeCheck = (emoji: string) => {
    onVibeCheck(emoji);
    closeModal();
  };
</script>

{#if show}
  <div class="modal-overlay" on:click={closeModal} role="button" tabindex="0" on:keydown={(e) => e.key === 'Escape' && closeModal()}>
    <div class="vibe-modal" on:click|stopPropagation>
      <div class="modal-header">
        <h2>🎭 VIBE CHECK</h2>
        <button class="close-button" on:click={closeModal}>✕</button>
      </div>
      
      <div class="modal-content">
        <p class="vibe-description">
          Jak się czuje Twój zwierzak? Wybierz emoji, które najlepiej opisuje jego nastrój!
        </p>
        
        <div class="vibe-options">
          {#each vibeOptions as option}
            <button 
              class="vibe-option" 
              on:click={() => handleVibeCheck(option.emoji)}
              on:keydown={(e) => e.key === 'Enter' && handleVibeCheck(option.emoji)}
            >
              <div class="vibe-emoji">{option.emoji}</div>
              <div class="vibe-label">{option.label}</div>
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }
  
  .vibe-modal {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    border: 3px solid #64748b;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
    border-bottom: 2px solid #a78bfa;
  }
  
  .modal-header h2 {
    margin: 0;
    color: white;
    font-size: 20px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  }
  
  .close-button {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 5px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .close-button:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .modal-content {
    padding: 20px;
  }
  
  .vibe-description {
    color: #d1d5db;
    text-align: center;
    margin-bottom: 20px;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .vibe-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .vibe-option {
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
    border: 2px solid #6b7280;
    border-radius: 8px;
    padding: 15px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  
  .vibe-option:hover {
    border-color: #a78bfa;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
  }
  
  .vibe-option:active {
    transform: translateY(0);
  }
  
  .vibe-emoji {
    font-size: 32px;
    filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.5));
  }
  
  .vibe-label {
    color: white;
    font-size: 12px;
    font-weight: bold;
    text-align: center;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.8);
  }
</style>
