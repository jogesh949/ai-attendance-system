from sqlalchemy import Column, Integer, String, TIMESTAMP, Enum
from app.database.connection import Base
from sqlalchemy.sql import func


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    password = Column(String(255))
    role = Column(Enum('admin', 'teacher', 'student'))
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())