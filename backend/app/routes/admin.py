from app.models.teacher import Teacher
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database.connection import SessionLocal
from app.models.department import Department
from app.routes.auth import get_current_user
from app.models.classroom import Classroom
from app.models.department import Department
from pydantic import BaseModel
from app.models.class_model import Class
from app.models.subject import Subject
from app.models.teacher import Teacher
from app.models.user import User

from app.models.student import Student

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)



router = APIRouter(prefix="/admin", tags=["Admin"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class DepartmentRequest(BaseModel):
    name: str


@router.post("/departments")
def add_department(
    data: DepartmentRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can add department")

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
def get_departments(db: Session = Depends(get_db)):
    departments = db.query(Department).all()
    return departments
from app.models.class_model import Class


class ClassRequest(BaseModel):
    name: str
    department_id: int


@router.post("/classes")
def add_class(
    data: ClassRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can add class")

    new_class = Class(
        name=data.name,
        department_id=data.department_id
    )

    db.add(new_class)
    db.commit()
    db.refresh(new_class)

    return {
        "message": "Class added successfully",
        "class_id": new_class.id
    }


@router.get("/classes")
def get_classes(db: Session = Depends(get_db)):
    return db.query(Class).all()
from app.models.student import Student
from app.models.user import User


class StudentRequest(BaseModel):
    name: str
    email: str
    password: str
    class_id: int
    roll_no: str


@router.post("/students")
def add_student(
    data: StudentRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can add student")

    # create user
    hashed_password = pwd_context.hash(data.password)

    new_user = User(
        name=data.name,
        email=data.email,
        password=hashed_password,
        role="student"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # create student
    new_student = Student(
        user_id=new_user.id,
        class_id=data.class_id,
        roll_no=data.roll_no
    )

    db.add(new_student)
    db.commit()

    return {
        "message": "Student added successfully",
        "student_id": new_student.id
    }

class TeacherRequest(BaseModel):
    name: str
    email: str
    password: str
    department_id: int
    teacher_code: str


@router.post("/teachers")
def add_teacher(
    data: TeacherRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can add teacher")

    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    existing_teacher = db.query(Teacher).filter(
        Teacher.teacher_code == data.teacher_code
    ).first()
    if existing_teacher:
        raise HTTPException(status_code=400, detail="Teacher code already exists")

    hashed_password = pwd_context.hash(data.password)

    new_user = User(
        name=data.name,
        email=data.email,
        password=hashed_password,
        role="teacher"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    new_teacher = Teacher(
        user_id=new_user.id,
        department_id=data.department_id,
        teacher_code=data.teacher_code
    )

    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)

    return {
        "message": "Teacher added successfully",
        "teacher_id": new_teacher.id,
        "user_id": new_user.id
    }


@router.get("/teachers")
def get_teachers(db: Session = Depends(get_db)):
    return db.query(Teacher).all()

from app.models.subject import Subject


class SubjectRequest(BaseModel):
    name: str
    department_id: int


@router.post("/subjects")
def add_subject(
    data: SubjectRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can add subject")

    subject = Subject(
        name=data.name,
        department_id=data.department_id
    )

    db.add(subject)
    db.commit()
    db.refresh(subject)

    return {
        "message": "Subject added successfully",
        "subject_id": subject.id
    }


@router.get("/subjects")
def get_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).all()



class ClassroomRequest(BaseModel):
    room_name: str
    location: str


@router.post("/classrooms")
def add_classroom(data: ClassroomRequest, db: Session = Depends(get_db)):
    room = Classroom(
        room_name=data.room_name,
        location=data.location
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@router.get("/classrooms")
def get_classrooms(db: Session = Depends(get_db)):
    return db.query(Classroom).all()




class DepartmentRequest(BaseModel):
    name: str

@router.post("/departments")
def add_department(data: DepartmentRequest, db: Session = Depends(get_db)):
    dept = Department(name=data.name)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

@router.get("/departments")
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()




class ClassRequest(BaseModel):
    name: str
    department_id: int

@router.post("/classes")
def add_class(data: ClassRequest, db: Session = Depends(get_db)):
    cls = Class(name=data.name, department_id=data.department_id)
    db.add(cls)
    db.commit()
    db.refresh(cls)
    return cls

@router.get("/classes")
def get_classes(db: Session = Depends(get_db)):
    return db.query(Class).all()




class SubjectRequest(BaseModel):
    name: str
    department_id: int

@router.post("/subjects")
def add_subject(data: SubjectRequest, db: Session = Depends(get_db)):
    sub = Subject(name=data.name, department_id=data.department_id)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

@router.get("/subjects")
def get_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).all()




class ClassroomRequest(BaseModel):
    room_name: str
    location: str

@router.post("/classrooms")
def add_classroom(data: ClassroomRequest, db: Session = Depends(get_db)):
    room = Classroom(
        room_name=data.room_name,
        location=data.location
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room

@router.get("/classrooms")
def get_classrooms(db: Session = Depends(get_db)):
    return db.query(Classroom).all()





class TeacherRequest(BaseModel):
    name: str
    email: str
    password: str
    department_id: int


@router.post("/teachers")
def add_teacher(data: TeacherRequest, db: Session = Depends(get_db)):

    # create user
    user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role="teacher"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # create teacher
    teacher = Teacher(
        user_id=user.id,
        department_id=data.department_id,
        teacher_code=f"TCH{user.id}"
    )

    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    return {
        "name": user.name,
        "email": user.email
    }


@router.get("/teachers")
def get_teachers(db: Session = Depends(get_db)):
    return db.query(Teacher).all()





class StudentRequest(BaseModel):
    name: str
    email: str
    password: str
    roll_no: str
    class_id: int


@router.post("/students")
def add_student(data: StudentRequest, db: Session = Depends(get_db)):

    # create user
    user = User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        role="student"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # create student
    student = Student(
        user_id=user.id,
        class_id=data.class_id,
        roll_no=data.roll_no
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    return {
        "name": user.name,
        "email": user.email
    }


@router.get("/students")
def get_students(db: Session = Depends(get_db)):
    return db.query(Student).all()