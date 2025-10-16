// Główna logika gry

class Game {
    constructor() {
        this.canvas = new CanvasController('drawingCanvas');
        this.ai = new AIController();
        this.phase = 'waiting'; // waiting, user_draw1, ai_turn1, user_draw2, ai_turn2, prompt2, prompt3, finished
        this.turn = 0;
        this.prompt1Cycles = 0;
        this.userDrawCount = 0;  // Licznik rysunków użytkownika
        this.moveHistory = [];
        
        this.setupUI();
        this.canvas.onShapeCreated = (shape) => this.handleUserShape(shape);
    }

    setupUI() {
        // Ukryj selektor kształtów (nie potrzebny dla ręcznego rysowania)
        document.getElementById('shapeSelector').style.display = 'none';
        
        // Ukryj sekcję user input (nie używana w nowym flow)
        document.getElementById('userInputSection').style.display = 'none';

        // Color picker
        document.getElementById('colorInput').addEventListener('change', (e) => {
            this.canvas.setColor(e.target.value);
        });

        // Control buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas());
    }

    startGame() {
        this.phase = 'user_draw';
        this.canvas.enable();
        this.updateStatus('Narysuj coś mazakiem na tablicy', 'Użytkownik', 0);
        document.getElementById('startBtn').style.display = 'none';
        this.addToHistory('🎨 Gra rozpoczęta! Narysuj coś na tablicy...', 'user');
    }

    async handleUserShape(shape) {
        this.canvas.disable();
        this.userDrawCount++;
        
        if (this.userDrawCount === 1) {
            // PIERWSZY rysunek użytkownika
            this.addToHistory(`✓ Użytkownik narysował początek`, 'user');
            this.phase = 'ai_turn1';
            
            // AI dodaje 5 elementów
            await this.runAITurn(5, 'AI buduje na Twoim rysunku...');
            
            // Teraz kolej użytkownika znowu
            this.phase = 'user_draw2';
            this.canvas.enable();
            this.updateStatus('Teraz Ty! Dodaj coś do rysunku', 'Użytkownik', 0);
            this.addToHistory(`🎨 Twoja kolej - dorysuj coś!`, 'user');
            
        } else if (this.userDrawCount === 2) {
            // DRUGI rysunek użytkownika
            this.addToHistory(`✓ Użytkownik dodał element`, 'user');
            this.phase = 'ai_turn2';
            
            // AI kończy (5 elementów)
            await this.runAITurn(5, 'AI kończy rysunek...');
            
            // Przejdź do weryfikacji
            await this.runPrompt2();
        }
    }

    async runAITurn(turnsCount, statusMessage) {
        this.addToHistory(`🖊️ AI rysuje ${turnsCount} kresek...`, 'ai1');
        
        for (let i = 1; i <= turnsCount; i++) {
            this.turn = i;
            this.updateStatus(statusMessage, `AI`, i);
            
            this.showAIThinking(true);
            await this.sleep(700);
            
            const canvasState = this.canvas.getCanvasState();
            const result = await this.ai.generateMove(canvasState, this.turn, 'prompt1');
            
            if (result.stroke) {
                // AI zwróciło kreskę (stroke)
                this.canvas.addAIStroke(result.stroke);
                this.addToHistory(`AI (${i}/${turnsCount}): ${result.stroke.reasoning || 'Dorysowuję kreskę'}`, 'ai1');
            } else if (result.shape) {
                // Fallback - stary format
                this.canvas.addAIShape(result.shape);
                this.addToHistory(`AI (${i}/${turnsCount}): kształt`, 'ai1');
            }
            
            this.showAIThinking(false);
            await this.sleep(500);
        }
    }
    
