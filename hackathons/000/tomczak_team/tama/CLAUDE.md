# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Tamagotchi Web App** - a browser-based virtual pet with dark humor personality powered by Azure OpenAI. The pet has real-time stat decay, requires care through user actions, and responds with sarcastic AI-generated messages.

## Development Commands

**Start the application:**
```bash
make serve          # Production server at http://localhost:8000
make dev            # Development server with auto-reload
```

**Development workflow:**
```bash
make install        # Install/sync dependencies with UV
make test           # Run basic functionality tests (import checks)
make lint           # Run code linting (ruff/flake8 if available)
make format         # Format code (ruff/black if available)
make clean          # Clean cache and temporary files
```

**Configuration validation:**
```bash
make check-config   # Verify config.yml and required Azure OpenAI settings
make check-deps     # Verify UV and dependencies are installed
```

## Architecture Overview

### Core Components

**Game Engine (`lib/game_logic.py`)**
- `GameEngine` class manages single-pet state with real-time stat decay
- Auto-saves to `tamagotchi_save.json` for persistence
- Background asyncio task updates stats every 10 seconds
- Stat decay rates: hunger +20/min, happiness -25/min, energy -33/min (requires interaction every 1-2 minutes)

**AI Personality (`lib/llm_client.py` + `lib/personality.py`)**
- `TamagotchiLLMClient` integrates with Azure OpenAI AsyncClient
- `TamagotchiPersonality` generates context-aware system prompts
- Fallback responses when LLM unavailable
- Response caching for repeated interactions

**FastAPI Backend (`app/main.py`)**
- RESTful endpoints for all pet actions (feed, play, sleep, pet, talk, revive)
- WebSocket endpoint (`/ws`) for real-time state updates
- Serves static frontend from `web/` directory
- Application lifespan manager initializes all components

**WebSocket Real-time (`app/api/websocket.py`)**
- `ConnectionManager` handles multiple client connections
- `WebSocketHandler` processes client messages and broadcasts updates
- Supports action execution and chat messages through WebSocket

### Configuration

**Azure OpenAI Setup:**
The app loads configuration from both `config.yml` and environment variables (env vars take precedence):
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT` 
- `AZURE_OPENAI_API_VERSION`
- `AZURE_OPENAI_MODEL` (defaults to gpt-4.1-mini)

**Data Models (`app/models/tamagotchi.py`)**
- `TamagotchiState`: Core pet state with Pydantic validation
- `ActionResult`: Response format for user actions
- Built-in serialization methods for JSON persistence

### Frontend Architecture

**Single-page application** in `web/`:
- `index.html`: 400x600px retro game display
- `style.css`: Dark theme with neon accents and CSS animations
- `script.js`: WebSocket client with real-time updates and user interactions

The frontend maintains persistent WebSocket connection, handles button cooldowns, displays speech bubbles for AI responses, and includes debug panel (Ctrl+D).

### Key Design Patterns

1. **Single Pet Instance**: App manages one global Tamagotchi state (not multi-user)
2. **Async Throughout**: All I/O operations use asyncio (LLM calls, file saves, WebSocket)
3. **Graceful Degradation**: LLM failures fall back to hardcoded personality responses
4. **Real-time Updates**: WebSocket broadcasts state changes to all connected clients
5. **Local Persistence**: Simple JSON file storage (no database required)

### Dependencies and Tools

- **UV** for Python dependency management (replaces pip/pipenv)
- **FastAPI** for async web framework with WebSocket support  
- **Pydantic** for data validation and serialization
- **AsyncAzureOpenAI** for LLM integration
- **YAML** config parsing with environment variable override

### Testing Strategy

The `make test` command runs basic import validation. For manual testing, the health endpoint (`/health`) shows system status including LLM availability and WebSocket connection count.