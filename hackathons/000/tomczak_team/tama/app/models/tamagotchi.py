from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import Optional
import json


class TamagotchiState(BaseModel):
    """Core state model for the Tamagotchi pet."""
    
    # Basic properties
    name: str = "Tama"
    age: int = 0  # in minutes
    
    # Core stats (0-100)
    hunger: int = Field(default=50, ge=0, le=100)
    happiness: int = Field(default=75, ge=0, le=100) 
    energy: int = Field(default=100, ge=0, le=100)
    
    # Status
    is_alive: bool = True
    current_mood: str = "😊"
    
    # Timestamps for decay calculations
    last_fed: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_played: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_slept: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_pet: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Game state
    total_interactions: int = 0
    deaths: int = 0
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
    
    def get_mood_emoji(self) -> str:
        """Determine mood emoji based on current stats."""
        if not self.is_alive:
            return "💀"
        
        # Critical states
        if self.hunger >= 90:
            return "😵"
        if self.energy <= 10:
            return "😴"
        if self.happiness <= 10:
            return "😢"
            
        # Happy states
        if self.happiness >= 80 and self.energy >= 70:
            return "😊"
        elif self.happiness >= 60:
            return "🙂"
        elif self.happiness >= 40:
            return "😐"
        else:
            return "😔"
    
    def get_neglect_level(self) -> int:
        """Calculate neglect level based on time since last interaction."""
        now = datetime.now(timezone.utc)
        times_since = [
            (now - self.last_fed).total_seconds() / 60,
            (now - self.last_played).total_seconds() / 60,
            (now - self.last_pet).total_seconds() / 60
        ]
        max_time_since = max(times_since)
        
        if max_time_since < 5:
            return 0  # Well cared for
        elif max_time_since < 15:
            return 1  # Slightly neglected
        elif max_time_since < 30:
            return 2  # Neglected
        else:
            return 3  # Very neglected
    
    def should_die(self) -> bool:
        """Check if Tamagotchi should die based on stats."""
        return self.hunger >= 100 or self.happiness <= 0 or self.energy <= 0
    
    def kill(self):
        """Kill the Tamagotchi."""
        self.is_alive = False
        self.current_mood = "💀"
        self.deaths += 1
    
    def revive(self):
        """Revive the Tamagotchi with moderate stats."""
        self.is_alive = True
        self.hunger = 60
        self.happiness = 50
        self.energy = 70
        self.current_mood = self.get_mood_emoji()
    
    def update_mood(self):
        """Update current mood based on stats."""
        self.current_mood = self.get_mood_emoji()
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        data = self.model_dump()
        # Convert datetime objects to ISO strings
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
        return data
    
    @classmethod
    def from_dict(cls, data: dict) -> 'TamagotchiState':
        """Create instance from dictionary."""
        # Convert ISO strings back to datetime objects
        datetime_fields = ['last_fed', 'last_played', 'last_slept', 'last_pet', 'created_at']
        for field in datetime_fields:
            if field in data and isinstance(data[field], str):
                data[field] = datetime.fromisoformat(data[field])
        return cls(**data)


class ActionResult(BaseModel):
    """Result of a user action on the Tamagotchi."""
    
    success: bool
    message: str
    stat_changes: dict = {}
    new_mood: str = ""
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TalkRequest(BaseModel):
    """Request for talking to the Tamagotchi."""
    
    message: Optional[str] = None
    action_context: Optional[str] = None  # e.g., "just_fed", "just_played"