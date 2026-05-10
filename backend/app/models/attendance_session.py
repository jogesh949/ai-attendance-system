from sqlalchemy import Column, Integer, ForeignKey, DateTime, String
from app.database.connection import Base
from datetime import datetime


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(20), default="active")
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))