from sqlalchemy import Column, Integer, String, Enum, DateTime, func
from sqlalchemy.orm import declarative_base, sessionmaker,relationship
from sqlalchemy import create_engine,ForeignKey
import enum
from datetime import datetime

Base = declarative_base()

class UserRole(enum.Enum):
    user = "user"
    admin = "admin"

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone_number = Column(String(100), unique=True)
    address = Column(String(100))
    email = Column(String(100), unique=True)
    username = Column(String(50), unique=True, index=True)
    password = Column(String(100))
    reference_number=Column(String(100))
    role = Column(Enum(UserRole), default=UserRole.user)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    videos = relationship("VideoFootage", back_populates="user")

class VehicleCount(Base):
    __tablename__ = 'vehicle_counts'

    id = Column(Integer, primary_key=True, index=True)
    vehicle_name = Column(String(50))
    vehicle_counts = Column(Integer)
    video_id = Column(Integer)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class VideoFootage(Base):
    __tablename__ = 'traffic_videos'

    id = Column(Integer, primary_key=True, index=True)
    reference_number = Column(String(100), unique=True, index=True, nullable=False)
    video_title = Column(String(100)) 
    video_location = Column(String(100))
    video = Column(String(255))
    status = Column(Integer)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    user = relationship("User", back_populates="videos")

SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:@localhost/traffic_management"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    print("Initializing the database...")
    Base.metadata.create_all(bind=engine)
    print("Database initialized.")

if __name__ == "__main__":
    init_db()
