from sqlalchemy import Column, Integer, String, ForeignKey
<<<<<<< HEAD
from sqlalchemy.orm import relationship
=======
>>>>>>> ebfa0412648e52de42ee6f8ee11a6a47c077645c
from app.database.connection import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    department_id = Column(Integer, ForeignKey("departments.id"))
<<<<<<< HEAD
    teacher_code = Column(String(50), unique=True)

    user = relationship("User")
=======
    teacher_code = Column(String(50), unique=True)
>>>>>>> ebfa0412648e52de42ee6f8ee11a6a47c077645c
