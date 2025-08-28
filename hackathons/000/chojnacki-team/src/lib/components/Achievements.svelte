<script lang="ts">
  import type { Achievement } from '$lib/models/Achievements';
  
  export let achievements: Achievement[] = [];
  export let show: boolean = false;
  
  const closeModal = () => {
    show = false;
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  };

  const handleModalKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  };
  
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);
</script>

{#if show}
  <div class="modal-overlay" role="button" tabindex="0" on:click={closeModal} on:keydown={handleKeydown}>
    <div class="achievements-modal" role="dialog" tabindex="0" on:click|stopPropagation on:keydown={handleModalKeydown}>
      <div class="modal-header">
        <h2>🏆 Osiągnięcia</h2>
        <button class="close-button" on:click={closeModal}>✕</button>
      </div>
      
      <div class="achievements-content">
        <div class="stats">
          <div class="stat">
            <span class="stat-label">Odblokowane:</span>
            <span class="stat-value">{unlockedAchievements.length}/{achievements.length}</span>
          </div>
        </div>
        
        <div class="achievements-list">
          {#each achievements as achievement}
            <div class="achievement-item {achievement.unlocked ? 'unlocked' : 'locked'}">
              <div class="achievement-icon">
                {achievement.icon}
              </div>
              <div class="achievement-info">
                <div class="achievement-name">{achievement.name}</div>
                <div class="achievement-description">{achievement.description}</div>
                <div class="achievement-progress">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      style="width: {Math.min(100, (achievement.current / achievement.requirement) * 100)}%"
                    ></div>
                  </div>
                  <span class="progress-text">
                    {achievement.current}/{achievement.requirement}
                  </span>
                </div>
                {#if achievement.unlocked && achievement.unlockedAt}
                  <div class="unlocked-date">
                    Odblokowano: {new Date(achievement.unlockedAt).toLocaleDateString('pl-PL')}
                  </div>
                {/if}
              </div>
            </div>
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
  
  .achievements-modal {
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
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
    border-bottom: 2px solid #6b7280;
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
  
  .achievements-content {
    padding: 20px;
    max-height: 60vh;
    overflow-y: auto;
  }
  
  .stats {
    margin-bottom: 20px;
    padding: 15px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    border: 1px solid #6b7280;
  }
  
  .stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .stat-label {
    color: #d1d5db;
    font-size: 14px;
  }
  
  .stat-value {
    color: #10b981;
    font-weight: bold;
    font-size: 16px;
  }
  
  .achievements-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .achievement-item {
    display: flex;
    gap: 15px;
    padding: 15px;
    border-radius: 8px;
    border: 2px solid #6b7280;
    transition: all 0.3s ease;
  }
  
  .achievement-item.unlocked {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(34, 197, 94, 0.1) 100%);
    border-color: #10b981;
  }
  
  .achievement-item.locked {
    background: rgba(0, 0, 0, 0.2);
    opacity: 0.7;
  }
  
  .achievement-icon {
    font-size: 32px;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    flex-shrink: 0;
  }
  
  .achievement-info {
    flex: 1;
  }
  
  .achievement-name {
    color: white;
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 5px;
  }
  
  .achievement-description {
    color: #d1d5db;
    font-size: 14px;
    margin-bottom: 10px;
  }
  
  .achievement-progress {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 5px;
  }
  
  .progress-bar {
    flex: 1;
    height: 8px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #34d399);
    transition: width 0.3s ease;
  }
  
  .progress-text {
    color: #9ca3af;
    font-size: 12px;
    min-width: 40px;
    text-align: right;
  }
  
  .unlocked-date {
    color: #10b981;
    font-size: 12px;
    font-style: italic;
  }
</style>
