from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.routes.auth import get_current_user
from app.models.teacher import Teacher
from app.models.attendance_session import AttendanceSession
from app.models.user import User
from app.models.class_model import Class
from app.models.subject import Subject
from app.models.classroom import Classroom, Camera

router = APIRouter(prefix="/teacher", tags=["Teacher"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from pydantic import BaseModel

class SessionRequest(BaseModel):
    class_id: int
    subject_id: int
    classroom_id: int


from app.models.classroom import Classroom, Camera

@router.post("/start-session")
def start_session(
    data: SessionRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        if current_user.role != "teacher":
            raise HTTPException(status_code=403, detail="Only teacher allowed")

        teacher = db.query(Teacher).filter(
            Teacher.user_id == current_user.id
        ).first()

        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher profile not found for this user")

        # Find the primary camera for this classroom
        camera = db.query(Camera).filter(
            Camera.classroom_id == data.classroom_id,
            Camera.is_primary == True
        ).first()
        
        # Fallback to any camera if no primary is set
        if not camera:
            camera = db.query(Camera).filter(Camera.classroom_id == data.classroom_id).first()

        session = AttendanceSession(
            class_id=data.class_id,
            subject_id=data.subject_id,
            teacher_id=teacher.id,
            classroom_id=data.classroom_id
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        return {
            "message": "Session started",
            "session_id": session.id,
            "camera_source": camera.source_url if camera else "0" # Default to laptop webcam index 0
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.post("/stop-session")
def stop_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    session = db.query(AttendanceSession).filter(
        AttendanceSession.id == session_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "completed"
    session.end_time = datetime.utcnow()

    db.commit()

    return {"message": "Session stopped"}