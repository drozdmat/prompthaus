// Game Configuration
const CONFIG = {
    TICK_MS: 300,
    BASE_DECAY: {
        fun: 1.5,
        sleep: 1,
        health: 0.6
    },
    DIFFICULTY_RAMP: 120, // seconds for difficulty to double
    CROSS_STAT_PENALTIES: {
        funZero: 5.0, // sleep decay multiplier when fun is 0
        sleepZero: 8.0 // health decay multiplier when sleep is 0
    },
    ACTIONS: {
        hover: {
            funGain: 0.6 // per second
        },
        click: {
            healthLoss: 10,
            sadDuration: 1000,
            cooldown: 800
        },
        eat: {
            health: 15,
            fun: 2,
            sleep: -2
        },
        sleep: {
            duration: 5000,
            sleepGain: 4, // per tick
            funLoss: 2
        },
        play: {
            fun: 12,
            sleep: -6,
            health: -1
        }
    },
    BUTTON_COOLDOWN: 1000,
    CATCHUP_CAP: 7200 // 2 hours in seconds
};

// Game State
class TamagotchiGame {
    constructor() {
        this.stats = {
            health: 100,
            sleep: 100,
            fun: 100
        };
        this.state = {
            startedAt: Date.now(),
            lastTick: Date.now(),
            elapsedSec: 0,
            isDead: false,
            isSleeping: false,
            isHovering: false,
            isSad: false,
            isEating: false,
            isPlaying: false,
            buttonCooldown: 0,
            clickCooldown: 0,
            sleepEndTime: 0,
            actionEndTime: 0
        };
        
        this.elements = {
            sprite: document.getElementById('tamagotchi-sprite'),
            healthBar: document.getElementById('health-bar'),
            sleepBar: document.getElementById('sleep-bar'),
            funBar: document.getElementById('fun-bar'),
            overlay: document.getElementById('overlay-img'),
            petArea: document.getElementById('pet-area'),
            eatBtn: document.getElementById('eat-btn'),
            sleepBtn: document.getElementById('sleep-btn'),
            playBtn: document.getElementById('play-btn'),
            resetBtn: document.getElementById('reset-btn'),
            aliveTime: document.getElementById('alive-time'),
            maxTime: document.getElementById('max-time')
        };
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initGame());
        } else {
            this.initGame();
        }
    }
    
    initGame() {
        this.loadState();
        this.setupEventListeners();
        this.startGameLoop();
        this.updateDisplay();
        this.updateTimeDisplay();
    }
    
    setupEventListeners() {
        // Pet area interactions
        this.elements.petArea.addEventListener('mouseenter', () => this.startHover());
        this.elements.petArea.addEventListener('mouseleave', () => this.stopHover());
        this.elements.petArea.addEventListener('click', () => this.handleClick());
        
        // Button interactions
        this.elements.eatBtn.addEventListener('click', () => this.eat());
        this.elements.sleepBtn.addEventListener('click', () => this.sleep());
        this.elements.playBtn.addEventListener('click', () => this.play());
        this.elements.resetBtn.addEventListener('click', () => this.reset());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.state.isDead) return;
            
            switch(e.key.toLowerCase()) {
                case 'e': this.eat(); break;
                case 's': this.sleep(); break;
                case 'p': this.play(); break;
                case 'r': this.reset(); break;
            }
        });
    }
    
    startGameLoop() {
        setInterval(() => this.tick(), CONFIG.TICK_MS);
        setInterval(() => this.updateTimeDisplay(), 1000); // Update time every second
    }
    
    tick() {
        if (this.state.isDead) return;
        
        const now = Date.now();
        const deltaSec = (now - this.state.lastTick) / 1000;
        this.state.lastTick = now;
        this.state.elapsedSec += deltaSec;
        
        // Update cooldowns
        this.state.buttonCooldown = Math.max(0, this.state.buttonCooldown - CONFIG.TICK_MS);
        this.state.clickCooldown = Math.max(0, this.state.clickCooldown - CONFIG.TICK_MS);
        
        // Handle sleeping state
        if (this.state.isSleeping && now >= this.state.sleepEndTime) {
            this.wakeUp();
        }
        
        // Handle action states
        if (this.state.isEating && now >= this.state.actionEndTime) {
            this.state.isEating = false;
            this.updateSprite();
        }
        if (this.state.isPlaying && now >= this.state.actionEndTime) {
            this.state.isPlaying = false;
            this.updateSprite();
        }
        
        // Apply decay
        this.applyDecay(deltaSec);
        
        // Apply hover gains
        if (this.state.isHovering) {
            this.stats.fun = Math.min(100, this.stats.fun + CONFIG.ACTIONS.hover.funGain * deltaSec);
        }
        
        // Check for death
        if (this.stats.health <= 0) {
            this.die();
        }
        
        this.updateDisplay();
        this.saveState();
    }
    
    applyDecay(deltaSec) {
        const difficulty = 1 + (this.state.elapsedSec / CONFIG.DIFFICULTY_RAMP);
        
        // Base decay rates
        let funDecay = CONFIG.BASE_DECAY.fun * difficulty * deltaSec;
        let sleepDecay = CONFIG.BASE_DECAY.sleep * difficulty * deltaSec;
        let healthDecay = CONFIG.BASE_DECAY.health * difficulty * deltaSec;
        
        // Cross-stat penalties
        if (this.stats.fun <= 0) {
            sleepDecay *= CONFIG.CROSS_STAT_PENALTIES.funZero;
        }
        
        // Sleep affects health decay proportionally
        const sleepMultiplier = 1 + ((100 - this.stats.sleep) / 100) * 4; // 1x to 5x multiplier
        healthDecay *= sleepMultiplier;
        
        // Extreme penalty when sleep is 0
        if (this.stats.sleep <= 0) {
            healthDecay *= CONFIG.CROSS_STAT_PENALTIES.sleepZero;
        }
        
        // Apply decay
        this.stats.fun = Math.max(0, this.stats.fun - funDecay);
        this.stats.sleep = Math.max(0, this.stats.sleep - sleepDecay);
        this.stats.health = Math.max(0, this.stats.health - healthDecay);
        
        // Round to integers to avoid jitter
        this.stats.fun = Math.round(this.stats.fun);
        this.stats.sleep = Math.round(this.stats.sleep);
        this.stats.health = Math.round(this.stats.health);
    }
    
    startHover() {
        if (this.state.isDead || this.state.isSleeping) return;
        
        this.state.isHovering = true;
        this.elements.sprite.classList.add('shake');
    }
    
    stopHover() {
        this.state.isHovering = false;
        this.elements.sprite.classList.remove('shake');
    }
    
    handleClick() {
        if (this.state.isDead || this.state.clickCooldown > 0) return;
        
        if (this.state.isSleeping) {
            // Wake up with shake and sad face
            this.elements.sprite.classList.add('shake');
            setTimeout(() => this.elements.sprite.classList.remove('shake'), 200);
            
            this.state.isSad = true;
            this.updateSprite();
            setTimeout(() => {
                this.state.isSad = false;
                this.updateSprite();
            }, CONFIG.ACTIONS.click.sadDuration);
            
            this.wakeUp();
            return;
        }
        
        // Quick shake and health loss
        this.elements.sprite.classList.add('shake');
        setTimeout(() => this.elements.sprite.classList.remove('shake'), 200);
        
        this.stats.health = Math.max(0, this.stats.health - CONFIG.ACTIONS.click.healthLoss);
        
        // Sad face for 1 second
        this.state.isSad = true;
        this.updateSprite();
        setTimeout(() => {
            this.state.isSad = false;
            this.updateSprite();
        }, CONFIG.ACTIONS.click.sadDuration);
        
        this.state.clickCooldown = CONFIG.ACTIONS.click.cooldown;
    }
    
    eat() {
        if (this.state.isDead || this.state.buttonCooldown > 0) return;
        
        // Interrupt sleep if sleeping
        if (this.state.isSleeping) {
            this.wakeUp();
        }
        
        this.stats.health = Math.min(100, this.stats.health + CONFIG.ACTIONS.eat.health);
        this.stats.fun = Math.min(100, this.stats.fun + CONFIG.ACTIONS.eat.fun);
        this.stats.sleep = Math.max(0, this.stats.sleep + CONFIG.ACTIONS.eat.sleep);
        
        this.state.isEating = true;
        this.state.actionEndTime = Date.now() + 150;
        this.updateSprite();
        
        this.state.buttonCooldown = CONFIG.BUTTON_COOLDOWN;
    }
    
    sleep() {
        if (this.state.isDead || this.state.isSleeping || this.state.buttonCooldown > 0) return;
        
        this.state.isSleeping = true;
        this.state.sleepEndTime = Date.now() + CONFIG.ACTIONS.sleep.duration;
        this.state.isHovering = false;
        this.elements.sprite.classList.remove('shake');
        
        this.updateSprite();
        
        this.state.buttonCooldown = CONFIG.BUTTON_COOLDOWN;
    }
    
    wakeUp() {
        this.state.isSleeping = false;
        this.stats.sleep = Math.min(100, this.stats.sleep + CONFIG.ACTIONS.sleep.sleepGain * 10); // 10 ticks
        this.stats.fun = Math.max(0, this.stats.fun - CONFIG.ACTIONS.sleep.funLoss);
        
        this.updateSprite();
    }
    
    refuseAction() {
        // Shake and sad face to refuse action
        this.elements.sprite.classList.add('shake');
        setTimeout(() => this.elements.sprite.classList.remove('shake'), 200);
        
        this.state.isSad = true;
        this.updateSprite();
        setTimeout(() => {
            this.state.isSad = false;
            this.updateSprite();
        }, CONFIG.ACTIONS.click.sadDuration);
    }
    
    play() {
        if (this.state.isDead || this.state.buttonCooldown > 0) return;
        
        // Interrupt sleep if sleeping
        if (this.state.isSleeping) {
            this.wakeUp();
        }
        
        this.stats.fun = Math.min(100, this.stats.fun + CONFIG.ACTIONS.play.fun);
        this.stats.sleep = Math.max(0, this.stats.sleep + CONFIG.ACTIONS.play.sleep);
        this.stats.health = Math.max(0, this.stats.health + CONFIG.ACTIONS.play.health);
        
        this.state.isPlaying = true;
        this.state.actionEndTime = Date.now() + 300;
        this.updateSprite();
        
        this.state.buttonCooldown = CONFIG.BUTTON_COOLDOWN;
    }
    
    die() {
        this.state.isDead = true;
        this.state.isHovering = false;
        this.elements.sprite.classList.remove('shake');
        this.updateSprite();
        this.updateButtons();
    }
    
    reset() {
        this.stats = { health: 100, sleep: 100, fun: 100 };
        this.state = {
            startedAt: Date.now(),
            lastTick: Date.now(),
            elapsedSec: 0,
            isDead: false,
            isSleeping: false,
            isHovering: false,
            isSad: false,
            isEating: false,
            isPlaying: false,
            buttonCooldown: 0,
            clickCooldown: 0,
            sleepEndTime: 0,
            actionEndTime: 0
        };
        
        document.body.classList.remove('sleeping');
        this.updateDisplay();
        this.saveState();
    }
    
    updateDisplay() {
        this.updateBars();
        this.updateSprite();
        this.updateOverlay();
        this.updateButtons();
    }
    
    updateTimeDisplay() {
        if (this.state.isDead) return;
        
        // Ensure elements exist before updating
        if (!this.elements.aliveTime || !this.elements.maxTime) {
            return;
        }
        
        const aliveSeconds = Math.floor(this.state.elapsedSec);
        const hours = Math.floor(aliveSeconds / 3600);
        const minutes = Math.floor((aliveSeconds % 3600) / 60);
        const seconds = aliveSeconds % 60;
        
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.elements.aliveTime.textContent = timeString;
        
        // Update max time if current time is higher
        const maxTime = localStorage.getItem('tmg_max_time') || '00:00:00';
        if (aliveSeconds > this.parseTimeString(maxTime)) {
            localStorage.setItem('tmg_max_time', timeString);
            this.elements.maxTime.textContent = timeString;
        } else {
            this.elements.maxTime.textContent = maxTime;
        }
    }
    
    parseTimeString(timeString) {
        const parts = timeString.split(':');
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    
    updateBars() {
        // Ensure elements exist before updating
        if (!this.elements.healthBar || !this.elements.sleepBar || !this.elements.funBar) {
            return;
        }
        
        // Update bar widths
        this.elements.healthBar.style.width = `${this.stats.health}%`;
        this.elements.sleepBar.style.width = `${this.stats.sleep}%`;
        this.elements.funBar.style.width = `${this.stats.fun}%`;
        
        // Update bar colors and pulse effects
        this.updateBarState(this.elements.healthBar, this.stats.health);
        this.updateBarState(this.elements.sleepBar, this.stats.sleep);
        this.updateBarState(this.elements.funBar, this.stats.fun);
    }
    
    updateBarState(barElement, value) {
        barElement.classList.remove('high', 'medium', 'low', 'pulse');
        
        if (value > 70) {
            barElement.classList.add('high');
        } else if (value >= 40) {
            barElement.classList.add('medium');
        } else {
            barElement.classList.add('low');
            if (value < 40) {
                barElement.classList.add('pulse');
            }
        }
    }
    
    updateSprite() {
        let spritePath = 'assets/';
        
        if (this.state.isDead) {
            spritePath += 'gameover.png';
        } else if (this.state.isSleeping) {
            spritePath += 'sleep.png';
        } else if (this.state.isSad) {
            spritePath += 'sad.png';
        } else if (this.state.isEating) {
            spritePath += 'happy.png';
        } else if (this.state.isPlaying) {
            spritePath += 'happy-more.png';
        } else if (this.stats.health < 20 || (this.stats.sleep < 20 && this.stats.fun < 20)) {
            spritePath += 'ill.png';
        } else if (this.stats.fun > 70 && this.stats.sleep > 70) {
            spritePath += 'happy-more.png';
        } else if (this.stats.fun > 50 && this.stats.sleep > 50) {
            spritePath += 'happy.png';
        } else {
            spritePath += 'idle.png';
        }
        
        this.elements.sprite.src = spritePath;
    }
    
    updateOverlay() {
        const overlay = this.elements.overlay;
        
        if (this.stats.health < 20) {
            overlay.src = 'assets/overlay-warning.png';
            overlay.parentElement.classList.add('warning');
        } else if (this.stats.health < 40 || this.stats.sleep < 40 || this.stats.fun < 40) {
            overlay.src = 'assets/overlay.png';
            overlay.parentElement.classList.add('active');
        } else {
            overlay.parentElement.classList.remove('active', 'warning');
        }
    }
    
    updateButtons() {
        const isDisabled = this.state.isDead || this.state.buttonCooldown > 0;
        
        this.elements.eatBtn.disabled = isDisabled;
        this.elements.sleepBtn.disabled = isDisabled;
        this.elements.playBtn.disabled = isDisabled;
        
        if (this.state.isDead) {
            this.elements.resetBtn.style.display = 'block';
            this.elements.eatBtn.style.display = 'none';
            this.elements.sleepBtn.style.display = 'none';
            this.elements.playBtn.style.display = 'none';
        } else {
            this.elements.resetBtn.style.display = 'none';
            this.elements.eatBtn.style.display = 'block';
            this.elements.sleepBtn.style.display = 'block';
            this.elements.playBtn.style.display = 'block';
        }
    }
    
    saveState() {
        const state = {
            health: this.stats.health,
            sleep: this.stats.sleep,
            fun: this.stats.fun,
            startedAtIso: new Date(this.state.startedAt).toISOString(),
            lastTickIso: new Date(this.state.lastTick).toISOString(),
            elapsedSec: this.state.elapsedSec
        };
        
        localStorage.setItem('tmg_state_v1', JSON.stringify(state));
    }
    
    loadState() {
        const saved = localStorage.getItem('tmg_state_v1');
        if (!saved) return;
        
        try {
            const state = JSON.parse(saved);
            this.stats.health = state.health;
            this.stats.sleep = state.sleep;
            this.stats.fun = state.fun;
            this.state.startedAt = new Date(state.startedAtIso).getTime();
            this.state.lastTick = new Date(state.lastTickIso).getTime();
            this.state.elapsedSec = state.elapsedSec;
            
            // Apply catch-up decay (capped to prevent brutal wipeouts)
            const now = Date.now();
            const offlineSec = Math.min(
                (now - this.state.lastTick) / 1000,
                CONFIG.CATCHUP_CAP
            );
            
            if (offlineSec > 0) {
                this.applyDecay(offlineSec);
                this.state.lastTick = now;
                this.state.elapsedSec += offlineSec;
            }
        } catch (e) {
            console.error('Failed to load saved state:', e);
        }
        
        // Load max time record
        const maxTime = localStorage.getItem('tmg_max_time') || '00:00:00';
        this.elements.maxTime.textContent = maxTime;
    }
}

// Initialize game when page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new TamagotchiGame();
    
    // Add random glitch effect
    setInterval(() => {
        if (Math.random() < 0.02) { // 2% chance every 30-90 seconds
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer) {
                const glitch = document.createElement('div');
                glitch.className = 'glitch-overlay';
                gameContainer.appendChild(glitch);
                
                setTimeout(() => {
                    if (glitch.parentNode) {
                        glitch.remove();
                    }
                }, 1000);
            }
        }
    }, 30000 + Math.random() * 60000);
});
