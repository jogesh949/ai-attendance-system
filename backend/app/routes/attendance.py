from fastapi import APIRouter, Depends, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
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
    print(f"DEBUG: Received frame for session {session_id}")

    new_embedding = get_face_embedding(image_bytes)

    if new_embedding is None:
        print("DEBUG: No face detected in frame")
        return {"message": "No face detected"}

    # Load all embeddings
    embeddings = db.query(FaceEmbedding).all()
    print(f"DEBUG: Comparing against {len(embeddings)} known faces")

    known = []
    for e in embeddings:
        try:
            # Handle string representation safely
            embedding_data = ast.literal_eval(e.embedding)
            known.append((e.student_id, embedding_data))
        except Exception as err:
            print(f"DEBUG: Error parsing embedding for student {e.student_id}: {err}")

    # Compare face
    student_id = compare_faces(known, new_embedding)

    if student_id:
        print(f"DEBUG: Recognized student ID: {student_id}")
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

    # Get students who have face embeddings
    enrolled_student_ids = [e.student_id for e in db.query(FaceEmbedding).all()]

    # Get logs
    logs = db.query(AttendanceLog).filter(
        AttendanceLog.session_id == session_id
    ).all()

    # Count detections
    detection_count = {}
    for log in logs:
        detection_count[log.student_id] = detection_count.get(log.student_id, 0) + 1

    # Calculate session duration
    end_time = session.end_time or datetime.utcnow()
    duration_seconds = (end_time - session.start_time).total_seconds()
    
    # AI Engine captures every 2 seconds
    capture_interval = 2.0
    total_expected_detections = max(1, int(duration_seconds / capture_interval))
    
    # 75% Requirement for "Present" status
    required_detections = max(1, int(total_expected_detections * 0.75))

    results = []

    for student in students:
        count = detection_count.get(student.id, 0)
        is_enrolled = student.id in enrolled_student_ids

        # ✅ Simplified Rule:
        # 1. If not enrolled (no face photo), always Absent
        # 2. If present for >= 75% of session time, mark Present
        # 3. Otherwise, mark Absent
        
        if not is_enrolled:
            status = "Absent"
            percentage = 0
        elif count >= required_detections:
            status = "Present"
            percentage = 100
        else:
            status = "Absent"
            percentage = 0

        # Create or Update record
        existing_record = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student.id,
            AttendanceRecord.session_id == session_id
        ).first()

        if existing_record:
            existing_record.status = status
            existing_record.percentage = percentage
        else:
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


# =========================
# MANUAL CORRECTION
# =========================
class ManualUpdate(BaseModel):
    session_id: int
    student_id: int
    status: str # Present, Absent

@router.post("/manual-update")
def manual_update(data: ManualUpdate, db: Session = Depends(get_db)):
    percentage = 0
    if data.status == "Present":
        percentage = 100

    record = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == data.session_id,
        AttendanceRecord.student_id == data.student_id
    ).first()

    if record:
        record.status = data.status
        record.percentage = percentage
    else:
        record = AttendanceRecord(
            student_id=data.student_id,
            session_id=data.session_id,
            status=data.status,
            percentage=percentage
        )
        db.add(record)

    db.commit()
    return {"message": "Attendance updated manually", "status": data.status}
