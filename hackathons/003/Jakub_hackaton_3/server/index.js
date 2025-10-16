const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { AzureOpenAI } = require('openai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialize Azure OpenAI
let azureOpenAI = null;
if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
    azureOpenAI = new AzureOpenAI({
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        endpoint: process.env.AZURE_OPENAI_ENDPOINT,
        apiVersion: "2024-08-01-preview"
    });
}

// API endpoint do generowania ruchów AI
app.post('/api/generate', async (req, res) => {
    try {
        const { prompt, canvasState, turn, promptType } = req.body;

        if (azureOpenAI) {
            // Użyj Azure OpenAI API
            const completion = await azureOpenAI.chat.completions.create({
                model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "Jesteś AI artystą w grze rysunkowej. Zwracaj TYLKO poprawny JSON zgodny z formatem, bez dodatkowych wyjaśnień."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" },
                temperature: promptType === 'prompt1' ? 0.8 : 0.5,
                max_tokens: 1000
            });

            const aiResponse = JSON.parse(completion.choices[0].message.content);
            res.json(aiResponse);
        } else {
            // Fallback - generowanie lokalne
            const result = generateLocalResponse(canvasState, turn, promptType);
            res.json(result);
        }
    } catch (error) {
        console.error('Error generating AI move:', error);
        
        // Fallback w przypadku błędu
        const result = generateLocalResponse(req.body.canvasState, req.body.turn, req.body.promptType);
        res.json(result);
    }
});

// Nowa funkcja do generowania odpowiedzi lokalnych (ŚCIEŻKI zamiast kształtów!)
function generateLocalResponse(canvasState, turn, promptType) {
    if (promptType === 'prompt1') {
        // Prompt #1: Dorysuj kreskę/ruch mazakiem
        return {
            stroke: generateLocalStroke(canvasState, turn)
        };
    } else if (promptType === 'prompt2') {
        // Prompt #2: Weryfikacja wspólnego rysunku
        const nonPathShapes = canvasState ? canvasState.filter(s => s.type !== 'path') : [];
        
        // Kryteria dla wspólnego rysunku:
        // 1. Minimum 8 elementów razem (użytkownik rysował 2x + AI 2x)
        const hasEnoughParts = nonPathShapes.length >= 8;
        
        // 2. Struktura pionowa (góra-środek-dół)
        const hasVerticalSpread = checkVerticalDistribution(nonPathShapes);
        
        // 3. Blisko siebie (max 120px)
        const areClose = checkShapesProximity(nonPathShapes, 120);
        
        // 4. 60% szans na akceptację (łatwiej niż wcześniej)
        const randomFactor = Math.random() > 0.4;
        
        const isCoherent = hasEnoughParts && hasVerticalSpread && areClose && randomFactor;
        
        return {
            shape: null,
            conditionMet: isCoherent,
            reason: !hasEnoughParts ? 'Za mało elementów (min. 8)' : 
                    !hasVerticalSpread ? 'Brak struktury' :
                    !areClose ? 'Rozproszone' : 
                    !randomFactor ? 'Jeszcze nie' : 
                    'Świetnie wygląda!'
        };
    } else if (promptType === 'prompt3') {
        // Prompt #3: Konkretne rozpoznawanie
        const nonPathShapes = canvasState ? canvasState.filter(s => s.type !== 'path') : [];
        
        // Analiza struktury
        const hasCircles = nonPathShapes.some(s => s.type === 'circle' || s.type === 'ellipse');
        const hasLines = nonPathShapes.some(s => s.type === 'line');
        const hasVertical = checkVerticalDistribution(nonPathShapes);
        
        // Prosta heurystyka rozpoznawania
        let recognition = '';
        
        if (hasCircles && hasLines && hasVertical) {
            const possibilities = [
                'Ludzik z patyczków z głową, ciałem i kończynami',
                'Prosta postać - widać głowę i ciało',
                'Szkicowa sylwetka człowieka',
                'Figurka z okrągłą głową i liniowymi kończynami'
            ];
            recognition = possibilities[Math.floor(Math.random() * possibilities.length)];
        } else if (hasCircles && !hasVertical) {
            recognition = 'Twarz lub główka z detalami';
        } else if (hasLines && hasVertical) {
            const options = ['Drzewo z pniem i gałęziami', 'Wertykalna struktura przypominająca roślinę'];
            recognition = options[Math.floor(Math.random() * options.length)];
        } else if (hasLines) {
            recognition = 'Szkic złożony z linii - może być dom, most lub konstrukcja';
        } else {
            recognition = 'Prosta figura z elementów geometrycznych';
        }
        
        return {
            recognition: recognition
        };
    }
    
    return { shape: null };
}

