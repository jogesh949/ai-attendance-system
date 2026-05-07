import { useEffect, useState } from "react";
import axios from "axios";
import "./TeacherDashboard.css";

const API = "http://127.0.0.1:8000";

export default function TeacherDashboard() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [classroomId, setClassroomId] = useState("");

  const [sessionId, setSessionId] = useState(null);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      setLoading(true);

      const classRes = await axios.get(`${API}/admin/classes`);
      const subjectRes = await axios.get(`${API}/admin/subjects`);
      const classroomRes = await axios.get(`${API}/admin/classrooms`);

      setClasses(classRes.data || []);
      setSubjects(subjectRes.data || []);
      setClassrooms(classroomRes.data || []);
    } catch (err) {
      console.log("Dropdown Error:", err);
      alert("Dropdown data not loaded. Check backend APIs and CORS.");
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    if (!classroomId || !classId || !subjectId) {
      alert("Please select classroom, class, and subject");
      return;
    }

    if (!token) {
      alert("Teacher token not found. Please login again.");
      return;
    }

    try {
      const res = await axios.post(
        `${API}/teacher/start-session`,
        {
          classroom_id: Number(classroomId),
          class_id: Number(classId),
          subject_id: Number(subjectId),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSessionId(res.data.session_id);
      alert(`Session started. Session ID: ${res.data.session_id}`);
    } catch (err) {
      console.log("Start Session Error:", err);
      alert(err.response?.data?.detail || "Failed to start session");
    }
  };

  const stopSession = async () => {
    try {
      await axios.post(
        `${API}/teacher/stop-session?session_id=${sessionId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Session stopped");
    } catch (err) {
      console.log("Stop Session Error:", err);
      alert(err.response?.data?.detail || "Failed to stop session");
    }
  };

  const finalizeAttendance = async () => {
    try {
      const res = await axios.post(`${API}/attendance/finalize/${sessionId}`);
      setReport(res.data.results || []);
      alert("Attendance finalized");
    } catch (err) {
      console.log("Finalize Error:", err);
      alert(err.response?.data?.detail || "Failed to finalize attendance");
    }
  };

  const downloadCSV = () => {
    if (report.length === 0) {
      alert("No report available");
      return;
    }

    let csv = "Student ID,Status\n";

    report.forEach((r) => {
      csv += `${r.student_id},${r.status}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_session_${sessionId}.csv`;
    a.click();
  };

  const manualCorrection = (studentId, newStatus) => {
    setReport((prev) =>
      prev.map((r) =>
        r.student_id === studentId ? { ...r, status: newStatus } : r
      )
    );
  };

  return (
    <div className="teacher-dashboard">
      <aside className="sidebar">
        <h2>AI Attendance</h2>
        <p>Teacher Panel</p>

        <ul>
          <li>Dashboard</li>
          <li>Live Attendance</li>
          <li>Timetable</li>
          <li>Reports</li>
          <li>Low Attendance</li>
        </ul>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <h1>Teacher Dashboard</h1>
          <span>Secure Login & Role-Based Access</span>
        </div>

        {loading && <p>Loading dropdown data...</p>}

        <section className="cards">
          <div className="card">
            <h3>Select Classroom</h3>
            <select
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
            >
              <option value="">-- Select Classroom --</option>
              {classrooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.room_name} {room.location ? `- ${room.location}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="card">
            <h3>Select Class</h3>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">-- Select Class --</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="card">
            <h3>Select Subject</h3>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">-- Select Subject --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="actions">
          <button onClick={startSession}>Start Attendance Session</button>

          <button onClick={stopSession} disabled={!sessionId}>
            Stop Session
          </button>

          <button onClick={finalizeAttendance} disabled={!sessionId}>
            Generate Class Report
          </button>

          <button onClick={downloadCSV}>Download CSV</button>
        </section>

        <section className="grid">
          <div className="panel">
            <h2>Live AI Attendance Monitoring</h2>
            <p>Session ID: {sessionId || "Not started"}</p>
            <p>Classroom ID: {classroomId || "Not selected"}</p>
            <p>Class ID: {classId || "Not selected"}</p>
            <p>Subject ID: {subjectId || "Not selected"}</p>
            <p>Run camera script in backend:</p>
            <code>python camera_attendance.py</code>
          </div>

          <div className="panel">
            <h2>Manual Attendance Correction</h2>

            {report.length === 0 ? (
              <p>Finalize attendance first</p>
            ) : (
              report.map((r) => (
                <div className="report-row" key={r.student_id}>
                  <span>Student {r.student_id}</span>

                  <select
                    value={r.status}
                    onChange={(e) =>
                      manualCorrection(r.student_id, e.target.value)
                    }
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                  </select>
                </div>
              ))
            )}
          </div>

          <div className="panel">
            <h2>Class Report</h2>
            <p>
              Present: {report.filter((r) => r.status === "Present").length}
            </p>
            <p>Absent: {report.filter((r) => r.status === "Absent").length}</p>
            <p>Late: {report.filter((r) => r.status === "Late").length}</p>
          </div>

          <div className="panel">
            <h2>Low Attendance Student List</h2>
            <p>Students below 75% will appear here.</p>
          </div>
        </section>
      </main>
    </div>
  );
}