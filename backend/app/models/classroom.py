from sqlalchemy import Column, Integer, String
from app.database.connection import Base


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    room_name = Column(String(50))
    location = Column(String(100))