// Funkcja generująca KRESKĘ (jak rysowanie mazakiem!)
function generateLocalStroke(canvasState, turn) {
    const colors = ['#000000', '#333333', '#FF6B6B', '#4ECDC4', '#98D8C8'];
    
    // Znajdź rysunek użytkownika
    let centerX = 400;
    let centerY = 300;
    let baseColor = '#000000';
    let userPathShape = 'unknown';
    
    if (canvasState && canvasState.length > 0) {
        const userPath = canvasState.find(s => s.type === 'path');
        if (userPath && userPath.properties.points) {
            const points = userPath.properties.points;
            centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
            centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
            baseColor = userPath.properties.color || baseColor;
            
            // Prosta analiza kształtu użytkownika
            const isVertical = Math.abs(points[0].y - points[points.length-1].y) > Math.abs(points[0].x - points[points.length-1].x);
            const isCircular = points.length > 20 && Math.abs(points[0].x - points[points.length-1].x) < 50;
            
            if (isCircular) userPathShape = 'circular';
            else if (isVertical) userPathShape = 'vertical';
            else userPathShape = 'horizontal';
        }
    }
    
    const color = Math.random() > 0.3 ? baseColor : colors[Math.floor(Math.random() * colors.length)];
    
    // AI DECYDUJE co budować na podstawie rysunku użytkownika i numeru tury
    let shapeType, x, y, properties;
    
    // STRATEGIA UNIWERSALNA: buduj strukturę góra-środek-dół z detalami
    
    if (turn <= 3) {
        // GÓRNA CZĘŚĆ - główka, czubek, górny element
        const upperShapes = ['circle', 'ellipse', 'line'];
        shapeType = upperShapes[Math.floor(Math.random() * upperShapes.length)];
        
        x = centerX + (Math.random() - 0.5) * 40;
        y = centerY - 35 - Math.random() * 25;  // POWYŻEJ
        
        if (shapeType === 'circle') {
            properties = { radius: 12 + Math.random() * 20, color, opacity: 0.8, filled: Math.random() > 0.5, lineWidth: 2 };
        } else if (shapeType === 'ellipse') {
            properties = { radiusX: 15 + Math.random() * 20, radiusY: 10 + Math.random() * 15, color, opacity: 0.8, filled: false, lineWidth: 2 };
        } else {
            properties = { length: 20 + Math.random() * 40, color, opacity: 0.8, filled: false, lineWidth: 2, rotation: Math.random() * 180 };
        }
    } else if (turn <= 6) {
        // ŚRODEK - ciało, korpus, część środkowa
        shapeType = Math.random() > 0.3 ? 'line' : 'rectangle';
        
        x = centerX + (Math.random() - 0.5) * 30;
        y = centerY + (Math.random() - 0.5) * 25;  // ŚRODEK
        
        if (shapeType === 'line') {
            properties = { 
                length: 30 + Math.random() * 50, 
                color, 
                opacity: 0.8, 
                filled: false, 
                lineWidth: 2 + Math.random() * 2, 
                rotation: 80 + Math.random() * 20  // W miarę pionowo
            };
        } else {
            properties = { width: 20 + Math.random() * 30, height: 30 + Math.random() * 40, color, opacity: 0.8, filled: false };
        }
    } else if (turn <= 8) {
        // DOLNA CZĘŚĆ - nogi, podstawa, korzeń
        shapeType = 'line';
        
        x = centerX + (Math.random() - 0.5) * 50;
        y = centerY + 25 + Math.random() * 30;  // PONIŻEJ
        
        properties = {
            length: 25 + Math.random() * 40,
            color,
            opacity: 0.8,
            filled: false,
            lineWidth: 2 + Math.random() * 2,
            rotation: 60 + Math.random() * 60  // Skośnie w dół
        };
    } else {
        // DETALE - boczne elementy, akcesoria
        const detailShapes = ['line', 'circle', 'triangle'];
        shapeType = detailShapes[Math.floor(Math.random() * detailShapes.length)];
        
        // Z boku lub gdziekolwiek
        x = centerX + (Math.random() - 0.5) * 60;
        y = centerY + (Math.random() - 0.5) * 50;
        
        if (shapeType === 'line') {
            properties = { length: 15 + Math.random() * 35, color, opacity: 0.8, filled: false, lineWidth: 1 + Math.random() * 2, rotation: Math.random() * 360 };
        } else if (shapeType === 'circle') {
            properties = { radius: 3 + Math.random() * 10, color, opacity: 0.9, filled: Math.random() > 0.5 };
        } else {
            properties = { size: 8 + Math.random() * 20, color, opacity: 0.8, filled: Math.random() > 0.6 };
        }
    }

    // Zamiast kształtów - generuj KRESKĘ (stroke) z punktami!
    const points = [];
    const numPoints = 3 + Math.floor(Math.random() * 5); // 3-7 punktów
    
    for (let i = 0; i < numPoints; i++) {
        const px = x + (Math.random() - 0.5) * 30;
        const py = y + i * 10 + (Math.random() - 0.5) * 15;
        points.push({ x: Math.round(px), y: Math.round(py) });
    }
    
    return {
        points: points,
        color: color,
        thickness: 2 + Math.floor(Math.random() * 2),
        reasoning: turn <= 3 ? 'Rysuję górną część' : 
                   turn <= 6 ? 'Rysuję środek' : 
                   turn <= 8 ? 'Rysuję dolną część' : 
                   'Dodaję detale'
    };
}

