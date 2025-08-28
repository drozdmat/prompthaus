import asyncio
import json
from typing import List
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime


class ConnectionManager:
    """Manages WebSocket connections for real-time updates."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Accept and store a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific WebSocket connection."""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            print(f"Error sending personal message: {e}")
            self.disconnect(websocket)
    
    async def broadcast(self, message: dict):
        """Broadcast a message to all connected WebSocket clients."""
        if not self.active_connections:
            return
        
        message_json = json.dumps(message)
        disconnected = []
        
        for connection in self.active_connections:
            try:
                await connection.send_text(message_json)
            except Exception as e:
                print(f"Error broadcasting to connection: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected connections
        for connection in disconnected:
            self.disconnect(connection)
    
    async def broadcast_state_update(self, tamagotchi_state):
        """Broadcast Tamagotchi state update to all clients."""
        message = {
            "type": "state_update",
            "timestamp": datetime.now().isoformat(),
            "data": tamagotchi_state.to_dict() if tamagotchi_state else None
        }
        await self.broadcast(message)
    
    async def broadcast_action_result(self, action: str, result: dict, response: str = ""):
        """Broadcast action result to all clients."""
        message = {
            "type": "action_result",
            "action": action,
            "timestamp": datetime.now().isoformat(),
            "success": result.get("success", False),
            "message": result.get("message", ""),
            "stat_changes": result.get("stat_changes", {}),
            "response": response
        }
        await self.broadcast(message)
    
    async def broadcast_chat_message(self, response: str, mood: str):
        """Broadcast chat message from Tamagotchi."""
        message = {
            "type": "chat_message",
            "timestamp": datetime.now().isoformat(),
            "response": response,
            "mood": mood
        }
        await self.broadcast(message)
    
    async def send_welcome_message(self, websocket: WebSocket, tamagotchi_state):
        """Send welcome message to newly connected client."""
        message = {
            "type": "welcome",
            "timestamp": datetime.now().isoformat(),
            "message": "Connected to Tamagotchi!",
            "data": tamagotchi_state.to_dict() if tamagotchi_state else None
        }
        await self.send_personal_message(message, websocket)
    
    def get_connection_count(self) -> int:
        """Get the number of active connections."""
        return len(self.active_connections)


class WebSocketHandler:
    """Handles WebSocket events and messages."""
    
    def __init__(self, connection_manager: ConnectionManager, game_engine, llm_client):
        self.connection_manager = connection_manager
        self.game_engine = game_engine
        self.llm_client = llm_client
    
    async def handle_websocket(self, websocket: WebSocket):
        """Main WebSocket handler."""
        await self.connection_manager.connect(websocket)
        
        # Send welcome message with current state
        current_state = await self.game_engine.get_state()
        await self.connection_manager.send_welcome_message(websocket, current_state)
        
        try:
            while True:
                # Wait for client messages
                data = await websocket.receive_text()
                await self.handle_client_message(websocket, data)
        
        except WebSocketDisconnect:
            self.connection_manager.disconnect(websocket)
        except Exception as e:
            print(f"WebSocket error: {e}")
            self.connection_manager.disconnect(websocket)
    
    async def handle_client_message(self, websocket: WebSocket, data: str):
        """Handle incoming client messages."""
        try:
            message = json.loads(data)
            message_type = message.get("type")
            
            if message_type == "ping":
                # Respond to ping with pong
                await self.connection_manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                }, websocket)
            
            elif message_type == "get_state":
                # Send current state to client
                current_state = await self.game_engine.get_state()
                await self.connection_manager.send_personal_message({
                    "type": "state_update",
                    "timestamp": datetime.now().isoformat(),
                    "data": current_state.to_dict() if current_state else None
                }, websocket)
            
            elif message_type == "action":
                # Handle game actions
                await self.handle_action_message(message)
            
            elif message_type == "chat":
                # Handle chat messages
                await self.handle_chat_message(message)
            
            else:
                await self.connection_manager.send_personal_message({
                    "type": "error",
                    "message": f"Unknown message type: {message_type}",
                    "timestamp": datetime.now().isoformat()
                }, websocket)
        
        except json.JSONDecodeError:
            await self.connection_manager.send_personal_message({
                "type": "error",
                "message": "Invalid JSON format",
                "timestamp": datetime.now().isoformat()
            }, websocket)
        except Exception as e:
            print(f"Error handling client message: {e}")
            await self.connection_manager.send_personal_message({
                "type": "error",
                "message": "Internal server error",
                "timestamp": datetime.now().isoformat()
            }, websocket)
    
    async def handle_action_message(self, message: dict):
        """Handle game action messages."""
        action = message.get("action")
        
        if action == "feed":
            result = await self.game_engine.feed()
        elif action == "play":
            result = await self.game_engine.play()
        elif action == "sleep":
            result = await self.game_engine.sleep()
        elif action == "pet":
            result = await self.game_engine.pet()
        elif action == "revive":
            result = await self.game_engine.revive()
        else:
            await self.connection_manager.broadcast({
                "type": "error",
                "message": f"Unknown action: {action}",
                "timestamp": datetime.now().isoformat()
            })
            return
        
        # Get current state and LLM response
        current_state = await self.game_engine.get_state()
        llm_response = await self.llm_client.get_response(
            current_state,
            action=action,
            action_result=result.model_dump()
        )
        
        # Broadcast action result
        await self.connection_manager.broadcast_action_result(
            action,
            {
                "success": result.success,
                "message": result.message,
                "stat_changes": result.stat_changes
            },
            llm_response
        )
        
        # Broadcast updated state
        await self.connection_manager.broadcast_state_update(current_state)
    
    async def handle_chat_message(self, message: dict):
        """Handle chat messages."""
        user_message = message.get("message", "")
        
        current_state = await self.game_engine.get_state()
        llm_response = await self.llm_client.get_response(
            current_state,
            action="talk",
            user_message=user_message
        )
        
        await self.connection_manager.broadcast_chat_message(
            llm_response,
            current_state.current_mood if current_state else "😐"
        )