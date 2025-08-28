<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { feedPet, playWithPet, putToSleep, updatePetState, resetGame, isGameOver, performVibeCheck } from '$lib/logic/gameEngine';
  import type { Pet } from '$lib/models/Pet';
  import type { Achievement } from '$lib/models/Achievements';
  import { checkAchievements } from '$lib/models/Achievements';
  import { savePetState, loadPetState, saveGameStats, loadGameStats } from '$lib/utils/storage';
  import { playFeedSound, playPlaySound, playSleepSound, playLevelUpSound, playAchievementSound, playDeathSound } from '$lib/utils/sounds';
  import Screen from '$lib/components/Screen.svelte';
  import Buttons from '$lib/components/Buttons.svelte';
  import Achievements from '$lib/components/Achievements.svelte';
  import VibeCheckModal from '$lib/components/VibeCheckModal.svelte';
  import { tamagotchiAIService } from '$lib/services/tamagotchiAIService';
  import type { PetResponse } from '$lib/services/tamagotchiAIService';

  // Stan zwierzaka (reaktywny w Svelte)
  let pet: Pet = {
    hunger: 100, // Zaczyna najedzony (odwrócona logika)
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
    vibeLevel: 50,
    coins: 100, // startowa waluta
    activeEffects: []
  };

  let gameOver = false;
  let gameInterval: number;
  let achievements: Achievement[] = [];
  let showAchievements = false;
  let showVibeCheck = false;
  let gameStats = loadGameStats();
  let previousLevel = 1;
  
  // AI Communication
  let aiResponse: PetResponse | null = null;
  let userMessage = '';
  let isAILoading = false;
  let showChat = false;

  // Funkcje obsługi przycisków
  const handlePlay = () => {
    pet = playWithPet(pet);
    gameOver = isGameOver(pet);
    playPlaySound();
    savePetState(pet);
    checkLevelUp();
    updateAchievements();
  };

  const handleEat = () => {
    pet = feedPet(pet);
    gameOver = isGameOver(pet);
    playFeedSound();
    savePetState(pet);
    checkLevelUp();
    updateAchievements();
  };

  const handleSleep = () => {
    pet = putToSleep(pet);
    gameOver = isGameOver(pet);
    playSleepSound();
    savePetState(pet);
    checkLevelUp();
    updateAchievements();
  };

  const handleReset = () => {
    pet = resetGame();
    gameOver = false;
    previousLevel = 1;
    gameStats.petsRaised++;
    saveGameStats(gameStats);
    savePetState(pet);
    updateAchievements();
  };

  const handleShowAchievements = () => {
    showAchievements = true;
  };

  const handleShowVibeCheck = () => {
    showVibeCheck = true;
  };

  const handleVibeCheck = (emoji: string) => {
    pet = performVibeCheck(pet, emoji);
    gameOver = isGameOver(pet);
    savePetState(pet);
    checkLevelUp();
    updateAchievements();
  };

  // AI Functions
  const handleShowChat = () => {
    showChat = !showChat;
    if (showChat && !aiResponse) {
      getAIResponse();
    }
  };

  const getAIResponse = async (message?: string) => {
    if (isAILoading) return;
    
    isAILoading = true;
    try {
      aiResponse = await tamagotchiAIService.getPetResponse(pet, message);
    } catch (error) {
      console.error('AI Error:', error);
      aiResponse = {
        message: "Przepraszam, nie mogę teraz odpowiedzieć... 😔",
        suggestion: "Spróbuj ponownie za chwilę!"
      };
    } finally {
      isAILoading = false;
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || isAILoading) return;
    
    const message = userMessage.trim();
    userMessage = '';
    await getAIResponse(message);
  };

  const checkLevelUp = () => {
    if (pet.level > previousLevel) {
      playLevelUpSound();
      previousLevel = pet.level;
    }
  };

  const updateAchievements = () => {
    const stats = {
      totalInteractions: pet.totalInteractions,
      petsRaised: gameStats.petsRaised,
      maxAge: pet.age,
      currentStage: pet.stage,
      perfectCareHours: 0 // TODO: implement
    };
    
    const newAchievements = checkAchievements(stats, achievements);
    const newlyUnlocked = newAchievements.filter(a => 
      a.unlocked && !achievements.find(old => old.id === a.id && old.unlocked)
    );
    
    if (newlyUnlocked.length > 0) {
      playAchievementSound();
    }
    
    achievements = newAchievements;
  };

  // Pętla gry - aktualizuje stan zwierzaka co 3 sekundy
  onMount(() => {
    // Wczytaj zapisany stan
    const savedPet = loadPetState();
    if (savedPet) {
      pet = savedPet;
      gameOver = isGameOver(pet);
      previousLevel = pet.level;
    }
    
    // Inicjalizuj osiągnięcia
    updateAchievements();
    
    gameInterval = setInterval(() => {
      if (!gameOver) {
        pet = updatePetState(pet);
        gameOver = isGameOver(pet);
        
        if (gameOver) {
          playDeathSound();
        }
        
        savePetState(pet);
        checkLevelUp();
        updateAchievements();
      }
    }, 3000);

    return () => {
      if (gameInterval) {
        clearInterval(gameInterval);
      }
    };
  });
