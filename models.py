from sqlalchemy import Column, Integer, String, Enum, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import enum
from datetime import datetime

Base = declarative_base()

#Migration
class UserRole(enum.Enum):
    user = "user"
    admin = "admin"

#users table create
class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.user)

#vehicle_counts table create
class VehicleCount(Base):
    __tablename__ = 'vehicle_counts'

    id = Column(Integer, primary_key=True, index=True)
    vehicle_name = Column(String, index=True)
    vehicle_counts = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:@localhost/traffic_management"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
