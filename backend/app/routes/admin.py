from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from passlib.context import CryptContext
from typing import List

from app.database.connection import SessionLocal
from app.routes.auth import get_current_user, hash_password
from app.models.user import User
from app.models.department import Department
from app.models.classroom import Classroom, Camera
from app.models.teacher import Teacher
from app.models.class_model import Class
from app.models.subject import Subject
from app.models.student import Student
import cv2
import time

router = APIRouter(prefix="/admin", tags=["Admin"])

# --- DB Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Request Schemas ---

class DepartmentRequest(BaseModel):
    name: str

class ClassRequest(BaseModel):
    name: str
    department_id: int

class SubjectRequest(BaseModel):
    name: str
    subject_code: str
    department_id: int

class ClassroomRequest(BaseModel):
    room_name: str
    location: str
    capacity: int = 60

class CameraRequest(BaseModel):
    camera_name: str
    camera_type: str # Webcam, USB Camera, CCTV, IP Camera
    source_url: str # 0, 1, or rtsp://...
    placement: str # Front, Back, Door, Ceiling
    resolution: str = "1280x720"
    fps: int = 30
    status: str = "Active"
    is_primary: bool = False
    notes: str = None

class TeacherRequest(BaseModel):
    name: str
    email: str
    password: str = None
    department_ids: List[int]
    teacher_code: str = None 

class StudentRequest(BaseModel):
    name: str
    email: str
    password: str
    roll_no: str
    class_id: int

# --- Auth Helper ---

def check_admin(current_user, allow_teacher=False):
    if allow_teacher:
        if current_user.role not in ["admin", "teacher"]:
            raise HTTPException(
                status_code=403, 
                detail=f"Access denied. Role '{current_user.role}' does not have permission. Required: admin or teacher."
            )
    else:
        if current_user.role != "admin":
            raise HTTPException(
                status_code=403, 
                detail=f"Access denied. Role '{current_user.role}' does not have admin privileges."
            )

# --- Department Routes ---

