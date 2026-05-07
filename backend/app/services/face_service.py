import cv2
import numpy as np
from insightface.app import FaceAnalysis

# load model once
face_app = FaceAnalysis(name="buffalo_l")
face_app.prepare(ctx_id=0)


def get_face_embedding(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    faces = face_app.get(img)

    if len(faces) == 0:
        return None

    embedding = faces[0].embedding
    return embedding.tolist()


def compare_faces(known_embeddings, new_embedding, threshold=1.0):
    for student_id, embedding in known_embeddings:
        dist = np.linalg.norm(np.array(embedding) - np.array(new_embedding))
        if dist < threshold:
            return student_id
    return None