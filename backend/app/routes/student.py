from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.routes.auth import get_current_user
from app.services.face_service import get_face_embedding

from app.models.student import Student
from app.models.face_embedding import FaceEmbedding
from app.models.attendance_record import AttendanceRecord


router = APIRouter(prefix="/student", tags=["Student"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/upload-face")
async def upload_face(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only student can upload face")

    student = db.query(Student).filter(Student.user_id == current_user.id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    image_bytes = await file.read()
    embedding = get_face_embedding(image_bytes)

    if embedding is None:
        raise HTTPException(status_code=400, detail="No face detected")

    new_embedding = FaceEmbedding(
        student_id=student.id,
        embedding=str(embedding)
    )

    db.add(new_embedding)
    db.commit()

    return {"message": "Face uploaded successfully"}


@router.get("/attendance")
def get_student_attendance(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only student allowed")

    student = db.query(Student).filter(Student.user_id == current_user.id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    from app.models.attendance_session import AttendanceSession
    from app.models.subject import Subject

    # Query attendance records joined with sessions and subjects
    results = db.query(
        AttendanceRecord, 
        AttendanceSession, 
        Subject.name
    ).join(
        AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id
    ).join(
        Subject, AttendanceSession.subject_id == Subject.id
    ).filter(
        AttendanceRecord.student_id == student.id
    ).all()

    total = len(results)
    present = len([r for r, s, sub_name in results if r.status == "Present"])

    percentage = (present / total * 100) if total > 0 else 0

    return {
        "records": [
            {
                "id": r.id,
                "session_id": r.session_id,
                "subject": sub_name,
                "status": r.status,
                "date": s.start_time.strftime("%Y-%m-%d %H:%M"),
                "percentage": r.percentage
            }
            for r, s, sub_name in results
        ],
        "total_classes": total,
        "total_present": present,
        "percentage": round(percentage, 2)
    }
