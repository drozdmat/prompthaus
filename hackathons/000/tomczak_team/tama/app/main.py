from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel
from typing import Optional
import os

from lib.game_logic import GameEngine
from lib.llm_client import TamagotchiLLMClient
from app.models.tamagotchi import TalkRequest
from app.api.websocket import ConnectionManager, WebSocketHandler


class CreateTamagotchiRequest(BaseModel):
    name: str


class TalkResponse(BaseModel):
    response: str
    mood: str
    timestamp: str


# Global instances
game_engine: GameEngine
llm_client: TamagotchiLLMClient
connection_manager: ConnectionManager
websocket_handler: WebSocketHandler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global game_engine, llm_client, connection_manager, websocket_handler
    
    # Initialize game engine and LLM client
    game_engine = GameEngine()
    llm_client = TamagotchiLLMClient()
    
    # Initialize WebSocket components
    connection_manager = ConnectionManager()
    websocket_handler = WebSocketHandler(connection_manager, game_engine, llm_client)
    
    # Try to load existing save
    existing_state = await game_engine.load_state()
    if existing_state:
        print(f"Loaded existing Tamagotchi: {existing_state.name}")
    else:
        # Create default Tamagotchi
        await game_engine.create_new_tamagotchi("Tama")
        print("Created new Tamagotchi: Tama")
    
    # Start background updates
    await game_engine.start_background_updates()
    
    # Test LLM connection
    llm_working = await llm_client.test_connection()
    print(f"LLM connection: {'✓' if llm_working else '✗ (using fallbacks)'}")
    
    yield
    
    # Cleanup on shutdown
    await game_engine.stop_background_updates()
    await game_engine.save_state()


app = FastAPI(
    title="Tamagotchi Web App",
    description="Dark humor Tamagotchi powered by Azure OpenAI",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for frontend
web_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "web")
if os.path.exists(web_dir):
    app.mount("/static", StaticFiles(directory=web_dir), name="static")


@app.get("/", response_class=HTMLResponse)
async def serve_frontend():
    """Serve the main frontend page."""
    html_file = os.path.join(web_dir, "index.html")
    if os.path.exists(html_file):
        return FileResponse(html_file)
    else:
        return HTMLResponse("""
        <html>
            <body>
                <h1>Tamagotchi Web App</h1>
                <p>Frontend not yet available. API is running at /api/</p>
            </body>
        </html>
        """)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "tamagotchi_exists": game_engine.tamagotchi is not None,
        "llm_available": llm_client.client is not None,
        "websocket_connections": connection_manager.get_connection_count()
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await websocket_handler.handle_websocket(websocket)


