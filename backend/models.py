from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId

# Data Models
class EmergencyContact(BaseModel):
    first_name: str
    last_name: str
    phone_number: str
    relationship: Optional[str] = None

class Location(BaseModel):
    ip_address: str
    city: str
    longitude: float
    latitude: float

class CallHistory(BaseModel):
    # Unique identifier for each call, increments automatically
    call_id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    notes: Optional[str] = None 
    urgency: str  # "low", "medium", or "high"
    timestamp: str  
    location: Optional[Location] = None 
    who_is_calling: Optional[str] = None 
 
class PersonBackgroundInfo(BaseModel):
    age: Optional[int] = None
    pronouns: Optional[str] = None
    job: Optional[str] = None
    leads_area: Optional[str] = None
    family_must_know: Optional[List[str]] = None

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    first_name: str
    last_name: str
    phone_number: str
    emergency_contact: Optional[EmergencyContact] = None
    background_info: Optional[str] = None
    previous_call_history: List[CallHistory] = []
    profile: Optional[PersonBackgroundInfo] = None
    
class UserBase(BaseModel):
    pass

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True 