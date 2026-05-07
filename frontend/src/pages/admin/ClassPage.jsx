import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

export default function ClassPage() {
  const [name, setName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);

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

  const addClass = async () => {
    if (!name || !departmentId) {
      alert("Fill all fields");
      return;
    }

    try {
      const res = await axios.post(`${API}/admin/classes`, {
        name,
        department_id: Number(departmentId),
      });

      setClasses([...classes, res.data]);
      setName("");
      setDepartmentId("");
      alert("Class added");
    } catch {
      alert("Error adding class");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Add Class</h2>

      <input
        placeholder="Class name (e.g. MCA 1st Year)"
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

      <button onClick={addClass}>Add Class</button>

      <h3>Class List</h3>

      {classes.map((c, i) => (
        <div key={i}>{c.name}</div>
      ))}
    </div>
  );
}