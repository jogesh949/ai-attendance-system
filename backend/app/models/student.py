from sqlalchemy import Column, Integer, String, ForeignKey
<<<<<<< HEAD
from sqlalchemy.orm import relationship
=======
>>>>>>> ebfa0412648e52de42ee6f8ee11a6a47c077645c
from app.database.connection import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    class_id = Column(Integer, ForeignKey("classes.id"))
<<<<<<< HEAD
    roll_no = Column(String(20))

    user = relationship("User")
=======
    roll_no = Column(String(20))
>>>>>>> ebfa0412648e52de42ee6f8ee11a6a47c077645c