@router.post("/departments")
def add_department(
    data: DepartmentRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    
    new_department = Department(name=data.name)
    db.add(new_department)
    db.commit()
    db.refresh(new_department)
    
    return {
        "message": "Department added successfully",
        "department_id": new_department.id,
        "name": new_department.name
    }

@router.get("/departments")
def get_departments(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user, allow_teacher=True)
    return db.query(Department).all()

@router.delete("/departments/{department_id}")
def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    try:
        db.execute(text("DELETE FROM teacher_departments WHERE department_id = :dept_id"), {"dept_id": department_id})
        db.query(Teacher).filter(Teacher.department_id == department_id).update({"department_id": None}, synchronize_session='fetch')
        db.query(Class).filter(Class.department_id == department_id).update({"department_id": None}, synchronize_session='fetch')
        db.query(Subject).filter(Subject.department_id == department_id).update({"department_id": None}, synchronize_session='fetch')
        db.flush()
        db.delete(dept)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error during deletion: {str(e)}")

    return {"message": "Department deleted successfully"}

# --- Class Routes ---

@router.post("/classes")
def add_class(
    data: ClassRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    
    new_class = Class(name=data.name, department_id=data.department_id)
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    
    return {
        "message": "Class added successfully",
        "class_id": new_class.id,
        "name": new_class.name
    }

@router.get("/classes")
def get_classes(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user, allow_teacher=True)
    return db.query(Class).all()

@router.delete("/classes/{class_id}")
def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    try:
        db.query(Student).filter(Student.class_id == class_id).update({"class_id": None}, synchronize_session='fetch')
        from app.models.attendance_session import AttendanceSession
        db.query(AttendanceSession).filter(AttendanceSession.class_id == class_id).update({"class_id": None}, synchronize_session='fetch')
        db.delete(cls)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

    return {"message": "Class deleted successfully"}

@router.put("/classes/{class_id}")
def update_class(
    class_id: int,
    data: ClassRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    
    cls = db.query(Class).filter(Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    cls.name = data.name
    cls.department_id = data.department_id
    
    db.commit()
    db.refresh(cls)
    
    return {"message": "Class updated successfully", "class": {"id": cls.id, "name": cls.name}}

# --- Subject Routes ---

@router.post("/subjects")
def add_subject(
    data: SubjectRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    
    new_subject = Subject(
        name=data.name, 
        subject_code=data.subject_code,
        department_id=data.department_id
    )
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    
    return {
        "message": "Subject added successfully",
        "subject_id": new_subject.id,
        "name": new_subject.name
    }

@router.get("/subjects")
def get_subjects(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user, allow_teacher=True)
    return db.query(Subject).all()

@router.put("/subjects/{subject_id}")
def update_subject(
    subject_id: int,
    data: SubjectRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    
    sub = db.query(Subject).filter(Subject.id == subject_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found")

    sub.name = data.name
    sub.subject_code = data.subject_code
    sub.department_id = data.department_id
    
    db.commit()
    db.refresh(sub)
    
    return {"message": "Subject updated successfully"}

@router.delete("/subjects/{subject_id}")
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    
    sub = db.query(Subject).filter(Subject.id == subject_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found")

    try:
        from app.models.attendance_session import AttendanceSession
        db.query(AttendanceSession).filter(AttendanceSession.subject_id == subject_id).update({"subject_id": None}, synchronize_session='fetch')
        db.delete(sub)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

    return {"message": "Subject deleted successfully"}

# --- Classroom Routes ---

@router.post("/classrooms")
def add_classroom(
    data: ClassroomRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    
    new_room = Classroom(
        room_name=data.room_name, 
        location=data.location,
        capacity=data.capacity
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    
    return {
        "message": "Classroom added successfully",
        "classroom_id": new_room.id,
        "room_name": new_room.room_name
    }

@router.get("/classrooms")
def get_classrooms(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user, allow_teacher=True)
    rooms = db.query(Classroom).all()
    
    result = []
    for r in rooms:
        cam_list = []
        for cam in r.cameras:
            cam_list.append({
                "id": cam.id,
                "name": cam.camera_name,
                "type": cam.camera_type,
                "url": cam.source_url,
                "placement": cam.placement,
                "status": cam.status,
                "current_status": cam.current_status,
                "is_primary": cam.is_primary,
                "resolution": cam.resolution,
                "fps": cam.fps,
                "last_active": cam.last_active_time.isoformat() if cam.last_active_time else None
            })
            
        result.append({
            "id": r.id,
            "room_name": r.room_name,
            "location": r.location,
            "capacity": r.capacity,
            "cameras": cam_list,
            "camera_count": len(cam_list)
        })
    return result

@router.put("/classrooms/{room_id}")
def update_classroom(
    room_id: int,
    data: ClassroomRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    room = db.query(Classroom).filter(Classroom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room.room_name = data.room_name
    room.location = data.location
    room.capacity = data.capacity
    db.commit()
    return {"message": "Classroom updated"}

@router.delete("/classrooms/{room_id}")
def delete_classroom(
    room_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    room = db.query(Classroom).filter(Classroom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    db.delete(room)
    db.commit()
    return {"message": "Classroom removed"}

# --- Camera Assignment & Management Routes ---

@router.post("/classrooms/{room_id}/cameras")
def add_camera_to_room(
    room_id: int,
    data: CameraRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    room = db.query(Classroom).filter(Classroom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
        
    if data.is_primary:
        db.query(Camera).filter(Camera.classroom_id == room_id).update({"is_primary": False})

    new_cam = Camera(
        classroom_id=room_id,
        camera_name=data.camera_name,
        camera_type=data.camera_type,
        source_url=data.source_url,
        placement=data.placement,
        resolution=data.resolution,
        fps=data.fps,
        status=data.status,
        is_primary=data.is_primary,
        notes=data.notes
    )
    db.add(new_cam)
    db.commit()
    return {"message": "Camera assigned successfully", "id": new_cam.id}

@router.put("/cameras/{camera_id}")
def update_camera(
    camera_id: int,
    data: CameraRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    if data.is_primary:
        db.query(Camera).filter(Camera.classroom_id == cam.classroom_id).update({"is_primary": False})

    cam.camera_name = data.camera_name
    cam.camera_type = data.camera_type
    cam.source_url = data.source_url
    cam.placement = data.placement
    cam.resolution = data.resolution
    cam.fps = data.fps
    cam.status = data.status
    cam.is_primary = data.is_primary
    cam.notes = data.notes
    
    db.commit()
    return {"message": "Camera updated successfully"}

@router.delete("/cameras/{camera_id}")
def remove_camera(
    camera_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    db.delete(cam)
    db.commit()
    return {"message": "Camera removed"}

@router.get("/cameras/monitor")
def monitor_cameras(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    cameras = db.query(Camera).all()
    return [{"id": c.id, "name": c.camera_name, "status": c.current_status} for c in cameras]

# --- Teacher Routes ---

@router.post("/teachers")
def add_teacher(
    data: TeacherRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    new_user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role="teacher"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    teacher_code = data.teacher_code if data.teacher_code else f"TCH{new_user.id}"
    
    existing_teacher = db.query(Teacher).filter(Teacher.teacher_code == teacher_code).first()
    if existing_teacher:
         raise HTTPException(status_code=400, detail="Teacher code already exists")

    primary_dept = data.department_ids[0] if data.department_ids else None

    new_teacher = Teacher(
        user_id=new_user.id,
        department_id=primary_dept,
        teacher_code=teacher_code
    )
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)

    for d_id in data.department_ids:
        db.execute(
            text("INSERT INTO teacher_departments (teacher_id, department_id) VALUES (:t_id, :d_id)"),
            {"t_id": new_teacher.id, "d_id": d_id}
        )
    db.commit()

    return {
        "message": "Teacher added successfully",
        "teacher_id": new_teacher.id,
        "name": new_user.name,
        "email": new_user.email
    }

@router.get("/teachers")
def get_teachers(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    teachers = db.query(Teacher).all()
    
    result = []
    for t in teachers:
        dept_ids = []
        try:
            rows = db.execute(
                text("SELECT department_id FROM teacher_departments WHERE teacher_id = :t_id"),
                {"t_id": t.id}
            ).fetchall()
            dept_ids = [row[0] for row in rows]
        except Exception as e:
            print(f"Error fetching departments for teacher {t.id}: {e}")
            if t.department_id:
                dept_ids = [t.department_id]
        
        t_dict = {
            "id": t.id,
            "user_id": t.user_id,
            "teacher_code": t.teacher_code,
            "department_id": t.department_id,
            "department_ids": dept_ids,
            "user_name": t.user.name if (hasattr(t, 'user') and t.user) else "Unknown",
            "user_email": t.user.email if (hasattr(t, 'user') and t.user) else "Unknown"
        }
        result.append(t_dict)
        
    return result

@router.put("/teachers/{teacher_id}")
def update_teacher(
    teacher_id: int,
    data: TeacherRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    user = db.query(User).filter(User.id == teacher.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Associated user not found")

    user.name = data.name
    user.email = data.email
    if data.password:
        user.password = hash_password(data.password)
    
    primary_dept = data.department_ids[0] if data.department_ids else None
    teacher.department_id = primary_dept
    if data.teacher_code:
        teacher.teacher_code = data.teacher_code

    db.execute(text("DELETE FROM teacher_departments WHERE teacher_id = :t_id"), {"t_id": teacher_id})
    for d_id in data.department_ids:
        db.execute(
            text("INSERT INTO teacher_departments (teacher_id, department_id) VALUES (:t_id, :d_id)"),
            {"t_id": teacher_id, "d_id": d_id}
        )

    db.commit()
    return {"message": "Teacher updated successfully"}

@router.delete("/teachers/{teacher_id}")
def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    try:
        from app.models.attendance_session import AttendanceSession
        db.query(AttendanceSession).filter(AttendanceSession.teacher_id == teacher_id).update({"teacher_id": None}, synchronize_session='fetch')
        db.execute(text("DELETE FROM teacher_departments WHERE teacher_id = :t_id"), {"t_id": teacher_id})
        user_id = teacher.user_id
        db.delete(teacher)
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

    return {"message": "Teacher deleted successfully"}

# --- Student Routes ---

@router.post("/students")
def add_student(
    data: StudentRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    new_user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role="student"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_student = Student(
        user_id=new_user.id,
        class_id=data.class_id,
        roll_no=data.roll_no
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return {
        "message": "Student added successfully",
        "student_id": new_student.id,
        "name": new_user.name,
        "email": new_user.email
    }

from app.models.face_embedding import FaceEmbedding

@router.get("/students")
def get_students(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user, allow_teacher=True)
    try:
        students = db.query(Student).all()
        
        result = []
        for s in students:
            face = db.query(FaceEmbedding).filter(FaceEmbedding.student_id == s.id).first()
            cls_name = "N/A"
            dept_name = "N/A"
            try:
                if s.class_id:
                    cls = db.query(Class).filter(Class.id == s.class_id).first()
                    if cls:
                        cls_name = cls.name
                        dept = db.query(Department).filter(Department.id == cls.department_id).first()
                        if dept:
                            dept_name = dept.name
            except:
                pass

            result.append({
                "id": s.id,
                "user_id": s.user_id,
                "roll_no": s.roll_no,
                "class_id": s.class_id,
                "class_name": cls_name,
                "department_name": dept_name,
                "name": s.user.name if (hasattr(s, 'user') and s.user) else "Unknown",
                "email": s.user.email if (hasattr(s, 'user') and s.user) else "Unknown",
                "face_registered": face is not None
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading students: {str(e)}")

@router.get("/students/{student_id}/attendance-stats")
def get_student_attendance_stats(
    student_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user, allow_teacher=True)
    
    from app.models.attendance_record import AttendanceRecord
    from app.models.attendance_session import AttendanceSession
    from app.models.subject import Subject

    records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id).all()
    if not records:
        return {"overall": 0, "subjects": []}

    total_sessions = len(records)
    present_count = len([r for r in records if r.status == "Present"])
    
    overall_pct = (present_count / total_sessions) * 100 if total_sessions > 0 else 0

    subject_stats = {}
    results = db.query(AttendanceRecord, AttendanceSession, Subject).\
        join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id).\
        join(Subject, AttendanceSession.subject_id == Subject.id).\
        filter(AttendanceRecord.student_id == student_id).all()

    for rec, session, sub in results:
        if sub.id not in subject_stats:
            subject_stats[sub.id] = {
                "subject_name": sub.name,
                "subject_code": sub.subject_code,
                "total": 0,
                "present": 0
            }
        
        subject_stats[sub.id]["total"] += 1
        if rec.status == "Present":
            subject_stats[sub.id]["present"] += 1

    subject_list = []
    for s_id, stats in subject_stats.items():
        pct = (stats["present"] / stats["total"]) * 100
        subject_list.append({
            "subject_name": stats["subject_name"],
            "subject_code": stats["subject_code"],
            "percentage": round(pct, 2),
            "total_classes": stats["total"],
            "attended_classes": stats["present"]
        })

    return {
        "overall": round(overall_pct, 2),
        "total_sessions": total_sessions,
        "subjects": subject_list
    }

@router.put("/students/{student_id}")
def update_student(
    student_id: int,
    data: StudentRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    user = db.query(User).filter(User.id == student.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Associated user not found")

    user.name = data.name
    user.email = data.email
    if data.password:
        user.password = hash_password(data.password)
        
    student.roll_no = data.roll_no
    student.class_id = data.class_id

    db.commit()
    return {"message": "Student updated successfully"}

@router.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    check_admin(current_user)
    
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    try:
        db.query(FaceEmbedding).filter(FaceEmbedding.student_id == student_id).delete()
        from app.models.attendance_record import AttendanceRecord
        from app.models.attendance_logs import AttendanceLog
        db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id).delete()
        db.query(AttendanceLog).filter(AttendanceLog.student_id == student_id).delete()
        user_id = student.user_id
        db.delete(student)
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database error: {str(e)}")

    return {"message": "Student deleted successfully"}
