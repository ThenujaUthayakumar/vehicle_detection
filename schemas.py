from pydantic import BaseModel
from datetime import datetime,date
from enum import Enum


# Users
class UserRoleEnum(str, Enum):
    user = "user"
    admin = "admin"

class UserCreate(BaseModel):
    username: str
    password: str
    role: UserRoleEnum
    firstName: str
    lastName:str
    phoneNumber: str
    address: str
    email: str

class UserUpdate(BaseModel):
    username: str
    password: str
    role: UserRoleEnum
    firstName: str
    lastName: str
    phoneNumber: str
    address: str
    email: str
    id: int

class UserRead(BaseModel):
    id: int
    username: str
    role: UserRoleEnum
    first_name: str
    last_name: str
    phone_number: str
    address: str
    email: str
    reference_number: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ===================================================================================================

#videos
class VideoCreate(BaseModel):
    videoTitle: str
    videoLocation: str
    video: str
    referenceNumber: str
    userId: int

class VideoUpdate(BaseModel):
    videoTitle: str
    videoLocation: str
    video: str
    userId: int
    referenceNumber: str
    id: int

class VideoRead(BaseModel):
    reference_number: str
    video_title: str
    video_location: str
    video: str
    status: int
    id: int
    user: UserRead
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class VideoDelete(BaseModel):
    reference_number: str
    video_title: str
    video_location: str
    video: str
    status: int
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class VideoStatusChange(BaseModel):
    status: int
    id: int
    user_id: int

    class Config:
        orm_mode = True

class VideoStatusChangeRequest(BaseModel):
    id: int
    status: int

# ====================================================

class VehicleCountResponse(BaseModel):
    vehicle_name: str
    total_counts: int
    date: date
    video_title: str

    class Config:
        from_attributes = True

class VehicleCountResponseAll(BaseModel):
    vehicle_name: str
    total_counts: int
    date: date
    video_title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True