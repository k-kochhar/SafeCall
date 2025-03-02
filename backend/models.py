from pydantic import BaseModel, Field
from typing import List, Optional

# Data Models
class EmergencyContact(BaseModel):
    name: str
    phone_number: str
    relationship: Optional[str] = None

class UserBase(BaseModel):
    user_id: str
    name: str
    phone_number: str
    emergency_contacts: List[EmergencyContact] = []
    background_context: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True 