import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentFaceUpload from "./pages/StudentFaceUpload";

/* ✅ Generic Protected Route — reads localStorage "token" and "role" */
function ProtectedRoute({ children, roleRequired }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />;
  if (roleRequired && role !== roleRequired) return <Navigate to="/login" />;

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roleRequired="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Teacher */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute roleRequired="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        {/* Student Dashboard */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute roleRequired="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Student Face Upload */}
        <Route
          path="/student/upload-face"
          element={
            <ProtectedRoute roleRequired="student">
              <StudentFaceUpload />
            </ProtectedRoute>
          }
        />

        {/* Default */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;