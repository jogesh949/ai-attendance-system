import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

export default function SubjectPage() {
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);

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

  const addSubject = async () => {
    if (!name || !departmentId) {
      alert("Fill all fields");
      return;
    }

    try {
      const res = await axios.post(`${API}/admin/subjects`, {
        name,
        department_id: Number(departmentId),
      });

      setSubjects([...subjects, res.data]);
      setName("");
      setDepartmentId("");
      alert("Subject added");
    } catch {
      alert("Error adding subject");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Add Subject</h2>

      <input
        placeholder="Subject name (e.g. AI, DBMS)"
        value={name}
        onChange={(e) => setName(e.target.value)}
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

      <button onClick={addSubject}>Add Subject</button>

      <h3>Subject List</h3>

      {subjects.map((s, i) => (
        <div key={i}>{s.name}</div>
      ))}
    </div>
  );
}