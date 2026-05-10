from sqlalchemy import Column, Integer, Float, ForeignKey, Enum
from app.database.connection import Base

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    session_id = Column(Integer, ForeignKey("attendance_sessions.id"))
    status = Column(Enum("Present", "Absent"))
    percentage = Column(Float)