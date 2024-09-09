from fastapi import FastAPI, HTTPException, Depends, status
from sqlalchemy.orm import Session
from models import engine, SessionLocal, init_db
from schemas import UserCreate, UserRead, VehicleCountResponse
from crud import create_user, get_user_by_username
from security import verify_password, hash_password
from typing import List
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import func
from datetime import datetime
from models import User,VehicleCount

#call fastapi
app = FastAPI()

#authentication token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

#database connection
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def on_startup():
    init_db()

# User create
@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    try:
        created_user = create_user(db, user)
        return {"message": "User created successfully", "user": created_user.username}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating user: {e}")

# User Login
@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = "access-token"
    return {"access_token": access_token, "token_type": "bearer"}

# Admin Panel Route
@app.get("/admin/users", response_model=List[UserRead])
def read_users(db: Session = Depends(get_db)):
    return db.query(User).all()

# Vehicle Counts API
@app.get("/vehicle_counts_by_date", response_model=List[VehicleCountResponse])
def get_vehicle_counts_by_date(db: Session = Depends(get_db)):
    try:
        results = db.query(
            VehicleCount.vehicle_name,
            func.sum(VehicleCount.vehicle_counts).label('total_counts'),
            func.date(VehicleCount.created_at).label('date')
        ).group_by(VehicleCount.vehicle_name, func.date(VehicleCount.created_at)).all()
        
        vehicle_counts = [
            VehicleCountResponse(
                vehicle_name=result.vehicle_name,
                total_counts=result.total_counts,
                date=result.date
            )
            for result in results
        ]
        
        return vehicle_counts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {e}")

#run api.py file using fastAPI
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)
