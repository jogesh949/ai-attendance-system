from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.connection import Base


class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    department_id = Column(Integer, ForeignKey("departments.id"))