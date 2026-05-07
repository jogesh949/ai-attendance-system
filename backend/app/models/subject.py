from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.connection import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    department_id = Column(Integer, ForeignKey("departments.id"))