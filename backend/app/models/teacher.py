from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.connection import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    department_id = Column(Integer, ForeignKey("departments.id"))
    teacher_code = Column(String(50), unique=True)