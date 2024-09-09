from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class UserRoleEnum(str, Enum):
    user = "user"
    admin = "admin"
    
class UserCreate(BaseModel):
    username: str
    hashed_password: str
    role: str

class UserRead(BaseModel):
    id: int
    username: str
    role: UserRoleEnum

    class Config:
        orm_mode = True

class VehicleCountResponse(BaseModel):
    vehicle_name: str
    total_counts: int
    date: datetime

    class Config:
        from_attributes = True
