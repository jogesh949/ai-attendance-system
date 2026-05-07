import { useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

export default function StudentFaceUpload() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const token = localStorage.getItem("token");

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);

    if (selected.length < 5) {
      alert("Please upload at least 5 face images");
      return;
    }

    setFiles(selected);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  };

  const uploadFaces = async () => {
    if (files.length < 5) {
      alert("Upload at least 5 images");
      return;
    }

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        await axios.post(`${API}/student/upload-face`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      alert("Face images uploaded successfully");
    } catch (err) {
      alert(err.response?.data?.detail || "Face upload failed");
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Upload Face Images</h2>
      <p>Upload 5–10 clear face images from different angles.</p>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
      />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
        {previews.map((src, index) => (
          <img
            key={index}
            src={src}
            alt="preview"
            width="120"
            height="120"
            style={{ objectFit: "cover", borderRadius: 10 }}
          />
        ))}
      </div>

      <br />

      <button onClick={uploadFaces}>Upload Face Images</button>
    </div>
  );
}