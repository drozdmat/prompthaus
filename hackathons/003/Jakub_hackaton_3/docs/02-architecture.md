# Architektura Aplikacji

## 🏗️ Architektura Wysokiego Poziomu

```mermaid
graph TB
    subgraph "Frontend - Przeglądarka"
        A[index.html] --> B[Canvas Controller]
        A --> C[Game Controller]
        A --> D[AI Controller]
        A --> E[Shape Manager]
    end
    
    subgraph "Backend - Node.js Server"
        F[Express API] --> G[OpenAI Integration]
        F --> H[Local Generator]
    end
    
    C --> D
    D --> F
    B --> E
    C --> B
```

## 📁 Struktura Projektu

```
/
├── index.html              # Główna strona aplikacji
├── package.json           # Zależności Node.js
├── .env.example          # Przykładowa konfiguracja
├── .gitignore            # Ignorowane pliki
│
├── css/
│   └── style.css         # Style aplikacji
│
├── js/
│   ├── shapes.js         # System zarządzania kształtami
│   ├── canvas.js         # Obsługa Canvas API
│   ├── ai.js             # Klient API dla AI
│   └── game.js           # Główna logika gry
│
├── server/
│   └── index.js          # Backend API
│
├── docs/
│   ├── 01-overview.md    # Przegląd projektu
│   ├── 02-architecture.md # Architektura (ten plik)
│   ├── 03-api.md         # Dokumentacja API
│   └── 04-game-flow.md   # Szczegóły przepływu gry
│
└── README.md             # Główne README
```

## 🎨 Frontend - Komponenty

### 1. Shape Manager (`shapes.js`)

Odpowiedzialny za definicję i renderowanie kształtów.

```mermaid
classDiagram
    class Shape {
        +String type
        +Number x
        +Number y
        +Object properties
        +Number id
        +draw(ctx)
        +toJSON()
    }
    
    class ShapeManager {
        -Array shapes
        +addShape(shape)
        +removeShape(shape)
        +clear()
        +getAllShapes()
        +drawAll(ctx)
        +toJSON()
    }
    
    ShapeManager "1" --> "*" Shape
```

**Kluczowe metody:**
- `draw(ctx)` - Renderuje kształt na canvas
- `toJSON()` - Serializacja do wysłania do API

### 2. Canvas Controller (`canvas.js`)

Zarządza interakcją użytkownika z Canvas.

```mermaid
stateDiagram-v2
    [*] --> Disabled
    Disabled --> Enabled: enable()
    Enabled --> Drawing: mousedown
    Drawing --> Drawing: mousemove
    Drawing --> Enabled: mouseup
    Enabled --> Disabled: disable()
    Drawing --> [*]: createShape()
```

**Kluczowe metody:**
- `handleMouseDown/Move/Up()` - Obsługa rysowania
- `createShape()` - Tworzenie kształtu z gestu użytkownika
- `addAIShape()` - Dodawanie kształtu od AI
- `getCanvasState()` - Eksport stanu do JSON

### 3. AI Controller (`ai.js`)

Komunikacja z backend API i generowanie ruchów AI.

**Funkcje:**
- `generateMove()` - Wysyła zapytanie do API
- `buildPrompt()` - Konstruuje prompt dla LLM
- `generateLocalMove()` - Fallback bez API

### 4. Game Controller (`game.js`)

Orkiestruje cały przepływ gry.

```mermaid
stateDiagram-v2
    [*] --> Waiting
    Waiting --> UserDraw: startGame()
    UserDraw --> AI1: handleUserShape()
    AI1 --> AI1: runAITurns (10x)
    AI1 --> UserInput: after 10 turns
    UserInput --> AI2: continueToAI2()
    AI2 --> AI2: runAITurns (10x)
    AI2 --> Finished: after 10 turns
    Finished --> [*]
```

## 🔧 Backend - Struktura

### Express Server (`server/index.js`)

```mermaid
sequenceDiagram
    participant F as Frontend
    participant API as Express API
    participant LLM as OpenAI/Local
    
    F->>API: POST /api/generate
    API->>API: Validate request
    alt Has OpenAI Key
        API->>LLM: Generate with GPT-4
        LLM-->>API: JSON response
    else No API Key
        API->>API: generateLocalShape()
    end
    API-->>F: { shape: {...} }
```

**Endpointy:**
- `POST /api/generate` - Generuje ruch AI
- `GET /api/health` - Status serwera

## 🔄 Przepływ Danych

```mermaid
graph LR
    A[User Input] --> B[Canvas State]
    B --> C[Shape Manager]
    C --> D[JSON Serialization]
    D --> E[AI Controller]
    E --> F[Backend API]
    F --> G[LLM]
    G --> H[Shape Data]
    H --> I[Canvas Controller]
    I --> C
```

## 🎯 Separacja Odpowiedzialności

| Komponent | Odpowiedzialność | Zależności |
|-----------|-----------------|-----------|
| **Shape** | Definicja i renderowanie pojedynczego kształtu | Brak |
| **ShapeManager** | Zarządzanie kolekcją kształtów | Shape |
| **CanvasController** | Interakcja canvas, eventy myszy | ShapeManager |
| **AIController** | Komunikacja z API, generowanie | Brak |
| **GameController** | Orkiestracja gry, stan | Wszystkie powyższe |
| **Express API** | Obsługa requestów, integracja LLM | OpenAI SDK |

## 🔐 Bezpieczeństwo

- **API Key**: Przechowywany w `.env`, nigdy w kodzie
- **CORS**: Włączony dla lokalnego developmentu
- **Walidacja**: Sprawdzanie formatów shape JSON
- **Fallback**: Lokalne generowanie gdy API niedostępne

## ⚡ Optymalizacja

1. **Canvas Rendering**: Redraw tylko gdy potrzebne
2. **API Calls**: Throttling między turami AI (600-800ms delay)
3. **State Management**: Minimalna struktura danych
4. **Memory**: Limit historii ruchów (scroll container)

