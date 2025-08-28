class TamagotchiApp {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.lastUpdate = null;
        this.buttonCooldowns = {};
        this.currentState = null;
        
        // Talking animation properties
        this.isTalking = false;
        this.talkingInterval = null;
        this.originalEmoji = '';
        
        // Emotion-based talking emoji sequences
        this.talkingEmojis = {
            happy: ['😊', '😄', '😁', '😊', '🙂'],
            sad: ['😢', '😭', '😔', '🥺', '😢'],
            angry: ['😠', '😡', '🤬', '😤', '😠'],
            tired: ['😴', '🥱', '😪', '😵‍💫', '😴'],
            sick: ['🤢', '🤮', '🤧', '😷', '🤢'],
            dead: ['💀', '👻', '🪦', '☠️', '💀'],
            neutral: ['😐', '🙂', '😶', '😑', '😐'],
            excited: ['🤩', '😆', '🥳', '😃', '🤩']
        };
        
        this.init();
    }
    
    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupWebSocket();
        this.loadFromLocalStorage();
        
        // Debug mode toggle
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.toggleDebugPanel();
            }
        });
    }
    
    setupElements() {
        // Status elements
        this.hungerFill = document.getElementById('hunger-fill');
        this.happinessFill = document.getElementById('happiness-fill');
        this.energyFill = document.getElementById('energy-fill');
        this.hungerValue = document.getElementById('hunger-value');
        this.happinessValue = document.getElementById('happiness-value');
        this.energyValue = document.getElementById('energy-value');
        
        // Pet display elements
        this.petName = document.getElementById('pet-name');
        this.petAge = document.getElementById('pet-age');
        this.moodEmoji = document.getElementById('mood-emoji');
        this.petStatus = document.getElementById('pet-status');
        this.petContainer = document.getElementById('pet-container');
        
        // Speech bubble
        this.speechBubble = document.getElementById('speech-bubble');
        this.speechText = document.getElementById('speech-text');
        
        // Death overlay
        this.deathOverlay = document.getElementById('death-overlay');
        
        // Buttons
        this.actionButtons = {
            feed: document.getElementById('feed-btn'),
            play: document.getElementById('play-btn'),
            sleep: document.getElementById('sleep-btn'),
            pet: document.getElementById('pet-btn'),
            talk: document.getElementById('talk-btn'),
            revive: document.getElementById('revive-btn'),
            reset: document.getElementById('reset-btn')
        };
        
        // Chat input
        this.chatInput = document.getElementById('chat-input');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.cancelBtn = document.getElementById('cancel-btn');
        
        // Connection status
        this.connectionStatus = document.getElementById('connection-status');
        this.statusIndicator = document.getElementById('status-indicator');
        this.statusText = document.getElementById('status-text');
        
        // Debug panel
        this.debugPanel = document.getElementById('debug-panel');
        this.wsStatus = document.getElementById('ws-status');
        this.lastUpdateEl = document.getElementById('last-update');
        this.totalInteractions = document.getElementById('total-interactions');
        this.deathCount = document.getElementById('death-count');
        
        // Toast container
        this.toastContainer = document.getElementById('toast-container');
    }
    
    setupEventListeners() {
        // Action buttons
        Object.entries(this.actionButtons).forEach(([action, btn]) => {
            if (btn) {
                btn.addEventListener('click', () => {
                    if (action === 'talk') {
                        this.showChatInput();
                    } else if (action === 'reset') {
                        this.confirmReset();
                    } else {
                        this.performAction(action);
                    }
                });
            }
        });
        
        // Chat functionality
        this.sendBtn.addEventListener('click', () => this.sendChatMessage());
        this.cancelBtn.addEventListener('click', () => this.hideChatInput());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            } else if (e.key === 'Escape') {
                this.hideChatInput();
            }
        });
        
        // Debug buttons
        document.getElementById('debug-state')?.addEventListener('click', () => {
            this.sendWebSocketMessage({ type: 'get_state' });
        });
        
        document.getElementById('debug-clear')?.addEventListener('click', () => {
            localStorage.clear();
            this.showToast('Local storage cleared', 'success');
        });
        
        document.getElementById('debug-ping')?.addEventListener('click', () => {
            this.sendWebSocketMessage({ type: 'ping' });
        });
    }
    
    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        this.updateConnectionStatus('Connecting...', false);
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.updateConnectionStatus('Connected', true);
                this.updateDebugInfo();
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            this.ws.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                this.updateConnectionStatus('Disconnected', false);
                this.updateDebugInfo();
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('Error', false);
            };
            
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.updateConnectionStatus('Failed', false);
        }
    }
    
    handleWebSocketMessage(data) {
        this.lastUpdate = new Date();
        this.updateDebugInfo();
        
        switch (data.type) {
            case 'welcome':
                console.log('Welcome message received');
                if (data.data) {
                    this.updateTamagotchiState(data.data);
                }
                this.showToast('Connected to Tamagotchi!', 'success');
                break;
                
            case 'state_update':
                if (data.data) {
                    this.updateTamagotchiState(data.data);
                }
                break;
                
            case 'action_result':
                this.handleActionResult(data);
                break;
                
            case 'chat_message':
                this.showSpeechBubble(data.response);
                break;
                
            case 'pong':
                console.log('Pong received');
                break;
                
            case 'error':
                console.error('Server error:', data.message);
                this.showToast(data.message, 'error');
                break;
                
            default:
                console.log('Unknown message type:', data.type);
        }
    }
    
    updateTamagotchiState(state) {
        this.currentState = state;
        this.saveToLocalStorage();
        
        // Update stats
        this.updateStatBar(this.hungerFill, this.hungerValue, state.hunger, 'hunger');
        this.updateStatBar(this.happinessFill, this.happinessValue, state.happiness, 'happiness');
        this.updateStatBar(this.energyFill, this.energyValue, state.energy, 'energy');
        
        // Update pet info
        this.petName.textContent = state.name;
        this.petAge.textContent = `Age: ${state.age} min`;
        this.moodEmoji.textContent = state.current_mood;
        
        // Update status
        this.petStatus.textContent = state.is_alive ? 'Alive' : 'Dead';
        
        // Handle death state
        this.updateDeathState(state.is_alive);
        
        // Update mood emoji animation
        this.updateMoodAnimation(state);
        
        // Update debug info
        if (this.totalInteractions) {
            this.totalInteractions.textContent = state.total_interactions;
        }
        if (this.deathCount) {
            this.deathCount.textContent = state.deaths;
        }
        
        // Update button states
        this.updateButtonStates(state);
    }
    
    updateStatBar(fillElement, valueElement, value, statType) {
        const percentage = Math.max(0, Math.min(100, value));
        fillElement.style.width = `${percentage}%`;
        valueElement.textContent = Math.round(value);
        
        // Add critical state classes
        const container = fillElement.closest('.stat-group');
        if (container) {
            container.classList.toggle(`critical-${statType}`, 
                (statType === 'hunger' && value >= 90) ||
                (statType !== 'hunger' && value <= 10)
            );
        }
    }
    
    updateMoodAnimation(state) {
        // Remove existing mood classes
        this.moodEmoji.classList.remove('dead', 'happy', 'sad', 'tired', 'hungry', 'sick');
        
        if (!state.is_alive) {
            this.moodEmoji.classList.add('dead');
        } else {
            // Check for sick state first (high hunger + low energy)
            if (state.hunger >= 80 && state.energy <= 30) {
                this.moodEmoji.classList.add('sick');
            }
            // Add appropriate mood class based on stats
            else if (state.hunger >= 90) {
                this.moodEmoji.classList.add('hungry');
            } else if (state.energy <= 10) {
                this.moodEmoji.classList.add('tired');
            } else if (state.happiness <= 20) {
                this.moodEmoji.classList.add('sad');
            } else if (state.happiness >= 80) {
                this.moodEmoji.classList.add('happy');
            }
        }
    }
    
    updateDeathState(isAlive) {
        this.deathOverlay.classList.toggle('show', !isAlive);
        this.actionButtons.revive.style.display = isAlive ? 'none' : 'block';
    }
    
    updateButtonStates(state) {
        Object.entries(this.actionButtons).forEach(([action, btn]) => {
            if (!btn) return;
            
            let disabled = false;
            
            if (!state.is_alive) {
                disabled = action !== 'revive' && action !== 'talk' && action !== 'reset';
            } else {
                switch (action) {
                    case 'play':
                        disabled = state.energy < 10;
                        break;
                    case 'sleep':
                        disabled = state.energy >= 90;
                        break;
                    case 'revive':
                        disabled = true; // Hidden when alive
                        break;
                }
            }
            
            // Check button cooldown
            if (this.buttonCooldowns[action] && Date.now() < this.buttonCooldowns[action]) {
                disabled = true;
            }
            
            btn.disabled = disabled;
        });
    }
    
    performAction(action) {
        if (this.buttonCooldowns[action] && Date.now() < this.buttonCooldowns[action]) {
            return;
        }
        
        // Set button cooldown (1 second)
        this.buttonCooldowns[action] = Date.now() + 1000;
        
        // Disable button temporarily
        const btn = this.actionButtons[action];
        if (btn) {
            btn.disabled = true;
            setTimeout(() => {
                this.updateButtonStates(this.currentState);
            }, 1000);
        }
        
        // Send action via WebSocket
        this.sendWebSocketMessage({
            type: 'action',
            action: action
        });
    }
    
    handleActionResult(data) {
        if (data.success) {
            this.showToast(data.message, 'success');
        } else {
            this.showToast(data.message, 'error');
        }
        
        if (data.response) {
            this.showSpeechBubble(data.response);
        }
    }
    
    showChatInput() {
        this.chatInput.style.display = 'flex';
        this.messageInput.focus();
    }
    
    hideChatInput() {
        this.chatInput.style.display = 'none';
        this.messageInput.value = '';
    }
    
    sendChatMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        this.sendWebSocketMessage({
            type: 'chat',
            message: message
        });
        
        this.hideChatInput();
    }
    
    showSpeechBubble(text) {
        this.speechText.textContent = text;
        this.speechBubble.classList.add('show');
        
        // Start talking animation
        this.startTalkingAnimation();
        
        // Hide after 5 seconds
        setTimeout(() => {
            this.speechBubble.classList.remove('show');
            this.stopTalkingAnimation();
        }, 5000);
    }
    
    startTalkingAnimation() {
        if (this.isTalking) return;
        
        this.isTalking = true;
        this.originalEmoji = this.moodEmoji.textContent;
        
        // Determine emotion based on current state
        const emotion = this.getCurrentEmotion();
        const emojiSequence = this.talkingEmojis[emotion] || this.talkingEmojis.neutral;
        
        // Add talking CSS class
        this.moodEmoji.classList.add('talking');
        
        let currentIndex = 0;
        this.talkingInterval = setInterval(() => {
            this.moodEmoji.textContent = emojiSequence[currentIndex];
            currentIndex = (currentIndex + 1) % emojiSequence.length;
        }, 400); // Change emoji every 400ms
    }
    
    stopTalkingAnimation() {
        if (!this.isTalking) return;
        
        this.isTalking = false;
        this.moodEmoji.classList.remove('talking');
        
        if (this.talkingInterval) {
            clearInterval(this.talkingInterval);
            this.talkingInterval = null;
        }
        
        // Restore original emoji
        if (this.originalEmoji) {
            this.moodEmoji.textContent = this.originalEmoji;
        }
    }
    
    getCurrentEmotion() {
        if (!this.currentState) return 'neutral';
        
        if (!this.currentState.is_alive) return 'dead';
        
        // Check for sick state (very high hunger + low energy)
        if (this.currentState.hunger >= 80 && this.currentState.energy <= 30) {
            return 'sick';
        }
        
        // Determine emotion based on stats
        if (this.currentState.hunger >= 90) return 'angry';
        if (this.currentState.energy <= 20) return 'tired';
        if (this.currentState.happiness <= 20) return 'sad';
        if (this.currentState.happiness >= 80 && this.currentState.energy >= 70) return 'happy';
        if (this.currentState.happiness >= 90) return 'excited';
        
        return 'neutral';
    }
    
    confirmReset() {
        // Show confirmation dialog
        const confirmed = confirm(
            "⚠️ Reset Game?\n\n" +
            "This will delete ALL progress:\n" +
            "• Pet's age and interactions\n" +
            "• Death count and statistics\n" +
            "• All saved data\n\n" +
            "Are you sure you want to start completely fresh?"
        );
        
        if (confirmed) {
            this.resetGame();
        }
    }
    
    async resetGame() {
        try {
            // Show loading state
            const resetBtn = this.actionButtons.reset;
            if (resetBtn) {
                resetBtn.disabled = true;
                resetBtn.querySelector('.btn-text').textContent = 'Resetting...';
            }
            
            // Call reset API
            const response = await fetch('/api/tamagotchi/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Reset failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Clear localStorage
                localStorage.clear();
                
                // Update UI with fresh state
                this.updateTamagotchiState(data.tamagotchi);
                
                // Show success message
                this.showToast('🎉 Game Reset! Starting fresh with a new pet!', 'success');
                
                // Show LLM response if available
                if (data.response) {
                    setTimeout(() => {
                        this.showSpeechBubble(data.response);
                    }, 1000);
                }
                
                // Reset any talking animation
                this.stopTalkingAnimation();
                
            } else {
                throw new Error(data.message || 'Reset failed');
            }
            
        } catch (error) {
            console.error('Reset error:', error);
            this.showToast(`Failed to reset game: ${error.message}`, 'error');
        } finally {
            // Restore button state
            const resetBtn = this.actionButtons.reset;
            if (resetBtn) {
                resetBtn.disabled = false;
                resetBtn.querySelector('.btn-text').textContent = 'Reset Game';
            }
        }
    }
    
    sendWebSocketMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, message not sent:', message);
            this.showToast('Not connected to server', 'error');
        }
    }
    
    updateConnectionStatus(text, isConnected) {
        this.statusText.textContent = text;
        this.statusIndicator.classList.toggle('online', isConnected);
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.updateConnectionStatus('Failed to reconnect', false);
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        this.updateConnectionStatus(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, false);
        
        setTimeout(() => {
            this.setupWebSocket();
        }, delay);
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        this.toastContainer.appendChild(toast);
        
        // Trigger show animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
    toggleDebugPanel() {
        const isVisible = this.debugPanel.style.display !== 'none';
        this.debugPanel.style.display = isVisible ? 'none' : 'block';
    }
    
    updateDebugInfo() {
        if (this.wsStatus) {
            this.wsStatus.textContent = this.ws ? 
                ['Connecting', 'Open', 'Closing', 'Closed'][this.ws.readyState] : 
                'Not created';
        }
        
        if (this.lastUpdateEl) {
            this.lastUpdateEl.textContent = this.lastUpdate ? 
                this.lastUpdate.toLocaleTimeString() : 
                'Never';
        }
    }
    
    saveToLocalStorage() {
        if (this.currentState) {
            try {
                localStorage.setItem('tamagotchi_state', JSON.stringify({
                    state: this.currentState,
                    timestamp: Date.now()
                }));
            } catch (error) {
                console.warn('Failed to save to localStorage:', error);
            }
        }
    }
    
    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('tamagotchi_state');
            if (saved) {
                const data = JSON.parse(saved);
                // Only use saved data if it's less than 1 hour old
                if (Date.now() - data.timestamp < 3600000) {
                    this.currentState = data.state;
                    this.updateTamagotchiState(data.state);
                }
            }
        } catch (error) {
            console.warn('Failed to load from localStorage:', error);
        }
    }
    
    // Auto-ping to keep connection alive
    startHeartbeat() {
        setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.sendWebSocketMessage({ type: 'ping' });
            }
        }, 30000); // Ping every 30 seconds
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tamagotchiApp = new TamagotchiApp();
    
    // Start heartbeat
    window.tamagotchiApp.startHeartbeat();
    
    console.log('Tamagotchi Web App initialized');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.tamagotchiApp) {
        // Page became visible, request state update
        window.tamagotchiApp.sendWebSocketMessage({ type: 'get_state' });
    }
});

// Handle window focus
window.addEventListener('focus', () => {
    if (window.tamagotchiApp) {
        // Window focused, request state update
        window.tamagotchiApp.sendWebSocketMessage({ type: 'get_state' });
    }
});