@app.post("/api/tamagotchi/create")
async def create_tamagotchi(request: CreateTamagotchiRequest):
    """Create a new Tamagotchi with given name."""
    try:
        tamagotchi = await game_engine.create_new_tamagotchi(request.name)
        
        # Get welcome message from LLM
        welcome_response = await llm_client.get_response(
            tamagotchi,
            action="create",
            user_message=f"I just named you {request.name}"
        )
        
        return {
            "success": True,
            "message": f"Created Tamagotchi: {request.name}",
            "tamagotchi": tamagotchi.to_dict(),
            "welcome_message": welcome_response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tamagotchi/state")
async def get_tamagotchi_state():
    """Get current Tamagotchi state."""
    try:
        state = await game_engine.get_state()
        if not state:
            raise HTTPException(status_code=404, detail="No Tamagotchi found")
        
        return {
            "success": True,
            "tamagotchi": state.to_dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tamagotchi/feed")
async def feed_tamagotchi():
    """Feed the Tamagotchi."""
    try:
        result = await game_engine.feed()
        state = await game_engine.get_state()
        
        # Get response from LLM
        llm_response = await llm_client.get_response(
            state,
            action="feed",
            action_result=result.model_dump()
        )
        
        return {
            "success": result.success,
            "message": result.message,
            "stat_changes": result.stat_changes,
            "tamagotchi": state.to_dict(),
            "response": llm_response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tamagotchi/play")
async def play_with_tamagotchi():
    """Play with the Tamagotchi."""
    try:
        result = await game_engine.play()
        state = await game_engine.get_state()
        
        # Get response from LLM
        llm_response = await llm_client.get_response(
            state,
            action="play",
            action_result=result.model_dump()
        )
        
        return {
            "success": result.success,
            "message": result.message,
            "stat_changes": result.stat_changes,
            "tamagotchi": state.to_dict(),
            "response": llm_response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tamagotchi/sleep")
async def sleep_tamagotchi():
    """Put the Tamagotchi to sleep."""
    try:
        result = await game_engine.sleep()
        state = await game_engine.get_state()
        
        # Get response from LLM
        llm_response = await llm_client.get_response(
            state,
            action="sleep",
            action_result=result.model_dump()
        )
        
        return {
            "success": result.success,
            "message": result.message,
            "stat_changes": result.stat_changes,
            "tamagotchi": state.to_dict(),
            "response": llm_response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tamagotchi/pet")
async def pet_tamagotchi():
    """Pet the Tamagotchi."""
    try:
        result = await game_engine.pet()
        state = await game_engine.get_state()
        
        # Get response from LLM
        llm_response = await llm_client.get_response(
            state,
            action="pet",
            action_result=result.model_dump()
        )
        
        return {
            "success": result.success,
            "message": result.message,
            "stat_changes": result.stat_changes,
            "tamagotchi": state.to_dict(),
            "response": llm_response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tamagotchi/revive")
async def revive_tamagotchi():
    """Revive a dead Tamagotchi."""
    try:
        result = await game_engine.revive()
        state = await game_engine.get_state()
        
        # Get response from LLM
        llm_response = await llm_client.get_response(
            state,
            action="revive",
            action_result=result.model_dump()
        )
        
        return {
            "success": result.success,
            "message": result.message,
            "stat_changes": result.stat_changes,
            "tamagotchi": state.to_dict(),
            "response": llm_response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tamagotchi/reset")
async def reset_tamagotchi_game():
    """Reset the game completely - delete all progress and start fresh."""
    try:
        # Clear LLM cache for fresh responses
        llm_client.clear_cache()
        
        # Reset the game
        fresh_state = await game_engine.reset_game()
        
        # Get welcome message for new game
        welcome_response = await llm_client.get_response(
            fresh_state,
            action="create",
            user_message="Game has been reset - I'm starting fresh!"
        )
        
        return {
            "success": True,
            "message": "Game reset successfully! Starting fresh.",
            "tamagotchi": fresh_state.to_dict(),
            "response": welcome_response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tamagotchi/talk", response_model=TalkResponse)
async def talk_to_tamagotchi(request: TalkRequest):
    """Talk to the Tamagotchi."""
    try:
        state = await game_engine.get_state()
        if not state:
            raise HTTPException(status_code=404, detail="No Tamagotchi found")
        
        # Get response from LLM
        llm_response = await llm_client.get_response(
            state,
            action="talk",
            user_message=request.message,
            action_result={'action_context': request.action_context} if request.action_context else None
        )
        
        return TalkResponse(
            response=llm_response,
            mood=state.current_mood,
            timestamp=state.last_fed.isoformat()  # Use any recent timestamp
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stats")
async def get_stats():
    """Get application statistics."""
    try:
        state = await game_engine.get_state()
        cache_stats = llm_client.get_cache_stats()
        
        return {
            "tamagotchi_stats": {
                "name": state.name if state else None,
                "age_minutes": state.age if state else None,
                "total_interactions": state.total_interactions if state else None,
                "deaths": state.deaths if state else None,
                "is_alive": state.is_alive if state else None
            },
            "system_stats": {
                "llm_cache_size": cache_stats["cache_size"],
                "llm_available": llm_client.client is not None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)