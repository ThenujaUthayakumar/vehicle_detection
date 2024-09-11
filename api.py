from fastapi import FastAPI, HTTPException, Depends, Form,status, Depends, HTTPException, Query,Response,File, UploadFile
from sqlalchemy.orm import Session
from models import engine, SessionLocal, init_db,User,VehicleCount,UserRole,VideoFootage
from schemas import UserCreate, UserRead, VehicleCountResponse,UserUpdate,VideoCreate,VideoUpdate,VideoStatusChangeRequest,VideoRead,VideoDelete,VideoStatusChange,VehicleCountResponseAll
from crud import create_user, get_user_by_username, update_user, create_video_crud,get_current_user_id
from security import verify_password, hash_password
from typing import List, Optional
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import func, or_
from datetime import datetime,timedelta,date
import pandas as pd
from io import BytesIO
from sqlalchemy.exc import IntegrityError,SQLAlchemyError
from jose import JWTError, jwt
import os
import shutil


SECRET_KEY = "aberdcfg"  # Replace with your actual secret key
ALGORITHM = "HS256"  # You can use other algorithms, but make sure to match them in your decode logic
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # Token expiration time in minutes

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

# User CREATE
@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    try:
        created_user = create_user(db, user)
        return {"message": "User created successfully", "user": created_user.username}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating user: {e}")

#user UPDATE
@app.put("/users", response_model=UserRead)
def update_user_endpoint(
    user: UserUpdate, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme) 
):
    # Debugging
    print(f"Received user data: {user}")

    id = user.id

    try:
        updated_user = update_user(db, id, user)

    except IntegrityError as e:
        db.rollback() 
        
        # Print the original error message for debugging
        print(f"IntegrityError: {e.orig}")
        
        if 'phone_number' in str(e.orig):
            raise HTTPException(status_code=400, detail="This Phone Number Already Exists !")
        elif 'username' in str(e.orig):
            raise HTTPException(status_code=400, detail="This Username Already Exists !")
        elif 'email' in str(e.orig):
            raise HTTPException(status_code=400, detail="This Email Already Exists !")
        else:
            raise HTTPException(status_code=500, detail="Database error occurred: " + str(e.orig))

    except Exception as e:
        # Catch any other exceptions
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Unexpected error occurred: " + str(e))

    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return updated_user

#users GET with search
@app.get("/users", response_model=List[UserRead])
def get_users(
    db: Session = Depends(get_db),
    search_key: Optional[str] = Query(None, description="Search key to filter users by email, first name, or last name")
):
    if search_key:
        # Filter users based on the search key
        users = db.query(User).filter(
            (User.first_name.ilike(f"%{search_key}%")) |
            (User.last_name.ilike(f"%{search_key}%")) |
            (User.username.ilike(f"%{search_key}%")) |
            (User.email.ilike(f"%{search_key}%")) |
            (User.address.ilike(f"%{search_key}%")) |
            (User.phone_number.ilike(f"%{search_key}%")) 
        ).all()
    else:
        # Return all users if no search key is provided
        users = db.query(User).all()

    if not users:
        raise HTTPException(status_code=404, detail="No users found")

    return users

#users download in excel
@app.get("/users/download")
def download_users(
    db: Session = Depends(get_db),
    search_key: Optional[str] = Query(None, description="Search key to filter users")
):
    # Fetch users from the database
    if search_key:
        users = db.query(User).filter(
            (User.first_name.ilike(f"%{search_key}%")) |
            (User.last_name.ilike(f"%{search_key}%")) |
            (User.username.ilike(f"%{search_key}%")) |
            (User.email.ilike(f"%{search_key}%")) |
            (User.address.ilike(f"%{search_key}%")) |
            (User.phone_number.ilike(f"%{search_key}%")) 
        ).all()
    else:
        users = db.query(User).all()

    if not users:
        raise HTTPException(status_code=404, detail="No users found")

    data = [
        {
            "ID": user.id,
            "Reference Number": user.reference_number,
            "First Name": user.first_name,
            "Last Name": user.last_name,
            "Address": user.address,
            "Phone Number": user.phone_number,
            "E-mail": user.email,
            "Role": user.role.value if isinstance(user.role, UserRole) else user.role, 
            "Username": user.username
        }
        for user in users
    ]
    df = pd.DataFrame(data)

    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Users")
    output.seek(0)

    headers = {
        'Content-Disposition': 'attachment; filename=users.xlsx'
    }
    return Response(content=output.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)

