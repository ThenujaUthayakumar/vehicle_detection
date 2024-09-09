from sqlalchemy.orm import Session
from models import User
from schemas import UserCreate
from security import hash_password
from fastapi import HTTPException


#User Create 
def create_user(db: Session, user: UserCreate):
    if not user.username or not user.hashed_password or not user.role:
        raise HTTPException(status_code=400, detail="All fields are required")
    
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_password = hash_password(user.hashed_password)
    db_user = User(username=user.username, hashed_password=hashed_password, role=user.role)
    db.add(db_user)
    
    try:
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating user: {e}")
    
#User Login
def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()
