from sqlalchemy import Column, Integer, ForeignKey, Float, DateTime
from datetime import datetime
from app.database.connection import Base


class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    session_id = Column(Integer, ForeignKey("attendance_sessions.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    confidence = Column(Float)