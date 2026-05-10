<<<<<<< HEAD
from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, Boolean, Text
from sqlalchemy.orm import relationship
from app.database.connection import Base
from sqlalchemy.sql import func

class Camera(Base):
    __tablename__ = "cameras"
    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id", ondelete="CASCADE"))
    camera_name = Column(String(100))
    camera_type = Column(String(50)) # Webcam, USB Camera, CCTV, IP Camera
    source_url = Column(String(255)) # 0, 1 or rtsp://...
    placement = Column(String(50)) # Front, Back, Door, Ceiling
    resolution = Column(String(50), nullable=True)
    fps = Column(Integer, default=30)
    status = Column(String(20), default="Active") # Active/Inactive
    current_status = Column(String(20), default="Offline") # Online/Offline/Connecting/Error
    is_primary = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    
    # Analytics
    last_active_time = Column(TIMESTAMP, nullable=True)
    detection_count = Column(Integer, default=0)
    total_sessions_used = Column(Integer, default=0)

    classroom = relationship("Classroom", back_populates="cameras")

class Classroom(Base):
    __tablename__ = "classrooms"
    id = Column(Integer, primary_key=True, index=True)
    room_name = Column(String(50))
    location = Column(String(100))
    capacity = Column(Integer, default=60)

    cameras = relationship("Camera", back_populates="classroom", cascade="all, delete-orphan")
=======
from sqlalchemy import Column, Integer, String
from app.database.connection import Base


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    room_name = Column(String(50))
    location = Column(String(100))
>>>>>>> ebfa0412648e52de42ee6f8ee11a6a47c077645c
