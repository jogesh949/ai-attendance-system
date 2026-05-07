import { useState } from "react";
import "./AdminDashboard.css";
import DepartmentPage from "./admin/DepartmentPage";
import ClassPage from "./admin/ClassPage";
import SubjectPage from "./admin/SubjectPage";
import ClassroomPage from "./admin/ClassroomPage";
import TeacherPage from "./admin/TeacherPage";
import StudentPage from "./admin/StudentPage";

export default function AdminDashboard() {
  const [page, setPage] = useState("dashboard");

  return (
    <div className="admin-dashboard">
      <aside className="sidebar">
        <h2>AI Attendance</h2>
        <p>Admin Panel</p>

        <ul>
          <li onClick={() => setPage("dashboard")}>Dashboard</li>
          <li onClick={() => setPage("department")}>Departments</li>
          <li onClick={() => setPage("class")}>Classes</li>
          <li onClick={() => setPage("subject")}>Subjects</li>
          <li onClick={() => setPage("classroom")}>Classrooms</li>
          <li onClick={() => setPage("teacher")}>Teachers</li>
          <li onClick={() => setPage("student")}>Students</li>
          <li>Camera Mapping</li>
          <li>Timetable</li>
          <li>Reports</li>
          <li>System Monitoring</li>
        </ul>
      </aside>

      <main className="main-content">
        {page === "dashboard" && (
          <>
            <h1>Admin Dashboard</h1>

            <section className="cards">
              <div className="card" onClick={() => setPage("department")}>
                <h3>Departments</h3>
                <p>Manage MCA, BCA, MBA, BBA</p>
              </div>

              <div className="card" onClick={() => setPage("class")}>
                <h3>Classes</h3>
                <p>Create class/year/section</p>
              </div>

              <div className="card">
                <h3>Subjects</h3>
                <p>Assign subjects by department</p>
              </div>

              <div className="card">
                <h3>Classrooms</h3>
                <p>Add room number and location</p>
              </div>

              <div className="card">
                <h3>Teachers</h3>
                <p>Add teachers with login access</p>
              </div>

              <div className="card">
                <h3>Students</h3>
                <p>Add students with default password</p>
              </div>

              <div className="card">
                <h3>Camera Mapping</h3>
                <p>Map camera with classroom</p>
              </div>

              <div className="card">
                <h3>Reports</h3>
                <p>Generate full attendance reports</p>
              </div>
            </section>
          </>
        )}

        {page === "department" && <DepartmentPage />}
        {page === "class" && <ClassPage />}
        {page === "subject" && <SubjectPage />}
        {page === "classroom" && <ClassroomPage />}
        {page === "teacher" && <TeacherPage />}
        {page === "student" && <StudentPage />}
      </main>
    </div>
  );
}