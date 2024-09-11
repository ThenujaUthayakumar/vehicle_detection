import re
from sqlalchemy.orm import Session
from models import User,VideoFootage
from schemas import UserCreate,UserUpdate,VideoCreate
from security import hash_password
from fastapi import HTTPException,Depends, HTTPException, Header
from sqlalchemy.exc import IntegrityError
from jose import JWTError, jwt

SECRET_KEY = "aberdcfg"  # Replace with your actual secret key
ALGORITHM = "HS256"  # You can use other algorithms, but make sure to match them in your decode logic
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Token expiration time in minutes

#expressions for validation
PHONE_NUMBER_REGEX = re.compile(r'^\d{10}$')  # 10-digit phone number format
EMAIL_REGEX = re.compile(r'^[\w\.-]+@[\w\.-]+\.\w+$')  # email format

def validate_phone_number(phone_number: str) -> bool:
    return PHONE_NUMBER_REGEX.match(phone_number) is not None

def validate_email(email: str) -> bool:
    return EMAIL_REGEX.match(email) is not None

#User Create 
def create_user(db: Session, user: UserCreate):
    # Validate required fields
    if not user.username or not user.password or not user.role:
        raise HTTPException(status_code=500, detail="Username, password, and role are required")

    # Validate phone number format
    if not validate_phone_number(user.phoneNumber):
        raise HTTPException(status_code=400, detail="Please Enter Correct Phone Number !")

    # Validate email format
    if not validate_email(user.email):
        raise HTTPException(status_code=400, detail="Please Enter Correct E-mail !")


    # Check username already exists
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=500, detail="This Username Already Exists !")
    
    #Check phone number already exists
    existing_phone_number = db.query(User).filter(User.phone_number == user.phoneNumber).first()
    if existing_phone_number:
        raise HTTPException(status_code=500, detail="This Phone Number Already Exists !")
    
    #Check email already exists
    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=500, detail="This E-mail Already Exists !")

    hashed_password = hash_password(user.password)
    user_count = db.query(User).count() + 1
    reference_numbers = f"USER{user_count}"

    db_user = User(
        username=user.username,
        password=hashed_password,
        role=user.role,
        first_name=user.firstName,
        last_name=user.lastName,
        phone_number=user.phoneNumber,
        address=user.address,
        email=user.email,
        reference_number=reference_numbers
    )
    
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


#user update
def update_user(db: Session, id: int, user_data: UserUpdate):
    db_user = db.query(User).filter(User.id == id).first()
    if db_user is None:
        return None

    if user_data.username:
        db_user.username = user_data.username
    if user_data.password:
        db_user.password = hash_password(user_data.password)
    if user_data.role:
        db_user.role = user_data.role
    if user_data.firstName:
        db_user.first_name = user_data.firstName
    if user_data.lastName:
        db_user.last_name = user_data.lastName
    if user_data.phoneNumber:
        db_user.phone_number = user_data.phoneNumber
    if user_data.address:
        db_user.address = user_data.address
    if user_data.email:
        db_user.email = user_data.email

    try:
        db.commit()
        db.refresh(db_user)
    except IntegrityError as e:
        db.rollback()
        raise e

    return db_user

#user session
def get_current_user_id(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing authorization token")
    
    token = authorization.split("Bearer ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return user_id

# ======================================================================================

#videos creation
def create_video_crud(db: Session, video_data: dict):
    # Validate required fields
    if not video_data['videoTitle'] or not video_data['videoLocation'] or not video_data['video']:
        raise HTTPException(status_code=400, detail="All fields are required")

    # Check if video title already exists
    existing_title = db.query(VideoFootage).filter(VideoFootage.video_title == video_data['videoTitle']).first()
    if existing_title:
        raise HTTPException(status_code=400, detail="This video title already exists")

    # Generate reference number
    video_count = db.query(VideoFootage).count() + 1
    reference_number = f"VIDEO{video_count}"

    # Create VideoFootage object
    db_video = VideoFootage(
        video_title=video_data['videoTitle'],
        video_location=video_data['videoLocation'],
        video=video_data['video'],  # This will be the path where the video is stored
        user_id=video_data['user_id'],
        reference_number=reference_number,
        status=0
    )
    
    db.add(db_video)
    try:
        db.commit()
        db.refresh(db_video)
        return db_video
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating video: {str(e)}")
