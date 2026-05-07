from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.face_embedding import FaceEmbedding
from app.models.attendance_logs import AttendanceLog
from app.models.attendance_record import AttendanceRecord
from app.models.student import Student
from app.models.attendance_session import AttendanceSession
from app.services.face_service import get_face_embedding, compare_faces

import ast

router = APIRouter(prefix="/attendance", tags=["Attendance"])


# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================
# MARK ATTENDANCE
# =========================
@router.post("/mark")
async def mark_attendance(
    file: UploadFile = File(...),
    session_id: int = Form(...),
    db: Session = Depends(get_db)
):
    image_bytes = await file.read()

    new_embedding = get_face_embedding(image_bytes)

    if new_embedding is None:
        return {"message": "No face detected"}

    # Load all embeddings
    embeddings = db.query(FaceEmbedding).all()

    known = []
    for e in embeddings:
        known.append((e.student_id, ast.literal_eval(e.embedding)))

    # Compare face
    student_id = compare_faces(known, new_embedding)

    if student_id:
        # ✅ Check duplicate log
        existing_log = db.query(AttendanceLog).filter(
            AttendanceLog.student_id == student_id,
            AttendanceLog.session_id == session_id
        ).first()

        if existing_log:
            return {
                "message": "Attendance already marked",
                "student_id": student_id
            }

        # ✅ Save log
        log = AttendanceLog(
            student_id=student_id,
            session_id=session_id,
            confidence=0.9
        )

        db.add(log)
        db.commit()

        return {
            "message": "Attendance marked",
            "student_id": student_id
        }

    # ❌ Not recognized
    return {"message": "Face not recognized"}


# =========================
# FINALIZE ATTENDANCE
# =========================
@router.post("/finalize/{session_id}")
def finalize_attendance(session_id: int, db: Session = Depends(get_db)):

    session = db.query(AttendanceSession).filter(
        AttendanceSession.id == session_id
    ).first()

    if not session:
        return {"error": "Session not found"}

    # Get students
    students = db.query(Student).filter(
        Student.class_id == session.class_id
    ).all()

    # Get logs
    logs = db.query(AttendanceLog).filter(
        AttendanceLog.session_id == session_id
    ).all()

    # Count detections
    detection_count = {}
    for log in logs:
        detection_count[log.student_id] = detection_count.get(log.student_id, 0) + 1

    results = []

    for student in students:
        count = detection_count.get(student.id, 0)

        # ✅ Better logic
        if count >= 3:
            status = "Present"
            percentage = 100
        elif count > 0:
            status = "Late"
            percentage = 50
        else:
            status = "Absent"
            percentage = 0

        # Avoid duplicate records
        existing_record = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student.id,
            AttendanceRecord.session_id == session_id
        ).first()

        if not existing_record:
            record = AttendanceRecord(
                student_id=student.id,
                session_id=session_id,
                status=status,
                percentage=percentage
            )
            db.add(record)

        results.append({
            "student_id": student.id,
            "status": status
        })

    # Mark session complete
    session.status = "completed"

    db.commit()

    return {
        "message": "Attendance finalized",
        "results": results
    }