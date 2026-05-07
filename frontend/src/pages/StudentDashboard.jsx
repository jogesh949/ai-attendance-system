import { useEffect, useState } from "react";
import axios from "axios";
import "./StudentDashboard.css";

const API = "http://127.0.0.1:8000";

export default function StudentDashboard() {
  const [attendance, setAttendance] = useState([]);
  const [overall, setOverall] = useState(0);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setProfile(user);
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!token) {
      alert("Please login again");
      window.location.href = "/login";
      return;
    }

    try {
      setLoading(true);

      const res = await axios.get(`${API}/student/attendance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAttendance(res.data.records || []);
      setOverall(res.data.percentage || 0);
    } catch (err) {
      console.log("Student Attendance Error:", err);
      alert(err.response?.data?.detail || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (attendance.length === 0) {
      alert("No attendance data available");
      return;
    }

    let csv = "Subject,Status,Percentage\n";

    attendance.forEach((a) => {
      csv += `${a.subject},${a.status},${a.percentage || 0}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "student_attendance_report.csv";
    a.click();
  };

  return (
    <div className="student-dashboard">
      <aside className="sidebar">
        <h2>Student Panel</h2>

        <ul>
          <li>Dashboard</li>
          <li>Attendance</li>
          <li>Calendar</li>
          <li>Notifications</li>
          <li onClick={() => (window.location.href = "/student/upload-face")}>
            Upload Face
          </li>
        </ul>
      </aside>

      <main className="main">
        <h1>Welcome, {profile?.name || "Student"}</h1>

        {loading && <p>Loading attendance...</p>}

        <div className="cards">
          <div className="card">
            <h3>Overall Attendance</h3>
            <h1>{overall}%</h1>
          </div>

          <div className="card">
            <h3>Face Enrollment</h3>
            <p>Upload 5–10 clear face images</p>
            <button onClick={() => (window.location.href = "/student/upload-face")}>
              Upload Face Images
            </button>
          </div>

          <div className="card">
            <h3>Alerts</h3>
            {overall < 75 ? (
              <p style={{ color: "red" }}>Low Attendance ⚠</p>
            ) : (
              <p style={{ color: "green" }}>Good Attendance ✅</p>
            )}
          </div>
        </div>

        <div className="section">
          <h2>Subject-wise Attendance</h2>

          {attendance.length === 0 ? (
            <p>No attendance records found</p>
          ) : (
            attendance.map((a, i) => (
              <div key={i} className="row">
                <span>{a.subject}</span>
                <span>{a.status}</span>
                <span>{a.percentage || 0}%</span>
              </div>
            ))
          )}
        </div>

        <button onClick={downloadReport}>Download Report</button>
      </main>
    </div>
  );
}