</script>

<svelte:head>
  <title>Tamagotchi AI - Digital Pet</title>
</svelte:head>

<div class="tamagotchi-app">
  <div class="app-header">
    <h1>🐾 TAMAGOTCHI AI</h1>
    <p>Digital Pet Companion</p>
  </div>
  
  <div class="game-container">
    <div class="game-header">
      <div class="pet-info">
        <div class="pet-level">Poziom {pet.level}</div>
        <div class="pet-stage">{pet.stage === 'baby' ? 'Dziecko' : 
                                pet.stage === 'teen' ? 'Nastolatek' : 
                                pet.stage === 'adult' ? 'Dorosły' : 
                                pet.stage === 'elder' ? 'Starszy' : 'Jajko'}</div>
        <div class="pet-age">Wiek: {pet.age} dni</div>
      </div>
      <button class="achievements-button" on:click={handleShowAchievements}>
        🏆 Osiągnięcia
      </button>
    </div>
    
      <Screen {pet} />
    <Buttons 
      onPlay={handlePlay}
      onEat={handleEat}
      onSleep={handleSleep}
      onReset={handleReset}
      onVibeCheck={handleShowVibeCheck}
      isGameOver={gameOver}
    />
    
    <!-- AI Chat Interface -->
    <div class="ai-chat-section">
      <button class="chat-toggle-button" on:click={handleShowChat}>
        {showChat ? '💬 Ukryj Czat' : '🤖 Rozmawiaj z AI'}
      </button>
      
      {#if showChat}
        <div class="chat-container">
          <div class="chat-header">
            <h3>💬 Rozmowa z {pet.stage === 'baby' ? 'dzieckiem' : 
                               pet.stage === 'teen' ? 'nastolatkiem' : 
                               pet.stage === 'adult' ? 'dorosłym' : 
                               pet.stage === 'elder' ? 'starszym' : 'jajkiem'}</h3>
          </div>
          
          <div class="chat-messages">
            {#if aiResponse}
              <div class="ai-message">
                <div class="message-content">
                  <strong>🤖 Zwierzak:</strong> {aiResponse.message}
                </div>
                {#if aiResponse.suggestion}
                  <div class="suggestion">
                    💡 {aiResponse.suggestion}
                  </div>
                {/if}
              </div>
            {/if}
            
            {#if isAILoading}
              <div class="loading-message">
                <div class="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p>AI myśli...</p>
              </div>
            {/if}
          </div>
          
          <div class="chat-input">
            <input 
              type="text" 
              bind:value={userMessage}
              placeholder="Napisz wiadomość do zwierzaka..."
              on:keydown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isAILoading}
            />
            <button 
              class="send-button" 
              on:click={handleSendMessage}
              disabled={!userMessage.trim() || isAILoading}
            >
              ➤
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
  
  <Achievements {achievements} show={showAchievements} />
  <VibeCheckModal show={showVibeCheck} onVibeCheck={handleVibeCheck} />
  
  <div class="app-footer">
    <p>Opiekuj się swoim zwierzakiem! 🎮</p>
  </div>
</div>

<style>
  .tamagotchi-app {
    min-height: 100vh;
    background: 
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%),
      linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: 'Courier New', monospace;
    color: white;
    position: relative;
    overflow: hidden;
  }

  /* Animated background particles */
  .tamagotchi-app::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(2px 2px at 20px 30px, rgba(255, 255, 255, 0.1), transparent),
      radial-gradient(2px 2px at 40px 70px, rgba(255, 255, 255, 0.1), transparent),
      radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.1), transparent),
      radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.1), transparent),
      radial-gradient(2px 2px at 160px 30px, rgba(255, 255, 255, 0.1), transparent);
    background-repeat: repeat;
    background-size: 200px 100px;
    animation: float 20s linear infinite;
    pointer-events: none;
  }

  @keyframes float {
    0% { transform: translateY(0px); }
    100% { transform: translateY(-100px); }
  }
  
  .app-header {
    text-align: center;
    margin-bottom: 30px;
  }
  
  .app-header h1 {
    font-size: 32px;
    margin: 0 0 10px 0;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    background: linear-gradient(45deg, #10b981, #3b82f6, #8b5cf6);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradient 3s ease infinite;
  }
  
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  .app-header p {
    font-size: 16px;
    margin: 0;
    opacity: 0.8;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  }
  
  .game-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
  }
  
  .game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 420px;
    padding: 15px;
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
    border: 2px solid #6b7280;
    border-radius: 8px;
  }
  
  .pet-info {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  
  .pet-level {
    color: #10b981;
    font-weight: bold;
    font-size: 16px;
  }
  
  .pet-stage {
    color: #f59e0b;
    font-size: 14px;
  }
  
  .pet-age {
    color: #6b7280;
    font-size: 12px;
  }
  
  .achievements-button {
    background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
    border: 2px solid #a78bfa;
    color: white;
    padding: 10px 15px;
    border-radius: 6px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .achievements-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(124, 58, 237, 0.3);
  }
  
  .app-footer {
    text-align: center;
    margin-top: 30px;
    opacity: 0.6;
    font-size: 14px;
  }
  
  .app-footer p {
    margin: 0;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  }

  /* AI Chat Styles */
  .ai-chat-section {
    width: 420px;
    margin-top: 20px;
  }

  .chat-toggle-button {
    width: 100%;
    background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
    border: 2px solid #a78bfa;
    color: white;
    padding: 12px;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .chat-toggle-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(124, 58, 237, 0.3);
  }

  .chat-container {
    margin-top: 15px;
    background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
    border: 2px solid #6b7280;
    border-radius: 8px;
    overflow: hidden;
  }

  .chat-header {
    background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
    padding: 12px;
    border-bottom: 2px solid #6b7280;
  }

  .chat-header h3 {
    margin: 0;
    font-size: 14px;
    color: white;
    text-align: center;
  }

  .chat-messages {
    padding: 15px;
    min-height: 120px;
    max-height: 200px;
    overflow-y: auto;
  }

  .ai-message {
    margin-bottom: 15px;
  }

  .message-content {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    padding: 10px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.4;
  }

  .suggestion {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
    padding: 8px;
    border-radius: 6px;
    font-size: 12px;
    margin-top: 8px;
    font-style: italic;
  }

  .loading-message {
    text-align: center;
    color: #9ca3af;
    font-size: 12px;
  }

  .loading-dots {
    display: flex;
    justify-content: center;
    gap: 4px;
    margin-bottom: 8px;
  }

  .loading-dots span {
    width: 8px;
    height: 8px;
    background: #6b7280;
    border-radius: 50%;
    animation: loading 1.4s infinite ease-in-out;
  }

  .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
  .loading-dots span:nth-child(2) { animation-delay: -0.16s; }

  @keyframes loading {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }

  .chat-input {
    display: flex;
    padding: 12px;
    border-top: 2px solid #6b7280;
    gap: 8px;
  }

  .chat-input input {
    flex: 1;
    background: #374151;
    border: 2px solid #6b7280;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
  }

  .chat-input input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .chat-input input::placeholder {
    color: #9ca3af;
  }

  .send-button {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border: 2px solid #34d399;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .send-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
  }

  .send-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }


</style>