    async runPrompt2() {
        this.phase = 'prompt2';
        this.updateStatus(`Weryfikacja figury...`, `Prompt #2`, 0);
        
        this.showAIThinking(true);
        this.addToHistory(`🔍 Prompt #2: Sprawdzam wspólny rysunek...`, 'ai2');
        await this.sleep(1000);
        
        const canvasState = this.canvas.getCanvasState();
        const result = await this.ai.generateMove(canvasState, 0, 'prompt2');
        
        this.showAIThinking(false);
        
        // Sprawdź warunek
        if (result.conditionMet) {
            const reason = result.reason || 'Wygląda super!';
            this.addToHistory(`✅ Prompt #2: ${reason}`, 'ai2');
            await this.sleep(1000);
            await this.runPrompt3();
        } else {
            const reason = result.reason || 'Nie wygląda sensownie';
            this.addToHistory(`❌ Prompt #2: ${reason}`, 'ai2');
            this.addToHistory(`🔄 RESET - Czyszczenie canvas i start OD NOWA!`, 'user');
            await this.sleep(1500);
            
            // KLUCZOWE: WYCZYŚĆ wszystko poza rysunkiem użytkownika i zacznij od nowa!
            this.clearAIShapes();
            this.userDrawCount = 1; // Reset do stanu po pierwszym rysunku użytkownika
            this.addToHistory(`♻️ Canvas wyczyszczony - AI próbuje ponownie...`, 'user');
            await this.sleep(1000);
            
            // Zacznij od nowa - AI próbuje zbudować inną figurę
            this.phase = 'ai_turn1';
            await this.runAITurn(5, 'AI buduje inną figurę...');
            
            // Użytkownik znowu rysuje
            this.phase = 'user_draw2';
            this.canvas.enable();
            this.updateStatus('Teraz Ty! Dodaj coś do rysunku', 'Użytkownik', 0);
            this.addToHistory(`🎨 Twoja kolej - dorysuj coś!`, 'user');
        }
    }
    
    clearAIShapes() {
        // Wyczyść wszystkie kształty poza pierwszym rysunkiem użytkownika
        const userPath = this.canvas.shapeManager.shapes.find(s => s.type === 'path');
        this.canvas.shapeManager.clear();
        if (userPath) {
            this.canvas.shapeManager.addShape(userPath);
        }
        this.canvas.redraw();
    }
    
    async runPrompt3() {
        this.phase = 'prompt3';
        this.updateStatus(
            `Prompt #3: Rozpoznaję co powstało`,
            `Prompt #3`,
            0
        );
        
        this.showAIThinking(true);
        this.addToHistory(`🎯 Prompt #3: Rozpoznawanie...`, 'user');
        await this.sleep(1500);
        
        const canvasState = this.canvas.getCanvasState();
        const result = await this.ai.generateMove(canvasState, 0, 'prompt3');
        
        this.showAIThinking(false);
        
        if (result.recognition) {
            this.addToHistory(`🎉 Rozpoznano: "${result.recognition}"`, 'user');
        }
        
        await this.sleep(1000);
        this.finishGame();
    }


    finishGame() {
        this.phase = 'finished';
        this.updateStatus('Gra zakończona!', 'Koniec', 0);
        this.addToHistory(`✅ Zakończono! Liczba cykli Prompt #1: ${this.prompt1Cycles}`, 'user');
        
        // Pokaż opcję restartu
        const controls = document.querySelector('.controls');
        if (!document.getElementById('restartBtn')) {
            const restartBtn = document.createElement('button');
            restartBtn.id = 'restartBtn';
            restartBtn.textContent = 'Nowa gra';
            restartBtn.className = 'btn-primary';
            restartBtn.onclick = () => location.reload();
            controls.appendChild(restartBtn);
        }
    }

    clearCanvas() {
        if (confirm('Czy na pewno chcesz wyczyścić canvas?')) {
            this.canvas.clear();
            this.moveHistory = [];
            document.getElementById('moveHistory').innerHTML = '';
        }
    }

    updateStatus(phase, ai, turn) {
        document.getElementById('currentPhase').textContent = phase;
        document.getElementById('activeAI').textContent = ai;
        document.getElementById('currentTurn').textContent = turn;
    }

    addToHistory(message, type) {
        this.moveHistory.push({ message, type, time: new Date() });
        
        const historyDiv = document.getElementById('moveHistory');
        const moveItem = document.createElement('div');
        moveItem.className = `move-item ${type}`;
        moveItem.textContent = message;
        historyDiv.appendChild(moveItem);
        historyDiv.scrollTop = historyDiv.scrollHeight;
    }

    showAIThinking(show) {
        document.getElementById('aiThinking').style.display = show ? 'block' : 'none';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Inicjalizacja gry po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

