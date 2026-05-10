from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, admin, student, teacher, attendance

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
<<<<<<< HEAD
    allow_origins=["*"],
=======
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
>>>>>>> ebfa0412648e52de42ee6f8ee11a6a47c077645c
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(student.router)
app.include_router(teacher.router)
app.include_router(attendance.router)

@app.get("/")
def home():
    return {"message": "AI Smart Attendance Backend is running"}