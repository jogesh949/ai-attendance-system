import cv2
import numpy as np
from insightface.app import FaceAnalysis

<<<<<<< HEAD
# load model once - Use ctx_id=-1 for CPU (more compatible)
face_app = FaceAnalysis(name="buffalo_l")
face_app.prepare(ctx_id=-1)


def get_face_embedding(image_bytes):
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return None

        faces = face_app.get(img)

        if len(faces) == 0:
            return None

        # Extract embedding and normalize it (L2 normalization)
        embedding = faces[0].embedding
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm

        return embedding.tolist()
    except Exception as e:
        print(f"Error in extraction: {e}")
        return None


def compare_faces(known_embeddings, new_embedding, threshold=0.7):
    # known_embeddings is list of (id, embedding_list)
    if not new_embedding:
        return None

    target = np.array(new_embedding)
    best_match = None
    min_dist = threshold

    for student_id, embedding in known_embeddings:
        known = np.array(embedding)

        # Safety normalization (in case old embeddings were not normalized)
        norm_k = np.linalg.norm(known)
        if norm_k > 0:
            known = known / norm_k

        # Calculate Euclidean distance between normalized vectors
        dist = np.linalg.norm(known - target)
        if dist < min_dist:
            min_dist = dist
            best_match = student_id

    return best_match
=======
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
>>>>>>> ebfa0412648e52de42ee6f8ee11a6a47c077645c