#user delete
@app.delete("/users/{user_id}", response_model=UserRead)
def delete_user_endpoint(
    user_id: int, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme) 
):
  
    print(f"Attempting to delete user with ID: {user_id}")

    user_to_delete = db.query(User).filter(User.id == user_id).first()
    
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        db.delete(user_to_delete)
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
 
        print(f"SQLAlchemyError: {e.orig}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    
    return user_to_delete

#get users
@app.get("/admin/users", response_model=List[UserRead])
def read_users(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    if not validate_admin(token):
        raise HTTPException(status_code=403, detail="Not authorized to perform this action")

    return db.query(User).all()

# User Login
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Create token
    access_token = create_access_token(data={"sub": user.username,"user_id": user.id})
    return {"access_token": access_token, "token_type": "bearer"}

# ==================================================================================================

#video create
UPLOAD_DIRECTORY = "uploaded_videos/"

@app.post("/video")
def video(
    videoTitle: str = Form(...),
    videoLocation: str = Form(...),
    video: UploadFile = File(...),
    db: Session = Depends(get_db), 
    userId: int = Depends(get_current_user_id)
):
    try:
        if not os.path.exists(UPLOAD_DIRECTORY):
            os.makedirs(UPLOAD_DIRECTORY)
        
        file_path = os.path.join(UPLOAD_DIRECTORY, video.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)

        video_data = {
            "videoTitle": videoTitle,
            "videoLocation": videoLocation,
            "video": file_path,
            "user_id": userId
        }
        
        created_video = create_video_crud(db, video_data)
        return {"message": "Video added successfully", "video_path": file_path}
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating video: {e}")
    
#video update
@app.put("/video/update")
def update_video(
    id: int = Form(...),
    videoTitle: str = Form(...), 
    videoLocation: str = Form(...),
    video: UploadFile = File(None),
    db: Session = Depends(get_db), 
    userId: int = Depends(get_current_user_id)
):
    try:
        existing_video = db.query(VideoFootage).filter(VideoFootage.id == id).first()
        if not existing_video:
            raise HTTPException(status_code=404, detail="Video not found")

        if existing_video.user_id != userId:
            raise HTTPException(status_code=403, detail="Not authorized to update this video")

        existing_video.video_title = videoTitle
        existing_video.video_location = videoLocation

        if video:
            file_path = os.path.join(UPLOAD_DIRECTORY, video.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(video.file, buffer)
            existing_video.video = file_path

        db.commit()
        db.refresh(existing_video)
        return {"message": "Video updated successfully", "video": existing_video}
    
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating video: {e}")
    
#vide get with search
@app.get("/video", response_model=List[VideoRead])
def get_videos(
    db: Session = Depends(get_db),
    search_key: Optional[str] = Query(None, description="Search key to filter videos details or users details")
):
    try:
        query = db.query(VideoFootage).join(User, VideoFootage.user_id == User.id)

        if search_key:
            query = query.filter(
                or_(
                    VideoFootage.video_title.ilike(f"%{search_key}%"),
                    VideoFootage.video_location.ilike(f"%{search_key}%"),
                    VideoFootage.reference_number.ilike(f"%{search_key}%"),
                    User.username.ilike(f"%{search_key}%"),
                    User.email.ilike(f"%{search_key}%"),
                    User.first_name.ilike(f"%{search_key}%"),
                    User.last_name.ilike(f"%{search_key}%"),
                    User.address.ilike(f"%{search_key}%"),
                    User.phone_number.ilike(f"%{search_key}%")
                )
            )

        videos = query.all()

        if not videos:
            raise HTTPException(status_code=404, detail="No videos found")
        
        return [VideoRead.from_orm(video) for video in videos]

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching videos: {str(e)}")
    
#download with search
@app.get("/video/download")
def download_videos(
    db: Session = Depends(get_db),
    search_key: Optional[str] = Query(None, description="Search key to filter videos details or user details")
):
    query = db.query(VideoFootage, User.reference_number).join(User, VideoFootage.user_id == User.id)

    if search_key:
        query = query.filter(
            or_(
                VideoFootage.video_title.ilike(f"%{search_key}%"),
                VideoFootage.video_location.ilike(f"%{search_key}%"),
                VideoFootage.reference_number.ilike(f"%{search_key}%"),
                User.username.ilike(f"%{search_key}%"),
                User.email.ilike(f"%{search_key}%"),
                User.first_name.ilike(f"%{search_key}%"),
                User.last_name.ilike(f"%{search_key}%"),
                User.address.ilike(f"%{search_key}%"),
                User.reference_number.ilike(f"%{search_key}%"),
                User.phone_number.ilike(f"%{search_key}%")
            )
        )

    results = query.all()

    if not results:
        raise HTTPException(status_code=404, detail="No videos found")

    data = [
        {
            "Reference Number": video.reference_number,
            "Video Title": video.video_title,
            "Video Location": video.video_location,
            "User ID": reference_number,
            "Video Exists": "Yes" if video.video else "No",
            "Status": "Active" if video.status==1 else "Inactive",
            "Created At": video.created_at,
            "Updated At": video.updated_at
        }
        for video, reference_number in results
    ]
    
    df = pd.DataFrame(data)

    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Videos")
    output.seek(0)

    headers = {
        'Content-Disposition': 'attachment; filename=videos.xlsx'
    }
    return Response(content=output.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)


#video delete
@app.delete("/video/{video_id}", response_model=VideoDelete)
def delete_video_endpoint(
    video_id: int, 
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme) 
):
  
    print(f"Attempting to delete video with ID: {video_id}")

    video_to_delete = db.query(VideoFootage).filter(VideoFootage.id == video_id).first()
    
    if not video_to_delete:
        raise HTTPException(status_code=404, detail="Video not found")
    
    try:
        db.delete(video_to_delete)
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
 
        print(f"SQLAlchemyError: {e.orig}")
        raise HTTPException(status_code=500, detail="Database error occurred")
    
    return video_to_delete

# video status change API
@app.put("/video/status-change", response_model=VideoStatusChange)
def status_change_endpoint(
    payload: VideoStatusChangeRequest, 
    db: Session = Depends(get_db),
    userId: int = Depends(get_current_user_id)
):
    print(f"Attempting to change status of video with ID: {payload.id}")

    video = db.query(VideoFootage).filter(VideoFootage.id == payload.id).first()

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if payload.status == 1:  
        active_video = db.query(VideoFootage).filter(VideoFootage.status == 1, VideoFootage.id != payload.id).first()
        if active_video:
            raise HTTPException(
                status_code=400, 
                detail="Only one video can be active at a time. Another video is already active."
            )

    video.status = payload.status
    video.user_id = userId

    try:
        db.commit() 
    except SQLAlchemyError as e:
        db.rollback()
        print(f"SQLAlchemyError: {e.orig}")
        raise HTTPException(status_code=500, detail="Database error occurred")

    return {
        "id": video.id,
        "status": video.status,
        "user_id": userId
    }
# ==========================================================================================

# Vehicle Counts with Search API Vehicle type wise
@app.get("/vehicle-counts", response_model=List[VehicleCountResponse])
def get_vehicle_counts_by_date(
    db: Session = Depends(get_db),
    start_date: Optional[date] = Query(None, description="Start date in format YYYY-MM-DD"),
    end_date: Optional[date] = Query(None, description="End date in format YYYY-MM-DD"),
    vehicle_name: Optional[str] = Query(None, description="Filter by vehicle name"),
    video_title: Optional[str] = Query(None, description="Filter by video title")
):
    try:
        query = db.query(
            VehicleCount.vehicle_name.label('vehicle_name'),
            func.sum(VehicleCount.vehicle_counts).label('total_counts'),
            func.date(VehicleCount.created_at).label('date'),
            VideoFootage.video_title.label('video_title')
        ).join(VideoFootage, VehicleCount.video_id == VideoFootage.id) 

        if start_date:
            query = query.filter(func.date(VehicleCount.created_at) >= start_date)
        if end_date:
            query = query.filter(func.date(VehicleCount.created_at) <= end_date)
        if vehicle_name:
            query = query.filter(VehicleCount.vehicle_name.ilike(f"%{vehicle_name}%"))
        if video_title:
            query = query.filter(VideoFootage.video_title.ilike(f"%{video_title}%"))

        results = query.group_by(
            VehicleCount.vehicle_name,
            func.date(VehicleCount.created_at),
            VideoFootage.video_title
        ).all()

        vehicle_counts = [
            VehicleCountResponse(
                vehicle_name=result.vehicle_name,
                total_counts=result.total_counts,
                date=result.date,
                video_title=result.video_title
            )
            for result in results
        ]
        
        return vehicle_counts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {e}")
    
# Vehicle Counts with Search API Vehicle type wise Download
@app.get("/vehicle-counts/download")
def get_vehicle_counts_excel(
    db: Session = Depends(get_db),
    start_date: Optional[date] = Query(None, description="Start date in format YYYY-MM-DD"),
    end_date: Optional[date] = Query(None, description="End date in format YYYY-MM-DD"),
    vehicle_name: Optional[str] = Query(None, description="Filter by vehicle name"),
    video_title: Optional[str] = Query(None, description="Filter by video title")
):
    try:
        query = db.query(
            VehicleCount.vehicle_name.label('vehicle_name'),
            func.sum(VehicleCount.vehicle_counts).label('total_counts'),
            func.date(VehicleCount.created_at).label('date'),
            VideoFootage.video_title.label('video_title')
        ).join(VideoFootage, VehicleCount.video_id == VideoFootage.id)

        if start_date:
            query = query.filter(func.date(VehicleCount.created_at) >= start_date)
        if end_date:
            query = query.filter(func.date(VehicleCount.created_at) <= end_date)
        if vehicle_name:
            query = query.filter(VehicleCount.vehicle_name.ilike(f"%{vehicle_name}%"))
        if video_title:
            query = query.filter(VideoFootage.video_title.ilike(f"%{video_title}%"))

        results = query.group_by(
            VehicleCount.vehicle_name,
            func.date(VehicleCount.created_at),
            VideoFootage.video_title
        ).all()

        # Create a DataFrame
        df = pd.DataFrame([
            {
                "Vehicle Name": result.vehicle_name,
                "Total Counts": result.total_counts,
                "Date": result.date,
                "Video Title": result.video_title
            }
            for result in results
        ])

        # Convert DataFrame to Excel
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name="Vehicle Counts")
        
        output.seek(0)
        
        # Return the Excel file as a response
        headers = {
            'Content-Disposition': 'attachment; filename=vehicle_counts.xlsx'
        }
        return Response(content=output.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating Excel file: {e}")

# GET All Vehicle Counts Details
@app.get("/vehicle-counts/all", response_model=List[VehicleCountResponseAll])
def get_vehicle_counts(
    db: Session = Depends(get_db),
    search_key: Optional[str] = Query(None, description="Search key to filter vehicle name or video title")
):
    try:
        query = db.query(
            VehicleCount.vehicle_name.label('vehicle_name'),
            func.sum(VehicleCount.vehicle_counts).label('total_counts'),
            func.date(VehicleCount.created_at).label('date'),
            VideoFootage.video_title.label('video_title'),
            VehicleCount.created_at.label('created_at'),
            VehicleCount.updated_at.label('updated_at')
        ).join(VideoFootage, VehicleCount.video_id == VideoFootage.id)

        if search_key:
            query = query.filter(
                or_(
                    VehicleCount.vehicle_name.ilike(f"%{search_key}%"),
                    VideoFootage.video_title.ilike(f"%{search_key}%")
                )
            )

        results = query.group_by(
            VehicleCount.vehicle_name,
            func.date(VehicleCount.created_at),
            VideoFootage.video_title,
            VehicleCount.created_at,
            VehicleCount.updated_at
        ).all()

        vehicle_counts = [
            VehicleCountResponseAll(
                vehicle_name=result.vehicle_name,
                total_counts=result.total_counts,
                date=result.date,
                video_title=result.video_title,
                created_at=result.created_at,
                updated_at=result.updated_at
            )
            for result in results
        ]
        
        return vehicle_counts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {e}")

# All Vehicle Counts Details Download
@app.get("/vehicle-counts/all/download")
def download_vehicle_counts(
    db: Session = Depends(get_db),
    search_key: Optional[str] = Query(None, description="Search key to filter vehicle name or video title")
):
    try:
        query = db.query(
            VehicleCount.vehicle_name.label('vehicle_name'),
            func.sum(VehicleCount.vehicle_counts).label('total_counts'),
            func.date(VehicleCount.created_at).label('date'),
            VideoFootage.video_title.label('video_title'),
            VehicleCount.created_at.label('created_at'),
            VehicleCount.updated_at.label('updated_at')
        ).join(VideoFootage, VehicleCount.video_id == VideoFootage.id)

        if search_key:
            query = query.filter(
                or_(
                    VehicleCount.vehicle_name.ilike(f"%{search_key}%"),
                    VideoFootage.video_title.ilike(f"%{search_key}%")
                )
            )

        results = query.group_by(
            VehicleCount.vehicle_name,
            func.date(VehicleCount.created_at),
            VideoFootage.video_title,
            VehicleCount.created_at,
            VehicleCount.updated_at
        ).all()

        data = [
            {
                "Vehicle Name": result.vehicle_name,
                "Total Counts": result.total_counts,
                "Date": result.date,
                "Video Title": result.video_title,
                "Created At": result.created_at,
                "Updated At": result.updated_at
            }
            for result in results
        ]

        df = pd.DataFrame(data)

        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name="Vehicle Counts")
        output.seek(0)

        headers = {
            'Content-Disposition': 'attachment; filename=all_vehicle_counts.xlsx'
        }
        return Response(content=output.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers=headers)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating Excel file: {e}")

#run api.py file using fastAPI
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)