function invertColor(hex) {
    // Prosta inwersja koloru
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Sprawdź czy linie/kształty są blisko siebie
function checkShapesProximity(shapes, maxDistance = 100) {
    if (shapes.length < 2) return false;
    
    for (let i = 0; i < shapes.length - 1; i++) {
        let hasNearby = false;
        for (let j = i + 1; j < shapes.length; j++) {
            const dx = shapes[i].x - shapes[j].x;
            const dy = shapes[i].y - shapes[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < maxDistance) {
                hasNearby = true;
                break;
            }
        }
        if (!hasNearby) return false;
    }
    
    return true;
}

// Sprawdź czy elementy są rozłożone pionowo (góra-środek-dół) - jak postać
function checkVerticalDistribution(shapes) {
    if (shapes.length < 3) return false;
    
    const yPositions = shapes.map(s => s.y).sort((a, b) => a - b);
    const minY = yPositions[0];
    const maxY = yPositions[yPositions.length - 1];
    
    // Czy rozpiętość pionowa jest większa niż 50px? (ma strukturę góra-dół)
    return (maxY - minY) > 50;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        hasAzureOpenAI: !!azureOpenAI,
        deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'not configured',
        message: azureOpenAI ? 'Using Azure OpenAI API' : 'Using local generation'
    });
});

app.listen(PORT, () => {
    console.log(`🎨 AI Drawing Chaos server running on http://localhost:${PORT}`);
    console.log(`Azure OpenAI: ${azureOpenAI ? 'Connected ✓' : 'Not configured (using local generation)'}`);
    if (azureOpenAI) {
        console.log(`Deployment: ${process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'default'}`);
    }
});

