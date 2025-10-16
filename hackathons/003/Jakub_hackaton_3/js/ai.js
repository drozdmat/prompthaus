// Integracja z LLM API

class AIController {
    constructor(apiEndpoint = 'http://localhost:3000/api') {
        this.apiEndpoint = apiEndpoint;
        this.prompts = {
            prompt1: null,
            prompt2: null,
            prompt3: null
        };
        this.loadPrompts();
    }
    
    async loadPrompts() {
        try {
            const p1 = await fetch('/prompts/#1').then(r => r.text());
            const p2 = await fetch('/prompts/#2').then(r => r.text());
            const p3 = await fetch('/prompts/#3').then(r => r.text());
            
            this.prompts.prompt1 = p1.trim();
            this.prompts.prompt2 = p2.trim();
            this.prompts.prompt3 = p3.trim();
            
            console.log('✓ Prompty załadowane:', this.prompts);
        } catch (error) {
            console.error('Błąd ładowania promptów:', error);
        }
    }

    async generateMove(canvasState, turn, promptType, userDirection = null) {
        const prompt = this.buildPromptFromFile(canvasState, turn, promptType, userDirection);
        
        try {
            const response = await fetch(`${this.apiEndpoint}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    canvasState: canvasState,
                    turn: turn,
                    promptType: promptType
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error generating AI move:', error);
            // Fallback do lokalnego generowania
            return { 
                shape: this.generateLocalMove(canvasState, turn, promptType),
                conditionMet: true // Dla lokalnego zawsze spełniony
            };
        }
    }
    
    buildPromptFromFile(canvasState, turn, promptType, userDirection) {
        let basePrompt = '';
        
        if (promptType === 'prompt1') {
            basePrompt = this.prompts.prompt1 || 'Dorysuj kreskę jak mazakiem.';
        } else if (promptType === 'prompt2') {
            basePrompt = this.prompts.prompt2 || 'Weryfikuj rysunek.';
        } else if (promptType === 'prompt3') {
            basePrompt = this.prompts.prompt3 || 'Rozpoznaj co powstało.';
        }
        
        // Uproszczony stan canvas - tylko informacje o ścieżkach
        const simplifiedState = canvasState.map(s => ({
            type: s.type,
            pointsCount: s.type === 'path' ? s.properties.points?.length : 1,
            color: s.properties?.color || s.properties?.points?.[0]
        }));
        
        let fullPrompt = `${basePrompt}\n\nObecny stan rysunku: ${JSON.stringify(simplifiedState)}\nTura: ${turn}\n\nZWRÓĆ TYLKO JSON zgodny z formatem, bez dodatkowych wyjaśnień.`;
        
        return fullPrompt;
    }


    // Lokalne generowanie jako fallback (bez API)
    generateLocalMove(canvasState, turn, personality) {
        const types = ['circle', 'rectangle', 'line', 'triangle', 'ellipse'];
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
        
        const randomType = types[Math.floor(Math.random() * types.length)];
        const x = 100 + Math.random() * 600;
        const y = 100 + Math.random() * 400;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        let properties = {
            color: color,
            opacity: 0.6 + Math.random() * 0.4,
            filled: Math.random() > 0.3,
            rotation: Math.random() * 360
        };

        // Dodaj specyficzne właściwości dla każdego typu
        switch(randomType) {
            case 'circle':
                properties.radius = 20 + Math.random() * 60;
                break;
            case 'rectangle':
                properties.width = 30 + Math.random() * 100;
                properties.height = 20 + Math.random() * 80;
                break;
            case 'line':
                properties.length = 40 + Math.random() * 100;
                properties.filled = false;
                properties.lineWidth = 2 + Math.random() * 4;
                break;
            case 'triangle':
                properties.size = 30 + Math.random() * 80;
                break;
            case 'ellipse':
                properties.radiusX = 25 + Math.random() * 60;
                properties.radiusY = 15 + Math.random() * 40;
                break;
        }

        // Modyfikacje w zależności od osobowości
        if (personality === 'chaotic' && turn % 3 === 0) {
            // Chaotyczne zmiany
            properties.rotation = Math.random() * 360;
            properties.opacity = 0.3 + Math.random() * 0.7;
        }

        return {
            type: randomType,
            x: x,
            y: y,
            properties: properties,
            reasoning: personality === 'chaotic' ? 
                'Dodaję element chaosu!' : 
                'Harmonizuję kompozycję'
        };
    }

}

