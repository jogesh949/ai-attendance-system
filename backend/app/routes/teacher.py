from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.routes.auth import get_current_user
from app.models.teacher import Teacher
from app.models.attendance_session import AttendanceSession

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


@router.post("/start-session")
def start_session(
    data: SessionRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teacher allowed")

    teacher = db.query(Teacher).filter(
        Teacher.user_id == current_user.id
    ).first()

    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    session = AttendanceSession(
        class_id=data.class_id,
        subject_id=data.subject_id,
        teacher_id=teacher.id,
        classroom_id=data.classroom_id   # ✅ NEW
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "message": "Session started",
        "session_id": session.id
    }

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