from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.connection import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
<<<<<<< HEAD
    subject_code = Column(String(20), unique=True, index=True)
=======
>>>>>>> ebfa0412648e52de42ee6f8ee11a6a47c077645c
    department_id = Column(Integer, ForeignKey("departments.id"))