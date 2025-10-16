# Jakub Hackaton 3 - AI Drawing Game 🎨

Interaktywna gra rysunkowa gdzie użytkownik i AI na zmianę rysują mazakiem, budując wspólnie sensowną figurę.

## Koncepcja

Gra inspirowana rysowaniem na kartce papieru - jeden gracz zaczyna rysować kreskę, drugi kontynuuje, aż powstaje rozpoznawalna figura (ludzik, zwierzę, drzewo, itp.).

## Przepływ gry

1. **Użytkownik** - Rysuje coś mazakiem (linia, koło, cokolwiek)
2. **AI (Prompt #1)** - Dodaje 5 kresek budując figurę
3. **Użytkownik znowu** - Dorysowuje coś
4. **AI (Prompt #1)** - Kończy rysunek (5 kresek)
5. **AI (Prompt #2)** - Weryfikuje czy wygląda sensownie
   - Jeśli NIE → Czyści i zaczyna OD NOWA
   - Jeśli TAK → Przechodzi do Prompt #3
6. **AI (Prompt #3)** - Rozpoznaje konkretnie co powstało

## Technologie

- **Frontend**: HTML5 Canvas, Vanilla JavaScript
- **Backend**: Node.js + Express
- **LLM**: Azure OpenAI GPT-4 / lokalny generator (fallback)

## Uruchomienie

```bash
npm install
npm start
# Otwórz: http://localhost:3000
```

## Konfiguracja Azure OpenAI (opcjonalna)

Utwórz plik `.env`:
```bash
AZURE_OPENAI_API_KEY=twój-klucz
AZURE_OPENAI_ENDPOINT=https://twoj-zasob.cognitiveservices.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=nazwa-deploymentu
PORT=3000
```

Aplikacja działa również bez Azure - używa lokalnego generatora kresek!

## Struktura

```
/
├── index.html          # Główna strona
├── css/style.css       # Style
├── js/
│   ├── shapes.js       # System rysowania
│   ├── canvas.js       # Obsługa canvas
│   ├── ai.js           # Integracja z LLM
│   └── game.js         # Logika gry
├── server/index.js     # Backend API
├── prompts/
│   ├── #1              # Prompt budowania figury
│   ├── #2              # Prompt weryfikacji
│   └── #3              # Prompt rozpoznawania
└── docs/               # Dokumentacja szczegółowa
```

## Autor

Jakub Chojnacki - Hackathon #003

