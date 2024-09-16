import cv2
import torch
import numpy as np
from datetime import datetime, timedelta
from image_preprocess import preprocess_frame, preprocess_bbox
from object_detection_app import model, calculate_iou, boundarBox, classes
from sqlalchemy import Column, Integer, String, create_engine, ForeignKey, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import pytz  # For timezone handling

# SQLAlchemy setup
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:@localhost/traffic_management"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define Video model (to retrieve videos)
class Video(Base):
    __tablename__ = 'traffic_videos'
    
    id = Column(Integer, primary_key=True, index=True)
    video = Column(String)
    status = Column(Integer)

# Define VehicleCount model
class VehicleCount(Base):
    __tablename__ = 'vehicle_counts'

    id = Column(Integer, primary_key=True, index=True)
    vehicle_name = Column(String, index=True)
    vehicle_counts = Column(Integer)
    video_id = Column(Integer)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# Create tables if they do not exist
Base.metadata.create_all(bind=engine)

# Initialize variables
object_count = {}
start_time = datetime.now()
interval = timedelta(seconds=30)  # Save counts every 30 seconds

# Define Sri Lankan timezone
sri_lanka_tz = pytz.timezone('Asia/Colombo')

def is_within_operating_hours(current_time):
    local_time = current_time.astimezone(sri_lanka_tz)
    return 6 <= local_time.hour < 21

def get_video_from_db():
    """ Fetch video with status 1 from the database """
    try:
        with SessionLocal() as db:
            video = db.query(Video).filter_by(status=1).first()
            if video:
                print(f"Video found: {video.video}, ID: {video.id}")
                return video.video, video.id
            else:
                print("No video found with status 1.")
                return None, None
    except Exception as e:
        print(f"Error retrieving video from database: {e}")
        return None, None

def save_vehicle_count_to_db(video_id, object_count):
    """ Save vehicle count data to the database """
    try:
        with SessionLocal() as db:
            for vehicle, count in object_count.items():
                vehicle_count_entry = VehicleCount(
                    video_id=video_id,
                    vehicle_name=vehicle,
                    vehicle_counts=count
                )
                db.add(vehicle_count_entry)
            db.commit()
        print(f"Vehicle counts successfully saved to the database for video ID {video_id}.")
    except Exception as e:
        print(f"Error saving to database: {e}")

def video_monitoring():
    global start_time, object_count

    # Fetch the video from the database
    video_path, video_id = get_video_from_db()
    
    if not video_path:
        print("Error: No video available with status 1.")
        return

    # Open the video file
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print(f"Error: Unable to open video file at {video_path}")
        return

    frame_rate = int(cap.get(cv2.CAP_PROP_FPS))
    current_frame = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Error: Unable to read frame from video.")
            break

        current_frame += 1

        if current_frame % frame_rate == 0:
            current_time = datetime.now()
            
            if is_within_operating_hours(current_time):
                input_image = preprocess_frame(frame)

                with torch.no_grad():
                    prediction = model(input_image)[0]

                processed_prediction = preprocess_bbox(prediction)

                boxes = processed_prediction['boxes'].cpu().numpy()
                scores = processed_prediction['scores'].cpu().numpy()
                labels = processed_prediction['labels'].cpu().numpy()

                for box, score, label in zip(boxes, scores, labels):
                    iou = calculate_iou(box, boundarBox)
                    if label == 1 or label == 3:
                        iou_thresh = 0.5
                    else:
                        iou_thresh = 0.2

                    if iou > iou_thresh:
                        class_name = classes[label]
                        if class_name not in object_count:
                            object_count[class_name] = 0
                        object_count[class_name] += 1

                # Store vehicle counts every 30 seconds if within operating hours
                if current_time - start_time >= interval:
                    start_time = current_time
                    save_vehicle_count_to_db(video_id, object_count)

                    # Clear the object_count dictionary after saving
                    object_count = {}

            count_text = "\n".join([f"{cls}: {count}" for cls, count in object_count.items()])
            y0, dy = 12, 15

            text_size, _ = cv2.getTextSize(count_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            text_width, text_height = text_size
            box_height = (dy * len(count_text.split('\n'))) + 1

            cv2.rectangle(frame, (2, y0 - 20), (text_width + 10, y0 + box_height), (0, 0, 0), cv2.FILLED)

            for i, line in enumerate(count_text.split('\n')): 
                cv2.putText(frame, line, (10, y0 + i * dy), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

            cv2.imshow('Video Monitoring', frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    # Ensure to save remaining counts after video processing ends
    if is_within_operating_hours(datetime.now()):
        if object_count:
            save_vehicle_count_to_db(video_id, object_count)

    cap.release()
    cv2.destroyAllWindows()
    print("Monitoring Finished......")

    print("Object Counts:")
    for cls, count in object_count.items():
        print(f"{cls}: {count}")

if __name__ == "__main__":
    video_monitoring()
