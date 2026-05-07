import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

export default function TeacherPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API}/admin/departments`);
      setDepartments(res.data);
    } catch {
      alert("Failed to load departments");
    }
  };

  const addTeacher = async () => {
    if (!name || !email || !password || !departmentId) {
      alert("Fill all fields");
      return;
    }

    try {
      const res = await axios.post(`${API}/admin/teachers`, {
        name,
        email,
        password,
        department_id: Number(departmentId),
      });

      setTeachers([...teachers, res.data]);

      setName("");
      setEmail("");
      setPassword("");
      setDepartmentId("");

      alert("Teacher added");
    } catch (err) {
      alert(err.response?.data?.detail || "Error adding teacher");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Add Teacher</h2>

      <input
        placeholder="Teacher Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <select
        value={departmentId}
        onChange={(e) => setDepartmentId(e.target.value)}
      >
        <option value="">Select Department</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      <br /><br />

      <button onClick={addTeacher}>Add Teacher</button>

      <h3>Teacher List</h3>

      {teachers.map((t, i) => (
        <div key={i}>
          {t.name} - {t.email}
        </div>
      ))}
    </div>
  );
}