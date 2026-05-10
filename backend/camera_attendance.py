from collections import defaultdict
import cv2
import ast
import time
import requests

from app.services.face_service import get_face_embedding, compare_faces
from app.database.connection import SessionLocal
from app.models.face_embedding import FaceEmbedding


SESSION_ID = 1
CAMERA_INDEX = 0
API_URL = "http://127.0.0.1:8000/attendance/mark"
SCAN_DELAY = 1
CONFIRM_FRAMES = 3


db = SessionLocal()
embeddings = db.query(FaceEmbedding).all()

known = []
for e in embeddings:
    known.append((e.student_id, ast.literal_eval(e.embedding)))

db.close()

print("Loaded embeddings:", len(known))


cap = cv2.VideoCapture(CAMERA_INDEX)

if not cap.isOpened():
    print("❌ Camera not opened")
    exit()

print("✅ Camera started. Press Q to quit.")


frame_count = defaultdict(int)
marked_students = set()


while True:
    ret, frame = cap.read()

    if not ret:
        print("❌ Failed to read frame")
        break

    cv2.imshow("AI Attendance Camera", frame)

    success, buffer = cv2.imencode(".jpg", frame)

    if not success:
        print("❌ Failed to encode image")
        continue

    image_bytes = buffer.tobytes()
    embedding = get_face_embedding(image_bytes)

    if embedding is not None:
        student_id = compare_faces(known, embedding)

        if student_id:
            frame_count[student_id] += 1

            print(f"Detected Student {student_id} | Count: {frame_count[student_id]}")

            if frame_count[student_id] >= CONFIRM_FRAMES and student_id not in marked_students:
                print(f"🎯 Confirmed Student {student_id}")

                try:
                    response = requests.post(
                        API_URL,
                        files={
                            "file": ("image.jpg", image_bytes, "image/jpeg")
                        },
                        data={
                            "session_id": str(SESSION_ID)
                        },
                        timeout=10
                    )

                    print("STATUS:", response.status_code)
                    print("RESPONSE:", response.text)

                    if response.status_code == 200:
                        marked_students.add(student_id)

                except Exception as e:
                    print("❌ API ERROR:", e)

                time.sleep(SCAN_DELAY)

        else:
            print("❌ Face not recognized")
            time.sleep(SCAN_DELAY)

    else:
        print("No face detected")

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


cap.release()
cv2.destroyAllWindows()
print("Camera stopped")